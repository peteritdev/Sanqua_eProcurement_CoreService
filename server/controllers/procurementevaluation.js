// OAuth Service
const OAuthService = require('../services/oauthservice.js');
const _oAuthServiceInstance = new OAuthService();

// Service
const ProcurementEvaluationService = require('../services/procurementevaluationservice.js');
const _serviceInstance = new ProcurementEvaluationService();

const { check, validationResult } = require('express-validator');

module.exports = { procurementEvaluation_Save, procurementEvaluation_GetById, procurementEvaluation_List, procurementEvaluation_Delete, procurementEvaluation_Unarchive, procurementEvaluation_Archive, procurementEvaluation_SaveEvaluation }

async function procurementEvaluation_List( req, res ){
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

async function procurementEvaluation_Save( req, res ){

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
                req.body.token = req.headers['x-token'];
                req.body.method = req.headers['x-method'];
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

async function procurementEvaluation_SaveEvaluation( req, res ){

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
                req.body.token = req.headers['x-token'];
                req.body.method = req.headers['x-method'];
                req.body.act = "update_evaluation";
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

async function procurementEvaluation_Archive( req, res ){

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
                
                req.params.user_id = oAuthResult.token_data.result_verify.id;
                req.params.user_name = oAuthResult.token_data.result_verify.name;
                joResult = await _serviceInstance.archive(req.params);
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

async function procurementEvaluation_Unarchive( req, res ){

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
                
                req.params.user_id = oAuthResult.token_data.result_verify.id;
                req.params.user_name = oAuthResult.token_data.result_verify.name;
                joResult = await _serviceInstance.unarchive(req.params);
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

async function procurementEvaluation_Delete( req, res ){

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

                joResult = await _serviceInstance.delete(req.params);
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

async function procurementEvaluation_GetById( req, res ){
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
                req.params.token = req.headers['x-token'];
                req.params.method = req.headers['x-method'];
                joResult = await _serviceInstance.getById(req.params);
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