const jwt = require('jsonwebtoken');
const md5 = require('md5');
const crypto = require('crypto');
const moment = require('moment');
const sequelize = require('sequelize');
const dateFormat = require('dateformat');
const Op = sequelize.Op;
const bcrypt = require('bcrypt');
const fs = require('fs');


const env         = process.env.NODE_ENV || 'localhost';
const config      = require(__dirname + '/../config/config.json')[env];

//Repository
const VendorRepository = require('../repository/vendorrepository.js');
const _vendorRepoInstance = new VendorRepository();
const VendorCatalogueRepository = require('../repository/vendorcataloguerepository.js');
const _vendorCatalogueRepoInstance = new VendorCatalogueRepository();

//Util
const Utility = require('peters-globallib-v2');
const { forEach } = require('lodash');
const _utilInstance = new Utility();

const GlobalUtility = require('../utils/globalutility.js');
const _globalUtilInstance = new GlobalUtility();

// Service
const CurrencyService = require('../services/currencyservice.js');
const _currencyService = new CurrencyService();

const Security = require('../utils/security.js');
const e = require('express');
const _secureInstance = new Security();

const multer = require('multer');
const _xlsToJson = require('xls-to-json-lc');
const _xlsxToJson = require('xlsx-to-json-lc');

// Setup multer storage
var storage = multer.diskStorage({
    destination: function( req, file, cb ){
      cb(null, './uploads/')
    },
    filename: function( req, file, cb ){
      var dateTimeStamp = Date.now();
      cb( null, file.fieldname + '-' + dateTimeStamp + '.' + file.originalname.split('.')[file.originalname.split('.').length -1])
    }
});
  
var upload = multer({
    storage: storage,
    fileFilter: function( req, file, callback ){
        if (['xls', 'xlsx'].indexOf(file.originalname.split('.')[file.originalname.split('.').length-1]) === -1) {
            return callback(new Error('Wrong extension type'));
        }
        callback(null, true);
    }
}).single('file');

var upload = multer({
    storage: storage
}).single('file');

class VendorService {
    constructor(){}

    async list(pParam){
        var xJoResult = {};
        var xJoArrData = [];       

        var xResultList = await _vendorRepoInstance.list(pParam);

        if( xResultList.count > 0 ){
            xJoResult.status_code = "00";
            xJoResult.status_msg = "OK";
            xJoResult.total_record = xResultList.count;

            var xRows = xResultList.rows;

            for(var index in xRows){                

                xJoArrData.push({
                    id: await _utilInstance.encrypt((xRows[index].id).toString(), config.cryptoKey.hashKey),
                    code: xRows[index].code,
                    name: xRows[index].name,
                    npwp: xRows[index].npwp,
                    business_entity: xRows[index].business_entity,
                    classification: xRows[index].classification,
                    province: xRows[index].province,
                    city: xRows[index].city,
                    address: xRows[index].address,
                    zip_code: xRows[index].zip_code,
                    phone1: ( xRows[index].phone1 != null && xRows[index].phone1 != '' ? (await _utilInstance.decrypt( xRows[index].phone1, config.cryptoKey.hashKey )).decrypted : '' ),
                    phone2: ( xRows[index].phone2 != null && xRows[index].phone2 != '' ? (await _utilInstance.decrypt( xRows[index].phone2, config.cryptoKey.hashKey )).decrypted : '' ),
                    email: ( xRows[index].email != null && xRows[index].email != '' ? (await _utilInstance.decrypt( xRows[index].email, config.cryptoKey.hashKey )).decrypted : '' ),
                    website: xRows[index].website,
                    status: xRows[index].status,
                    currency: xRows[index].currency,
                });
            }

            xJoResult.data = xJoArrData;
        }else{
            xJoResult.status_code = "00";
            xJoResult.status_msg = "OK";
            xJoResult.total_record = xResultList.count;
            xJoResult.data = xJoArrData;
        }

        return (xJoResult);
    } 

