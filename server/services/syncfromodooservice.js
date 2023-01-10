const jwt = require('jsonwebtoken');
const md5 = require('md5');
const crypto = require('crypto');
const moment = require('moment');
const sequelize = require('sequelize');
const dateFormat = require('dateformat');
const Op = sequelize.Op;
const bcrypt = require('bcrypt');
const fs = require('fs');

const env = process.env.NODE_ENV || 'localhost';
const config = require(__dirname + '/../config/config.json')[env];

// Utility
const Utility = require('peters-globallib-v2');
const _utilInstance = new Utility();

// Repository
const PurchaseRequestDetailRepository = require('../repository/purchaserequestdetailrepository.js');
const _prDetailInstance = new PurchaseRequestDetailRepository();

// Repository
const PurchaseRequestRepository = require('../repository/purchaserequestrepository.js');
const _prInstance = new PurchaseRequestRepository();

class SyncFromOdooService {
	constructor() {}

	async updateStatusPR(pParam) {
		var xJoResult = {};

		return xJoResult;
	}
}

module.exports = SyncFromOdooService;
