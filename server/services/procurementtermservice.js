const jwt = require('jsonwebtoken');
const md5 = require('md5');
const crypto = require('crypto');
const moment = require('moment');
const Sequelize = require('sequelize');
const dateFormat = require('dateformat');
const Op = Sequelize.Op;
const bcrypt = require('bcrypt');
const fs = require('fs');

const env = process.env.NODE_ENV || 'localhost';
const config = require(__dirname + '/../config/config.json')[env];

// Utility
const Utility = require('peters-globallib-v2');
const _utilInstance = new Utility();

const GlobalUtility = require('../utils/globalutility.js');
const _globalUtilInstance = new GlobalUtility();

// Repository
const ProcurementTermRepository = require('../repository/procurementtermrepository.js');
const _repoInstance = new ProcurementTermRepository();

const ProcurementRepository = require('../repository/procurementrepository.js');
const _procurementRepoInstance = new ProcurementRepository();

// OAuth Service
const OAuthService = require('../services/oauthservice.js');
const _oAuthService = new OAuthService();

class ProcurementTermService {
	constructor() {}

	async list(pParam) {
		var xJoResult = {};
		var xJoArrData = [];
		var xFlagProcess = false;

		if (pParam.hasOwnProperty('procurement_id')) {
			if (pParam.procurement_id != '') {
				var xDecId = await _utilInstance.decrypt(pParam.procurement_id, config.cryptoKey.hashKey);
				if (xDecId.status_code == '00') {
					pParam.procurement_id = xDecId.decrypted;
					xFlagProcess = true;
				} else {
					xJoResult = xDecId;
				}
			}
		}

		if (xFlagProcess) {
			var xResultList = await _repoInstance.list(pParam);

			if (xResultList.count > 0) {
				var xRows = xResultList.rows;
				for (var index in xRows) {
					xJoArrData.push({
						id: await _utilInstance.encrypt(xRows[index].id.toString(), config.cryptoKey.hashKey),
						term: xRows[index].term,
						description: xRows[index].description,

						created_at: moment(xRows[index].createdAt).format('YYYY-MM-DD hh:mm:ss'),
						created_by_name: xRows[index].created_by_name
					});
				}
				xJoResult = {
					status_code: '00',
					status_msg: 'OK',
					total_record: xResultList.count,
					data: xJoArrData
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

	async getById(pParam) {
		var xJoResult = {};
		var xJoData = {};
		var xFlagProcess = true;
		var xEncId = '';

		if (pParam.hasOwnProperty('id')) {
			if (pParam.id != '') {
				xEncId = pParam.id;
				var xDecId = await _utilInstance.decrypt(pParam.id, config.cryptoKey.hashKey);
				if (xDecId.status_code == '00') {
					pParam.id = xDecId.decrypted;
				} else {
					xFlagProcess = false;
					xJoResult = xDecId;
				}
			}
		}

		if (xFlagProcess) {
			var xResult = await _repoInstance.getById(pParam);

			if (xResult != null) {
				xJoData = {
					id: await _utilInstance.encrypt(xResult.id.toString(), config.cryptoKey.hashKey),
					term: xResult.term,
					description: xResult.description,

					created_at: moment(xResult.createdAt).format('YYYY-mm-dd H:i:s'),
					created_by_name: xResult.created_by_name
				};

				xJoResult = {
					status_code: '00',
					status_msg: 'OK',
					data: xJoData
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

		if (xFlagProcess) {
			if (xAct == 'add') {
				// Procurement Id
				var xDecId = await _utilInstance.decrypt(pParam.procurement_id, config.cryptoKey.hashKey);
				if (xDecId.status_code == '00') {
					pParam.procurement_id = xDecId.decrypted;
					// User Id
					xDecId = await _utilInstance.decrypt(pParam.user_id, config.cryptoKey.hashKey);
					if (xDecId.status_code == '00') {
						pParam.created_by = xDecId.decrypted;
						pParam.created_by_name = pParam.user_name;
					} else {
						xFlagProcess = false;
						xJoResult = xDecId;
					}
				} else {
					xFlagProcess = false;
					xJoResult = xDecId;
				}

				var xProcurementDetail = await _procurementRepoInstance.getById({ id: pParam.procurement_id });
				if (xProcurementDetail != null) {
					if (xProcurementDetail.status_approval == 0) {
						var xAddResult = await _repoInstance.save(pParam, xAct);
						xJoResult = xAddResult;
					} else {
						xJoResult = {
							status_code: '-99',
							status_msg: 'You can not add new item when procurement has been submited or approved'
						};
					}
				} else {
					xJoResult = {
						status_code: '-99',
						status_msg: 'The ID that supplied not exist.'
					};
				}
			} else if (xAct == 'update') {
				var xDecId = await _utilInstance.decrypt(pParam.id, config.cryptoKey.hashKey);
				if (xDecId.status_code == '00') {
					pParam.id = xDecId.decrypted;
					xDecId = await _utilInstance.decrypt(pParam.user_id, config.cryptoKey.hashKey);
					if (xDecId.status_code == '00') {
						pParam.updated_by = xDecId.decrypted;
						pParam.updated_by_name = pParam.user_name;
						xDecId = await _utilInstance.decrypt(pParam.procurement_id, config.cryptoKey.hashKey);
						if (xDecId.status_code == '00') {
							pParam.procurement_id = xDecId.decrypted;
						} else {
							xFlagProcess = false;
							xJoResult = xDecId;
						}
					} else {
						xFlagProcess = false;
						xJoResult = xDecId;
					}
				} else {
					xFlagProcess = false;
					xJoResult = xDecId;
				}

				if (xFlagProcess) {
					var xProcurementDetail = await _procurementRepoInstance.getById({ id: pParam.procurement_id });
					if (xProcurementDetail != null) {
						if (xProcurementDetail.status_approval == 0) {
							var xAddResult = await _repoInstance.save(pParam, xAct);
							xJoResult = xAddResult;
						} else {
							xJoResult = {
								status_code: '-99',
								status_msg: 'You can not update item when procurement has been submited or approved'
							};
						}
					} else {
						xJoResult = {
							status_code: '-99',
							status_msg: 'The Procurement ID that supplied not exist.'
						};
					}
				}
			}
		}

		return xJoResult;
	}

	async archive(pParam) {
		var xJoResult;
		var xFlagProcess = true;

		var xDecId = await _utilInstance.decrypt(pParam.id, config.cryptoKey.hashKey);
		if (xDecId.status_code == '00') {
			pParam.id = xDecId.decrypted;
			xDecId = await _utilInstance.decrypt(pParam.user_id, config.cryptoKey.hashKey);
			if (xDecId.status_code == '00') {
				pParam.is_delete = 1;
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
			var xDeleteResult = await _repoInstance.archive(pParam);
			xJoResult = xDeleteResult;
		}

		return xJoResult;
	}

	async unarchive(pParam) {
		var xJoResult;
		var xFlagProcess = true;

		var xDecId = await _utilInstance.decrypt(pParam.id, config.cryptoKey.hashKey);
		if (xDecId.status_code == '00') {
			pParam.id = xDecId.decrypted;
			xDecId = await _utilInstance.decrypt(pParam.user_id, config.cryptoKey.hashKey);
			if (xDecId.status_code == '00') {
				pParam.is_delete = 0;
				// pParam.deleted_by = xDecId.decrypted;
				// pParam.deleted_by_name = pParam.user_name;
			} else {
				xFlagProcess = false;
				xJoResult = xDecId;
			}
		} else {
			xFlagProcess = false;
			xJoResult = xDecId;
		}

		if (xFlagProcess) {
			var xDeleteResult = await _repoInstance.archive(pParam);
			xJoResult = xDeleteResult;
		}

		return xJoResult;
	}

	async delete(pParam) {
		var xJoResult;
		var xFlagProcess = true;

		var xDecId = await _utilInstance.decrypt(pParam.id, config.cryptoKey.hashKey);
		if (xDecId.status_code == '00') {
			pParam.id = xDecId.decrypted;
		} else {
			xFlagProcess = false;
			xJoResult = xDecId;
		}

		if (xFlagProcess) {
			// Check first if there are procurement item or not

			var xDeleteResult = await _repoInstance.delete(pParam);
			xJoResult = xDeleteResult;
		}

		return xJoResult;
	}
}

module.exports = ProcurementTermService;
