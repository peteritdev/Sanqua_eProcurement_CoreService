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
const VendorCatalogueSpesificationRepository = require('../repository/vendorcataloguespesificationrepository.js');
const _repoInstance = new VendorCatalogueSpesificationRepository();

//Util
const Utility = require('peters-globallib');
const _utilInstance = new Utility();

const _groupBy = require('json-groupby');

class VendorCatalogueSpesificationService {
    constructor(){}   

    async getById( pParam ){
        var xJoResult = {};
        var xFlagProcess = true;

        if( pParam.id != '' ){
            var xDecId = await _utilInstance.decrypt( pParam.id, config.cryptoKey.hashKey );
            if( xDecId.status_code == '00' ){
                pParam.id = xDecId.decrypted;
            }else{
                xFlagProcess = false;
                xJoResult = xDecId;
            }
            if( xFlagProcess ){
                var xResult = await _repoInstance.getById( pParam );
                if( xResult != null ){
                    xJoResult = {
                        status_code: '00',
                        status_msg: 'OK',
                        data: {
                            id: await _utilInstance.encrypt( (xResult.id).toString(), config.cryptoKey.hashKey ),
                            spesification_category: xResult.spesification_category,
                            spesification_attribute: xResult.spesification_attribute,
                            description: xResult.description,
                            standard: xResult.standard,
                            unit: xResult.unit,
                            criteria: xResult.criteria,
                            analysis_method: xResult.analysis_method,
                            min_frequency_supplier: xResult.min_frequency_supplier,
                            min_frequency_sanqua: xResult.min_frequency_sanqua,
                            created_at: xResult.createdAt,
                            created_by_name: xResult.created_by_name,
                            updated_at: xResult.updatedAt,
                            updated_by_name: xResult.updated_by_name,
                        }
                    }
                }else{
                    xJoResult = {
                        status_code: "-99",
                        status_msg: "Data not found",
                    };
                }
            }
        }else{
            xJoResult = {
                status_code: '-99',
                status_msg: 'Parameter not valid'
            }
        }

        return xJoResult;
    }

    async list(pParam){
        var xJoResult = {};
        var xJoArrData = [];
        var xFlagProcess = true;

        var xDecId = await _utilInstance.decrypt(pParam.vendor_catalogue_id, config.cryptoKey.hashKey);
        if( xDecId.status_code == '00' ){
            pParam.vendor_catalogue_id = xDecId.decrypted;
        }else{
            xFlagProcess = false;
            xJoResult = xDecId;
        }

        if( xFlagProcess ){
            var xResultList = await _repoInstance.list(pParam);
            if( xResultList.count > 0 ){
                var xRows = xResultList.rows;

                if( pParam.hasOwnProperty('mode') ){
                    if( pParam.mode == 'public' ){
                        for( var index in xRows ){
    
                            xJoArrData.push({
                                id: await _utilInstance.encrypt( (xRows[index].id).toString(), config.cryptoKey.hashKey ),
                                spesification_category: xRows[index].spesification_category.name,
                                spesification_attribute: xRows[index].spesification_attribute,
                                description: xRows[index].description,
                                standard: xRows[index].standard,
                                unit: xRows[index].unit,
                                criteria: xRows[index].criteria,
                                analysis_method: xRows[index].analysis_method,
                                min_frequency_supplier: xRows[index].min_frequency_supplier,
                                min_frequency_sanqua: xRows[index].min_frequency_sanqua,
                                created_at: xRows[index].createdAt,
                                created_by_name: xRows[index].created_by_name,
                                updated_at: xRows[index].updatedAt,
                                updated_by_name: xRows[index].updated_by_name,
                            });
                        }

                        xJoResult = {
                            status_code: "00",
                            status_msg: "OK",
                            data: _groupBy(xJoArrData,['spesification_category']),
                            catalogue_type: xRows[index].vendor_catalogue.catalogue_type,
                            total_record: xResultList.count,
                        }
                    }
                }else{
                    for( var index in xRows ){
    
                        xJoArrData.push({
                            id: await _utilInstance.encrypt( (xRows[index].id).toString(), config.cryptoKey.hashKey ),
                            spesification_category: xRows[index].spesification_category,
                            spesification_attribute: xRows[index].spesification_attribute,
                            description: xRows[index].description,
                            standard: xRows[index].standard,
                            unit: xRows[index].unit,
                            criteria: xRows[index].criteria,
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
                        catalogue_type: xRows[index].vendor_catalogue.catalogue_type,
                        total_record: xResultList.count,
                    }
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

    async save(pParam){
        var xJoResult;
        var xAct = pParam.act;
        var xFlagProcess = true;

        delete pParam.act;

        if( pParam.vendor_catalogue_id != '' ){
            var xDecId = await _utilInstance.decrypt( pParam.vendor_catalogue_id, config.cryptoKey.hashKey );
            if( xDecId.status_code == '00' ){
                pParam.vendor_catalogue_id = xDecId.decrypted;
            }else{
                xFlagProcess = false;
                xJoResult = xDecId;
            }
        }else{
            xJoResult = {
                status_code: '-99',
                status_msg: 'Parameter not valid'
            }
        }

        if( xFlagProcess ){
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
                    var xAddResult = await _repoInstance.save( pParam, xAct );
                    xJoResult = xAddResult;
                }           
    
    
            }else if( xAct == "update" ){
    
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
            var xDeleteResult = await _repoInstance.delete( pParam );
            xJoResult = xDeleteResult;
        }

        return xJoResult;
    }   

}

module.exports = VendorCatalogueSpesificationService;
