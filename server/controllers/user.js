// User Service
const UserService = require('../services/userservice.js');
const userServiceInstance = new UserService();
// User Validation
const UserValidation = require('../utils/validation/uservalidation.js');
const userValidationInstance = new UserValidation();

//Library
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

module.exports = { register, generatePassword, verifyAccount, login, forgotPassword, verifyForgotPassword, changePassword, loginGoogle, parseQueryGoogle, verifyToken};

async function register( req, res ){
    var joResult;

    // Validate first
    var errors = await userValidationInstance.register(req);
    if( errors ){
        joResult = JSON.stringify({
            "status_code": "-99",
            "status_msg":"Parameter value has problem",
            "error_msg": errors
        });
    }else{
        joResult = await userServiceInstance.doRegister(req.body);
    }    

    res.setHeader('Content-Type','application/json');
    res.status(200).send(joResult);
}

async function generatePassword( req, res ){

    var joResult;

    //var encPassword = md5( req.body.password + config.md5Key );
    bcrypt.genSalt( 10, function( err, salt ){
        bcrypt.hash( req.body.password, salt, function( err, hash ){
            joResult = JSON.stringify({
                "status_code": "00",
                "status_msg": "User successfully created",
                "password": hash
            });
            res.setHeader('Content-Type','application/json');
            res.status(200).send(joResult);
        });
    } );

}

async function verifyAccount(req, res){
    var joResult;

    // Validate first
    var errors = await userValidationInstance.verifyAccount(req);
    if( errors ){
        joResult = JSON.stringify({
            "status_code": "-99",
            "status_msg":"Parameter has problem",
            "error_msg": errors
        });
    }else{
        joResult = await userServiceInstance.doVerifyAccount(req.body);
    }    

    res.setHeader('Content-Type','application/json');
    res.status(200).send(joResult);
}

async function login(req, res){
    var joResult;

    // Validate first
    var errors = await userValidationInstance.login(req);
    if( errors ){
        joResult = JSON.stringify({
            "status_code": "-99",
            "status_msg":"Parameter has problem",
            "error_msg": errors
        });
    }else{
        joResult = await userServiceInstance.doLogin(req.body);
    }    

    res.setHeader('Content-Type','application/json');
    res.status(200).send(joResult);
}

async function loginGoogle(req, res){
    var joResult;

    joResult = await userServiceInstance.doLogin_GoogleID(req.body); 

    res.setHeader('Content-Type','application/json');
    res.status(200).send(joResult);
}

async function parseQueryGoogle( req, res ){
    var joResult;

    joResult = await userServiceInstance.doParseQueryString_Google(req.body); 

    res.setHeader('Content-Type','application/json');
    res.status(200).send(joResult);
}

async function forgotPassword(req, res){
    var joResult;

    // Validate first
    var errors = await userValidationInstance.forgotPassword(req);
    if( errors ){
        joResult = JSON.stringify({
            "status_code": "-99",
            "status_msg":"Parameter has problem",
            "error_msg": errors
        });
    }else{
        joResult = await userServiceInstance.doForgotPassword(req.body);
    }    

    res.setHeader('Content-Type','application/json');
    res.status(200).send(joResult);
}

async function verifyForgotPassword(req, res){
    var joResult;

    // Validate first
    var errors = await userValidationInstance.verifyAccount(req);
    if( errors ){
        joResult = JSON.stringify({
            "status_code": "-99",
            "status_msg":"Parameter has problem",
            "error_msg": errors
        });
    }else{
        joResult = await userServiceInstance.doVerifyForgotPasswordCode_JWT(req.body);
    }    

    res.setHeader('Content-Type','application/json');
    res.status(200).send(joResult);
}

async function changePassword(req, res){
    var joResult;

    // Validate first
    var errors = await userValidationInstance.changePassword(req);
    if( errors ){
        joResult = JSON.stringify({
            "status_code": "-99",
            "status_msg":"Parameter has problem",
            "error_msg": errors
        });
    }else{
        joResult = await userServiceInstance.doChangePassword(req.body);
    }    

    res.setHeader('Content-Type','application/json');
    res.status(200).send(joResult);
}

async function verifyToken(req, res){
    var joResult;

    joResult = await userServiceInstance.verifyToken({
         token: req.query.token,
         method: req.query.method
    });

    
    res.setHeader('Content-Type','application/json');
    res.status(200).send(joResult);
}