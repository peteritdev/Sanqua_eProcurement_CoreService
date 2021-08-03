var env = process.env.NODE_ENV || 'localhost';
var config = require(__dirname + '/../config/config.json')[env];
var Sequelize = require('sequelize');
var sequelize = new Sequelize(config.database, config.username, config.password, config);
const { hash } = require('bcryptjs');
const Op = sequelize.Op;

//Model
const _modelDb = require('../models').ms_spesificationattributes;
const _modelSpesificationCategory = require('../models').ms_spesificationcategories;

const Utility = require('peters-globallib-v2');
const _utilInstance = new Utility();



class SpesificationAttributeRepository{
    constructor(){}

    async list( pParam ){

        var xOrder = ['name', 'ASC'];
        var xInclude = [
            {
                attributes: ['id','name'],
                model: _modelSpesificationCategory,
                as: 'spesification_category',
            }
        ];
        var xWhereCategoryId = {};

        if( pParam.hasOwnProperty('spesification_category_id') ){
            if( pParam.spesification_category_id != '' ){
                xWhereCategoryId = {
                    spesification_category_id: pParam.spesification_category_id
                }
            }
        }

        if( pParam.order_by != '' && pParam.hasOwnProperty('order_by') ){
            xOrder = [pParam.order_by, (pParam.order_type == 'desc' ? 'DESC' : 'ASC') ];
        }

        var xParamQuery = {
            where: {
                [Op.and]:[
                    {
                        is_delete: 0
                    },
                    xWhereCategoryId
                ],
                [Op.or]: [
                    {
                        name: {
                            [Op.iLike]: '%' + pParam.keyword + '%'
                        },
                    },
                ]
            },          
            include: xInclude,  
            order: [xOrder],
        };

        if( pParam.hasOwnProperty('offset') && pParam.hasOwnProperty('limit') ){
            if( pParam.offset != '' && pParam.limit != ''){
                if( pParam.limit != 'all' ){
                    xParamQuery.offset = pParam.offset;
                    xParamQuery.limit = pParam.limit;
                }                
            }
        }

        var xData = await _modelDb.findAndCountAll(xParamQuery);

        return xData;
    }

    async isDataExists( pName ){
        var data = await _modelDb.findOne({
            where: {
                name: pName
            }
        });
        
        return data;
    }

    async getById( pParam ){
        var xData = await _modelDb.findOne({
            where: {
                id: pParam.id,
                is_delete: 0,
            },
        });

        return xData;
    }

    async getBySpesificationCategoryId( pParam ){
        var xData = await _modelDb.findOne({
            where: {
                spesification_category_id: pParam.spesification_category_id,
                is_delete: 0,
            },
        });

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

module.exports = SpesificationAttributeRepository;

