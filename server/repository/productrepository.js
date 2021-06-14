var env = process.env.NODE_ENV || 'localhost';
var config = require(__dirname + '/../config/config.json')[env];
var Sequelize = require('sequelize');
var sequelize = new Sequelize(config.database, config.username, config.password, config);
const { hash } = require('bcryptjs');
const Op = sequelize.Op;

//Model
const _modelDb = require('../models').ms_products;
const _modelCategory = require('../models').ms_productcategories;
const _modelUnit = require('../models').ms_units;

const Utility = require('peters-globallib-v2');
const _utilInstance = new Utility();

class ProductRepository{
    constructor(){}

    async list( pParam ){

        var xOrder = ['name', 'ASC'];
        var xInclude = [
            {
                attributes: ['id','name'],
                model: _modelCategory,
                as: 'category'
            },{
                attributes: ['id','name'],
                model: _modelUnit,
                as: 'unit'
            }
        ]

        if( pParam.order_by != '' && pParam.hasOwnProperty('order_by') ){
            xOrder = [pParam.order_by, (pParam.order_type == 'desc' ? 'DESC' : 'ASC') ];
        }

        var xParamQuery = {
            where: {
                [Op.and]:[
                    {
                        is_delete: 0
                    }
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

    async getProductByERPId( pParam ){
        var data = await _modelDb.findOne({
            where: {
                erp_id: pParam.erp_id,
                is_delete: 0
            }
        });
        
        return data;
    }

    async getProductByCode( pParam ){

        var xWhere = {};

        if( pParam.hasOwnProperty('id') ){
            if( pParam.id != '' ){
                xWhere = {
                    code: pParam.code,
                    is_delete: 0,
                    id: {
                        [Op.ne]: pParam.id,
                    }
                }
            }else{
                xWhere = {
                    code: pParam.code,
                    is_delete: 0,
                }
            }
        }else{
            xWhere = {
                code: pParam.code,
                is_delete: 0,
            }
        }

        var data = await _modelDb.findOne({
            where: xWhere
        });
        
        return data;
    }

    async getProductByName( pParam ){

        var xWhere = {};

        if( pParam.hasOwnProperty('id') ){
            if( pParam.id != '' ){
                xWhere = {
                    name: pParam.name,
                    is_delete: 0,
                    id: {
                        [Op.ne]: pParam.id,
                    }
                }
            }else{
                xWhere = {
                    name: pParam.name,
                    is_delete: 0,
                }
            }
        }else{
            xWhere = {
                name: pParam.name,
                is_delete: 0,
            }
        }

        var data = await _modelDb.findOne({
            where: xWhere
        });
        
        return data;
    }

    async getProductById( pParam ){
        var xData = await _modelDb.findOne({
            where: {
                id: pParam.id,
                is_delete: 0,
            },
            include:[
                {
                    attributes: ['id','name'],
                    model: _modelCategory,
                    as: 'category'
                },
                {
                    attributes: ['id','name'],
                    model: _modelUnit,
                    as: 'unit'
                },
            ],
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

            }else if( pAct == "update_by_erpid" ){
                var xErpId = pParam.erp_id;
                delete pParam.erp_id;
                
                saved = await _modelDb.update(pParam,{
                    where: {
                        erp_id: xErpId
                    }
                },{xTransaction});

                await xTransaction.commit();
    
                joResult = {
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

            console.log(">>> Catch : " + JSON.stringify(xJoResult));
            
        }
        
        return xJoResult;
    }

    async delete( pParam ){
        let xTransaction;
        var xJoResult = {};

        try{
            var xSaved = null;
            xTransaction = await sequelize.transaction();

            console.log(JSON.stringify(pParam));

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

module.exports = ProductRepository;

