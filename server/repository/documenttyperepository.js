var env = process.env.NODE_ENV || 'development';
var configEnv = require(__dirname + '/../config/config.json')[env];
var Sequelize = require('sequelize');
var sequelize = new Sequelize(configEnv.database, configEnv.username, configEnv.password, configEnv);
const { hash } = require('bcryptjs');
const Op = sequelize.Op;

//Model
const modelDb = require('../models').ms_documenttypes;

const Utility = require('../utils/globalutility.js');
const utilInstance = new Utility();

class DocumentTypeRepository{
    constructor(){}

    async list( param ){

        var data = await modelDb.findAndCountAll({
            where: {
                [Op.or]:[
                    {
                        name:{
                            [Op.like]: '%' + param.keyword + '%'
                        }
                    }
                ],
                [Op.and]:[
                    {
                        is_delete: 0
                    }
                ]

            },
            limit: param.limit,
            offset: param.offset
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

    async save(param){
        let transaction;
        var joResult = {};

        try{

            var saved = null;
            transaction = await sequelize.transaction(); 

            if( param.act == "add" ){
                saved = await modelDb.create({
                    name: param.name,
                    is_mandatory: param.is_mandatory,
                    created_by: param.user_id,
                    is_delete: 0
                },{transaction});
    
                await transaction.commit();
    
                joResult = {
                    status_code: "00",
                    status_msg: "Data has been successfully saved",
                    created_id: saved.id
                }
            }else if( param.act == "update" ){

                saved = await modelDb.update({
                    name: param.name,
                    is_mandatory: param.is_mandatory,
                    updated_by: param.user_id
                },{
                    where: {
                        id: param.id
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

    async delete( param ){
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
                deleted_by: param.user_id,
                deleted_at: await utilInstance.getCurrDateTime()
            },{
                where: {
                    id: param.id
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

module.exports = DocumentTypeRepository;