    async getVendorById( pParam ){
        var xJoResult;
        var xFlag = true;

        var xDecId = await _utilInstance.decrypt( pParam.id, config.cryptoKey.hashKey );
        if( xDecId.status_code == '00' ){
            pParam.id = xDecId.decrypted;
        }else{
            xFlag = false;
            xJoResult = xDecId;
        }

        if( xFlag ){
            var xData = await _vendorRepoInstance.getVendorById(pParam.id);
            if( xData != null ){
                xJoResult = {
                    status_code: "00",
                    status_msg: "OK",
                    data: {
                        id: await _utilInstance.encrypt( xData.id, config.cryptoKey.hashKey ),
                        code: xData.code,
                        name: xData.name,
                        logo: ( xData.logo == null ? '' : ( config.frontParam.photoPath.logo + xData.logo ) ),
                        npwp: xData.npwp,
                        business_entity: xData.business_entity,
                        classification: xData.classification,
                        sub_classification: xData.sub_classification,
                        province: xData.province,   
                        city: xData.city,
                        address: xData.address,
                        zip_code: xData.zip_code,
                        phone1: (await _utilInstance.decrypt( xData.phone1, config.cryptoKey.hashKey )).decrypted,
                        phone2: (await _utilInstance.decrypt( xData.phone2, config.cryptoKey.hashKey )).decrypted,
                        email: (await _utilInstance.decrypt( xData.email, config.cryptoKey.hashKey )).decrypted,
                        website: xData.website,
                        about: xData.about,
                        location_lat: xData.location_lat,
                        location_long: xData.location_long,
                        status: xData.status,
                        register_via: xData.register_via,
                        tags: xData.tags,
                        company_scale: xData.company_scale,
                        currency: xData.currency,
                    }
                }
            }
        }

        return xJoResult;
    }

    async save(param){
        var joResult;
        var checkDuplicateResult = await _vendorRepoInstance.isDataExists(param.name, param.email);
        var flagProcess = true;
        var xDec = null;
        var xVendorCode = "";

        // console.log(">>> Service : ");
        // console.log(JSON.stringify(param));

        if( ( param.act == "add" && checkDuplicateResult == null ) || param.act == "update" ){

            if( param.act == "update" ){
                xDec = await _utilInstance.decrypt(param.id, config.cryptoKey.hashKey);
                param.id = xDec.decrypted;
            }

            if( ( param.act == "update" && xDec.status_code == "00" ) || ( param.act == "add" ) ){                    
                var xDecUserId = await _utilInstance.decrypt(param.user_id, config.cryptoKey.hashKey);
                if( xDecUserId.status_code == "00" ){
                    param.user_id = xDecUserId.decrypted;                    
                }else{
                    flagProcess = false;
                    joResult = xDecUserId;
                }                    
            }else{
                flagProcess = false;
                joResult = xDec; 
            }       

            
            if( flagProcess ){
                // Note: This line for autogenerate vendor code
                // param = await _secureInstance.encryptCriticalField(param);
                // joResult = await _vendorRepoInstance.save( param );

                // if( joResult.status_code == '00' ){

                    // This line when use autogenerate vendor code
                    // if( param.act == "add" && pParam.code == '' ){
                    //     // Get currency code by id
                    //     var xCurrency = await _currencyService.getById( {id: param.currency_id} );

                    //     // Generate Vendor Code
                    //     if( xCurrency.status_code == '00' ){
                    //         xVendorCode = await _globalUtilInstance.generateVendorCode(joResult.clear_id, xCurrency.data.code );
                    //     }else{
                    //         xVendorCode = await _globalUtilInstance.generateVendorCode(joResult.clear_id, "IDR" );
                    //     }

                    //     // Update Vendor Code
                    //     var xParamUpdate = {
                    //         id: joResult.clear_id,
                    //         code: xVendorCode,
                    //         act: 'update',
                    //     }
                    //     var xUpdateResult = await _vendorRepoInstance.save(xParamUpdate);
                    //     joResult.result_update_vendor = xUpdateResult;
                    // }

                    if( param.act == "add" && pParam.code != '' ){
                        // Check if code exists or not
                        var xCheckData = await _vendorRepoInstance.getVendorByCode( pParam.code, null );
                        if( xCheckData != null ){
                            xJoResult = {
                                status_code: '-99',
                                status_msg: 'Vendor code already exists.'
                            }
                        }
                    }

                    param = await _secureInstance.encryptCriticalField(param);
                    joResult = await _vendorRepoInstance.save( param );
                    
                // }

                

            }

        }else{
            joResult = {
                status_code: "01",
                status_msg: "Data already exist in database"
            }
        }

        return (joResult);
    }

