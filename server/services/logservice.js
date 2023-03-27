const jwt = require('jsonwebtoken');
const md5 = require('md5');
const crypto = require('crypto');
const moment = require('moment');
const sequelize = require('sequelize');
const dateFormat = require('dateformat');
const Op = sequelize.Op;
const bcrypt = require('bcrypt');

const env = process.env.NODE_ENV || 'localhost';
const config = require(__dirname + '/../config/config.json')[env];

// Utility
const Util = require('peters-globallib-v2');
const { default: Axios } = require('axios');
const _utilInstance = new Util();

class LogService {
	constructor() {}

	// Log FPB
	async addLog(pMethod, pToken, pParam) {
		var xAPIUrl = `${config.api.logging.url}/fpb/save`;
		var xHeader = {
			headers: {
				'x-method': pMethod,
				'x-token': pToken
			}
		};
		var xResult = await _utilInstance.axiosRequestPost(xAPIUrl, 'POST', pParam, xHeader);
		return xResult;
	}
}

module.exports = LogService;
