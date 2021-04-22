const jwt = require('jsonwebtoken');
const md5 = require('md5');
const crypto = require('crypto');
const moment = require('moment');
const sequelize = require('sequelize');
const dateFormat = require('dateformat');
const Op = sequelize.Op;
const bcrypt = require('bcrypt');

const env         = process.env.NODE_ENV || 'localhost';
const config      = require(__dirname + '/../config/config.json')[env];

// Utility
const Utility = require('peters-globallib');
const _utilInstance = new Utility();

// Repository
const CurrencyRepository = require('../repository/currencyrepository.js');
const _repoInstance = new CurrencyRepository();

class CurrencyService {
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
                        name: xResultList.name,
                        code: xResultList.code,
                        symbol: xResultList.symbol,
                        createdAt: moment( xResultList.createdAt ).format('DD-MM-YYYY HH:mm:ss'),
                        updatedAt: moment( xResultList.updatedAt ).format('DD-MM-YYYY HH:mm:ss'),
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
        
        var xResultList = await _repoInstance.list(pParam);

            if( xResultList.count > 0 ){
                var xRows = xResultList.rows;
                for( var index in xRows ){
                    xJoArrData.push({
                        id: await _utilInstance.encrypt( (xRows[index].id).toString(), config.cryptoKey.hashKey ),
                        name: xRows[index].name,
                        code: xRows[index].code,
                        symbol: xRows[index].symbol,
                        createdAt: moment( xRows[index].createdAt ).format('DD-MM-YYYY HH:mm:ss'),
                        updatedAt: moment( xRows[index].updatedAt ).format('DD-MM-YYYY HH:mm:ss'),
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

        return xJoResult;
    }

    async save( pParam ){
        var xJoResult;
        var xAct = pParam.act;
        var xFlagProcess = true;

        delete pParam.act;

        if( xAct == "add" ){            

            // User Id
            var xDecId = await _utilInstance.decrypt(pParam.user_id,config.cryptoKey.hashKey);
            pParam.created_by = xDecId.decrypted;
            pParam.created_by_name = pParam.user_name;

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

    async dropDownList(pParam){
        var xJoResult = {};
        var xJoArrData = [];  
        var xFlagProcess = true;     

        if( xFlagProcess ){

            var xResultList = await _repoInstance.list(pParam);

            if( xResultList.count > 0 ){
                xJoResult.status_code = "00";
                xJoResult.status_msg = "OK";

                var xRows = xResultList.rows;

                for(var index in xRows){                

                    xJoArrData.push({
                        id: xRows[index].id,
                        code: xRows[index].code,
                    });
                }

                xJoResult.data = xJoArrData;
            }else{
                xJoResult.status_code = "00";
                xJoResult.status_msg = "OK";
                xJoResult.data = xJoArrData;
            }

        }        

        return (xJoResult);
    }
}

module.exports = CurrencyService;