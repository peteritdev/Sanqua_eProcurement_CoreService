var env = process.env.NODE_ENV || 'localhost';
var config = require(__dirname + '/../config/config.json')[env];
var Sequelize = require('sequelize');
var sequelize = new Sequelize(config.database, config.username, config.password, config);
const { hash } = require('bcryptjs');
const Op = sequelize.Op;

// Model
const _modelDb = require('../models').ms_cities;

const Utility = require('../utils/globalutility.js');
const utilInstance = new Utility();

class CityRepository {
    constructor(){}

    async list(pParam){
        var xOrder = ['name', 'ASC'];
        var xWhere = [{
            is_delete: 0
        }];

        var xData = await _modelDb.findAndCountAll({
            where: {
                [Op.and]:xWhere

            },
            /*include:[
                xJoinedTable,
            ],*/
            limit: pParam.limit,
            offset: pParam.offset,
            order: [
                xOrder
            ]
        });

        return xData;
    }
}

module.exports = CityRepository;