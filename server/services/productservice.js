const jwt = require('jsonwebtoken');
const md5 = require('md5');
const crypto = require('crypto');
const moment = require('moment');
const sequelize = require('sequelize');
const dateFormat = require('dateformat');
const Op = sequelize.Op;
const bcrypt = require('bcrypt');


var config = require('../config/config.json');

// Model
const _modelUser = require('../models').ms_products;

//Repository
const ProductRepository = require('../repository/productrepository.js');
const _productRepoInstance = new ProductRepository();

//Util
const Utility = require('peters-globallib');
const _utilInstance = new Utility();

const _multer = require('multer');
const _xlsToJson = require('xls-to-json-lc');
const _xlsxToJson = require('xlsx-to-json-lc');

// Service
const ProductCategoryService = require('../services/productcategoryservice.js');
const _productCategoryServiceInstance = new ProductCategoryService();

// Setup multer storage
var _storage = _multer.diskStorage({
    destination: function( req, file, cb ){
      cb(null, './uploads/')
    },
    filename: function( req, file, cb ){
      var dateTimeStamp = Date.now();
      cb( null, file.fieldname + '-' + dateTimeStamp + '.' + file.originalname.split('.')[file.originalname.split('.').length -1])
    }
});

var _upload = _multer({
    storage: _storage,
    fileFilter: function( req, file, callback ){
        if (['xls', 'xlsx'].indexOf(file.originalname.split('.')[file.originalname.split('.').length-1]) === -1) {
            return callback(new Error('Wrong extension type'));
        }
        callback(null, true);
    }
}).single('file');

var _upload = _multer({
    storage: _storage
}).single('file');

class ProductService {
    constructor(){}

