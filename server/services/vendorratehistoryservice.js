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
const VendorRateHistoryRepository = require('../repository/vendorratehistoryrepository.js');
const _repoInstance = new VendorRateHistoryRepository();

class VendorRateHistoryService {
    constructor(){}

    async getById( pParam ){
        var xJoResult = {};
        var xFlagProcess = true;

        var xDecId = await _utilInstance.decrypt( pParam.id, config.cryptoKey.hashKey );
        if( xDecId.status_code == '00' ){
            pParam.id = xDecId.decrypted;
        }else{
            xFlagProcess = false;
            xJoResult = xDecId;
        }

        if( xFlagProcess ){
            var xResultList = await _repoInstance.getById( pParam );
            if( xResultList != null ){
                xJoResult = {
                    status_code: '00',
                    status_message: 'OK',
                    data: {
                        id: await _utilInstance.encrypt( xResultList.id, config.cryptoKey.hashKey ),
                        rate_date: xResultList.rate_date,
                        pic: xResultList.pic,
                        harga: xResultList.harga,
                        kualitas: xResultList.kualitas,
                        pengiriman: xResultList.pengiriman,
                        kesesuaian_penawaran: xResultList.kesesuaian_penawaran,
                        komunikatif: xResultList.komunikatif,
                        status: xResultList.status,
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
            var xResultList = await _repoInstance.list(pParam);

            if( xResultList.count > 0 ){
                var xRows = xResultList.rows;
                for( var index in xRows ){
                    xJoArrData.push({
                        id: await _utilInstance.encrypt( (xRows[index].id).toString(), config.cryptoKey.hashKey ),
                        rate_date: xRows[index].rate_date,
                        pic: xRows[index].pic,
                        harga: xRows[index].harga,
                        kualitas: xRows[index].kualitas,
                        pengiriman: xRows[index].pengiriman,
                        kesesuaian_penawaran: xRows[index].kesesuaian_penawaran,
                        komunikatif: xRows[index].komunikatif,
                        avg_rate: xRows[index].avg_rate,
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

            if( xAct == "add" ){            

                // User Id
                var xDecId = await _utilInstance.decrypt(pParam.user_id,config.cryptoKey.hashKey);
                pParam.created_by = xDecId.decrypted;
                pParam.created_by_name = pParam.user_name;

                pParam.avg_rate = ( pParam.harga + pParam.kualitas + pParam.pengiriman + pParam.kesesuaian_penawaran + pParam.komunikatif ) / 5;
    
                // Add to Vendor Rate history table
                var xAddResult = await _repoInstance.save( pParam, xAct );

                xJoResult = xAddResult;
            }else if( xAct == "update" ){
    
                var xDecId = await _utilInstance.decrypt(pParam.id,config.cryptoKey.hashKey);
                if( xDecId.status_code == "00" ){
                    pParam.id = xDecId.decrypted;                    
                    xDecId = await _utilInstance.decrypt(pParam.user_id,config.cryptoKey.hashKey);
                    if( xDecId.status_code == "00" ){
                        pParam.updated_by = xDecId.decrypted;
                        pParam.updated_by_name = pParam.user_name;
                        pParam.avg_rate = ( pParam.harga + pParam.kualitas + pParam.pengiriman + pParam.kesesuaian_penawaran + pParam.komunikatif ) / 5;
                    }else{
                        xFlagProcess = false;
                        xJoResult = xDecId;
                    }
                }else{
                    xFlagProcess = false;
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

            var xDeleteResult = await _repoInstance.delete( pParam );
            xJoResult = xDeleteResult;
            
        }

        return xJoResult;

    }
}

module.exports = VendorRateHistoryService;