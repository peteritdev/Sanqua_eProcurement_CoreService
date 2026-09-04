// OAuth Service
const OAuthService = require('../services/oauthservice.js');
const oAuthServiceInstance = new OAuthService();

// Service
const ExportService = require('../services/exportservice.js');
const _serviceInstance = new ExportService();

const env         = process.env.NODE_ENV || 'localhost';
const config      = require(__dirname + '/../config/config.json')[env];
const { check, validationResult } = require('express-validator');

module.exports = { generateFPB, generatePayreq, generateGR, generatePJCA, generateRAB, generateRAB_V2, generateFPB_V2 }

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

async function generatePayreq( req, res ){
    try {
            
        var joResult = {};
        var oAuthResult = await oAuthServiceInstance.verifyToken( req.headers['x-token'], req.headers['x-method'] );

        if( oAuthResult.status_code == "00" ){
            if( oAuthResult.token_data.status_code == "00" ){
                await _serviceInstance.generatePayreq_Puppeteer(req.params.id, req.headers['x-method'], req.headers['x-token'], res, oAuthResult.token_data.result_verify);
            } else{
                joResult = JSON.stringify(oAuthResult);
                res.setHeader('Content-Type','application/json');
                res.status(200).send(joResult);
            }
        }else{
            joResult = JSON.stringify(oAuthResult);
            res.setHeader('Content-Type','application/json');
            res.status(200).send(joResult);
        }
    
    } catch (err) {
        console.error('>>> generatePayreq controller error:', err);

        if (!res.headersSent && !res.destroyed) {
            return res.status(500).json({
                message: err.message || 'Failed to generate PDF'
            });
        }
    }
}

async function generateGR( req, res ){
    var joResult = {};
    var oAuthResult = await oAuthServiceInstance.verifyToken( req.headers['x-token'], req.headers['x-method'] );

    console.log(">>> Here");

    if( oAuthResult.status_code == "00" ){
        if( oAuthResult.token_data.status_code == "00" ){
            await _serviceInstance.generateGR(req.params.id, req.headers['x-method'], req.headers['x-token'], res);
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

async function generatePJCA( req, res ){
    var joResult = {};
    var oAuthResult = await oAuthServiceInstance.verifyToken( req.headers['x-token'], req.headers['x-method'] );

    console.log(">>> Here");

    if( oAuthResult.status_code == "00" ){
        if( oAuthResult.token_data.status_code == "00" ){
            await _serviceInstance.generatePJCA_Puppeteer(req.params.id, req.headers['x-method'], req.headers['x-token'], res);
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

async function generateRAB( req, res ){
    var joResult = {};
    var oAuthResult = await oAuthServiceInstance.verifyToken( req.headers['x-token'], req.headers['x-method'] );

    console.log(">>> Here");

    if( oAuthResult.status_code == "00" ){
        if( oAuthResult.token_data.status_code == "00" ){
            await _serviceInstance.generateRAB(req.params.id, req.headers['x-method'], req.headers['x-token'], res);
            // await _serviceInstance.generateRAB_Puppeteer(req.params.id, req.headers['x-method'], req.headers['x-token'], res);
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
async function generateRAB_V2( req, res ){
    var joResult = {};
    var oAuthResult = await oAuthServiceInstance.verifyToken( req.headers['x-token'], req.headers['x-method'] );

    console.log(">>> Here");

    if( oAuthResult.status_code == "00" ){
        if( oAuthResult.token_data.status_code == "00" ){
            // await _serviceInstance.generateRAB(req.params.id, req.headers['x-method'], req.headers['x-token'], res);
            await _serviceInstance.generateRAB_Puppeteer(req.params.id, req.headers['x-method'], req.headers['x-token'], res);
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

async function generateFPB_V2( req, res ){
    var joResult = {};
    var oAuthResult = await oAuthServiceInstance.verifyToken( req.headers['x-token'], req.headers['x-method'] );

    console.log(">>> Here");

    if( oAuthResult.status_code == "00" ){
        if( oAuthResult.token_data.status_code == "00" ){
            // await _serviceInstance.generateRAB(req.params.id, req.headers['x-method'], req.headers['x-token'], res);
            await _serviceInstance.generateFPB_Puppeteer(req.params.id, req.headers['x-method'], req.headers['x-token'], res);
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
