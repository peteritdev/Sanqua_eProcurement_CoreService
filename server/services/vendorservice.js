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

//Repository
const VendorRepository = require('../repository/vendorrepository.js');
const _vendorRepoInstance = new VendorRepository();

//Util
const Utility = require('../utils/globalutility.js');
const { forEach } = require('lodash');
const _utilInstance = new Utility();

const Security = require('../utils/security.js');
const e = require('express');
const _secureInstance = new Security();

class VendorService {
    constructor(){}

    async list(pParam){
        var xJoResult = {};
        var xJoArrData = [];       

        var xResultList = await _vendorRepoInstance.list(pParam);

        if( xResultList.count > 0 ){
            xJoResult.status_code = "00";
            xJoResult.status_msg = "OK";
            xJoResult.total_record = xResultList.count;

            var xRows = xResultList.rows;

            for(var index in xRows){                

                xJoArrData.push({
                    id: await _utilInstance.encrypt((xRows[index].id).toString()),
                    code: xRows[index].code,
                    name: xRows[index].name,

                });
            }

            xJoResult.data = xJoArrData;
        }else{
            xJoResult.status_code = "00";
            xJoResult.status_msg = "OK";
            xJoResult.total_record = xResultList.count;
            xJoResult.data = xJoArrData;
        }

        return (xJoResult);
    } 

    async getVendorById( pParam ){
        var xJoResult;
        var xFlag = true;

        var xDecId = await _utilInstance.decrypt( pParam.id );
        if( xDecId.status_code == '00' ){
            pParam.id = xDecId.decrypted;
        }else{
            xFlag = false;
            xJoResult = xDecId;
        }

        if( xFlag ){
            var xData = await _vendorRepoInstance.getVendorById(pParam.id);
            if( xData != null ){
                xJoResult = {
                    status_code: "00",
                    status_msg: "OK",
                    data: {
                        id: await _utilInstance.encrypt( xData.id ),
                        name: xData.name,
                        logo: ( xData.logo == null ? '' : ( config.frontParam.photoPath.logo + xData.logo ) ),
                        npwp: xData.npwp,
                        business_entity: xData.business_entity,
                        classification: xData.classification,
                        sub_classification: xData.sub_classification,
                        province: xData.province,   
                        city: xData.city,
                        address: xData.address,
                        zip_code: xData.zip_code,
                        phone1: (await _utilInstance.decrypt( xData.phone1 )).decrypted,
                        phone2: (await _utilInstance.decrypt( xData.phone2 )).decrypted,
                        email: (await _utilInstance.decrypt( xData.email )).decrypted,
                        website: xData.website,
                        about: xData.about,
                        location_lat: xData.location_lat,
                        location_long: xData.location_long,
                        status: xData.status,
                        register_via: xData.register_via,
                        tags: xData.tags,
                        company_scale: xData.company_scale,
                    }
                }
            }
        }

        return xJoResult;
    }

    async save(param){
        var joResult;
        var checkDuplicateResult = await _vendorRepoInstance.isDataExists(param.name, param.email);
        var flagProcess = true;
        var xDec = null;

        console.log(">>> Service : ");
        console.log(JSON.stringify(param));

        if( ( param.act == "add" && checkDuplicateResult == null ) || param.act == "update" ){

            if( param.act == "update" ){
                xDec = await _utilInstance.decrypt(param.id);
                param.id = xDec.decrypted;
            }

            if( ( param.act == "update" && xDec.status_code == "00" ) || ( param.act == "add" ) ){                    
                var xDecUserId = await _utilInstance.decrypt(param.user_id);
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

            
            if( flagProcess ){
                param = await _secureInstance.encryptCriticalField(param);
                joResult = await _vendorRepoInstance.save( param );
            }

        }else{
            joResult = {
                status_code: "01",
                status_msg: "Data already exist in database"
            }
        }

        return (joResult);
    }

    async blockVendor( pParam ){
        var xJoResult;
        var xIsExist = null;
        var xFlagProcess = true;
        var xDecId = null;

        xDecId = await _utilInstance.decrypt( pParam.id );
        if( xDecId.status_code == "00" ){
            pParam.id = xDecId.decrypted;
            xDecId = await _utilInstance.decrypt(pParam.user_id);
            if( xDecId.status_code == "00" ){
                pParam.user_id = xDecId.decrypted;
            }else{
                xJoResult = xDecId;
                xFlagProcess = false;
            }
        }else{
            xDecId - xJoResult;
            xFlagProcess = false;
        }

        if( xFlagProcess ){
            xIsExist = await _vendorRepoInstance.getVendorById(pParam.id);
            if( xIsExist != null ){
                xJoResult = await _vendorRepoInstance.blockVendor(pParam);
            }else{
                xJoResult = {
                    status_code: "-99",
                    status_msg: "Vendor not found. Please provide correct id.",
                }
            }
        }

        return xJoResult;
    }

    async saveVendorDocument(pParam){
        var xJoResult;        
        var xFlagProcess = true;
        var xDec = null;
        var isExists = null;       

        xDec = await _utilInstance.decrypt(pParam.vendor_id);
        if( xDec.status_code == '00' ){
            pParam.vendor_id = xDec.decrypted;     
            xDec = await _utilInstance.decrypt(pParam.user_id);
            if( xDec.status_code == "00" ){
                pParam.user_id = xDec.decrypted;                    
            }else{
                xFlagProcess = false;
                xJoResult = xDec;
            }   
        }else{
            xFlagProcess = false;
            xJoResult = xDec;
        }      
        

        if( xFlagProcess ){                   

            isExists = await _vendorRepoInstance.isVendorDocumentExists(pParam.vendor_id, pParam.document_type_id);

            if( isExists != null ){
                pParam.act = "update";
            }else{
                pParam.act = "add";
            }

            xJoResult = await _vendorRepoInstance.saveVendorDocument( pParam );       
            
        }       

        return (xJoResult);
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
            var xDeleteResult = await _vendorRepoInstance.delete( pParam );
            xJoResult = xDeleteResult;
        }

        return xJoResult;
    }

    async getVendorDocumentByDocumentTypeId( pParam ){
        var xJoResult = {};
        var xFlagProcess = true;

        if( pParam.vendor_id != '' && pParam.document_type_id != '' ){
            var xDecId = await _utilInstance.decrypt( pParam.vendor_id, config.cryptoKey.hashKey );
            if( xDecId.status_code == '00' ){
                pParam.vendor_id = xDecId.decrypted;
            }else{
                xFlagProcess = false;
                xJoResult = xDecId;
            }
        }

        if( xFlagProcess ){
            var xResult = await _vendorRepoInstance.getVendorDocumentByDocumentTypeId( pParam );
            if( xResult != null ){
                xJoResult = {
                    status_code: '00',
                    status_msg: 'OK',
                    data: {
                        id: await _utilInstance.encrypt( xResult.id, config.cryptoKey.hashKey ),
                        document_type_id: xResult.document_type_id,
                        document_no: xResult.document_no,
                        date: xResult.date,
                        expire_date: xResult.expire_date,
                        file: xResult.file,
                        description: xResult.description,
                        instance: xResult.instance,
                        siup_qualification: xResult.siup_qualification,
                        address: xResult.address,
                    },
                }
            }else{
                xJoResult = {
                    status_code: '-99',
                    status_msg: 'Data not found'
                };
            }
        }

        return xJoResult;
    }

}

module.exports = VendorService;