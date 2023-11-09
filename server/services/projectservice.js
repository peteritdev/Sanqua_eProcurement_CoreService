const jwt = require('jsonwebtoken');
const md5 = require('md5');
const crypto = require('crypto');
const moment = require('moment');
const dateFormat = require('dateformat');
const bcrypt = require('bcrypt');
const fs = require('fs');

// Config
const env = process.env.NODE_ENV || 'localhost';
const config = require(__dirname + '/../config/config.json')[env];

//Util
const Utility = require('peters-globallib-v2');
const _utilInstance = new Utility();

const LocalUtility = require('../utils/globalutility.js');
const _globalUtilInstance = new LocalUtility();

// Repository
const Repository = require('../repository/projectrepository.js');
const _repoInstance = new Repository();

const _xClassName = 'ProjectService';

class ProjectService {
	constructor() {}

	async save(pParam) {
		var xJoResult = {};
		var xAct = pParam.act;
		var xJoArrData = [];
		var xDecId = null;
		var xFlagProcess = false;

		try {
			if (pParam.hasOwnProperty('user_id')) {
				if (pParam.user_id != '') {
					xDecId = await _utilInstance.decrypt(pParam.user_id, config.cryptoKey.hashKey);
					if (xDecId.status_code == '00') {
						pParam.user_id = xDecId.decrypted;
						xFlagProcess = true;
						if (pParam.hasOwnProperty('employee_id')) {
							if (pParam.employee_id != '') {
								if (pParam.employee_id.length == 65) {
									xDecId = await _utilInstance.decrypt(pParam.employee_id, config.cryptoKey.hashKey);
									if (xDecId.status_code == '00') {
										pParam.employee_id = xDecId.decrypted;
										xFlagProcess = true;
									} else {
										xJoResult = xDecId;
									}
								} else {
									xFlagProcess = true;
								}
							} else {
								xJoResult = {
									status_code: '-99',
									status_msg: 'Parameter employee_id can not be empty'
								};
							}
						} else {
							xFlagProcess = true;
						}
					} else {
						xJoResult = xDecId;
					}
				} else {
					xJoResult = {
						status_code: '-99',
						status_msg: 'Parameter user_id can not be empty'
					};
				}
			}

			if (xFlagProcess) {
				if (xAct == 'add') {
					if (!pParam.logged_is_admin) {
						pParam.company_id = pParam.logged_company_id;
						pParam.company_name = pParam.logged_company_name;
					}
					let xResult = await _repoInstance.save(pParam, 'add');
					xJoResult = xResult;
				} else if (xAct == 'update') {
					var xDecId = await _utilInstance.decrypt(pParam.id, config.cryptoKey.hashKey);
					if (xDecId.status_code == '00') {
						pParam.id = xDecId.decrypted;
						pParam.updated_by = pParam.user_id;
						pParam.updated_by_name = pParam.user_name;
						xFlagProcess = true;
					} else {
						xJoResult = xDecId;
					}

					if (xFlagProcess) {
						let xResult = await _repoInstance.save(pParam, xAct);
						xJoResult = xResult;
					}
				}
			}
		} catch (e) {
			_utilInstance.writeLog(`${_xClassName}.save`, `Exception error: ${e.message}`, 'error');

			xJoResult = {
				status_code: '-99',
				status_msg: `${_xClassName}.save: Exception error: ${e.message}`
			};
		}

		return xJoResult;
	}

	async list(pParam) {
		var xJoResult = {};
		var xJoArrData = [];
		var xDecId = null;
		var xFlagProccess = false;

		try {
			var xResultList = await _repoInstance.list(pParam);
			if (xResultList) {
				console.log(`>>> xResultList: ${JSON.stringify(xResultList)}`);
				if (xResultList.status_code == '00') {
					var xRows = xResultList.data.rows;
					if (xRows.length > 0) {
						for (var i in xRows) {
							xJoArrData.push({
								id: await _utilInstance.encrypt(xRows[i].id.toString(), config.cryptoKey.hashKey),
								code: xRows[i].code,
								name: xRows[i].name,
								odoo_project_code: xRows[i].odoo_project_code,
								company_id: xRows[i].company_id,
								company_name: xRows[i].company_name,
								employee_id: xRows[i].employee_id,
								employee_name: xRows[i].employee_name,
								description: xRows[i].description,

								status: xRows[i].status,
								created_at: moment(xRows[i].createdAt).format('DD MMM YYYY HH:mm:ss'),
								created_by_name: xRows[i].created_by_name,
								updated_at: moment(xRows[i].updatedAt).format('DD MMM YYYY HH:mm:ss'),
								updated_by_name: xRows[i].updated_by_name
							});
						}

						xJoResult = {
							status_code: '00',
							status_msg: 'OK',
							data: xJoArrData
						};
					} else {
						xJoResult = {
							status_code: '-99',
							status_msg: 'Data not found'
						};
					}
				} else {
					xJoResult = xResultList;
				}
			} else {
				xJoResult = xResultList;
			}
		} catch (e) {
			_utilInstance.writeLog(`${_xClassName}.list`, `Exception error: ${e.message}`, 'error');

			xJoResult = {
				status_code: '-99',
				status_msg: `${_xClassName}.list: Exception error: ${e.message}`
			};
		}

		return xJoResult;
	}

