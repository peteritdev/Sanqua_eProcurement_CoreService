const crypto = require('crypto');
const env         = process.env.NODE_ENV || 'localhost';
const config      = require(__dirname + '/../config/config.json')[env];
const encKey = config.cryptoKey.hashKey
const dateTime = require('node-datetime');
const axios = require('axios');
const IV_LENGTH = 16;
const urlQueryParser = require('query-string');

class GlobalUtility{

    async getCurrDateTime(){
        var dt = dateTime.create();
        var formatted = dt.format('Y-m-d H:M:S');
        return formatted;
    }

    async encrypt( pVal ){
        let iv = crypto.randomBytes(IV_LENGTH);
        let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(encKey), iv);
        let encrypted = cipher.update(pVal);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return ( iv.toString('hex') + ':' + encrypted.toString('hex') );
    }

    async decrypt( pVal ){
        if( pVal != '' ){

            try{
                let textParts = pVal.split(':');
                let iv = Buffer.from(textParts.shift(), 'hex');
                let encryptedText = Buffer.from(textParts.join(':'), 'hex');
                let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(encKey), iv);
                let decrypted = decipher.update(encryptedText);
    
                decrypted = Buffer.concat([decrypted, decipher.final()]);
    
                return {
                    status_code: "00",
                    status_msg: "OK",
                    decrypted: decrypted.toString()
                };
            }catch( err ){
                return {
                    status_code: "-99",
                    status_msg: "Error",
                    err_msg: err
                };
            }
            
        }else{
            return {
                status_code: "-99",
                status_msg: "Value that want to decrypt not provided"
            };
        }
    }

    async axiosRequestPost( pUrl, pMethod, pBody ){
        var config = {};            
        let response = await axios.post(pUrl, pBody);
        return response.data;
    }

    async axiosRequest( pUrl, pConfig ){
        
        try{
            const res = await axios.get(pUrl, pConfig);
            return {
                "status_code": "00",
                "status_msg":"OK",
                "token_data": res.data
            };
        }catch(e){
            console.log(">>> e:" + e);
            return {
                "status_code": "-99",
                "status_msg": "Failed request",
                "err_msg": e.message
            };
        }
        
    }

    async parseQueryString( pString ){
        return urlQueryParser.parse(pString);
    }

    async imageFilter( req, file ){

        try{
            if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF)$/)) {
                req.fileValidationError = 'Only image files are allowed!';  
                return false;             
            }else{
                return true;
            }
        }catch(e){
            console.log("Error GlobalUtility.ImageFilter : " + e)
            return (false);            
        }
        
    }

    async generateProcurementNo( pId, pCompany ){
        // Formula : SMI/21/06/00001
        var dt = dateTime.create();
        var xDate = dt.format('ym');
        var xNo = `${pCompany}/${xDate}/` + pId.padStart(5,'0');
        return xNo;        
    }

    async generateVendorCode( pId, pCurrencyCode ){
        // Formula: V-IDR-001
        var xNo = `V-${pCurrencyCode}-` + pId.padStart(3,'0');
        return xNo;
    }

}

module.exports = GlobalUtility;