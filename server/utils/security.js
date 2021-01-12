const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
var config = require('../config/config.json');

const Utility = require('./globalutility.js');
const utilInstance = new Utility();

class Security{
    constructor(){}

    async generateEncryptedPassword( pPassword ){
        var salt = await bcrypt.genSalt(10);
        var password = await bcrypt.hash( pPassword, salt );
        return password;
    }   

    async encryptCriticalField(pParam){

        if( ("email" in pParam) == true ){
            pParam.email = await utilInstance.encrypt(pParam.email);
        }
        if( ("phone1" in pParam) == true ){
            pParam.phone1 = await utilInstance.encrypt(pParam.phone1);
        }
        if( ("phone2" in pParam) == true ){
            pParam.phone2 = await utilInstance.encrypt(pParam.phone2);
        }

        return pParam;
    }
}

module.exports = Security;