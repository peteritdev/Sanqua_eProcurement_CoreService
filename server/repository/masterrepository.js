var env = process.env.NODE_ENV || 'localhost';
var config = require(__dirname + '/../config/config.json')[env];
var Sequelize = require('sequelize');
var sequelize = new Sequelize(config.database, config.username, config.password, config);
const { hash } = require('bcryptjs');
const Op = sequelize.Op;

// Model
const _modelCurrency = require('../models').ms_currencies;
const _modelUnit = require('../models').ms_units;

const _modelDb = require('../models');

const Utility = require('peters-globallib-v2');
const _utilInstance = new Utility();

class MasterRepository {

    constructor(pModelName){
        var xModelName = 'ms_' + ( (pModelName.slice(-1)) == 'y' ? (pModelName.slice(0,-1) + 'ies') : (pModelName + 's') );
        // console.log('>>> Model Name : ' + xModelName);
        // xModelName = 'unit.js';
        // // this._modelDb = require('../models').xModelName;
        // this._modelDb = require(`../models/${xModelName}`);
        this._runningModel = _modelDb[xModelName];
    }

    async list (pParam){
        var xOrder = ['name', 'ASC'];
        var xInclude = [];
        var xWhere = {};
        var xWhereAnd = [], xWhereOr = [];

        if( pParam.order_by != '' && pParam.hasOwnProperty('order_by') ){
            xOrder = [pParam.order_by, (pParam.order_type == 'desc' ? 'DESC' : 'ASC') ];
        }        

        if( pParam.hasOwnProperty('is_archived') ){
            if( pParam.is_archived != '' ){
                xWhereAnd.push({
                    is_delete: pParam.is_archived
                });
            }else{
                xWhereAnd.push({
                    is_delete: 0,
                });
            }
        }else{
            xWhereAnd.push({
                is_delete: 0,
            });
        }

        if( pParam.hasOwnProperty('keyword') ){
            if( pParam.keyword != '' ){
                xWhereOr.push({
                    name: {
                        [Op.iLike]: '%' + pParam.keyword + '%'
                    }
                })   
            }            
        }

        if( xWhereAnd.length > 0 ){
            xWhere.$and = xWhereAnd;
        }

        if( xWhereOr.length > 0 ){
            xWhere.$or = xWhereOr;
        }

        var xParamQuery = {
            where: xWhere,            
            include: xInclude,
            order: [xOrder],
        };

        if( pParam.hasOwnProperty('offset') && pParam.hasOwnProperty('limit') ){
            if( pParam.offset != '' && pParam.limit != ''){
                xParamQuery.offset = pParam.offset;
                xParamQuery.limit = pParam.limit;
            }
        }

        var xData = await this._runningModel.findAndCountAll(xParamQuery);

        return xData;
    }

    async save(pParam, pAct){
        let xTransaction;
        var xJoResult = {};
        
        try{

            var xSaved = null;
            xTransaction = await sequelize.transaction();

            if( pAct == "add" ){

                pParam.status = 1;
                pParam.is_delete = 0;

                xSaved = await this._runningModel.create(pParam, {xTransaction}); 

                if( xSaved.id != null ){

                    await xTransaction.commit();

                    xJoResult = {
                        status_code: "00",
                        status_msg: "Data has been successfully saved",
                        created_id: await _utilInstance.encrypt( (xSaved.id).toString(), config.cryptoKey.hashKey ),
                    }                     
                    

                }else{

                    if( xTransaction ) await xTransaction.rollback();

                    xJoResult = {
                        status_code: "-99",
                        status_msg: "Failed save to database",
                    }

                }                

            }else if( pAct == "update" ){
                
                pParam.updatedAt = await _utilInstance.getCurrDateTime();
                var xId = pParam.id;
                delete pParam.id;
                var xWhere = {
                    where : {
                        id: xId,
                    }
                };
                xSaved = await this._runningModel.update( pParam, xWhere, {xTransaction} );

                await xTransaction.commit();

                xJoResult = {
                    status_code: "00",
                    status_msg: "Data has been successfully updated"
                }

            }

        }catch(e){
            if( xTransaction ) await xTransaction.rollback();
            xJoResult = {
                status_code: "-99",
                status_msg: "Failed save or update data. Error : " + e,
                err_msg: e
            }

            
        }
        
        return xJoResult;
    }

    async isDataExists( pName ){
        var data = await this._runningModel.findOne({
            where: {
                name: pName,
                is_delete: 0
            }
        });
        
        return data;
    }

    async archive( pParam ){
        let xTransaction;
        var xJoResult = {};

        try{
            var xSaved = null;
            xTransaction = await sequelize.transaction();

            xSaved = await this._runningModel.update(
                pParam,
                {
                    where: {
                        id: pParam.id
                    }
                },
                {xTransaction}
            );
    
            await xTransaction.commit();

            xJoResult = {
                status_code: "00",
                status_msg: "Data has been successfully " + ( pParam.is_delete == 1 ? "archived" : "unarchived" ),
            }

            return xJoResult;

        }catch(e){
            if( xTransaction ) await xTransaction.rollback();
            xJoResult = {
                status_code: "-99",
                status_msg: "Failed archived data",
                err_msg: e
            }

            return xJoResult;
        }
    }

    async delete( pParam ){
        let xTransaction;
        var xJoResult = {};

        try{
            var xSaved = null;
            xTransaction = await sequelize.transaction();

            xSaved = await this._runningModel.destroy(
                {
                    where: {
                        id: pParam.id
                    }
                },
                {xTransaction}
            );
    
            await xTransaction.commit();

            xJoResult = {
                status_code: "00",
                status_msg: "Data has been successfully deleted",
            }

            return xJoResult;

        }catch(e){
            if( xTransaction ) await xTransaction.rollback();
            xJoResult = {
                status_code: "-99",
                status_msg: "Failed delete data",
                err_msg: e
            }

            return xJoResult;
        }
    }
   
}

module.exports = MasterRepository;