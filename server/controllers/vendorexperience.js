// OAuth Service
const OAuthService = require('../services/oauthservice.js');
const _oAuthServiceInstance = new OAuthService();

// Vendor Service
const VendorExperienceService = require('../services/vendorexperienceservice.js');
const _vendorExperienceServiceInstance = new VendorExperienceService();

const { check, validationResult } = require('express-validator');

module.exports = { save, list, deleteVendorExperience }

async function list( req, res ){

    var joResult;
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
                joResult = await _vendorExperienceServiceInstance.list(req.query);
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

async function save( req, res ){

    var joResult;
    var oAuthResult = await _oAuthServiceInstance.verifyToken( req.headers['x-token'], req.headers['x-method'] );

    if( oAuthResult.status_code == "00" ){
        if( oAuthResult.token_data.status_code == "00" ){
            // Validate first
            var errors = validationResult(req).array();   
            
            if( errors.length != 0 && req.body.act == "add" ){
                joResult = JSON.stringify({
                    "status_code": "-99",
                    "status_msg":"Parameter value has problem",
                    "error_msg": errors
                });
            }else{
                
                req.body.user_id = oAuthResult.token_data.result_verify.id;
                req.body.user_name = oAuthResult.token_data.result_verify.name;
                joResult = await _vendorExperienceServiceInstance.save(req.body);
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

async function deleteVendorExperience(req,res){
    var xJoResult = {};
    var xOAuthResult = await _oAuthServiceInstance.verifyToken( req.headers['x-token'], req.headers['x-method'] );

    if( xOAuthResult.status_code == "00" ){
        if( xOAuthResult.token_data.status_code == "00" ){
            // Validate first
            var xError = validationResult(req).array();               
            if( xError.length != 0 ){
                xJoResult = JSON.stringify({
                    "status_code": "-99",
                    "status_msg":"Parameter value has problem",
                    "error_msg": xError
                });
            }else{
                req.params.user_id = xOAuthResult.token_data.result_verify.id;
                req.params.user_name = xOAuthResult.token_data.result_verify.name;
                xJoResult = await _vendorExperienceServiceInstance.delete(req.params);
                xJoResult = JSON.stringify(xJoResult);
                console.log(xJoResult);
            }
        }else{
            xJoResult = JSON.stringify(xOAuthResult);
        }
    }else{
        xJoResult = JSON.stringify(xOAuthResult);
    }

    res.setHeader('Content-Type','application/json');
    res.status(200).send(xJoResult);

    return xJoResult;
}