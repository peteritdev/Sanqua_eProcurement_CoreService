var env = process.env.NODE_ENV || 'development';
var config = require(__dirname + '/../config/config.json')[env];
var Sequelize = require('sequelize');
var sequelize = new Sequelize(config.database, config.username, config.password, config);
const { hash } = require('bcryptjs');
const Op = sequelize.Op;

// Model
const _modelDb = require('../models').ms_vendorcatalogues;
const _modelProduct = require('../models').ms_products;
const _modelProductCategory = require('../models').ms_productcategories;
const _modelVendor = require('../models').ms_vendors;

const Utility = require('peters-globallib');
const _utilInstance = new Utility();

class VendorCatalogueRepository {
    constructor(){}

    async getByVendorCodeAndProductCode( pParam ){
        var xInclude = [];

        xInclude = [
            {
                attributes: ['id','name','code'],
                model: _modelProduct,
                as: 'product',
            },
            {
                attributes: ['id','code','name'],
                model: _modelVendor,
                as: 'vendor',
            }
        ];

        var xData = await _modelDb.findOne({
            where: {
                '$vendor.code$': pParam.vendor_code,
                '$product.code$': pParam.product_code,
                is_delete: 0,
            },
            include: xInclude,
        });

        return xData;
    }

    async getById( pParam ){

        var xInclude = [];
        xInclude = [
            {
                attributes: ['id','name'],
                model: _modelProduct,
                as: 'product',
                include: [
                    {
                        attributes: ['id','name'],
                        model: _modelProductCategory,
                        as: 'category',
                    }
                ]
            },
            {
                attributes: ['id','code','name','location_lat','location_long'],
                model: _modelVendor,
                as: 'vendor',
            }
        ];

        var xData = await _modelDb.findOne({
            where: {
                id: pParam.id,
                is_delete: 0,
            },
            include: xInclude,
        });

        return xData;
    }

    async getTotalByVendorId( pVendorId ){
        var xData = await _modelDb.count({
            where: {
                vendor_id: pVendorId,
                is_delete: 0,
            }
        });

        return xData;
    }

    async list( pParam ){

        var xOrder = ['product_name', 'ASC'];
        var xWhereVendorId = {};
        var xWhereCategoryId = {};
        var xWhereProductId = {};
        var xInclude = [];

        if( pParam.order_by != '' && pParam.hasOwnProperty('order_by') ){
            xOrder = [pParam.order_by, (pParam.order_type == 'desc' ? 'DESC' : 'ASC') ];
        }

        if( pParam.hasOwnProperty('vendor_id')  ){
            if( pParam.vendor_id != '' ){
                xWhereVendorId = {
                    vendor_id: pParam.vendor_id,
                }
            }            
        }

        if( pParam.hasOwnProperty('category_id') ){
            if( pParam.category_id != '' ){
                xWhereCategoryId = {
                    '$product.category_id$': pParam.category_id,
                }
            }
        }

        if( pParam.hasOwnProperty('product_id') && pParam.hasOwnProperty('vendor_id') ){
            if( pParam.product_id != '' && pParam.vendor_id != '' ){
                xWhereProductId = {
                    product_id: pParam.product_id,
                }

                xWhereVendorId = {
                    vendor_id: {
                        [Op.ne]: pParam.vendor_id,
                    }
                }
            }
        }

        xInclude = [
            {
                attributes: ['id','name','photo_1','photo_2','photo_3','photo_4','photo_5'],
                model: _modelProduct,
                as: 'product',
                include: [
                    {
                        attributes: ['id','name'],
                        model: _modelProductCategory,
                        as: 'category',
                    }
                ]
            },
            {
                attributes: ['id','code','name', 'avg_rate'],
                model: _modelVendor,
                as: 'vendor',
            }
        ];

        var xParamQuery = {
            where: {
                [Op.and]:[
                    {
                        is_delete: 0
                    },
                    xWhereProductId,
                    xWhereVendorId,
                    xWhereCategoryId,
                ],
                [Op.or]: [
                    {
                        product_code: {
                            [Op.iLike]: '%' + pParam.keyword + '%'
                        },
                    },
                    {
                        
                        product_name: {
                            [Op.iLike]: '%' + pParam.keyword + '%'
                        },
                    },
                    {                        
                        product_category_name: {
                            [Op.iLike]: '%' + pParam.keyword + '%'
                        }
                    },
                    {                        
                        merk: {
                            [Op.iLike]: '%' + pParam.keyword + '%'
                        }
                    },
                    {
                        '$vendor.name$': {
                            [Op.iLike]: '%' + pParam.keyword + '%'
                        },
                    },
                ]
            },            
            include: xInclude,
            order: [xOrder],
        };

        if( pParam.hasOwnProperty('offset') && pParam.hasOwnProperty('limit') ){
            if( pParam.offset != '' && pParam.limit != ''){
                xParamQuery.offset = pParam.offset;
                xParamQuery.limit = pParam.limit;
            }
        }

        var xData = await _modelDb.findAndCountAll(xParamQuery);

        return xData;
    }

