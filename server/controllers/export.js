// OAuth Service
const OAuthService = require('../services/oauthservice.js');
const oAuthServiceInstance = new OAuthService();

// Service
const ExportService = require('../services/exportservice.js');
const _serviceInstance = new ExportService();

const env         = process.env.NODE_ENV || 'localhost';
const config      = require(__dirname + '/../config/config.json')[env];
const { check, validationResult } = require('express-validator');

module.exports = { generateFPB, }

async function generateFPB( req, res ){
    var joResult = {};
    var oAuthResult = await oAuthServiceInstance.verifyToken( req.headers['x-token'], req.headers['x-method'] );

    console.log(">>> Here");

    if( oAuthResult.status_code == "00" ){
        if( oAuthResult.token_data.status_code == "00" ){
            await _serviceInstance.generateFPB(req.params.id, req.headers['x-method'], req.headers['x-token'], res);
        }else{
            joResult = JSON.stringify(oAuthResult);
            res.setHeader('Content-Type','application/json');
            res.status(200).send(joResult);
        }
    }else{
        joResult = JSON.stringify(oAuthResult);
        res.setHeader('Content-Type','application/json');
        res.status(200).send(joResult);
    }
}