    async blockVendor( pParam ){
        var xJoResult;
        var xIsExist = null;
        var xFlagProcess = true;
        var xDecId = null;

        xDecId = await _utilInstance.decrypt( pParam.id, config.cryptoKey.hashKey );
        if( xDecId.status_code == "00" ){
            pParam.id = xDecId.decrypted;
            xDecId = await _utilInstance.decrypt(pParam.user_id, config.cryptoKey.hashKey);
            if( xDecId.status_code == "00" ){
                pParam.user_id = xDecId.decrypted;
            }else{
                xJoResult = xDecId;
                xFlagProcess = false;
            }
        }else{
            xDecId - xJoResult;
            xFlagProcess = false;
        }

        if( xFlagProcess ){
            xIsExist = await _vendorRepoInstance.getVendorById(pParam.id);
            if( xIsExist != null ){
                xJoResult = await _vendorRepoInstance.blockVendor(pParam);
            }else{
                xJoResult = {
                    status_code: "-99",
                    status_msg: "Vendor not found. Please provide correct id.",
                }
            }
        }

        return xJoResult;
    }

    async unblockVendor( pParam ){
        var xJoResult;
        var xIsExist = null;
        var xFlagProcess = true;
        var xDecId = null;

        xDecId = await _utilInstance.decrypt( pParam.id, config.cryptoKey.hashKey );
        if( xDecId.status_code == "00" ){
            pParam.id = xDecId.decrypted;
            xDecId = await _utilInstance.decrypt(pParam.user_id, config.cryptoKey.hashKey);
            if( xDecId.status_code == "00" ){
                pParam.user_id = xDecId.decrypted;
            }else{
                xJoResult = xDecId;
                xFlagProcess = false;
            }
        }else{
            xDecId - xJoResult;
            xFlagProcess = false;
        }

        if( xFlagProcess ){
            xIsExist = await _vendorRepoInstance.getVendorById(pParam.id);
            if( xIsExist != null ){
                xJoResult = await _vendorRepoInstance.unblockVendor(pParam);
            }else{
                xJoResult = {
                    status_code: "-99",
                    status_msg: "Vendor not found. Please provide correct id.",
                }
            }
        }

        return xJoResult;
    }

    async saveVendorDocument(pParam){
        var xJoResult;        
        var xFlagProcess = true;
        var xDec = null;
        var isExists = null;       

        xDec = await _utilInstance.decrypt(pParam.vendor_id, config.cryptoKey.hashKey);
        if( xDec.status_code == '00' ){
            pParam.vendor_id = xDec.decrypted;     
            xDec = await _utilInstance.decrypt(pParam.user_id, config.cryptoKey.hashKey);
            if( xDec.status_code == "00" ){
                pParam.user_id = xDec.decrypted;                    
            }else{
                xFlagProcess = false;
                xJoResult = xDec;
            }   
        }else{
            xFlagProcess = false;
            xJoResult = xDec;
        }      
        

        if( xFlagProcess ){                   

            isExists = await _vendorRepoInstance.isVendorDocumentExists(pParam.vendor_id, pParam.document_type_id);

            if( isExists != null ){
                pParam.act = "update";
            }else{
                pParam.act = "add";
            }

            xJoResult = await _vendorRepoInstance.saveVendorDocument( pParam );       
            
        }       

        return (xJoResult);
    }

