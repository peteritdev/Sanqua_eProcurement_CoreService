var env = process.env.NODE_ENV || 'development';
var configEnv = require(__dirname + '/../config/config.json')[env];
var Sequelize = require('sequelize');
var sequelize = new Sequelize(configEnv.database, configEnv.username, configEnv.password, configEnv);
const { hash } = require('bcryptjs');
const Op = sequelize.Op;

//Model
const _modelDb = require('../models').ms_classifications;
const _modelSubClassification = require('../models').ms_subclassifications;

const Utility = require('../utils/globalutility.js');
const utilInstance = new Utility();

class BusinessEntityRepository {
    constructor(){}

    async list( pParam ){

        var xOrder = ['name', 'ASC'];
        var xWhere = [{
            is_delete: 0
        }];

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

        try{
            var xData = await _modelDb.findAndCountAll({
                where: {
                    [Op.and]:xWhere
    
                },
                include: xJoinedTable,
                limit: pParam.limit,
                offset: pParam.offset,
                order: [
                    xOrder
                ]
            });
        }catch(e){
            console.log(e);
        }

        return xData;
    } 
}

module.exports = BusinessEntityRepository;