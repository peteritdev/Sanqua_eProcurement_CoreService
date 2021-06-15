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
const ProcurementItemRepository = require('../repository/procurementvendorrepository.js');
const _repoInstance = new ProcurementItemRepository();

const ProcurementRepository = require('../repository/procurementrepository.js');
const _procurementRepoInstance = new ProcurementRepository();

// OAuth Service
const OAuthService = require('../services/oauthservice.js');
const _oAuthService = new OAuthService();

const _xArrConfirmationStatus = ['Pending', 'Join', 'Not Join'];
const _xArrConfirmationVia = ['', 'Email', 'Vendor Area', 'Admin'];

class ProcurementVendorService {
    constructor(){}

    async list( pParam ){
        var xJoResult = {};
        var xJoArrData = [];
        var xFlagProcess = false;

        if( pParam.hasOwnProperty('procurement_id') ){
            if( pParam.procurement_id != '' ){
                var xDecId = await _utilInstance.decrypt( pParam.procurement_id, config.cryptoKey.hashKey );
                if( xDecId.status_code == '00' ){
                    pParam.procurement_id = xDecId.decrypted;
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
                        vendor: xRows[index].vendor,
                        invited_at: moment( xRows[index].invited_at ).format( 'DD MMM YYYY hh:mm:ss' ),
                        confirmation_status: {
                            id: xRows[index].confirmation_status,
                            name: _xArrConfirmationStatus[xRows[index].confirmation_status],
                        },
                        confirmation_at: moment( xRows[index].confirmation_at ).format( 'DD MMM YYYY hh:mm:ss' ),
                        confirmation_via: {
                            id: xRows[index].confirmation_via,
                            name: _xArrConfirmationVia[xRows[index].confirmation_via],
                        },
                        invited_by_name: xRows[index].invited_by_name,
                        invited_counter: xRows[index].invited_counter,

                        created_at: moment(xRows[index].createdAt).format('YYYY-MM-DD hh:mm:ss'),
                        created_by_name: xRows[index].created_by_name,
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
        var xFlagProcess = true;
        var xEncId = '';
        var xDecId = null;

        if( pParam.hasOwnProperty('id') ){
            if( pParam.id != '' ){
                xDecId = await _utilInstance.decrypt(pParam.id, config.cryptoKey.hashKey);
                if( xDecId.status_code == '00' ){
                    pParam.id = xDecId.decrypted;
                }else{
                    xFlagProcess = false;
                    xJoResult = xDecId;
                }
            }
        }else if( pParam.hasOwnProperty('procurement_id') && pParam.hasOwnProperty('vendor_id') ){
            if( pParam.procurement_id != '' && pParam.vendor_id != '' ){
                xEncId = pParam.procurement_id;
                xDecId = await _utilInstance.decrypt(pParam.procurement_id, config.cryptoKey.hashKey);
                if( xDecId.status_code == '00' ){
                    pParam.procurement_id = xDecId.decrypted;
                    if( pParam.vendor_id != '' ){
                        xDecId = await _utilInstance.decrypt(pParam.vendor_id, config.cryptoKey.hashKey);
                        if( xDecId.status_code == '00' ){
                            pParam.vendor_id = xDecId.decrypted;
                        }else{
                            xFlagProcess = false;
                            xJoResult = xDecId;
                        }
                    }
                }else{
                    xFlagProcess = false;
                    xJoResult = xDecId;
                }
            }
        }

        if( xFlagProcess ){

            var xResult = await _repoInstance.getById(pParam);

            if( xResult != null ){

                xJoData = {
                    id: await _utilInstance.encrypt( (xResult.id).toString(), config.cryptoKey.hashKey ),
                    vendor: xResult.vendor,
                    invited_at: moment( xResult.invited_at ).format( 'DD MMM YYYY hh:mm:ss' ),
                    confirmation_status: {
                        id: xResult.confirmation_status,
                        name: _xArrConfirmationStatus[xResult.confirmation_status],
                    },
                    confirmation_at: moment( xResult.confirmation_at ).format( 'DD MMM YYYY hh:mm:ss' ),
                    confirmation_via: {
                        id: xResult.confirmation_via,
                        name: _xArrConfirmationVia[xResult.confirmation_via],
                    },
                    invited_by_name: xResult.invited_by_name,
                    invited_counter: xResult.invited_counter,

                    created_at: moment(xResult.createdAt).format('YYYY-MM-DD hh:mm:ss'),
                    created_by_name: xResult.created_by_name,
                };
                
                xJoResult = {
                    status_code: '00',
                    status_msg: 'OK',
                    data: xJoData,
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

        if( xFlagProcess ){

            if( xAct == "add" ){             

                // Procurement Id
                if( pParam.hasOwnProperty('procurement_id') && pParam.hasOwnProperty('vendor_id') ){
                    if( pParam.procurement_id != '' && pParam.vendor_id != '' ){
                        var xDecId = await _utilInstance.decrypt( pParam.procurement_id, config.cryptoKey.hashKey );
                        if( xDecId.status_code == '00' ){
                            pParam.procurement_id = xDecId.decrypted;  
                            var xDecId = await _utilInstance.decrypt( pParam.vendor_id, config.cryptoKey.hashKey );
                            if( xDecId.status_code == '00' ){
                                pParam.vendor_id = xDecId.decrypted;                                           
                            }else{
                                xFlagProcess = false;
                                xJoResult = xDecId;
                            }                                         
                        }else{
                            xFlagProcess = false;
                            xJoResult = xDecId;
                        }
                    }else{
                        xFlagProcess = false;
                        xJoResult = {
                            status_code: '-99',
                            status_msg: 'Procurement ID and Vendor ID can not empty',
                        }
                    }
                }else{
                    xFlagProcess = false;
                    xJoResult = {
                        status_code: '-99',
                        status_msg: 'You need to supply correct ID',
                    }
                }                                

                // var xProcurementDetail = await _procurementRepoInstance.getById( {id: pParam.procurement_id } );
                // if( xProcurementDetail != null ){
                    // if( xProcurementDetail.status_approval == 0 ){
                    if(true){
                        var xAddResult = await _repoInstance.save( pParam, xAct );
                        xJoResult = xAddResult;
                    }else{
                        xJoResult = {
                            status_code: '-99',
                            status_msg: 'You can not add new item when procurement has been submited or approved'
                        }
                    }
                // }else{
                //     xJoResult = {
                //         status_code: '-99',
                //         status_msg: 'The ID that supplied not exist.'
                //     }
                // }
                
                
            }else if( xAct == "update" ){
    
                var xDecId = await _utilInstance.decrypt(pParam.id,config.cryptoKey.hashKey);
                if( xDecId.status_code == "00" ){
                    pParam.id = xDecId.decrypted;                    
                    
                }else{
                    xFlagProcess = false;
                    xJoResult = xDecId;
                }
    
                if( xFlagProcess ){
                    // var xProcurementDetail = await _procurementRepoInstance.getById( {id: pParam.procurement_id } );
                    // if( xProcurementDetail != null ){
                        // if( xProcurementDetail.status_approval == 0 ){
                        if(true){
                            var xAddResult = await _repoInstance.save( pParam, xAct );
                            xJoResult = xAddResult;
                        }else{
                            xJoResult = {
                                status_code: '-99',
                                status_msg: 'You can not update item when procurement has been submited or approved'
                            }
                        }
                    // }else{
                    //     xJoResult = {
                    //         status_code: '-99',
                    //         status_msg: 'The Procurement ID that supplied not exist.'
                    //     }
                    // }
                }
                
            }
            
        }        

        return xJoResult;
    }

    async archive( pParam ){
        var xJoResult;
        var xFlagProcess = true;  

        var xDecId = await _utilInstance.decrypt(pParam.id, config.cryptoKey.hashKey);
        if( xDecId.status_code == "00" ){
            pParam.id = xDecId.decrypted;                    
            xDecId = await _utilInstance.decrypt(pParam.user_id, config.cryptoKey.hashKey);
            if( xDecId.status_code == "00" ){
                pParam.is_delete = 1;
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

            var xDeleteResult = await _repoInstance.archive( pParam );
            xJoResult = xDeleteResult;
            
        }

        return xJoResult;
    }

    async unarchive( pParam ){
        var xJoResult;
        var xFlagProcess = true;  

        var xDecId = await _utilInstance.decrypt(pParam.id, config.cryptoKey.hashKey);
        if( xDecId.status_code == "00" ){
            pParam.id = xDecId.decrypted;                    
            xDecId = await _utilInstance.decrypt(pParam.user_id, config.cryptoKey.hashKey);
            if( xDecId.status_code == "00" ){
                pParam.is_delete = 0;
                // pParam.deleted_by = xDecId.decrypted;
                // pParam.deleted_by_name = pParam.user_name;
            }else{
                xFlagProcess = false;
                xJoResult = xDecId;
            }
        }else{
            xFlagProcess = false;
            xJoResult = xDecId;
        }

        if( xFlagProcess ){

            var xDeleteResult = await _repoInstance.archive( pParam );
            xJoResult = xDeleteResult;
            
        }

        return xJoResult;
    }

    async delete( pParam ){
        var xJoResult;
        var xFlagProcess = true;  

        var xDecId = await _utilInstance.decrypt(pParam.id, config.cryptoKey.hashKey);
        if( xDecId.status_code == "00" ){
            pParam.id = xDecId.decrypted;                   
        }else{
            xFlagProcess = false;
            xJoResult = xDecId;
        }

        if( xFlagProcess ){      
            
            // Check first if there are procurement item or not             

            var xDeleteResult = await _repoInstance.delete( pParam );
            xJoResult = xDeleteResult;
        }

        return xJoResult;
    }
}

module.exports = ProcurementVendorService;