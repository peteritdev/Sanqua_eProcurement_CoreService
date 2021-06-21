var env = process.env.NODE_ENV || 'localhost';
var config = require(__dirname + '/../config/config.json')[env];
var Sequelize = require('sequelize');
var sequelize = new Sequelize(config.database, config.username, config.password, config);
const { hash } = require('bcryptjs');
const Op = sequelize.Op;

// Model
const _modelDb = require('../models').tr_procurementquotationitems;
const _modelProcurementVendor = require('../models').tr_procurementvendors;
const _modelProcurement = require('../models').tr_procurements;
const _modelProduct = require('../models').ms_products;
const _modelProductCategory = require('../models').ms_productcategories;
const _modelUnit = require('../models').ms_units;
const _modelCurrency = require('../models').ms_currencies;

const Utility = require('peters-globallib-v2');
const _utilInstance = new Utility();

const GlobalUtility = require('../utils/globalutility.js');
const _globalUtilInstance = new GlobalUtility();

class ProcurementQuotationItemRepository {
    constructor(){}

    async addItemCopyFromProcurementItem( pParam ){
        var xJoResult = {};
        var xSql = "";
        var xObjJsonWhere = {};
        var xSqlWhere = " (1=1) ";
        let xTransaction;

        try{

            xTransaction = await sequelize.transaction();

            if( pParam.hasOwnProperty('procurement_id') ){
                if( pParam.procurement_id != '' ){
                    xSqlWhere += " AND procurement_id = :procurementId ";
                    xObjJsonWhere.procurementId = pParam.procurement_id;
                }
            }

            if( pParam.hasOwnProperty('vendor_id') ){
                if( pParam.vendor_id != '' ){
                    xObjJsonWhere.vendorId = pParam.vendor_id;
                }
            }
    
            xSql = " INSERT INTO tr_procurementquotationitems( procurement_vendor_id, product_id, unit_id, unit_price, currency_id, qty, total, created_at, created_by, created_by_name ) " + 
                   " SELECT ( SELECT id FROM tr_procurementvendors WHERE procurement_id = :procurementId AND vendor_id = :vendorId ), product_id, unit_id, unit_price, currency_id, qty, total, now(), created_by, created_by_name " + 
                   " FROM tr_procurementitems " + 
                   " WHERE " + xSqlWhere;
    
            var xDtQuery = await sequelize.query( xSql, {
                replacements: xObjJsonWhere,
                type: sequelize.QueryTypes.INSERT,
            }, {transaction: xTransaction} );

            xJoResult = {
                status_code: '00',
                status_msg: 'OK',
                result_add: xDtQuery,
            }
        }catch( err ){
            xJoResult = {
                status_code: '-99',
                status_msg: 'Error processing copy from procurement items. Err: ' + err,
                result_add: err,
            }
        } 

        return xJoResult;
    }

    async list( pParam ){
        var xOrder = ['id', 'ASC'];
        var xInclude = [];
        var xWhere = {};
        var xWhereAnd = [], xWhereOr = [];

        xInclude = [
            {
                attributes: ['id','name','code'],
                model: _modelProduct,
                as: 'product',
                include: [
                    {
                        model: _modelProductCategory,
                        as: 'category',
                        attributes: ['id', 'name'],
                    }
                ],
            },
            {
                attributes: ['id','name'],
                model: _modelUnit,
                as: 'unit',
            },
            {
                attributes: ['id','name'],
                model: _modelCurrency,
                as: 'currency',
            },
            {
                model: _modelProcurementVendor,
                as: 'procurement_vendor',
                include: [
                    {
                        model: _modelProcurement,
                        as: 'procurement',
                        attributes: ['id', 'procurement_no', 'name', 'year', 'total_hps']
                    }
                ],
            },
        ];

        if( pParam.hasOwnProperty('order_by') && pParam.hasOwnProperty('order_type') ){
            if( pParam.order_by != '' ){
                xOrder = [pParam.order_by, (pParam.order_type == 'desc' ? 'DESC' : 'ASC') ];
            }
        }        

        if( pParam.hasOwnProperty('procurement_id') ){
            if( pParam.year != '' ){
                xWhereAnd.push({
                    '$procurement_vendor.procurement.id$': pParam.procurement_id,
                });
            }
        }

        if( pParam.hasOwnProperty('is_archived') ){
            if( pParam.is_archived != '' ){
                xWhereAnd.push({
                    is_delete: pParam.is_archived
                });
            }else{
                xWhereAnd.push({
                    is_delete: 0,
                });
            }
        }else{
            xWhereAnd.push({
                is_delete: 0,
            });
        }

        if( pParam.hasOwnProperty('keyword') ){
            if( pParam.keyword != '' ){
                xWhereOr.push({
                    '$product.name$': {
                        [Op.iLike]: '%' + pParam.keyword + '%'
                    }
                },{
                    '$product.code$': {
                        [Op.iLike]: '%' + pParam.keyword + '%'
                    }
                },{
                    '$product.category.name$': {
                        [Op.iLike]: '%' + pParam.keyword + '%'
                    }
                })   
            }            
        }

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
                xParamQuery.offset = pParam.offset;
                xParamQuery.limit = pParam.limit;
            }
        }

        var xData = await _modelDb.findAndCountAll(xParamQuery);

        return xData;
    }

    async getById( pParam ){
        var xData = {};
        var xInclude = [];
        var xWhere = {};
        var xWhereAnd = [], xWhereOr = [];

        xInclude = [       
            {
                attributes: ['id'],
                model: _modelProcurementVendor,
                as: 'procurement_vendor',
                include: [
                    {
                        attributes: ['procurement_no', 'status'],
                        model: _modelProcurement,
                        as: 'procurement'
                    }
                ]
            }, 
            {
                attributes: ['id','name','code'],
                model: _modelProduct,
                as: 'product',
                include: [
                    {
                        model: _modelProductCategory,
                        as: 'product_category',
                        attributes: ['id', 'name'],
                    }
                ],
            },
            {
                attributes: ['id','name'],
                model: _modelUnit,
                as: 'unit',
            },
            {
                attributes: ['id','name'],
                model: _modelCurrency,
                as: 'currency',
            },
        ];

        var xData = await _modelDb.findOne({
            where: {
                id: pParam.id,
            },
            include: xInclude,
        });

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

                xSaved = await _modelDb.create(pParam, {transaction: xTransaction}); 

                if( xSaved.id != null ){               
                    
                    xJoResult = {
                        status_code: "00",
                        status_msg: "Data has been successfully saved",
                        created_id: await _utilInstance.encrypt( xSaved.id, config.cryptoKey.hashKey ),
                        clear_id: xSaved.id,
                    }                     
                    
                    await xTransaction.commit();

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
}

module.exports = ProcurementQuotationItemRepository;