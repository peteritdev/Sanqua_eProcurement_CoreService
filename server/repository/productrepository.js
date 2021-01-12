var env = process.env.NODE_ENV || 'development';
var configEnv = require(__dirname + '/../config/config.json')[env];
var Sequelize = require('sequelize');
var sequelize = new Sequelize(configEnv.database, configEnv.username, configEnv.password, configEnv);
const { hash } = require('bcryptjs');
const Op = sequelize.Op;

//Model
const modelDb = require('../models').ms_products;
const modelCategory = require('../models').ms_productcategories;
const modelUnit = require('../models').ms_units;

const Utility = require('../utils/globalutility.js');
const utilInstance = new Utility();



class ProductRepository{
    constructor(){}

    async list( pParam ){

        var data = await modelDb.findAndCountAll({
            where: {
                [Op.or]:[
                    {
                        name:{
                            [Op.like]: '%' + pParam.keyword + '%'
                        }
                    }
                ],
                [Op.and]:[
                    {
                        is_delete: 0
                    }
                ]

            },
            include:[
                {
                    model: modelCategory,
                    as: 'category'
                },{
                    model: modelUnit,
                    as: 'unit'
                }
            ],
            limit: pParam.limit,
            offset: pParam.offset
        });

        return {
            "status_code": "00",
            "status_msg": "OK",
            "data": data
        };
    }

    async isDataExists( pName ){
        var data = await modelDb.findOne({
            where: {
                name: pName
            }
        });
        
        return data;
    }

    async getProductByERPId( pParam ){
        var data = await modelDb.findOne({
            where: {
                erp_id: pParam.erp_id,
                is_delete: 0
            }
        });
        
        return data;
    }

    async save(pParam){
        let transaction;
        var joResult = {};
        var xAct = pParam.act;
        delete pParam.act;

        pParam.is_delete = 0;

        try{

            var saved = null;
            transaction = await sequelize.transaction(); 

            if( xAct == "add" ){
                saved = await modelDb.create(pParam,{transaction});
    
                await transaction.commit();
    
                joResult = {
                    status_code: "00",
                    status_msg: "Data has been successfully saved",
                    created_id: saved.id
                }
            }else if( xAct == "update" ){
                var xId = pParam.id;
                delete pParam.id;

                saved = await modelDb.update(pParam,{
                    where: {
                        id: xId
                    }
                },{transaction});

                await transaction.commit();
    
                joResult = {
                    status_code: "00",
                    status_msg: "Data has been successfully updated"
                }
            }else if( xAct == "update_by_erpid" ){
                var xErpId = pParam.erp_id;
                delete pParam.erp_id;
                
                saved = await modelDb.update(pParam,{
                    where: {
                        erp_id: pParam.erp_id
                    }
                },{transaction});

                await transaction.commit();
    
                joResult = {
                    status_code: "00",
                    status_msg: "Data has been successfully updated"
                }
            }

            return joResult;
        }catch(e){
            if( transaction ) await transaction.rollback();
            joResult = {
                status_code: "-99",
                status_msg: "Failed save or update data",
                err_msg: e
            }

            return joResult;
        }
    }

    async delete( pParam ){
        let transaction;
        var joResult = {};

        try{
		
			var saved = null;
            transaction = await sequelize.transaction();      

			/*created = await modelDb.delete({
                where: {
                    id: id
                }
            },{transaction});*/
            saved = await modelDb.update({
                is_delete: 1,
                deleted_by: pParam.user_id,
                deleted_at: await utilInstance.getCurrDateTime()
            },{
                where: {
                    id: pParam.id
                }
            });

            await transaction.commit();

            joResult = {
                status_code: "00",
                status_msg: "Data successfully deleted"
            }
        }catch(e){
            if( transaction ) await transaction.rollback();
            joResult = {
                status_code: "-99",
                status_msg: "Failed delete data",
                err_msg: e
            }
        }

        return joResult;
    }
}

module.exports = ProductRepository;

