//DECLARE SERVICES INSTANCE
// DocumentType
const DocumentTypeService = require('../services/documenttypeservice.js');
const _docTypeServiceInstance = new DocumentTypeService();

//BusinessEntity
const BusinessEntityService = require('../services/businessentityservice.js');
const _businessEntityServiceInstance = new BusinessEntityService();

//Classification
const ClassificationService = require('../services/classificationservice.js');
const _classificationServiceInstance = new ClassificationService();

// OAuth Service
const OAuthService = require('../services/oauthservice.js');
const _oAuthServiceInstance = new OAuthService();

// Province
const ProvinceService = require('../services/provinceservice.js');
const _provinceServiceInstance = new ProvinceService();

//Validation
const DocumentTypeValidation = require('../utils/validation/mastervalidation.js');
const _documentTypeValidationInstance = new DocumentTypeValidation();

module.exports = {documentType_Save, documentType_List, documentType_Delete, 
                  businessEntity_DropDown, classification_DropDown, province_DropDown};

// Document Type
async function documentType_List( req, res ){
    var joResult;
    var errors = null;

    var oAuthResult = await _oAuthServiceInstance.verifyToken( req.headers['x-token'], req.headers['x-method'] );

    if( oAuthResult.status_code == "00" ){
        if( oAuthResult.token_data.status_code == "00" ){
            errors = await _documentTypeValidationInstance.listDocumentType(req);
            if( errors ){
                joResult = JSON.stringify({
                    "status_code": "-99",
                    "status_msg":"Parameter value has problem",
                    "error_msg": errors
                });
            }else{
                joResult = await _docTypeServiceInstance.list(req.query);
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

async function documentType_Save(req, res){
    var joResult;
    var errors = null;

    var oAuthResult = await _oAuthServiceInstance.verifyToken( req.headers['x-token'], req.headers['x-method'] );   
    if( oAuthResult.status_code == "00" ){
        if( oAuthResult.token_data.status_code == "00" ){

            //Validate first
            if( req.body.act == "add" ){
                errors = await _documentTypeValidationInstance.addDocumentType(req);
            }else if( req.body.act == "update" ){                
                errors = await _documentTypeValidationInstance.updateDocumentType(req);
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
                joResult = await _docTypeServiceInstance.save(req.body);
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

async function documentType_Delete( req, res ){
    var joResult;
    var errors = null;

    var oAuthResult = await _oAuthServiceInstance.verifyToken( req.headers['x-token'], req.headers['x-method'] );

    if( oAuthResult.status_code == "00" ){
        if( oAuthResult.token_data.status_code == "00" ){

            errors = await _documentTypeValidationInstance.deleteDocumentType(req);
            if( errors ){
                joResult = JSON.stringify({
                    "status_code": "-99",
                    "status_msg":"Parameter value has problem",
                    "error_msg": errors
                });
            }else{
                req.query.user_id = oAuthResult.token_data.result_verify.id;
                joResult = await _docTypeServiceInstance.delete(req.query);
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

// Business Entity
async function businessEntity_DropDown( req, res ){
    var joResult;
    var errors = null;

    var oAuthResult = await _oAuthServiceInstance.verifyToken( req.headers['x-token'], req.headers['x-method'] );

    if( oAuthResult.status_code == "00" ){
        if( oAuthResult.token_data.status_code == "00" ){
            joResult = await _businessEntityServiceInstance.dropDownList(req.query);
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

// Classification
async function classification_DropDown( req, res ){
    var joResult;
    var errors = null;

    var oAuthResult = await _oAuthServiceInstance.verifyToken( req.headers['x-token'], req.headers['x-method'] );

    if( oAuthResult.status_code == "00" ){
        if( oAuthResult.token_data.status_code == "00" ){
            joResult = await _classificationServiceInstance.dropDownList(req.query);
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

// Province
async function province_DropDown( req, res ){
    var joResult;
    var errors = null;

    var oAuthResult = await _oAuthServiceInstance.verifyToken( req.headers['x-token'], req.headers['x-method'] );

    if( oAuthResult.status_code == "00" ){
        if( oAuthResult.token_data.status_code == "00" ){
            joResult = await _provinceServiceInstance.dropDownList(req.query);
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