    async save( pParam, pAct ){
        let xTransaction;
        var xJoResult = {};
        
        try{

            var xSaved = null;
            xTransaction = await sequelize.transaction();

            if( pAct == "add" ){

                pParam.status = 1;
                pParam.is_delete = 0;

                xSaved = await _modelDb.create(pParam, {xTransaction}); 

                if( xSaved.id != null ){

                    await xTransaction.commit();

                    xJoResult = {
                        status_code: "00",
                        status_msg: "Data has been successfully saved",
                        created_id: await _utilInstance.encrypt( xSaved.id, config.cryptoKey.hashKey ),
                    }                     
                    

                }else{

                    if( xTransaction ) await xTransaction.rollback();

                    xJoResult = {
                        status_code: "-99",
                        status_msg: "Failed save to database",
                    }

                }                

            }else if( pAct == "update" ){
                
                pParam.updatedAt = await _utilInstance.getCurrDateTime();
                var xId = pParam.id;
                delete pParam.id;
                var xWhere = {
                    where : {
                        id: xId,
                    }
                };
                xSaved = await _modelDb.update( pParam, xWhere, {xTransaction} );

                await xTransaction.commit();

                xJoResult = {
                    status_code: "00",
                    status_msg: "Data has been successfully updated"
                }

            }else if( pAct == "update_by_vendor_id_product_id" ){
                
                pParam.updatedAt = await _utilInstance.getCurrDateTime();
                var xId = pParam.id;
                delete pParam.id;
                var xWhere = {
                    where : {
                        product_id: pParam.product_id,
                        vendor_id: pParam.vendor_Id,
                    }
                };
                xSaved = await _modelDb.update( pParam, xWhere, {xTransaction} );

                await xTransaction.commit();

                xJoResult = {
                    status_code: "00",
                    status_msg: "Data has been successfully updated"
                }

            }

        }catch(e){
            if( xTransaction ) await xTransaction.rollback();
            xJoResult = {
                status_code: "-99",
                status_msg: "Failed save or update data. Error : " + e,
                err_msg: e
            }

            
        }
        
        return xJoResult;
    }

    async delete(pParam){
        let xTransaction;
        var xJoResult = {};

        try{
            var xSaved = null;
            xTransaction = await sequelize.transaction();

            xSaved = await _modelDb.update(
                {
                    is_delete: 1,
                    deleted_by: pParam.deleted_by,
                    deleted_by_name: pParam.deleted_by_name,
                    deleted_at: await _utilInstance.getCurrDateTime(),
                },
                {
                    where: {
                        id: pParam.id
                    }
                },
                {xTransaction}
            );
    
            await xTransaction.commit();

            xJoResult = {
                status_code: "00",
                status_msg: "Data has been successfully deleted",
            }

            return xJoResult;

        }catch(e){
            if( xTransaction ) await xTransaction.rollback();
            xJoResult = {
                status_code: "-99",
                status_msg: "Failed save or update data",
                err_msg: e
            }

            return xJoResult;
        }        
    }
}

module.exports = VendorCatalogueRepository;
