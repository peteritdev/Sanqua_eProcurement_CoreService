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

const GlobalUtility = require('../utils/globalutility.js');
const _globalUtilInstance = new GlobalUtility();

// Repository
const ProcurementQuotationItemRepository = require('../repository/procurementquotationitemrepository.js');
const _repoInstance = new ProcurementQuotationItemRepository();

class ProcurementQuotationItemService {
    constructor(){}

    async addItemCopyFromProcurementItem( pParam ){

        var xJoResult = {};
        var xFlagProcess = true;

        // This line use when the procurement_id and vendor_id is encrypted.
        // For now, this is clear because the function only used by internal
        // if( pParam.hasOwnProperty('procurement_id') && pParam.hasOwnProperty('vendor_id') ){
        //     if( pParam.procurement_id != '' ){
        //         var xDecId = await _utilInstance.decrypt( pParam.procurement_id, config.cryptoKey.hashKey );
        //         if( xDecId.status_code == '00' ){
        //             pParam.procurement_id = xDecId.decrypted;
        //             xFlagProcess = true;
        //         }else{
        //             xJoResult = xDecId;
        //         }
        //     }

        //     if( pParam.vendor_id != '' ){
        //         var xDecId = await _utilInstance.decrypt( pParam.vendor_id, config.cryptoKey.hashKey );
        //         if( xDecId.status_code == '00' ){
        //             pParam.vendor_id = xDecId.decrypted;
        //             xFlagProcess = true;
        //         }else{
        //             xJoResult = xDecId;
        //         }
        //     }
        // }

        if( xFlagProcess ){
            var xAddResult = await _repoInstance.addItemCopyFromProcurementItem( pParam );
            xJoResult = xAddResult;
        }

        return xJoResult;
    }
}

module.exports = ProcurementQuotationItemService;