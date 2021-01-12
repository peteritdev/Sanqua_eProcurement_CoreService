const jwt = require('jsonwebtoken');
const config = require('../config/config.json');
const { json } = require('sequelize');

class JwtUtil {
    
    constructor(){}

    async verifyJWT(pToken){
        var jsonResult;

        if( pToken.startsWith('Bearer ') ){
            pToken = pToken.slice(7, pToken.length);
        }

        if( pToken ){
            try{
                var resultVerify = await jwt.verify( pToken, config.secret );
                jsonResult = {
                    "status_code": "00",
                    "status_msg": "OK",
                    "result_verify": resultVerify
                }
            }catch(err){
                jsonResult = {
                    "status_code": "-99",
                    "status_msg": "Error",
                    "err_msg": err
                }
            }

            
        }else{
            jsonResult = {
                "status_code": "-99",
                "status_msg": "Failed",
                "err_msg": "Token not valid"
            }
        }

        //console.log(jsonResult);

        return jsonResult;
    }

}

module.exports = JwtUtil;