//Service
const VendorRateHistoryService = require('../services/vendorratehistoryservice.js');
const _serviceInstance = new VendorRateHistoryService();

// OAuth Service
const OAuthService = require('../services/oauthservice.js');
const _oAuthServiceInstance = new OAuthService();

//Validation
const { check, validationResult } = require('express-validator');

module.exports = {vendorRateHistory_Save, vendorRateHistory_List, vendorRateHistory_Delete, vendorRateHistory_GetById};

async function vendorRateHistory_GetById( req, res ){
    var joResult;
    var errors = null;

    var oAuthResult = await _oAuthServiceInstance.verifyToken( req.headers['x-token'], req.headers['x-method'] );

    if( oAuthResult.status_code == "00" ){
        if( oAuthResult.token_data.status_code == "00" ){
            // Validate first
            var errors = validationResult(req).array();   
            
            if( errors.length != 0 ){
                joResult = JSON.stringify({
                    "status_code": "-99",
                    "status_msg":"Parameter value has problem",
                    "error_msg": errors
                });
            }else{                      
                joResult = await _serviceInstance.getById(req.query);
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

async function vendorRateHistory_List( req, res ){
    var joResult;
    var errors = null;

    var oAuthResult = await _oAuthServiceInstance.verifyToken( req.headers['x-token'], req.headers['x-method'] );

    if( oAuthResult.status_code == "00" ){
        if( oAuthResult.token_data.status_code == "00" ){
            // Validate first
            var errors = validationResult(req).array();   
            
            if( errors.length != 0 ){
                joResult = JSON.stringify({
                    "status_code": "-99",
                    "status_msg":"Parameter value has problem",
                    "error_msg": errors
                });
            }else{                      
                joResult = await _serviceInstance.list(req.query);
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

async function vendorRateHistory_Save(req, res){
    var joResult;
    var errors = null;

    var oAuthResult = await _oAuthServiceInstance.verifyToken( req.headers['x-token'], req.headers['x-method'] );    

    if( oAuthResult.status_code == "00" ){
        if( oAuthResult.token_data.status_code == "00" ){

            // Validate first
            var errors = validationResult(req).array();   
            
            if( errors.length != 0 ){
                joResult = JSON.stringify({
                    "status_code": "-99",
                    "status_msg":"Parameter value has problem",
                    "error_msg": errors
                });
            }else{      
                
                req.body.user_id = oAuthResult.token_data.result_verify.id;
                req.body.user_name = oAuthResult.token_data.result_verify.name;
                joResult = await _serviceInstance.save(req.body);
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

async function vendorRateHistory_Delete( req, res ){
    var joResult;
    var errors = null;

    var oAuthResult = await _oAuthServiceInstance.verifyToken( req.headers['x-token'], req.headers['x-method'] );

    if( oAuthResult.status_code == "00" ){
        if( oAuthResult.token_data.status_code == "00" ){

            // Validate first
            var errors = validationResult(req).array();   
            
            if( errors.length != 0 ){
                joResult = JSON.stringify({
                    "status_code": "-99",
                    "status_msg":"Parameter value has problem",
                    "error_msg": errors
                });
            }else{      
                req.params.user_id = oAuthResult.token_data.result_verify.id;
                req.params.user_name = oAuthResult.token_data.result_verify.name;
                joResult = await _serviceInstance.delete(req.params);
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