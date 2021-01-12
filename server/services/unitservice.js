const jwt = require('jsonwebtoken');
const md5 = require('md5');
const crypto = require('crypto');
const moment = require('moment');
const sequelize = require('sequelize');
const dateFormat = require('dateformat');
const Op = sequelize.Op;
const bcrypt = require('bcrypt');


var config = require('../config/config.json');

// Model
const modelUser = require('../models').ms_users;

//Repository
const UnitRepository = require('../repository/unitrepository.js');
const unitRepoInstance = new UnitRepository();

//Util
const Utility = require('../utils/globalutility.js');
const utilInstance = new Utility();

class UnitService {
    constructor(){}

    async list(param){
        var joResult = {};
        var joArrData = [];       

        var xResultList = await unitRepoInstance.list(param);

        if( xResultList.data.count > 0 ){
            joResult.status_code = "00";
            joResult.status_msg = "OK";
            joResult.recordsTotal = xResultList.count;
            joResult.recordsFiltered = xResultList.count;
            joResult.draw = param.draw;

            var xRows = xResultList.data.rows;

            for(var index in xRows){
                joArrData.push({
                    id: await utilInstance.encrypt((xRows[index].id).toString()),
                    name: xRows[index].name,
                    created_at: xRows[index].createdAt,
                    updated_at: xRows[index].updatedAt
                });
            }

            joResult.data = joArrData;
        }else{
            joResult.status_code = "00";
            joResult.status_msg = "OK";
            joResult.recordsTotal = xResultList.count;
            joResult.recordsFiltered = xResultList.count;
            joResult.draw = param.draw;
            joResult.data = joArrData;
        }

        return (joResult);
    }

    async save(param){
        var joResult;
        var checkDuplicateResult = await unitRepoInstance.isDataExists(param.name);
        var flagProcess = true;
        var xDec = null;

        if( ( param.act == "add" && checkDuplicateResult == null ) || param.act == "update" ){

            if( param.act == "update" ){
                xDec = await utilInstance.decrypt(param.id);
                param.id = xDec.decrypted;
            }

            if( ( param.act == "update" && xDec.status_code == "00" ) || ( param.act == "add" ) ){                    
                var xDecUserId = await utilInstance.decrypt(param.user_id);
                if( xDecUserId.status_code == "00" ){
                    param.user_id = xDecUserId.decrypted;
                }else{
                    flagProcess = false;
                    joResult = xDecUserId;
                }                    
            }else{
                flagProcess = false;
                joResult = xDec; 
            }       

            if( flagProcess )joResult = await unitRepoInstance.save( param );

        }else{
            joResult = {
                status_code: "01",
                status_msg: "Data already exist in database"
            }
        }

        return (joResult);
    }

    async delete( param ){
        var joResult;
        var flagProcess = true;
        var xDecId = await utilInstance.decrypt(param.id);
        var xDecUserId = await utilInstance.decrypt(param.user_id);

        if( xDecId.status_code == "00" ){
            param.id = xDecId.decrypted;    
            if( xDecUserId.status_code == "00" ){
                param.user_id = xDecUserId.decrypted;
            }else{
                flagProcess = false;
                joResult = xDecUserId;
            }                
        }else{
            flagProcess = false;
            joResult = xDecId;
        }

        if( flagProcess )joResult = await unitRepoInstance.delete(param);

        return (joResult);
    }

    async upload( param ){
        try{
            console.log(">>> Req : " + param.files);
            if( !req.files ){
                res.send({
                    status: false,
                    message: "No file uploaded"
                });
            }else{
                let uploadedPhoto = param.files.attachment;
                uploadedPhoto.mv('../files/product_categories/' + uploadedPhoto.name);
    
                res.send({
                    status: true,
                    message: "File successfully uploaded",
                    data: {
                        name: uploadedPhoto.name,
                        mimetype: uploadedPhoto.mimetype,
                        size: uploadedPhoto.size
                    }
                });
            }
        }catch( e ){
            res.status(500).send(e);
        }
    }

}

module.exports = UnitService;
