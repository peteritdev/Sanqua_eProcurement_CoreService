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

// Utility
const Utility = require('peters-globallib-v2');
const _utilInstance = new Utility();

// Repository
const VendorCatalogueRepository = require('../repository/vendorcataloguerepository.js');
const _vendorCatalogueRepoInstance = new VendorCatalogueRepository();

const ProductRepository = require('../repository/productrepository.js');
const _productRepoInstance = new ProductRepository();

const VendorRepository = require('../repository/vendorrepository.js');
const _vendorRepoInstance = new VendorRepository();

const UnitRepository = require('../repository/unitrepository.js');
const _unitRepoInstance = new UnitRepository();

const CurrencyRepository = require('../repository/currencyrepository.js');
const _currencyRepoInstance = new CurrencyRepository();

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

class VendorCatalogueService {
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
                    }else{
                        pParam.data[i].vendor_id = xCheckData_Vendor.id;
                    }

                    if( xCheckData_Product == null ){
                        xStringMsg += "Row " + (i+1) + " product code " + pParam.data[i].product_code + " doesn't exists, \n";    
                    }else{
                        pParam.data[i].product_id = xCheckData_Product.id;
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
                                if( pParam.data[i].last_ordered == '' ){
                                    pParam.data[i].last_ordered = null;
                                }
                                var xAddResult = await _vendorCatalogueRepoInstance.save( pParam.data[i], "update" );
                            }
                        }         
                    }else{

                        // If Vendor code and product code is exists
                        if( xCheckData_Vendor != null && xCheckData_Product != null ){
                            // Check if catalogue exists
                            xCheckData_Catalogue = await _vendorCatalogueRepoInstance.getByVendorCodeAndProductCode( { vendor_code: pParam.data[i].vendor_code, product_code: pParam.data[i].product_code } );
                            
                            if( xCheckData_Catalogue == null ){                    
                                if( pParam.data[i].last_ordered == '' ){
                                    pParam.data[i].last_ordered = null;
                                }        
                                var xAddResult = await _vendorCatalogueRepoInstance.save( pParam.data[i], "add" );
                            }
                        }

                    }

                    // if( xCheckData != null ){
                    //     var xAddResult = await _businessEntityRepoInstance.save( pParam.data[i], "update" );
                    // }else{
                    //     pParam.data[i].act = pParam.act;
                    //     var xAddResult = await _businessEntityRepoInstance.save( pParam.data[i], pParam.act );
                    // }
                }else{
                    xStringMsg += "Row " + (i+1) + " vendor code and product code can not be empty, \n";
                }               

            }

            // await _utilInstance.changeSequenceTable((pParam.data.length)+1, 'ms_vendorcatalogues','id');

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
        var xArrOtherVendor = [];

        var xDecId = await _utilInstance.decrypt( pParam.id, config.cryptoKey.hashKey );
        if( xDecId.status_code == '00' ){
            pParam.id = xDecId.decrypted;
        }else{
            xFlagProcess = false;
            xJoResult = xDecId;
        }

        if( xFlagProcess ){
            var xResultList = await _vendorCatalogueRepoInstance.getById( pParam );
            if( xResultList != null ){

                // Get Other Vendor
                var xOtherVendorCatalogue = await _vendorCatalogueRepoInstance.list({
                    product_id: xResultList.product_id,
                    vendor_id: xResultList.vendor_id,
                    keyword: '',
                });

                if( xOtherVendorCatalogue.count > 0 ){
                    var xRows = xOtherVendorCatalogue.rows;
                    for( var index in xRows ){
                        xArrOtherVendor.push({
                            id: await _utilInstance.encrypt( xRows[index].id, config.cryptoKey.hashKey ),
                            vendor: {
                                code: xRows[index].vendor.code,
                                name: xRows[index].vendor.name,
                                avg_rate: xRows[index].vendor.avg_rate,
                                merk: xRows[index].merk,
                            },
                            uom_name:  xRows[index].uom_name,
                            last_price: xRows[index].last_price,
                        });
                    }   
                }

                xJoResult = {
                    status_code: '00',
                    status_message: 'OK',
                    data: {
                        id: await _utilInstance.encrypt( xResultList.id, config.cryptoKey.hashKey ),
                        vendor_id: xResultList.vendor_id,
                        vendor_name: xResultList.vendor.name,
                        vendor_location:{
                            longitude: xResultList.vendor.location_long,
                            latitude: xResultList.vendor.location_lat,
                        },
                        product_id: xResultList.product_id,
                        product_code: xResultList.product.code,
                        product_name: xResultList.product.name,
                        product_category_name: xResultList.product_category_name,
                        merk: xResultList.merk,
                        file_brochure: xResultList.file_brochure,
                        description: xResultList.description,
                        uom: {
                            id: xResultList.uom_id,
                            name: xResultList.uom_name,
                        },
                        purchase_uom: {
                            id: xResultList.purchase_uom_id,
                            name: xResultList.purchase_uom_name,
                        },
                        currency: xResultList.currency,
                        last_price: xResultList.last_price,
                        last_ordered: xResultList.last_ordered,
                        last_purchase_plant: xResultList.last_purchase_plant,
                        status: xResultList.status,
                        other_vendor: xArrOtherVendor,
                        catalogue_type: xResultList.catalogue_type,
                        created_at: xResultList.createdAt,
                        created_by_name: xResultList.created_by_name,
                        updated_at: xResultList.updatedAt,
                        updated_by_name: xResultList.updated_by_name,
                        
                    }
                }
            }else{
                xJoResult = {
                    status_code: '-99',
                    status_message: 'Data not found',
                }
            }
        }

        return xJoResult;
    }

    async list( pParam  ){
        var xJoResult = {};
        var xJoArrData = [];
        var xFlagProcess = true;

        // Decrypt vendor_id
        if( pParam.hasOwnProperty('vendor_id') ){
            if( pParam.vendor_id != '' ){
                var xDecId = await _utilInstance.decrypt( pParam.vendor_id, config.cryptoKey.hashKey );
                if( xDecId.status_code == '00' ){
                    pParam.vendor_id = xDecId.decrypted;
                }else{
                    xJoResult = xDecId;
                    xFlagProcess = false;
                }
            }
        }

        if( xFlagProcess ){
            var xResultList = await _vendorCatalogueRepoInstance.list(pParam);

            if( xResultList.count > 0 ){
                var xRows = xResultList.rows;
                for( var index in xRows ){

                    xJoArrData.push({
                        id: await _utilInstance.encrypt( (xRows[index].id).toString(), config.cryptoKey.hashKey ),
                        product: {
                            code: xRows[index].product.code,
                            name: xRows[index].product.name,
                            category: ( xRows[index].product.category == null ? null : xRows[index].product.category.name ),
                        },
                        vendor: {
                            id: ( xRows[index].vendor != null ? await _utilInstance.encrypt( (xRows[index].vendor.id).toString(), config.cryptoKey.hashKey ) : null ),
                            code: ( xRows[index].vendor != null ? xRows[index].vendor.code : '' ),
                            name: ( xRows[index].vendor != null ? xRows[index].vendor.name : null ) ,
                        },
                        merk: xRows[index].merk,
                        brochure: xRows[index].file_brochure,

                        photo: {
                            photo_1: ( ( xRows[index].product.photo_1 != null && xRows[index].product.photo_1 != '' ) ? ( config.frontParam.photoPath.product.product1 + xRows[index].product.photo_1 ) : null ),
                            photo_2: ( ( xRows[index].product.photo_2 != null && xRows[index].product.photo_2 != '' ) ? ( config.frontParam.photoPath.product.product2 + xRows[index].product.photo_2 ) : null ),
                            photo_3: ( ( xRows[index].product.photo_3 != null && xRows[index].product.photo_3 != '' ) ? ( config.frontParam.photoPath.product.product3 + xRows[index].product.photo_3 ) : null ),
                            photo_4: ( ( xRows[index].product.photo_4 != null && xRows[index].product.photo_4 != '' ) ? ( config.frontParam.photoPath.product.product4 + xRows[index].product.photo_4 ) : null ),
                            photo_5: ( ( xRows[index].product.photo_5 != null && xRows[index].product.photo_5 != '' ) ? ( config.frontParam.photoPath.product.product5 + xRows[index].product.photo_5 ) : null ),
                        },

                        currency: xRows[index].currency,
                        last_price: xRows[index].last_price,
                        last_ordered: ( xRows[index].last_ordered != null && xRows[index].last_ordered != '' ? moment(xRows[index].last_ordered).format('YYYY-MM-DD') : '' ),
                        last_purchase_plant: xRows[index].last_purchase_plant,
                        description: xRows[index].description,
                        uom_id: xRows[index].uom_id,
                        uom_name: xRows[index].uom_name,
                        purchase_uom_id: xRows[index].purchase_uom_id,
                        purchase_uom_name: xRows[index].purchase_uom_name,
                        catalogue_type: xRows[index].catalogue_type,
                        catalogue_type_name: ( xRows[index].catalogue_type == 1 ? 'Bahan Baku' : ( xRows[index].catalogue_type == 2 ? 'Umum' : null )),
                    });
                }
                xJoResult = {
                    status_code: "00",
                    status_msg: "OK",
                    total_record: xResultList.count,
                    data: xJoArrData,
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

    async save( pParam ){
        var xJoResult;
        var xAct = pParam.act;
        var xFlagProcess = true;

        delete pParam.act;

        // Decrypt vendor_id
        var xDecId = await _utilInstance.decrypt( pParam.vendor_id,config.cryptoKey.hashKey );
        if( xDecId.status_code == '00' ){
            pParam.vendor_id = xDecId.decrypted;
        }else{
            xFlagProcess = false;
            xJoResult = xDecId;
        }

        if( xFlagProcess ){

            // Get Product Info
            var xProductDetail = await _productRepoInstance.getProductById( { id: pParam.product_id } );
            var xUnitDetail = await _unitRepoInstance.getById( {id: pParam.uom_id} );
            var xPurchaseUnitDetail = await _unitRepoInstance.getById( {id: pParam.purchase_uom_id} );

            if( xProductDetail != null && xUnitDetail != null && xPurchaseUnitDetail != null){

                pParam.product_code = xProductDetail.code;
                pParam.product_name = xProductDetail.name;
                pParam.product_category_name = xProductDetail.category.name;

                pParam.uom_name = xUnitDetail.name;
                pParam.purchase_uom_name = xPurchaseUnitDetail.name;

                if( xAct == "add" ){            

                    // User Id
                    var xDecId = await _utilInstance.decrypt(pParam.user_id,config.cryptoKey.hashKey);
                    pParam.created_by = xDecId.decrypted;
                    pParam.created_by_name = pParam.user_name;
        
                    var xAddResult = await _vendorCatalogueRepoInstance.save( pParam, xAct );
                    xJoResult = xAddResult;
                }else if( xAct == "update" ){
        
                    var xDecId = await _utilInstance.decrypt(pParam.id,config.cryptoKey.hashKey);
                    if( xDecId.status_code == "00" ){
                        pParam.id = xDecId.decrypted;                    
                        xDecId = await _utilInstance.decrypt(pParam.user_id,config.cryptoKey.hashKey);
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
                        var xAddResult = await _vendorCatalogueRepoInstance.save( pParam, xAct );
                        xJoResult = xAddResult;
                    }
                    
                }
            }else{
                xJoResult = {
                    status_code: "-99",
                    status_msg: "Product not found",
                }
            }   
            
        }        

        return xJoResult;
    }

    async delete( pParam ){
        var xJoResult;
        var xFlagProcess = true;       

        var xDecId = await _utilInstance.decrypt(pParam.id,config.cryptoKey.hashKey);
        if( xDecId.status_code == "00" ){
            pParam.id = xDecId.decrypted;                    
            xDecId = await _utilInstance.decrypt(pParam.user_id,config.cryptoKey.hashKey);
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

            var xDeleteResult = await _vendorCatalogueRepoInstance.delete( pParam );
            xJoResult = xDeleteResult;
            
        }

        return xJoResult;

    }

    async updatePriceFromOdoo( pParam ){

        var xJoResult = {};
        var xJoDataResult = [];

        var xRows = pParam.product;
        
        // Loop each line
        for( var index in xRows ){
            // Check Vendor Code and Product Code
            var xVendorCatalogue = await _vendorCatalogueRepoInstance.getByVendorCodeAndProductCode({
                vendor_code: pParam.vendor.code,
                product_code: xRows[index].product.default_code,
            });

            if( xVendorCatalogue != null ){
                // Process update price
                console.log(">>> Vendor Catalogue Detail : " + JSON.stringify(xVendorCatalogue));

                // Get uom_id 
                var xUom = await _unitRepoInstance.getByName( {name: xRows[index].uom.name} );

                // Get Purchase uom_id
                // var xPurUom = await _unitRepoInstance.getByName( { name: xRows[index].product_uom } );

                // Get Currency
                var xCurrency = await _currencyRepoInstance.getByCode( {code: xRows[index].currency.name} );

                var xParamUpdate = {
                    id: xVendorCatalogue.id,
                    uom_id: ( xUom != null ? xUom.id : null ),
                    uom_name: ( xUom != null ? xUom.name : null ),
                    purchase_uom_id: ( xUom != null ? xUom.id : null ),
                    purchase_uom_name: ( xUom != null ? xUom.name : null ),
                    last_price: xRows[index].price_unit,
                    last_ordered: xRows[index].createdat,
                    currency_id: (xCurrency != null ? xCurrency.id : null),                    
                    purchase_frequency: sequelize.literal('purchase_frequency + 1'),
                    last_purchase_plant: pParam.company.name,

                };
                var xUpdate = await _vendorCatalogueRepoInstance.save(xParamUpdate, 'update');
                xJoDataResult.push({
                    product_code: xRows[index].product.default_code,
                    status: true,
                })
                
            }else{
                xJoDataResult.push({
                    product_code: xRows[index].product.default_code,
                    status: false,
                })
            }
        }        

        xJoResult = {
            status_code: '00',
            status_sync: xJoDataResult,
        }

        return xJoResult;

    }

    async getVendorByProductId( pParam  ){
        var xJoResult = {};
        var xJoArrData = [];
        var xFlagProcess = true;

        // Decrypt vendor_id
        if( pParam.hasOwnProperty('product_id') ){
            if( pParam.product_id != '' ){
                if( (pParam.product_id).length == 65 ){
                    var xDecId = await _utilInstance.decrypt( pParam.product_id, config.cryptoKey.hashKey );
                    if( xDecId.status_code == '00' ){
                        pParam.product_id = xDecId.decrypted;
                    }else{
                        xJoResult = xDecId;
                        xFlagProcess = false;
                    }
                }                
            }
        }

        if( xFlagProcess ){
            var xResultList = await _vendorCatalogueRepoInstance.getVendorByProductId(pParam);

            if( xResultList.count > 0 ){
                var xRows = xResultList.rows;
                for( var index in xRows ){
                    xJoArrData.push({
                        id: await _utilInstance.encrypt(xRows[index].vendor.id, config.cryptoKey.hashKey),
                        name: xRows[index].vendor.name,
                        code: xRows[index].vendor.code,
                        logo: xRows[index].vendor.logo,
                        address: xRows[index].vendor.address,
                        phone1: ( xRows[index].vendor.phone1 != '' ? (await _utilInstance.decrypt( xRows[index].vendor.phone1, config.cryptoKey.hashKey )).decrypted : '' ),
                        phone2: ( xRows[index].vendor.phone2 != '' ? (await _utilInstance.decrypt( xRows[index].vendor.phone2, config.cryptoKey.hashKey )).decrypted : '' ),
                        email: ( xRows[index].vendor.email != '' ? (await _utilInstance.decrypt( xRows[index].vendor.email, config.cryptoKey.hashKey )).decrypted : '' ),
                        website: xRows[index].vendor.website,
                        location_lat: xRows[index].vendor.location_lat,
                        location_long: xRows[index].vendor.location_long,
                        avg_rate: xRows[index].vendor.avg_rate,
                        province: xRows[index].vendor.province,
                        city: xRows[index].vendor.city,
                    });
                }
                xJoResult = {
                    status_code: "00",
                    status_msg: "OK",
                    total_record: xResultList.count,
                    data: xJoArrData,
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
}

module.exports = VendorCatalogueService