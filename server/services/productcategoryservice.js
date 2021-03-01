const jwt = require('jsonwebtoken');
const md5 = require('md5');
const crypto = require('crypto');
const moment = require('moment');
const sequelize = require('sequelize');
const dateFormat = require('dateformat');
const Op = sequelize.Op;
const bcrypt = require('bcrypt');
const fs = require('fs');

const env         = process.env.NODE_ENV || 'development';
const config      = require(__dirname + '/../config/config.json')[env];

// Model
const modelUser = require('../models').ms_users;

//Repository
const ProductCategoryRepository = require('../repository/productcategoryrepository.js');
const _productCategoryRepoInstance = new ProductCategoryRepository();

//Util
const Utility = require('peters-globallib');
const _utilInstance = new Utility();

const _multer = require('multer');
const _xlsToJson = require('xls-to-json-lc');
const _xlsxToJson = require('xlsx-to-json-lc');

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

class ProductCategoryService {
    constructor(){}

    async dropDownList(pParam){
        var xJoResult = {};
        var xJoArrData = [];  
        var xFlagProcess = true;     

        if( xFlagProcess ){

            var xResultList = await _productCategoryRepoInstance.list(pParam);

            if( xResultList.count > 0 ){
                xJoResult.status_code = "00";
                xJoResult.status_msg = "OK";

                var xRows = xResultList.rows;

                for(var index in xRows){                

                    xJoArrData.push({
                        id: xRows[index].id,
                        name: xRows[index].name,
                    });
                }

                xJoResult.data = xJoArrData;
            }else{
                xJoResult.status_code = "00";
                xJoResult.status_msg = "OK";
                xJoResult.data = xJoArrData;
            }

        }        

        return (xJoResult);
    }

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

    async list(pParam){
        var xJoResult = {};
        var xJoArrData = [];

        var xResultList = await _productCategoryRepoInstance.list(pParam);

        if( xResultList.count > 0 ){
            var xRows = xResultList.rows;
            for( var index in xRows ){
                xJoArrData.push({
                    id: await _utilInstance.encrypt( (xRows[index].id).toString(), config.cryptoKey.hashKey ),
                    name: xRows[index].name,
                    photo: xRows[index].photo,
                    created_at: xRows[index].createdAt,
                    created_by_name: xRows[index].created_by_name,
                    updated_at: xRows[index].updatedAt,
                    updated_by_name: xRows[index].updated_by_name,
                });
            }
            xJoResult = {
                status_code: "00",
                status_msg: "OK",
                data: xJoArrData,
                total_record: xResultList.count,
            }
        }else{
            xJoResult = {
                status_code: "-99",
                status_msg: "Data not found",
            };
        }

        return xJoResult;
    }

    async save(pParam){
        var xJoResult;
        var xAct = pParam.act;
        var xFlagProcess = true;

        delete pParam.act;

        if( xAct == "add" ){           

            // User Id
            var xDecId = await _utilInstance.decrypt(pParam.user_id, config.cryptoKey.hashKey);
            if( xDecId.status_code == '00' ){
                pParam.created_by = xDecId.decrypted;
                pParam.created_by_name = pParam.user_name;
            }else{
                xFlagProcess = false;
                xJoResult = xDecId;
            }
            
            if( xFlagProcess ){
                var xAddResult = await _productCategoryRepoInstance.save( pParam, xAct );
                xJoResult = xAddResult;
            }           


        }else if( xAct == "update" ){

            console.log(JSON.stringify(pParam));

            var xDecId = await _utilInstance.decrypt(pParam.id, config.cryptoKey.hashKey);
            if( xDecId.status_code == "00" ){
                pParam.id = xDecId.decrypted;                    
                xDecId = await _utilInstance.decrypt(pParam.user_id, config.cryptoKey.hashKey);
                if( xDecId.status_code == "00" ){
                    pParam.updated_by = xDecId.decrypted;
                    pParam.updated_by_name = pParam.user_name;
                }else{
                    xFlagProcess = false;
                    xJoResult = xDecId;
                }                
            }else{
                xFlagProcess = false;
                xJoResult = xDecId;
            }

            if( xFlagProcess ){
                var xAddResult = await _productCategoryRepoInstance.save( pParam, xAct );
                xJoResult = xAddResult;
            }
            
        }

        return xJoResult;
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

            var xDeleteResult = await _productCategoryRepoInstance.delete( pParam );
            xJoResult = xDeleteResult;
            
        }

        return xJoResult;
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
                var xCheckData = await _productCategoryRepoInstance.getProductCategoryByERPId( pParam.data[i] );
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
                    xAddResult = await _productCategoryRepoInstance.save( pParam.data[i] );
                }
                jaResult.push(xAddResult);
            }

            await _utilInstance.changeSequenceTable((pParam.data.length)+1, 'ms_productcategories','id');

            joResult = {
                "status_code": "00",
                "status_msg": "Finish save to database",
                "line_saved": jaResult,
            }

        }

        return joResult;
    }

    async getProductCategoryByERPId(pParam){
        var xJoResult = {};

        if( pParam.erp_id.length < 65 ){
            xJoResult = await _productCategoryRepoInstance.getProductCategoryByERPId(pParam);
        }

        return xJoResult;
    }

}

module.exports = ProductCategoryService;
