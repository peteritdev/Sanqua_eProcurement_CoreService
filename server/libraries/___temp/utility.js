const dateTime = require('node-datetime');
const crypto = require('crypto');
const ENCRYPTION_KEY = "51beba089ef1612152be4933ea6a9a48";//crypto.randomBytes(32);
const IV_LENGTH = 16;
const promise = require('promise');
const requestModule = require('request');

const SimpleNodeLogger = require('simple-node-logger'),
    opts = {
        logDirectory: './logs',
        fileNamePattern: 'log-<DATE>.log',
        dateFormat: 'YYYY.MM.DD',
        //logFilePath:'mylogfile.log',
        timestampFormat:'YYYY-MM-DD HH:mm:ss.SSS'
    },
log = SimpleNodeLogger.createRollingFileLogger( opts );

function Utility(){

    this.getRelasiName = function( id ){
        //1=>Suami, 2=>Istri, 3=>Anak, 4=> Ayah, 5=>Ibu
        switch( id ){
            case 1: return "SUAMI";break;
            case 2: return "ISTRI";break;
            case 3: return "ANAK";break;
            case 4: return "AYAH";break;
            case 5: return "IBU";break;
            default: return "";
        }
    },

    this.isValidEmail = function( email, callback ){
        var isValid = false;
        isValid =  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        callback(isValid);
    },

    this.getCurrDateTime = function( callback ){
        var dt = dateTime.create();
        var formatted = dt.format('Y-m-d H:M:S');
        callback(formatted);
    },

    this.getCurrTime = function( callback ){
        var dt = dateTime.create();
        var formatted = dt.format('H:M:S');
        callback(formatted);
    },

    this.getCurrDate = function( callback ){
        var dt = dateTime.create();
        var formatted = dt.format('Y-m-d');
        callback(formatted);
    },

    this.getEncrypted = function( data, callback ){
        let iv = crypto.randomBytes(IV_LENGTH);
        let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
        let encrypted = cipher.update(data);

        encrypted = Buffer.concat([encrypted, cipher.final()]);

        callback( iv.toString('hex') + ':' + encrypted.toString('hex') );
    }

    this.getDecrypted = function( data, callback ){

        if( data != '' ){
            let textParts = data.split(':');
            let iv = Buffer.from(textParts.shift(), 'hex');
            let encryptedText = Buffer.from(textParts.join(':'), 'hex');
            let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
            let decrypted = decipher.update(encryptedText);

            decrypted = Buffer.concat([decrypted, decipher.final()]);

            callback(decrypted.toString());
        }else{
            callback("");
        }
        
    },

    this.curlRequest = ( requestOption ) => {
        return new Promise( ( resolve, reject ) => {
            requestModule( requestOption, ( error, response , body ) => {
                try{
                    if( error ){
                        throw error;
                    }

                    if( body ){
                        try{
                            body = body.replace("\"{","{").replace("}\"","}");
                            body = body.replace(/\\/g, '');
                            console.log(body);
                            body = (body) ? JSON.parse(body) : body;
                            resolve(body);
                        }catch( error ){
                            resolve(body);
                        }
                    }
                }catch( error ){
                    reject(error);
                }
            } );
        } );
    },
    
    this.writeLog = function( message, label ){
        log.info("[" + label + "] " + message);
    },

    this.parseToFormattedDate = function( unformattedDate ){

        if( unformattedDate == "" ){
            return null;
        }else{
            var xArr = unformattedDate.split("-"); 
            return xArr["2"] + "-" + xArr[1] + "-" + xArr[0];
        }
        
    }

    this.generateJSONTree = function( arr ){
        var tree = [],
          mappedArr = {},
          arrElem,
          mappedElem;

        // First map the nodes of the array to an object -> create a hash table.
        for(var i = 0, len = arr.length; i < len; i++) {
            arrElem = arr[i];
            mappedArr[arrElem.id] = arrElem;
            mappedArr[arrElem.id]['children'] = [];
        }


        for (var id in mappedArr) {
            if (mappedArr.hasOwnProperty(id)) {
                
                mappedElem = mappedArr[id];
                // If the element is not at the root level, add it to its parent array of children.
                if (mappedElem.parentid) {
                    if( mappedArr[mappedElem['parentid']] != null ){
                        mappedArr[mappedElem['parentid']]['children'].push(mappedElem);
                    }
                }
                // If the element is at the root level, add it to first level elements array.
                else {
                    tree.push(mappedElem);
                }
                
            }
        }
        return tree;
    },

    this.parseSettingValue = function( pStrVal ){
        return new Promise( ( resolve, reject ) => {
            
            var xArrStr = pStrVal.split(";");
            var xArrStrVal = {};
            if( xArrStr.length > 0 ){
                for( var i = 0; i < xArrStr.length; i++ ){
                    var xTempArrStrVal = xArrStr[i].split("=");
                    xArrStrVal[ xTempArrStrVal[0] ] = xTempArrStrVal[1];
                }
                resolve(xArrStrVal);
            }else{
                resolve(null);
            }
        } );
    }

}

module.exports = new Utility();