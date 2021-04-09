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
const VendorCatalogueQuotationRepository = require('../repository/vendorcataloguequotationrepository.js');
const _repoInstance = new VendorCatalogueQuotationRepository();

const VendorCatalogueRepository = require('../repository/vendorcataloguerepository.js');
const _vendorCatalogueRepoInstance = new VendorCatalogueRepository();

const VendorRepository = require('../repository/vendorrepository.js');
const _vendorRepoInstance = new VendorRepository();

const ProductRepository = require('../repository/productrepository.js');
const _productRepoInstance = new ProductRepository();

//Util
const Utility = require('peters-globallib');
const _utilInstance = new Utility();

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

class VendorCatalogueQuotationService {
    constructor(){}   

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

    async batchSave( pParam ){
        
        var joResult;
        var jaResult = [];
        var jaExistingData = [];
        var xFlagProcess = true;

        if( pParam.act == "add" ){

            var xCheckData_Vendor = null;
            var xCheckData_Product = null;
            var xCheckData_Catalogue = null;
            var xStringMsg = "";

            for( var i = 0; i < pParam.data.length; i++ ){

                xCheckData_Vendor = null;   
                xCheckData_Product = null;    
                xCheckData_Catalogue = null;            
                
                if( pParam.data[i].vendor_code != '' && pParam.data[i].product_code != '' ){

                    // Check vendor_code is exists
                    xCheckData_Vendor = await _vendorRepoInstance.getVendorByCode( pParam.data[i].vendor_code );

                    // Check product_code is exists
                    xCheckData_Product = await _productRepoInstance.getProductByCode( { code: pParam.data[i].product_code } );

                    if( xCheckData_Vendor == null ){
                        xStringMsg += "Row " + (i+1) + " vendor code " + pParam.data[i].vendor_code + " doesn't exists, \n"; 
                    }

                    if( xCheckData_Product == null ){
                        xStringMsg += "Row " + (i+1) + " product code " + pParam.data[i].product_code + " doesn't exists, \n";    
                    }

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
                                pParam.data[i].act = "update";
                                var xAddResult = await _repoInstance.save( pParam.data[i], "update" );
                            }
                        }         
                    }else{

                        // If Vendor code and product code is exists
                        if( xCheckData_Vendor != null && xCheckData_Product != null ){
                            // Get Catalogue Id from Vendor Catalogue
                            xCheckData_Catalogue = await _vendorCatalogueRepoInstance.getByVendorCodeAndProductCode( { vendor_code: pParam.data[i].vendor_code, product_code: pParam.data[i].product_code } );
                            if( xCheckData_Catalogue == null ){                            
                                xStringMsg += "Row " + (i+1) + " vendor code and product code not valid, \n";
                            }else{                            
                                pParam.data[i].vendor_catalogue_id = xCheckData_Catalogue.id;
                                var xAddResult = await _repoInstance.save( pParam.data[i], "add" );
                            }
                        }
                    }

                }else{
                    xStringMsg += "Row " + (i+1) + " vendor code and product code can not be empty, \n";
                }               

            }

            // await _utilInstance.changeSequenceTable((pParam.data.length)+1, 'ms_vendorcataloguequotations','id');

            joResult = {
                "status_code": "00",
                "status_msg": "Finish save to database",
                "err_msg": xStringMsg,
            }
        }else if( pParam.act == "update" ){

        }

        return joResult;

    }

    async getById( pParam ){
        var xJoResult = {};
        var xFlagProcess = true;

        if( pParam.id != '' ){
            var xDecId = await _utilInstance.decrypt( pParam.id, config.cryptoKey.hashKey );
            if( xDecId.status_code == '00' ){
                pParam.id = xDecId.decrypted;
            }else{
                xFlagProcess = false;
                xJoResult = xDecId;
            }
            if( xFlagProcess ){
                var xResult = await _repoInstance.getById( pParam );
                if( xResult != null ){
                    xJoResult = {
                        status_code: '00',
                        status_msg: 'OK',
                        data: xResult
                    }
                }else{
                    xJoResult = {
                        status_code: "-99",
                        status_msg: "Data not found",
                    };
                }
            }
        }else{
            xJoResult = {
                status_code: '-99',
                status_msg: 'Parameter not valid'
            }
        }

        return xJoResult;
    }

    async list(pParam){
        var xJoResult = {};
        var xJoArrData = [];
        var xFlagProcess = true;

        if( pParam.hasOwnProperty('vendor_catalogue_id') ){
            if( pParam.vendor_catalogue_id != '' ){
                var xDecId = await _utilInstance.decrypt(pParam.vendor_catalogue_id, config.cryptoKey.hashKey);
                if( xDecId.status_code == '00' ){
                    pParam.vendor_catalogue_id = xDecId.decrypted;
                }else{
                    xFlagProcess = false;
                    xJoResult = xDecId;
                }
            }
        }        

        if( xFlagProcess ){
            var xResultList = await _repoInstance.list(pParam);
            if( xResultList.count > 0 ){
                var xRows = xResultList.rows;
                for( var index in xRows ){
    
                    xJoArrData.push({
                        id: await _utilInstance.encrypt( (xRows[index].id).toString(), config.cryptoKey.hashKey ),
                        vendor: ( xRows[index].vendor_catalogue != null ? xRows[index].vendor_catalogue.vendor : null ),
                        product: ( xRows[index].vendor_catalogue != null ? xRows[index].vendor_catalogue.product : null ),
                        period_start: xRows[index].period_start,
                        period_end: xRows[index].period_end,
                        uom: xRows[index].uom,
                        price_per_unit: xRows[index].price_per_unit,
                        file_quotation: xRows[index].file_quotation,
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
        }      

        return xJoResult;
    }

    async dropDownList(pParam){
        var xJoResult = {};
        var xJoArrData = [];  
        var xFlagProcess = true;     

        if( xFlagProcess ){

            var xResultList = await _repoInstance.list(pParam);

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

    async save(pParam){
        var xJoResult;
        var xAct = pParam.act;
        var xFlagProcess = true;

        delete pParam.act;

        if( pParam.vendor_catalogue_id != '' ){
            var xDecId = await _utilInstance.decrypt( pParam.vendor_catalogue_id, config.cryptoKey.hashKey );
            if( xDecId.status_code == '00' ){
                pParam.vendor_catalogue_id = xDecId.decrypted;
            }else{
                xFlagProcess = false;
                xJoResult = xDecId;
            }
        }else{
            xJoResult = {
                status_code: '-99',
                status_msg: 'Parameter not valid'
            }
        }

        if( xFlagProcess ){
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
                    var xAddResult = await _repoInstance.save( pParam, xAct );
                    xJoResult = xAddResult;
                }           
    
    
            }else if( xAct == "update" ){
    
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
                    var xAddResult = await _repoInstance.save( pParam, xAct );
                    xJoResult = xAddResult;
                }
                
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
            var xDeleteResult = await _repoInstance.delete( pParam );
            xJoResult = xDeleteResult;
        }

        return xJoResult;
    }   

}

module.exports = VendorCatalogueQuotationService;
