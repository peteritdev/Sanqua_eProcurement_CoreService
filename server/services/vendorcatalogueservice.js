const jwt = require('jsonwebtoken');
const md5 = require('md5');
const crypto = require('crypto');
const moment = require('moment');
const sequelize = require('sequelize');
const dateFormat = require('dateformat');
const Op = sequelize.Op;
const bcrypt = require('bcrypt');

const env         = process.env.NODE_ENV || 'development';
const config      = require(__dirname + '/../config/config.json')[env];

// Utility
const Utility = require('peters-globallib');
const _utilInstance = new Utility();

// Repository
const VendorCatalogueRepository = require('../repository/vendorcataloguerepository.js');
const _vendorCatalogueRepoInstance = new VendorCatalogueRepository();

const ProductRepository = require('../repository/productrepository.js');
const _productRepoInstance = new ProductRepository();

const UnitRepository = require('../repository/unitrepository.js');
const _unitRepoInstance = new UnitRepository();

class VendorCatalogueService {
    constructor(){}

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
                        product_id: xResultList.product_id,
                        product_code: xResultList.product_code,
                        product_name: xResultList.product_name,
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
                            code: xRows[index].product_code,
                            name: xRows[index].product_name,
                            category: xRows[index].product.category.name,
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

                        last_price: xRows[index].last_price,
                        last_ordered: xRows[index].last_ordered,
                        last_purchase_plant: xRows[index].last_purchase_plant,
                        description: xRows[index].description,
                        uom_name: xRows[index].uom_name,
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
}

module.exports = VendorCatalogueService