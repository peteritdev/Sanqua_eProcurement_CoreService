const jwt = require('jsonwebtoken');
const md5 = require('md5');
const crypto = require('crypto');
const moment = require('moment');
const Sequelize = require('sequelize');
const dateFormat = require('dateformat');
const Op = Sequelize.Op;
const bcrypt = require('bcrypt');

const env = process.env.NODE_ENV || 'localhost';
const config = require(__dirname + '/../config/config.json')[env];

// Utility
const Utility = require('peters-globallib-v2');
const _utilInstance = new Utility();

// Repository
const VendorExperienceRepository = require('../repository/vendorexperiencerepository.js');
const _vendorExperienceRepoInstance = new VendorExperienceRepository();

class VendorExperienceService {
	constructor() {}

	async list(pParam) {
		var xJoResult = {};
		var xJoArrData = [];
		var xFlagProcess = true;

		// Decrypt vendor_id
		if (pParam.hasOwnProperty('vendor_id')) {
			if (pParam.vendor_id != '') {
				var xDecId = await _utilInstance.decrypt(pParam.vendor_id, config.cryptoKey.hashKey);
				if (xDecId.status_code == '00') {
					pParam.vendor_id = xDecId.decrypted;
				} else {
					xJoResult = xDecId;
					xFlagProcess = false;
				}
			}
		}

		if (xFlagProcess) {
			var xResultList = await _vendorExperienceRepoInstance.list(pParam);

			if (xResultList.count > 0) {
				var xRows = xResultList.rows;
				for (var index in xRows) {
					xJoArrData.push({
						id: await _utilInstance.encrypt(xRows[index].id.toString(), config.cryptoKey.hashKey),
						name: xRows[index].name,
						type: xRows[index].type,
						location: xRows[index].location,
						month: xRows[index].month,
						year: xRows[index].year
					});
				}
				xJoResult = {
					status_code: '00',
					status_msg: 'OK',
					data: xJoArrData,
					total_record: xResultList.count
				};
			} else {
				xJoResult = {
					status_code: '-99',
					status_msg: 'Data not found'
				};
			}
		}

		return xJoResult;
	}

	async save(pParam) {
		var xJoResult;
		var xAct = pParam.act;
		var xFlagProcess = true;

		delete pParam.act;

		// Decrypt vendor_id
		var xDecId = await _utilInstance.decrypt(pParam.vendor_id, config.cryptoKey.hashKey);
		if (xDecId.status_code == '00') {
			pParam.vendor_id = xDecId.decrypted;
		} else {
			xFlagProcess = false;
			xJoResult = xDecId;
		}

		if (xFlagProcess) {
			if (xAct == 'add') {
				// User Id
				var xDecId = await _utilInstance.decrypt(pParam.user_id, config.cryptoKey.hashKey);
				pParam.created_by = xDecId.decrypted;
				pParam.created_by_name = pParam.user_name;

				var xAddResult = await _vendorExperienceRepoInstance.save(pParam, xAct);
				xJoResult = xAddResult;
			} else if (xAct == 'update') {
				var xDecId = await _utilInstance.decrypt(pParam.id, config.cryptoKey.hashKey);
				if (xDecId.status_code == '00') {
					pParam.id = xDecId.decrypted;
					xDecId = await _utilInstance.decrypt(pParam.user_id, config.cryptoKey.hashKey);
					if (xDecId.status_code == '00') {
						pParam.updated_by = xDecId.decrypted;
						pParam.updated_by_name = pParam.user_name;
					} else {
						xFlagProcess = false;
						xJoResult = xDecId;
					}
				} else {
					xFlagProcess = false;
					xJoResult = xDecId;
				}

				if (xFlagProcess) {
					var xAddResult = await _vendorExperienceRepoInstance.save(pParam, xAct);
					xJoResult = xAddResult;
				}
			}
		}

		return xJoResult;
	}

	async delete(pParam) {
		var xJoResult;
		var xFlagProcess = true;

		var xDecId = await _utilInstance.decrypt(pParam.id, config.cryptoKey.hashKey);
		if (xDecId.status_code == '00') {
			pParam.id = xDecId.decrypted;
			xDecId = await _utilInstance.decrypt(pParam.user_id, config.cryptoKey.hashKey);
			if (xDecId.status_code == '00') {
				pParam.deleted_by = xDecId.decrypted;
				pParam.deleted_by_name = pParam.user_name;
			} else {
				xFlagProcess = false;
				xJoResult = xDecId;
			}
		} else {
			xFlagProcess = false;
			xJoResult = xDecId;
		}

		if (xFlagProcess) {
			var xDeleteResult = await _vendorExperienceRepoInstance.delete(pParam);
			xJoResult = xDeleteResult;
		}

		return xJoResult;
	}
}

module.exports = VendorExperienceService;