    async uploadFromExcel( pReq, pRes ){
        var xExcelToJSON;
        _upload( pReq, pRes, function( pErr ){
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

    async batchSave( pParam ){
        var joResult;
        var jaResult = [];
        var xFlagProcess = true;

        if( pParam.user_id != '' ){
            var xDecId = await _utilInstance.decrypt(pParam.user_id, config.cryptoKey.hashKey);
            if( xDecId.status_code == '00' ){
                pParam.user_id = xDecId.decrypted;
            }else{
                joResult = xDecId;
                xFlagProcess = false;
            }
        }
        
        if( xFlagProcess ){        

            for( var i = 0; i < pParam.data.length; i++ ){
                var xAddResult = {};
                var xCheckData = await _productRepoInstance.getProductByERPId( pParam.data[i] );

                // Get Product Category Id by ERP Category Id
                var xCategory = await _productCategoryServiceInstance.getProductCategoryByERPId( { erp_id: pParam.data[i].erp_category_id } );
                if( xCategory != null ){
                    pParam.data[i].category_id = xCategory.id;
                }

                if( xCheckData != null ){                    
                    pParam.data[i].updated_by = pParam.user_id;
                    pParam.data[i].updated_by_name = pParam.user_name;
                    pParam.data[i].act = 'update_by_erpid';
                    pParam.data[i].is_delete = 0;
                    xAddResult = await _productCategoryRepoInstance.save( pParam.data[i] );
                }else{
                    pParam.data[i].created_by = pParam.user_id;
                    pParam.data[i].created_by_name = pParam.user_name;
                    pParam.data[i].act = 'add';
                    pParam.data[i].is_delete = 0;
                    xAddResult = await _productRepoInstance.save( pParam.data[i] );
                }
                jaResult.push(xAddResult);
            }

            joResult = {
                "status_code": "00",
                "status_msg": "Finish save to database",
                "line_saved": jaResult,
            }

        }

        return joResult;
    }

    async list(param){
        var joResult = {};
        var joArrData = [];       

        var xResultList = await _productRepoInstance.list(param);

        if( xResultList.data.count > 0 ){
            joResult.status_code = "00";
            joResult.status_msg = "OK";
            joResult.recordsTotal = xResultList.count;
            joResult.recordsFiltered = xResultList.count;
            joResult.draw = param.draw;

            var xRows = xResultList.data.rows;

            for(var index in xRows){
                joArrData.push({
                    id: await _utilInstance.encrypt((xRows[index].id).toString(), config.cryptoKey.hashKey),
                    name: xRows[index].name,
                    photo: xRows[index].photo
                });
            }

            joResult.data = joArrData;
        }else{
            joResult.status_code = "00";
            joResult.status_msg = "OK";
            joResult.recordsTotal = xResultList.count;
            joResult.recordsFiltered = xResultList.count;
            joResult.draw = param.draw;
            joResult.data = joArrData;
        }

        return (joResult);
    }

    async dropDownList(pParam){
        var xJoResult = {};
        var xJoArrData = [];       

        var xResultList = await _productRepoInstance.list(pParam);

        if( xResultList.count > 0 ){
            xJoResult.status_code = "00";
            xJoResult.status_msg = "OK";

            var xRows = xResultList.rows;

            console.log(JSON.stringify(xRows));

            for(var index in xRows){                

                xJoArrData.push({
                    id: xRows[index].id,
                    // code: xRows[index].code,
                    name: xRows[index].name,
                });
            }

            xJoResult.data = xJoArrData;
        }else{
            xJoResult.status_code = "00";
            xJoResult.status_msg = "OK";
            xJoResult.data = xJoArrData;
        }

        return (xJoResult);
    }

    async save(param){
        var joResult;
        var checkDuplicateResult = await _productRepoInstance.isDataExists(param.name);
        var flagProcess = true;
        var xDec = null;

        if( ( param.act == "add" && checkDuplicateResult == null ) || param.act == "update" ){

            if( param.act == "update" ){
                xDec = await _utilInstance.decrypt(param.id);
                param.id = xDec.decrypted;
            }

            if( ( param.act == "update" && xDec.status_code == "00" ) || ( param.act == "add" ) ){                    
                var xDecUserId = await _utilInstance.decrypt(param.user_id);
                if( xDecUserId.status_code == "00" ){
                    param.user_id = xDecUserId.decrypted;
                    var xDecCategoryId = await _utilInstance.decrypt(param.category_id);
                    if( xDecCategoryId.status_code == "00" ){
                        param.category_id = xDecCategoryId.decrypted;
                        var xDecUnitId = await _utilInstance.decrypt(param.unit_id);
                        if( xDecUnitId.status_code == "00" ){
                            param.unit_id = xDecUnitId.decrypted;
                        }else{
                            flagProcess = false;
                            joResult = xDecUnitId;
                        }
                    }else{
                        flagProcess = false;
                        joResult = xDecCategoryId;
                    }
                }else{
                    flagProcess = false;
                    joResult = xDecUserId;
                }                    
            }else{
                flagProcess = false;
                joResult = xDec; 
            }       

            if( flagProcess )joResult = await _productRepoInstance.save( param );

        }else{
            joResult = {
                status_code: "01",
                status_msg: "Data already exist in database"
            }
        }

        return (joResult);
    }

    async delete( param ){
        var joResult;
        var flagProcess = true;
        var xDecId = await _utilInstance.decrypt(param.id);
        var xDecUserId = await _utilInstance.decrypt(param.user_id);

        if( xDecId.status_code == "00" ){
            param.id = xDecId.decrypted;    
            if( xDecUserId.status_code == "00" ){
                param.user_id = xDecUserId.decrypted;
            }else{
                flagProcess = false;
                joResult = xDecUserId;
            }                
        }else{
            flagProcess = false;
            joResult = xDecId;
        }

        if( flagProcess )joResult = await _productRepoInstance.delete(param);

        return (joResult);
    }

    async upload( param ){
        try{
            console.log(">>> Req : " + param.files);
            if( !req.files ){
                res.send({
                    status: false,
                    message: "No file uploaded"
                });
            }else{
                let uploadedPhoto = param.files.attachment;
                uploadedPhoto.mv('../files/product_categories/' + uploadedPhoto.name);
    
                res.send({
                    status: true,
                    message: "File successfully uploaded",
                    data: {
                        name: uploadedPhoto.name,
                        mimetype: uploadedPhoto.mimetype,
                        size: uploadedPhoto.size
                    }
                });
            }
        }catch( e ){
            res.status(500).send(e);
        }
    }

    

}

module.exports = ProductService;
