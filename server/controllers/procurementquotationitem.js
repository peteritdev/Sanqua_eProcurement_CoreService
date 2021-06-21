// OAuth Service
const OAuthService = require('../services/oauthservice.js');
const _oAuthServiceInstance = new OAuthService();

// Service
const ProcurementQuotationItemService = require('../services/procurementquotationitemservice.js');
const _serviceInstance = new ProcurementQuotationItemService();

const { check, validationResult } = require('express-validator');

module.exports = { procurementQuotationItem_List }

async function procurementQuotationItem_List( req, res ){
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