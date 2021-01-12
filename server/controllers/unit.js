//Service
const UnitService = require('../services/unitservice.js');
const unitServiceInstance = new UnitService();

// OAuth Service
const OAuthService = require('../services/oauthservice.js');
const oAuthServiceInstance = new OAuthService();

//Validation
const Validation = require('../utils/validation/mastervalidation.js');
const product = require('../models/product.js');
const { eq } = require('lodash');
const validationInstance = new Validation();


module.exports = {unit_Save, unit_List, unit_Delete};

// Document Type
async function unit_List( req, res ){
    var joResult;
    var errors = null;

    var oAuthResult = await oAuthServiceInstance.verifyToken( req.headers['x-token'], req.headers['x-method'] );

    if( oAuthResult.status_code == "00" ){
        if( oAuthResult.token_data.status_code == "00" ){
            errors = await validationInstance.listUnit(req);
            if( errors ){
                joResult = JSON.stringify({
                    "status_code": "-99",
                    "status_msg":"Parameter value has problem",
                    "error_msg": errors
                });
            }else{                
                joResult = await unitServiceInstance.list(req.query);
                joResult.token_data = oAuthResult.token_data;
                joResult = JSON.stringify(joResult);
            }
        }else{
            joResult = JSON.stringify(oAuthResult);
        }   
    }else{
        joResult = JSON.stringify(oAuthResult);
    }    

    res.setHeader('Content-Type','application/json');
    res.status(200).send(joResult);
}

async function unit_Save(req, res){
    var joResult;
    var errors = null;

    var oAuthResult = await oAuthServiceInstance.verifyToken( req.headers['x-token'], req.headers['x-method'] );    

    if( oAuthResult.status_code == "00" ){
        if( oAuthResult.token_data.status_code == "00" ){

            //Validate first
            if( req.body.act == "add" ){
                errors = await validationInstance.addUnit(req);
            }else if( req.body.act == "update" ){
                errors = await validationInstance.updateUnit(req);
            }else{
                errors = null;
            }
            
            if( errors ){
                joResult = JSON.stringify({
                    "status_code": "-99",
                    "status_msg":"Parameter value has problem",
                    "error_msg": errors
                });
            }else{
                
                req.body.user_id = oAuthResult.token_data.result_verify.id;
                joResult = await unitServiceInstance.save(req.body);
                joResult.token_data = oAuthResult.token_data;
                joResult = JSON.stringify(joResult);
            }

        }else{
            joResult = JSON.stringify(oAuthResult);
        }

    }else{
        joResult = JSON.stringify(oAuthResult);
    }  

    res.setHeader('Content-Type','application/json');
    res.status(200).send(joResult);
}

async function unit_Delete( req, res ){
    var joResult;
    var errors = null;

    var oAuthResult = await oAuthServiceInstance.verifyToken( req.headers['x-token'], req.headers['x-method'] );

    if( oAuthResult.status_code == "00" ){
        if( oAuthResult.token_data.status_code == "00" ){

            errors = await validationInstance.deleteUnit(req);
            if( errors ){
                joResult = JSON.stringify({
                    "status_code": "-99",
                    "status_msg":"Parameter value has problem",
                    "error_msg": errors
                });
            }else{
                req.query.user_id = oAuthResult.token_data.result_verify.id;
                joResult = await unitServiceInstance.delete(req.query);
                joResult.token_data = oAuthResult.token_data;
                joResult = JSON.stringify(joResult);
            }
            console.log(oAuthResult);

        }else{
            joResult = JSON.stringify(oAuthResult);
        }

    }else{
        joResult = JSON.stringify(oAuthResult);
    }

    res.setHeader('Content-Type','application/json');
    res.status(200).send(joResult);
}