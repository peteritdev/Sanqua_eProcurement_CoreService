//Service
const ProductCategoryService = require('../services/productcategoryservice.js');
const _productCategoryServiceInstance = new ProductCategoryService();

// OAuth Service
const OAuthService = require('../services/oauthservice.js');
const _oAuthServiceInstance = new OAuthService();

const { check, validationResult } = require('express-validator');

module.exports = {productCategory_Save, productCategory_List, productCategory_Delete, productCategory_Upload, productCategory_BatchSave};

async function productCategory_Upload( req, res ){
    var joResult = {};
    var oAuthResult = await _oAuthServiceInstance.verifyToken( req.headers['x-token'], req.headers['x-method'] );

    if( oAuthResult.status_code == "00" ){
        if( oAuthResult.token_data.status_code == "00" ){
            await _productCategoryServiceInstance.uploadFromExcel(req, res);
            
            /*joResult.token_data = oAuthResult.token_data;
            joResult = JSON.stringify(joResult);*/
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

// Document Type
async function productCategory_List( req, res ){
    var joResult;
    var errors = null;

    var oAuthResult = await _oAuthServiceInstance.verifyToken( req.headers['x-token'], req.headers['x-method'] );

    if( oAuthResult.status_code == "00" ){
        if( oAuthResult.token_data.status_code == "00" ){
            errors = await validationInstance.listProductCategory(req);
            if( errors ){
                joResult = JSON.stringify({
                    "status_code": "-99",
                    "status_msg":"Parameter value has problem",
                    "error_msg": errors
                });
            }else{                
                joResult = await _productCategoryServiceInstance.list(req.query);
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

async function productCategory_Save(req, res){
    var joResult;
    var errors = null;

    var oAuthResult = await _oAuthServiceInstance.verifyToken( req.headers['x-token'], req.headers['x-method'] );    

    if( oAuthResult.status_code == "00" ){
        if( oAuthResult.token_data.status_code == "00" ){

            req.body.user_id = oAuthResult.token_data.result_verify.id;
            req.body.user_name = oAuthResult.token_data.result_verify.name;

            //Validate first
            if( req.body.act == "add" ){
                errors = await validationInstance.addProductCategory(req);
            }else if( req.body.act == "update" ){
                errors = await validationInstance.updateProductCategory(req);
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
                joResult = await _productCategoryServiceInstance.save(req.body);
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

async function productCategory_BatchSave(req, res){
    var joResult;
    var errors = null;

    var oAuthResult = await _oAuthServiceInstance.verifyToken( req.headers['x-token'], req.headers['x-method'] );        

    if( oAuthResult.status_code == "00" ){
        if( oAuthResult.token_data.status_code == "00" ){

            req.body.user_id = oAuthResult.token_data.result_verify.id;
            req.body.user_name = oAuthResult.token_data.result_verify.name;
            joResult = await _productCategoryServiceInstance.batchSave(req.body);
            // joResult.token_data = oAuthResult.token_data;
            joResult = JSON.stringify(joResult);

        }else{
            joResult = JSON.stringify(oAuthResult);
        }

    }else{
        joResult = JSON.stringify(oAuthResult);
    }  

    

    res.setHeader('Content-Type','application/json');
    res.status(200).send(joResult);
}

async function productCategory_Delete( req, res ){
    var joResult;
    var errors = null;

    var oAuthResult = await _oAuthServiceInstance.verifyToken( req.headers['x-token'], req.headers['x-method'] );

    if( oAuthResult.status_code == "00" ){
        if( oAuthResult.token_data.status_code == "00" ){

            errors = await validationInstance.deleteProductCategory(req);
            if( errors ){
                joResult = JSON.stringify({
                    "status_code": "-99",
                    "status_msg":"Parameter value has problem",
                    "error_msg": errors
                });
            }else{
                req.query.user_id = oAuthResult.token_data.result_verify.id;
                joResult = await _productCategoryServiceInstance.delete(req.query);
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