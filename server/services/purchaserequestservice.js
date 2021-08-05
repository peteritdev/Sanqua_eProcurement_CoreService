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
const PurchaseRequestRepository = require('../repository/purchaserequestrepository.js');
const _repoInstance = new PurchaseRequestRepository();

// OAuth Service
const OAuthService = require('../services/oauthservice.js');
const _oAuthService = new OAuthService();

class PurchaseRequestService {
    constructor(){}

    async save( pParam ){
        var xJoResult;
        var xAct = pParam.act;
        var xFlagProcess = false;
        var xDecId = null;

        delete pParam.act;

        if( pParam.hasOwnProperty('user_id') && pParam.hasOwnProperty('employee_id') ){
            if( pParam.user_id != '' && pParam.employee_id != '' ){
                xDecId = await _utilInstance.decrypt(pParam.user_id,config.cryptoKey.hashKey);
                if( xDecId.status_code == '00' ){
                    pParam.user_id = xDecId.decrypted;
                    xFlagProcess = true;
                    xDecId = await _utilInstance.decrypt(pParam.employee_id,config.cryptoKey.hashKey);
                    if( xDecId.status_code == '00' ){
                        pParam.employee_id = xDecId.decrypted;
                        xFlagProcess = true;
                    }else{
                        xJoResult = xDecId;
                    }
                }else{
                    xJoResult = xDecId;
                }
            }else{
                xJoResult = {
                    status_code: '-99',
                    status_msg: 'Parameter user_id can not be empty',
                }
            }
        }else{
            xJoResult = {
                status_code: '-99',
                status_msg: 'You need to supply correct parameter',
            }
        }

        if( xFlagProcess ){

            if( xAct == "add" || xAct == "add_batch_in_item" ){

                // Calculate the total
                var xJoArrItems = [];
                xJoArrItems = pParam.purchase_request_detail;
                if( xJoArrItems.length > 0 ){
                    for( var i in xJoArrItems ){
                        if( xJoArrItems[i].hasOwnProperty('qty') && xJoArrItems[i].hasOwnProperty('budget_price_per_unit') ){
                            xJoArrItems[i].budget_price_total = xJoArrItems[i].qty * xJoArrItems[i].budget_price_per_unit;
                        }
                    }
                }

                var xAddResult = await _repoInstance.save( pParam, xAct );
                if( xAddResult.status_code == '00' && xAddResult.created_id != '' && xAddResult.clear_id != '' ){
                    // Generate FPB No
                    var xFPBNo = await _globalUtilInstance.generatePurchaseRequestNo( xAddResult.clear_id, pParam.company_code );
                    var xParamUpdate = {
                        request_no: xFPBNo,
                        id: xAddResult.clear_id,
                    }

                    var xUpdate = await _repoInstance.save(xParamUpdate, 'update');

                    if( xUpdate.status_code == '00' ){
                        delete xAddResult.clear_id;
                        xJoResult = xAddResult;
                    }else{
                        xJoResult = xUpdate;
                    }
                    
                }else{
                    xJoResult = xAddResult;
                }

            }else if( xAct == 'update' ){
                var xDecId = await _utilInstance.decrypt(pParam.id,config.cryptoKey.hashKey);
                if( xDecId.status_code == "00" ){
                    pParam.id = xDecId.decrypted;                    
                    pParam.updated_by = pParam.user_id;
                    pParam.updated_by_name = pParam.user_name;
                    xFlagProcess = true;
                }else{
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

    async list( pParam ){
        var xJoResult = {};
        var xJoArrData = [];
        var xFlagProcess = false;
        var xDecId = {};

        if( pParam.hasOwnProperty('user_id') ){
            if( pParam.user_id != '' ){
                xDecId = await _utilInstance.decrypt( pParam.user_id, config.cryptoKey.hashKey );
                if( xDecId.status_code == '00' ){
                    pParam.user_id = xDecId.decrypted;
                    xFlagProcess = true;
                }else{
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
                        request_no: xRows[index].request_no,
                        requested_at: ( xRows[index].requested_at == null ? "" : moment(xRows[index].requested_at).format("DD MMM") ),
                        employee: {
                            id: await _utilInstance.encrypt( (xRows[index].employee_id).toString(), config.cryptoKey.hashKey ),
                            name: xRows[index].employee_name,
                        },
                        department: {
                            id: xRows[index].department_id,
                            name: xRows[index].department_name,
                        },
                        status: xRows[index].status,
                    });
                }

                xJoResult = {
                    status_code: '00',
                    status_msg: 'OK',
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

    async getById( pParam ){
        var xJoResult = {};
        var xJoData = {};
        var xFlagProcess = false;
        var xDecId = null;

        xDecId = await _utilInstance.decrypt( pParam.id, config.cryptoKey.hashKey );
        if( xDecId.status_code == '00' ){
            xFlagProcess = true;
            pParam.id = xDecId.decrypted;
        }else{
            xJoResult = xDecId;
        }
        
        if( xFlagProcess ){

            var xResult = await _repoInstance.getById(pParam);

            if( xResult != null ){

                console.log(JSON.stringify(xResult));

                var xJoArrRequestDetailData = [];
                var xDetail = xResult.purchase_request_detail;

                for( var index in xDetail ){
                    xJoArrRequestDetailData.push({
                        id: await _utilInstance.encrypt( xDetail[index].id, config.cryptoKey.hashKey ),
                        product: {
                            id: xDetail[index].product_id,
                            code: xDetail[index].product_code,
                            name: xDetail[index].product_name,
                        },
                        qty: xDetail[index].qty,
                        budget_price_per_unit: xDetail[index].budget_price_per_unit,
                        budget_price_total: xDetail[index].budget_price_total,
                        vendor: {
                            id: xDetail[index].vendor_id,
                            code: xDetail[index].vendor_code,
                            name: xDetail[index].vendor_name,
                        },
                        has_budget: xDetail[index].has_budget,
                        estimate_date_use: xDetail[index].estimate_date_use,
                        description: xDetail[index].description,
                    })
                }

                xJoData = {
                    id: await _utilInstance.encrypt( (xResult.id).toString(), config.cryptoKey.hashKey ),
                    request_no: xResult.request_no,
                    requested_at: xResult.requested_at,
                    employee: {
                        id: await _utilInstance.encrypt( (xResult.employee_id).toString(), config.cryptoKey.hashKey ),
                        name: xResult.employee_name,
                    },
                    department: {
                        id: xResult.department_id,
                        name: xResult.department_name,
                    },
                    reference_from_ecommerce: xResult.reference_from_ecommerce,
                    budget_is_approved: xResult.budget_is_approved,
                    memo_special_request: xResult.memo_special_request,

                    total_qty: xResult.total_qty,
                    total_price: xResult.total_price,

                    status: xResult.status,
                    requested_at: moment(xResult.requested_at).format('DD MMM YYYY HH:mm'),
                    printed_fpb_at: moment(xResult.printed_fpb_at).format('DD MMM YYYY HH:mm'),
                    submit_price_quotation_at: moment(xResult.submit_price_quotation_at).format('DD MMM YYYY HH:mm'),

                    purchase_request_detail: xJoArrRequestDetailData,
                }

                xJoResult = {
                    status_code: '00',
                    status_msg: 'OK',
                    data: xJoData,
                }
            }else{
                xJoResult = {
                    status_code: '-99',
                    status_msg: 'Data not found',
                }
            }
        }     
        
        return xJoResult;
    }

    async submitFPB( pParam ){

        var xJoResult = {};
        var xDecId = null;
        var xFlagProcess = false;

        if( pParam.id != '' && pParam.user_id != '' ){
            xDecId = await _utilInstance.decrypt( pParam.id, config.cryptoKey.hashKey );
            if( xDecId.status_code == '00' ){
                xFlagProcess = true;
                pParam.id = xDecId.decrypted;
                xDecId = await _utilInstance.decrypt( pParam.user_id, config.cryptoKey.hashKey );
                if( xDecId.status_code == '00' ){
                    pParam.user_id = xDecId.decrypted;
                    xFlagProcess = true;
                }else{
                    xJoResult = xDecId;
                }
            }else{
                xJoResult = xDecId;
            }
        }

        if( xFlagProcess ){
            pParam.requested_at = await _utilInstance.getCurrDateTime();
            pParam.status = 1;

            var xUpdateResult = await _repoInstance.save( pParam, 'submit_fpb' );
            xJoResult = xUpdateResult;
            // Next Phase : Notification to adamin
        }

        return xJoResult;
    }

    async cancelFPB( pParam ){

        var xJoResult = {};
        var xDecId = null;
        var xFlagProcess = false;

        if( pParam.id != '' && pParam.user_id != '' ){
            xDecId = await _utilInstance.decrypt( pParam.id, config.cryptoKey.hashKey );
            if( xDecId.status_code == '00' ){
                xFlagProcess = true;
                pParam.id = xDecId.decrypted;
                xDecId = await _utilInstance.decrypt( pParam.user_id, config.cryptoKey.hashKey );
                if( xDecId.status_code == '00' ){
                    pParam.user_id = xDecId.decrypted;
                    xFlagProcess = true;
                }else{
                    xJoResult = xDecId;
                }
            }else{
                xJoResult = xDecId;
            }
        }

        if( xFlagProcess ){
            pParam.cancel_at = await _utilInstance.getCurrDateTime();
            pParam.status = -1;

            var xUpdateResult = await _repoInstance.save( pParam, 'cancel_fpb' );
            xJoResult = xUpdateResult;
            // Next Phase : Notification to adamin
        }

        return xJoResult;
    }

    async setToDraftFPB( pParam ){

        var xJoResult = {};
        var xDecId = null;
        var xFlagProcess = false;

        if( pParam.id != '' && pParam.user_id != '' ){
            xDecId = await _utilInstance.decrypt( pParam.id, config.cryptoKey.hashKey );
            if( xDecId.status_code == '00' ){
                xFlagProcess = true;
                pParam.id = xDecId.decrypted;
                xDecId = await _utilInstance.decrypt( pParam.user_id, config.cryptoKey.hashKey );
                if( xDecId.status_code == '00' ){
                    pParam.user_id = xDecId.decrypted;
                    xFlagProcess = true;
                }else{
                    xJoResult = xDecId;
                }
            }else{
                xJoResult = xDecId;
            }
        }

        if( xFlagProcess ){
            pParam.set_to_draft_at = await _utilInstance.getCurrDateTime();
            pParam.status = 0;

            var xUpdateResult = await _repoInstance.save( pParam, 'set_to_draft_fpb' );
            xJoResult = xUpdateResult;
            // Next Phase : Notification to adamin
        }

        return xJoResult;
    }
}

module.exports = PurchaseRequestService;