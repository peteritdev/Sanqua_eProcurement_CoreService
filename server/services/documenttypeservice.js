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

// Model
const modelUser = require('../models').ms_users;

//Repository
const DocumentTypeRepository = require('../repository/documenttyperepository.js');
const _docTypeRepoInstance = new DocumentTypeRepository();

//Util
const Utility = require('peters-globallib-v2');
const _utilInstance = new Utility();

class DocumentTypeService {
    constructor(){}

    async list(pParam){
        var xJoResult = {};
        var xJoArrData = [];

        var xResultList = await _docTypeRepoInstance.list(pParam);

        if( xResultList.count > 0 ){
            var xRows = xResultList.rows;
            for( var index in xRows ){
                xJoArrData.push({
                    id: await _utilInstance.encrypt( (xRows[index].id).toString(), config.cryptoKey.hashKey ),
                    name: xRows[index].name,
                    created_at: xRows[index].createdAt,
                    created_by_name: xRows[index].created_by_name,
                    updated_at: xRows[index].updatedAt,
                    updated_by_name: xRows[index].updated_by_name,
                });
            }
            xJoResult = {
                status_code: "00",
                status_msg: "OK",
                data: xJoArrData,
                total_record: xResultList.count,
            }
        }else{
            xJoResult = {
                status_code: "-99",
                status_msg: "Data not found",
            };
        }

        return xJoResult;
    }

    async save(pParam){
        var xJoResult;
        var xAct = pParam.act;
        var xFlagProcess = true;

        delete pParam.act;

        if( xAct == "add" ){           

            // User Id
            var xDecId = await _utilInstance.decrypt(pParam.user_id, config.cryptoKey.hashKey);
            if( xDecId.status_code == '00' ){
                pParam.created_by = xDecId.decrypted;
                pParam.created_by_name = pParam.user_name;
            }else{
                xFlagProcess = false;
                xJoResult = xDecId;
            }
            
            if( xFlagProcess ){
                var xAddResult = await _docTypeRepoInstance.save( pParam, xAct );
                xJoResult = xAddResult;
            }           


        }else if( xAct == "update" ){

            console.log(JSON.stringify(pParam));

            var xDecId = await _utilInstance.decrypt(pParam.id, config.cryptoKey.hashKey);
            if( xDecId.status_code == "00" ){
                pParam.id = xDecId.decrypted;                    
                xDecId = await _utilInstance.decrypt(pParam.user_id, config.cryptoKey.hashKey);
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
                var xAddResult = await _docTypeRepoInstance.save( pParam, xAct );
                xJoResult = xAddResult;
            }
            
        }

        return xJoResult;
    }

    async delete( pParam ){
        var xJoResult;
        var xFlagProcess = true;  

        var xDecId = await _utilInstance.decrypt(pParam.id, config.cryptoKey.hashKey);
        if( xDecId.status_code == "00" ){
            pParam.id = xDecId.decrypted;                    
            xDecId = await _utilInstance.decrypt(pParam.user_id, config.cryptoKey.hashKey);
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

            

            var xDeleteResult = await _docTypeRepoInstance.delete( pParam );
            xJoResult = xDeleteResult;
            
        }

        return xJoResult;
    }

    async dropDownList(pParam){
        var xJoResult = {};
        var xJoArrData = [];  
        var xFlagProcess = true;     

        if( xFlagProcess ){

            var xResultList = await _docTypeRepoInstance.list(pParam);

            if( xResultList.count > 0 ){
                xJoResult.status_code = "00";
                xJoResult.status_msg = "OK";

                var xRows = xResultList.rows;

                for(var index in xRows){                

                    xJoArrData.push({
                        id: xRows[index].id,
                        name: xRows[index].name,
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

module.exports = DocumentTypeService;
