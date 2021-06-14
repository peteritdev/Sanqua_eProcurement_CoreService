var env = process.env.NODE_ENV || 'localhost';
var config = require(__dirname + '/../config/config.json')[env];
var Sequelize = require('sequelize');
var sequelize = new Sequelize(config.database, config.username, config.password, config);
const { hash } = require('bcryptjs');
const Op = sequelize.Op;

//Model
const _modelDb = require('../models').ms_vendorcataloguequotations;
const _modelUnit = require('../models').ms_units;
const _modelVendorCatalogue = require('../models').ms_vendorcatalogues;
const _modelVendors = require('../models').ms_vendors;
const _modelProduct = require('../models').ms_products;

const Utility = require('peters-globallib-v2');
const _utilInstance = new Utility();

class VendorCatalogueQuotationRepository{
    constructor(){}

    async list( pParam ){

        var xOrder = ['createdAt', 'ASC'];
        var xInclude = [];
        var xWhereAnd = [];
        var xWhereOr = [];
        var xWhere = {};
        xWhereAnd.push({is_delete: 0});

        if( pParam.order_by != '' && pParam.hasOwnProperty('order_by') ){
            xOrder = [pParam.order_by, (pParam.order_type == 'desc' ? 'DESC' : 'ASC') ];
        }

        if( pParam.hasOwnProperty('vendor_catalogue_id') ){
            if( pParam.vendor_catalogue_id != '' ){
                xWhereAnd.push({
                    vendor_catalogue_id: pParam.vendor_catalogue_id,
                });
            }
        }

        if( pParam.hasOwnProperty('keyword') ){
            if( pParam.keyword != '' ){
                xWhereOr.push({
                    '$vendor_catalogue.vendor.name$': {
                        [Op.iLike]: '%' + pParam.keyword + '%',
                    },
                });
            }
        }

        xInclude = [
            {
                attributes: ['id','name'],
                model: _modelUnit,
                as: 'uom'
            },
            {
                model: _modelVendorCatalogue,
                as: 'vendor_catalogue',
                include: [
                    {
                        attributes: ['id','code','name'],
                        model: _modelVendors,
                        as: 'vendor',
                    },
                    {
                        attributes: ['id','code','name'],
                        model: _modelProduct,
                        as: 'product',
                    }
                ]
            }
        ];

        if( xWhereAnd.length > 0 ){
            xWhere.$and = xWhereAnd;
        }
        if( xWhereOr.length > 0 ){
            xWhere.$or = xWhereOr;
        }

        var xParamQuery = {
            where: xWhere,          
            include: xInclude,  
            order: [xOrder],
        };

        if( pParam.hasOwnProperty('offset') && pParam.hasOwnProperty('limit') ){
            if( pParam.offset != '' && pParam.limit != ''){
                if( pParam.limit != 'all' ){
                    xParamQuery.offset = pParam.offset;
                    xParamQuery.limit = pParam.limit;
                }                
            }
        }

        var xData = await _modelDb.findAndCountAll(xParamQuery);

        return xData;
    }

    async isDataExists( pName ){
        var data = await _modelDb.findOne({
            where: {
                name: pName
            }
        });
        
        return data;
    }

    async getById( pParam ){
        var xData = await _modelDb.findOne({
            where: {
                id: pParam.id,
                is_delete: 0,
            },
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

    async deletePermanent( pParam ){
        let xTransaction;
        var xJoResult = {};

        try{
            var xSaved = null;
            xTransaction = await sequelize.transaction();

            xSaved = await _modelDb.destroy(
                {
                    where: {
                        id: pParam.id
                    },
                    force: true,
                },
                {xTransaction}
            );
    
            await xTransaction.commit();

            xJoResult = {
                status_code: "00",
                status_msg: "Data has been successfully deleted permanently",
            }

            return xJoResult;

        }catch(e){
            if( xTransaction ) await xTransaction.rollback();
            xJoResult = {
                status_code: "-99",
                status_msg: "Failed delete data permanently",
                err_msg: e
            }

            return xJoResult;
        }
    }
}

module.exports = VendorCatalogueQuotationRepository;

