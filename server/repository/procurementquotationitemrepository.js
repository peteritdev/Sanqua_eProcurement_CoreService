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
const _modeUnit = require('../models').ms_units;

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
}

module.exports = ProcurementQuotationItemRepository;