    async delete( pParam ){
        var xJoResult;
        var xFlagProcess = true;  

        var xDecId = await _utilInstance.decrypt(pParam.id, config.cryptoKey.hashKey);
        if( xDecId.status_code == "00" ){
            pParam.id = xDecId.decrypted;                    
            xDecId = await _utilInstance.decrypt(pParam.user_id, config.cryptoKey.hashKey);
            if( xDecId.status_code == "00" ){
                pParam.deleted_by = xDecId.decrypted;
                pParam.deleted_by_name = pParam.user_name;
            }else{
                xFlagProcess = false;
                xJoResult = xDecId;
            }
        }else{
            xFlagProcess = false;
            xJoResult = xDecId;
        }

        if( xFlagProcess ){       
            
            // Check if vendor's document and vendor's catalogue has exists or not
            var xTotalVendorDocument = await _vendorRepoInstance.getTotalVendorDocumentByVendorId( pParam.id );
            var xTotalVendorCatalogue = await _vendorCatalogueRepoInstance.getTotalByVendorId( pParam.id );

            if( xTotalVendorDocument == 0 && xTotalVendorCatalogue == 0 ){
                var xDeleteResult = await _vendorRepoInstance.delete( pParam );
                xJoResult = xDeleteResult;
            }else{
                xJoResult = {
                    status_code: '-99',
                    status_msg: 'Data can not delete because it has related to another data'
                }
            }
            
        }

        return xJoResult;
    }

    async getVendorDocumentByDocumentTypeId( pParam ){
        var xJoResult = {};
        var xFlagProcess = true;

        if( pParam.vendor_id != '' && pParam.document_type_id != '' ){
            var xDecId = await _utilInstance.decrypt( pParam.vendor_id, config.cryptoKey.hashKey );
            if( xDecId.status_code == '00' ){
                pParam.vendor_id = xDecId.decrypted;
            }else{
                xFlagProcess = false;
                xJoResult = xDecId;
            }
        }

        if( xFlagProcess ){
            var xResult = await _vendorRepoInstance.getVendorDocumentByDocumentTypeId( pParam );
            if( xResult != null ){
                xJoResult = {
                    status_code: '00',
                    status_msg: 'OK',
                    data: {
                        id: await _utilInstance.encrypt( xResult.id, config.cryptoKey.hashKey ),
                        document_type_id: xResult.document_type_id,
                        document_no: xResult.document_no,
                        date: xResult.date,
                        expire_date: xResult.expire_date,
                        file: xResult.file,
                        description: xResult.description,
                        instance: xResult.instance,
                        siup_qualification: xResult.siup_qualification,
                        address: xResult.address,
                    },
                }
            }else{
                xJoResult = {
                    status_code: '-99',
                    status_msg: 'Data not found'
                };
            }
        }

        return xJoResult;
    }

    async uploadFromExcel( pReq, pRes ){
        var xExcelToJSON;
        upload( pReq, pRes, function( pErr ){
            if( pErr ){
                var joResult =  {
                    "status_code": "-99",
                    "status_msg": "",
                    "err_msg": pErr
                }

                try {
                    fs.unlinkSync(pReq.file.path);
                } catch(e) {
                    //error deleting the file
                    console.log(e);
                }
                
                pRes.setHeader('Content-Type','application/json');
                pRes.status(200).send(joResult);
            }

            console.log(pReq.file)

            if( !pReq.file ){
                var joResult = {
                    "status_code": "-99",
                    "status_msg": "",
                    "err_msg": "No file passed"
                }

                try {
                    fs.unlinkSync(pReq.file.path);
                } catch(e) {
                    //error deleting the file
                    console.log(e);
                }

                pRes.setHeader('Content-Type','application/json');
                pRes.status(200).send(joResult);
            }

            //start convert process
            /** Check the extension of the incoming file and
             *  use the appropriate module
             */
            if(pReq.file.originalname.split('.')[pReq.file.originalname.split('.').length-1] === 'xlsx'){
                xExcelToJSON = _xlsxToJson;
            } else {
                xExcelToJSON = _xlsToJson;
            }

            try {
                xExcelToJSON({
                    input: pReq.file.path, //the same path where we uploaded our file
                    output: null, //since we don't need output.json
                    lowerCaseHeaders:true
                }, function(err,result){
                    if(err) {
                        var joResult = {
                            "status_code": "-99",
                            "status_msg": "",
                            "err_msg": err
                        }

                        try {
                            fs.unlinkSync(pReq.file.path);
                        } catch(e) {
                            //error deleting the file
                            console.log(e);
                        }

                        pRes.setHeader('Content-Type','application/json');
                        pRes.status(200).send(joResult);
                    }
                    var joResult = {
                        "status_code": "00",
                        "status_msg": "OK",
                        "data": result,
                        "err_msg": null
                    }

                    try {
                        fs.unlinkSync(pReq.file.path);
                    } catch(e) {
                        //error deleting the file
                        console.log(e);
                    }

                    console.log(joResult);

                    pRes.setHeader('Content-Type','application/json');
                    pRes.status(200).send(joResult);
                });
            } catch (e){
                var joResult = {
                    "status_code": "-99",
                    "status_msg": "",
                    "err_msg": "Corupted excel file"
                }

                try {
                    fs.unlinkSync(pReq.file.path);
                } catch(e) {
                    //error deleting the file
                    console.log(e);
                }

                pRes.setHeader('Content-Type','application/json');
                pRes.status(200).send(joResult);
            }

        } );
    }

