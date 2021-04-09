var env = process.env.NODE_ENV || 'localhost';
var config = require(__dirname + '/../config/config.json')[env];
var Sequelize = require('sequelize');
var sequelize = new Sequelize(config.database, config.username, config.password, config);
const { hash } = require('bcryptjs');
const Op = sequelize.Op;

//Model
const _modelDb = require('../models').ms_vendorcataloguespesifications;
const _modelSpesificationCategory = require('../models').ms_spesificationcategories;
const _modelSpesificationAttribute = require('../models').ms_spesificationattributes;
const _modelUnit = require('../models').ms_units;
const _modelVendorCatalogue = require('../models').ms_vendorcatalogues;
const _modelVendor = require('../models').ms_vendors;
const _modelProduct = require('../models').ms_products;

const Utility = require('peters-globallib');
const _utilInstance = new Utility();

class VendorCatalogueSpesificationRepository{
    constructor(){}

    async list( pParam ){

        var xOrder = ['id', 'ASC'];
        var xInclude = [
            {
                attributes: ['id','name'],
                model: _modelSpesificationCategory,
                as: 'spesification_category'
            },
            {
                attributes: ['id','name'],
                model: _modelSpesificationAttribute,
                as: 'spesification_attribute'
            },
            {
                attributes: ['id','name'],
                model: _modelUnit,
                as: 'unit',
            },
            {
                attributes: ['catalogue_type'],
                model: _modelVendorCatalogue,
                as: 'vendor_catalogue',
                include: [
                    {
                        attributes: ['id','code','name'],
                        model: _modelVendor,
                        as: 'vendor',
                    },
                    {
                        attributes: ['id','code','name'],
                        model: _modelProduct,
                        as: 'product',
                    }
                ],
            },
        ];
        var xWhereAnd = [];
        var xWhereOr = [];
        var xWhere = {};

        

        // From xWhereAnd
        xWhereAnd.push({
            is_delete: 0,
        });


        if( pParam.hasOwnProperty('vendor_catalogue_id') ){
            if( pParam.vendor_catalogue_id != '' ){
                xWhereAnd.push({
                    vendor_catalogue_id: pParam.vendor_catalogue_id
                });
            }
        }        

        if( pParam.hasOwnProperty('spesification_type') ){
            if( pParam.spesification_type != '' ){
                xWhereAnd.push({
                    spesification_type: pParam.spesification_type
                });
            }
        }        

        // From xWhereOr
        if( pParam.hasOwnProperty('keyword') ){
            xWhereOr = [
                {
                    description: {
                        [Op.iLike]: '%' + pParam.keyword + '%',
                    }
                },
                {
                    standard: {
                        [Op.iLike]: '%' + pParam.keyword + '%',
                    }
                },
                {
                    analysis_method: {
                        [Op.iLike]: '%' + pParam.keyword + '%',
                    }
                },
                {
                    min_frequency_supplier: {
                        [Op.iLike]: '%' + pParam.keyword + '%',
                    }
                },
                {
                    min_frequency_sanqua: {
                        [Op.iLike]: '%' + pParam.keyword + '%',
                    }
                },
                {
                    '$vendor_catalogue.vendor.name$': {
                        [Op.iLike]: '%' + pParam.keyword + '%',
                    }
                }
            ]
        }

        if( xWhereAnd.length > 0 ){
            xWhere.$and = xWhereAnd;
        }
        if( xWhereOr.length > 0 ){
            xWhere.$or = xWhereOr;
        }

        if( pParam.order_by != '' && pParam.hasOwnProperty('order_by') ){
            xOrder = [pParam.order_by, (pParam.order_type == 'desc' ? 'DESC' : 'ASC') ];
        }

        var xParamQuery = {
            where: xWhere,          
            include: xInclude,  
            order: [xOrder],
        };

        if( pParam.hasOwnProperty('offset') && pParam.hasOwnProperty('limit') ){
            if( pParam.offset != '' && pParam.limit != '' && pParam.limit != 'all' ){
                xParamQuery.offset = pParam.offset;
                xParamQuery.limit = pParam.limit;
            }
        }

        var xData = await _modelDb.findAndCountAll(xParamQuery);

        return xData;
    }

    async isDataExists( pParam ){
        var xData = await _modelDb.findOne({
            where: {
                vendor_catalogue_id: pParam.vendor_catalogue_id,
                spesification_category_id: pParam.spesification_category_id,
                spesification_attribute_id: pParam.spesification_attribute_id,
            }
        });
        
        return xData;
    }

    async getById( pParam ){

        var xInclude = [
            {
                attributes: ['id','name'],
                model: _modelSpesificationCategory,
                as: 'spesification_category'
            },
            {
                attributes: ['id','name'],
                model: _modelSpesificationAttribute,
                as: 'spesification_attribute'
            },
            {
                attributes: ['id','name'],
                model: _modelUnit,
                as: 'unit',
            },
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

    async save(pParam, pAct){
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
                        created_id: await _utilInstance.encrypt( (xSaved.id).toString(), config.cryptoKey.hashKey ),
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

    async delete( pParam ){
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

module.exports = VendorCatalogueSpesificationRepository;

