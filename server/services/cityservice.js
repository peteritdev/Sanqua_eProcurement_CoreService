const jwt = require('jsonwebtoken');
const md5 = require('md5');
const crypto = require('crypto');
const moment = require('moment');
const sequelize = require('sequelize');
const dateFormat = require('dateformat');
const Op = Sequelize.Op;
const bcrypt = require('bcrypt');

const env = process.env.NODE_ENV || 'localhost';
const config = require(__dirname + '/../config/config.json')[env];

// Utility
const Util = require('../utils/globalutility.js');
const _utilInstance = new Util();

// Repository
const CityRepository = require('../repository/cityrepository.js');
const _cityRepoInstance = new CityRepository();

class CityService {
	constructor() {}

	async dropDownList(pParam) {
		var xJoResult = {};
		var xJoArrData = [];
		var xFlagProcess = true;

		if (xFlagProcess) {
			var xResultList = await _cityRepoInstance.list(pParam);

			if (xResultList.count > 0) {
				xJoResult.status_code = '00';
				xJoResult.status_msg = 'OK';

				var xRows = xResultList.rows;

				for (var index in xRows) {
					xJoArrData.push({
						id: xRows[index].id,
						name: xRows[index].name
					});
				}

				xJoResult.data = xJoArrData;
			} else {
				xJoResult.status_code = '00';
				xJoResult.status_msg = 'OK';
				xJoResult.data = xJoArrData;
			}
		}

		return xJoResult;
	}
}

module.exports = CityService;