    async batchSaveVendor( pParam ){
        
        var joResult;
        var jaResult = [];
        var xMessageResult = "";
        var xFlagProcess = true;

        console.log(">>> Length : " + pParam.data.length);

        if( pParam.act == "add" ){
            for( var i = 0; i < pParam.data.length; i++ ){

                if( pParam.data[i].hasOwnProperty('business_entity_id') ){
                    pParam.data[i].business_entity_id = parseInt( pParam.data[i].business_entity_id );
                }
                if( pParam.data[i].hasOwnProperty('classification_id') ){
                    pParam.data[i].classification_id = parseInt( pParam.data[i].classification_id );
                }
                if( pParam.data[i].hasOwnProperty('sub_classification_id') ){
                    pParam.data[i].sub_classification_id = parseInt( pParam.data[i].sub_classification_id );
                }
                if( pParam.data[i].hasOwnProperty('province_id') ){
                    pParam.data[i].province_id = parseInt( pParam.data[i].province_id );
                }
                if( pParam.data[i].hasOwnProperty('city_id') ){
                    pParam.data[i].city_id = parseInt( pParam.data[i].city_id );
                }

                if( pParam.data[i].code == '' ){
                    xMessageResult += "Vendor name <strong>" + pParam.data[i].name + "</strong> must have code. Please fill valid code <br>";
                }else{
                    // If row has id meaning update based on id
                    if( pParam.data[i].hasOwnProperty('id') ){
                        if( pParam.data[i].id != '' ){
                            // Decrypt the value first
                            var xDecId = await _utilInstance.decrypt( pParam.data[i].id, config.cryptoKey.hashKey );
                            if( xDecId.status_code == '00' ){
                                pParam.data[i].id = xDecId.decrypted;
                            }else{
                                xFlagProcess = false;
                            }

                            if( xFlagProcess ){
                                // Check vendor code is duplicate or not
                                // var xCheckData = await _vendorRepoInstance.getVendorByCode( pParam.data[i].code, pParam.data[i].id );
                                // if( xCheckData != null ){
                                //     xMessageResult += "Vendor code <strong>" + pParam.data[i].code + "</strong> already exists. Please use another code <br>";
                                // }else{
                                //     // Do update based on id
                                //     pParam.data[i].act = "update";
                                //     var xAddResult = await _vendorRepoInstance.save( pParam.data[i] );
                                // }   

                                // Temporary not use this 
                                // Do update based on id
                                pParam.data[i].act = "update";
                                var xAddResult = await _vendorRepoInstance.save( pParam.data[i] );
                            }                            
                        }
                    }else{
                        var xCheckData = await _vendorRepoInstance.getVendorByCode( pParam.data[i].code, null );
                        if( xCheckData != null ){
                            xMessageResult += "Vendor code <strong>" + pParam.data[i].code + "</strong> already exists. Please use another code <br>";
                        }else{
                            // Do update based on id
                            pParam.data[i].act = "add";
                            var xAddResult = await _vendorRepoInstance.save( pParam.data[i] );
                        }
                    }
                }                         

            }

            // await _utilInstance.changeSequenceTable((pParam.data.length)+1, 'ms_vendors','id');

            joResult = {
                "status_code": "00",
                "status_msg": "Finish save to database",
                "line_saved": jaResult,
                "err_msg": xMessageResult,
            }
        }else if( pParam.act == "update" ){
            joResult = {
                "status_code": "-99",
                "status_msg": "Wrong value for parameter act",
            }
        }

        return joResult;

    }

}

module.exports = VendorService;