var env = process.env.NODE_ENV || 'development';
var configEnv = require(__dirname + '/../config/config.json')[env];
var Sequelize = require('sequelize');
var sequelize = new Sequelize(configEnv.database, configEnv.username, configEnv.password, configEnv);
const { hash } = require('bcryptjs');
const Op = sequelize.Op;

//Model
const _modelDb = require('../models').ms_classifications;
const _modelSubClassification = require('../models').ms_subclassifications;

const Utility = require('peters-globallib');
const _utilInstance = new Utility();

var config = require('../config/config.json');

class ClassificationRepository {
    constructor(){}

    async list( pParam ){

        var xOrder = ['name', 'ASC'];
        var xWhere = [
            {
                is_delete: 0
            },
            {
                name: {
                    [Op.iLike]: '%' + pParam.keyword + '%'
                },
            }
        ];

        if( pParam.order_by != '' && pParam.hasOwnProperty('order_by') ){
            xOrder = [pParam.order_by, (pParam.order_type == 'desc' ? 'DESC' : 'ASC') ];
        }

        var xJoinedTable = [
            {
                model: _modelSubClassification,
                as: 'sub_classification',
                include: [
                    {
                        model: _modelSubClassification,
                        as: 'sub_classification_2',
                    }
                ],
            }
        ];

        var xParamQuery = {
            where: {
                [Op.and]:xWhere
            },
            include: xJoinedTable,
            order: [
                xOrder
            ]
        };

        if( pParam.hasOwnProperty('offset') && pParam.hasOwnProperty('limit') ){
            if( pParam.offset != '' && pParam.limit != '' && pParam.offset != 0 && pParam.limit != 0 ){
                xParamQuery.offset = pParam.offset;
                xParamQuery.limit = pParam.limit;
            }
        }

        try{
            var xData = await _modelDb.findAndCountAll(xParamQuery);
        }catch(e){
            console.log(e);
        }

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

                xSaved = await _modelDb.create(pParam, {xTransaction}); 

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
                xSaved = await _modelDb.update( pParam, xWhere, {xTransaction} );

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

    async delete( pParam ){
        let xTransaction;
        var xJoResult = {};

        try{
            var xSaved = null;
            xTransaction = await sequelize.transaction();

            xSaved = await _modelDb.update(
                {
                    is_delete: 1,
                    deleted_by: pParam.deleted_by,
                    deleted_by_name: pParam.deleted_by_name,
                    deleted_at: await _utilInstance.getCurrDateTime(),
                },
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
                status_msg: "Failed save or update data",
                err_msg: e
            }

            return xJoResult;
        }
    }
}

module.exports = ClassificationRepository;