	async detail(pParam) {
		var xJoResult = {};
		var xFlagProcess = false;
		var xDecId = null;
		var xEncId = null;
		var xJoData = {};

		try {
			if (pParam.hasOwnProperty('id')) {
				if (pParam.id != '') {
					xEncId = pParam.id;
					xDecId = await _utilInstance.decrypt(pParam.id, config.cryptoKey.hashKey);
					if (xDecId.status_code == '00') {
						pParam.id = xDecId.decrypted;
						xFlagProcess = true;
					} else {
						xJoResult = xDecId;
					}
				}

				if (xFlagProcess) {
					let xDetail = await _repoInstance.getByParameter(pParam);

					// console.log(`>>> pParam: ${JSON.stringify(xDetail)}`);
					if (xDetail.status_code == '00') {
						xJoData = {
							id: await _utilInstance.encrypt(xDetail.data.id.toString(), config.cryptoKey.hashKey),
							code: xDetail.data.code,
							name: xDetail.data.name,
							odoo_project_code: xDetail.data.odoo_project_code,
							company_id: xDetail.data.company_id,
							company_name: xDetail.data.company_name,
							employee_id: xDetail.data.employee_id,
							employee_name: xDetail.data.employee_name,
							description: xDetail.data.description,
							budget: xDetail.data.budget,

							status: xDetail.data.status,
							created_at: moment(xDetail.data.createdAt).format('DD MMM YYYY HH:mm:ss'),
							created_by_name: xDetail.data.created_by_name,
							updated_at: moment(xDetail.data.updatedAt).format('DD MMM YYYY HH:mm:ss'),
							updated_by_name: xDetail.data.updated_by_name
						};
						xJoResult = {
							status_code: '00',
							status_msg: 'OK',
							data: xJoData
						};
					} else {
						xJoResult = xDetail;
					}
				}
			}
		} catch (e) {
			_utilInstance.writeLog(`${_xClassName}.detail`, `Exception error: ${e.message}`, 'error');

			xJoResult = {
				status_code: '-99',
				status_msg: `${_xClassName}.detail: Exception error: ${e.message}`
			};
		}

		return xJoResult;
	}

	async submit(pParam) {
		var xJoResult = {};
		var xFlagProcess = false;
		var xDecId = null;
		var xEncId = null;
		var xJoData = {};

		try {
			if (pParam.id != '' && pParam.user_id != '') {
				xDecId = await _utilInstance.decrypt(pParam.id, config.cryptoKey.hashKey);
				if (xDecId.status_code == '00') {
					xFlagProcess = true;
					xEncId = pParam.id;
					pParam.id = xDecId.decrypted;
					xClearId = xDecId.decrypted;
					xDecId = await _utilInstance.decrypt(pParam.user_id, config.cryptoKey.hashKey);
					if (xDecId.status_code == '00') {
						pParam.user_id = xDecId.decrypted;
						xFlagProcess = true;
					} else {
						xJoResult = xDecId;
					}
				} else {
					xJoResult = xDecId;
				}
			}

			if (xFlagProcess) {
				var xDetail = await _repoInstance.getByParameter({
					id: pParam.id
				});

				if (xDetail.status_code == '00') {
					pParam.requested_at = await _utilInstance.getCurrDateTime();
					pParam.status = 1;
					var xUpdate = await _repoInstance.save(pParam, 'submit_project');
					xJoResult = xUpdate;
				} else {
					xJoResult = xDetail;
				}
			}
		} catch (e) {
			_utilInstance.writeLog(`${_xClassName}.submit`, `Exception error: ${e.message}`, 'error');

			xJoResult = {
				status_code: '-99',
				status_msg: `${_xClassName}.submit: Exception error: ${e.message}`
			};
		}
	}

	async delete(pParam) {
		var xJoResult;
		var xFlagProcess = false;
		var xEncId = '';

		let xLevel = pParam.logged_user_level.find(
			(el) => el.application.id === config.applicationId || el.application.id === 1
		);

		if (xLevel.is_admin != 1) {
			xJoResult = {
				status_code: '-99',
				status_msg: 'You not allowed to delete this data'
			};
		} else {
			var xDecId = await _utilInstance.decrypt(pParam.id, config.cryptoKey.hashKey);
			if (xDecId.status_code == '00') {
				xEncId = pParam.id;
				pParam.id = xDecId.decrypted;
				xFlagProcess = true;
			} else {
				xJoResult = xDecId;
			}

			if (xFlagProcess) {
				// Next: Will add delete user first on oauth
				xJoResult = await _repoInstance.delete(pParam);
			}
		}

		return xJoResult;
	}
}

module.exports = ProjectService;
