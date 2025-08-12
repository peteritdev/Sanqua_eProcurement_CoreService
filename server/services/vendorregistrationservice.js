const jwt = require('jsonwebtoken');
const md5 = require('md5');
const crypto = require('crypto');
const moment = require('moment');
const dateFormat = require('dateformat');
const bcrypt = require('bcrypt');
const fs = require('fs');
const dateTime = require('node-datetime');

// Config
const env = process.env.NODE_ENV || 'localhost';
const config = require(__dirname + '/../config/config.json')[env];

// Util
const Utility = require('peters-globallib-v2');
const _utilInstance = new Utility();

const LocalUtility = require('../utils/globalutility.js');
const _globalUtilInstance = new LocalUtility();

// Repository
const Repository = require('../repository/vendorregistrationrepository.js');
const _repoInstance = new Repository();

const _xClassName = 'VendorRegistrationService';

class VendorRegistrationService {
	constructor() {}
    async list(pParam) {
		let xJoResult = {};
		let xJoArrData = [];

		try {
			const xResultList = await _repoInstance.list(pParam);

			if (xResultList.status_code === '00') {
				const xRows = xResultList.data.rows;
				if (xRows.length > 0) {
					for (const row of xRows) {
						xJoArrData.push({
							id: await _utilInstance.encrypt(row.id.toString(), config.cryptoKey.hashKey),
							name: row.name,
							email: row.email,
							phone_number: row.phone_number,
							website: row.website,
							address: row.address,
							province_id: row.province_id,
							province_name: row.province && row.province.name ? row.province.name : null,
							city_id: row.city_id,
							city_name: row.city && row.city.name ? row.city.name : null,
							classification_id: row.classification_id,
							classification_name: row.classification && row.classification.name ? row.classification.name : null,
							sub_classification_id: row.sub_classification_id,
							sub_classification_name: row.sub_classification && row.sub_classification.name ? row.sub_classification.name : null,
							business_entity: row.business_entity,
                            status: {
                                id: row.status,
                                name: config.statusDescription.vendorRegistration[row.status]
                            },
							created_at: moment(row.createdAt).format('DD MMM YYYY HH:mm:ss'),
							updated_at: moment(row.updatedAt).format('DD MMM YYYY HH:mm:ss'),
							created_by_company_id: row.created_by_company_id,
							created_by_company_name: row.created_by_company_name,
							created_by: row.created_by,
							created_by_name: row.created_by_name,
							request_no: row.request_no
						});
					}

					xJoResult = {
						status_code: '00',
						status_msg: 'OK',
						data: xJoArrData,
						total_record: xResultList.total_record
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
		} catch (e) {
			_utilInstance.writeLog(`${_xClassName}.list`, `Exception error: ${e.message}`, 'error');
			xJoResult = {
				status_code: '-99',
				status_msg: `${_xClassName}.list: Exception error: ${e.message}`
			};
		}

		return xJoResult;
	}

    async save(pParam) {
		let xJoResult = {};
		let xDecId;
		let xFlagProcess = false;

		try {
			if (pParam.user_id) {
				xDecId = await _utilInstance.decrypt(pParam.user_id, config.cryptoKey.hashKey);
				if (xDecId.status_code === '00') {
					pParam.user_id = xDecId.decrypted;
					xFlagProcess = true;
				} else {
					return xJoResult = xDecId;
				}
			} else {
				return xJoResult = {
					status_code: '-99',
					status_msg: 'Parameter user_id cannot be empty'
				};
			}

			if (xFlagProcess) {
				if (pParam.act === 'add') {
					const xSave = await _repoInstance.save(pParam, 'add');
					xJoResult = xSave;
					if (xSave.status_code == '00' && xSave.created_id != '' && xSave.clear_id != '') {
						// Generate Document No
						var dt = dateTime.create();
						var xDate = dt.format('ym');
						var xDocNo = `${pParam.logged_company_alias}/VREG/${xDate}/` + xSave.clear_id.padStart(5, '0');
						var xParamUpdate = {
							request_no: xDocNo,
							id: xSave.clear_id
						};

						var xUpdate = await _repoInstance.save(xParamUpdate, 'update');
						if (xUpdate.status_code == '00') {
							xJoResult = xSave;
						} else {
							xJoResult = xUpdate;
						}
					} else {
						xJoResult = xSave;
					}
				} else if (pParam.act === 'update') {
					const xDecId = await _utilInstance.decrypt(pParam.id, config.cryptoKey.hashKey);
					if (xDecId.status_code === '00') {
						pParam.id = xDecId.decrypted;
						pParam.updated_by = pParam.user_id;
						pParam.updated_by_name = pParam.user_name;
						xJoResult = await _repoInstance.save(pParam, 'update');
					} else {
						xJoResult = xDecId;
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

	async detail(pParam) {
		let xJoResult = {};
		let xFlagProcess = false;

		try {
			if (pParam.id) {
				const xDecId = await _utilInstance.decrypt(pParam.id, config.cryptoKey.hashKey);
				if (xDecId.status_code === '00') {
					pParam.id = xDecId.decrypted;
					xFlagProcess = true;
				} else {
					return xJoResult = xDecId;
				}
			}

			if (xFlagProcess) {
				const xData = await _repoInstance.getById(pParam);

				if (xData.status_code == '00') {
					const xDetail = xData.data
					xDetail.id = await _utilInstance.encrypt(xDetail.id.toString(), config.cryptoKey.hashKey)
					xDetail.status = {
						id: xDetail.status,
						name: config.statusDescription.vendorRegistration[xDetail.status]
					}
					
					console.log(`>>> xData 2: ${JSON.stringify(xData)}`);
					const xDocumentFile = xDetail.vendor_document;
					console.log(`>>> xData 3`);
					if (xDocumentFile != null) {
						for (let i = 0; i < xDocumentFile.length; i++) {
							if (xDocumentFile[i].file != null) {
								xDetail.vendor_document[i].file = `${config.imagePathESanQua}/eprocurement/vendor-regist/${xDocumentFile[i].file}`
							}
						}
					}

					xJoResult = {
						status_code: '00',
						status_msg: 'OK',
						data: xDetail
					};
				} else {
					xJoResult = {
						status_code: '-99',
						status_msg: 'Data not found'
					};
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

	async delete(pParam) {
		let xJoResult = {};
		try {
			const xDecId = await _utilInstance.decrypt(pParam.id, config.cryptoKey.hashKey);
			if (xDecId.status_code !== '00') return xDecId;
			pParam.id = xDecId.decrypted;

			const xData = await _repoInstance.getById({ id: pParam.id });
			if (!xData) {
				return { status_code: '-99', status_msg: 'Data not found' };
			}

			if (xData.created_by !== pParam.user_id) {
				return { status_code: '-99', status_msg: 'Only creator can delete this data' };
			}
			// delete all foto / file inside this data before delete
			xJoResult = await _repoInstance.deletePermanent(pParam);
		} catch (e) {
			_utilInstance.writeLog(`${_xClassName}.delete`, `Exception error: ${e.message}`, 'error');
			xJoResult = {
				status_code: '-99',
				status_msg: `${_xClassName}.delete: Exception error: ${e.message}`
			};
		}
		return xJoResult;
	}

	async submit(pParam) {
		return this._changeStatus(pParam, 1, 'submit', {
			from: [0],
			onlyCreator: true
		});
	}

	async take(pParam) {
		return this._changeStatus(pParam, 2, 'take', {
			from: [1]
		});
	}

	async done(pParam) {
		return this._changeStatus(pParam, 3, 'done', {
			from: [2]
		});
	}

	async cancel(pParam) {
		return this._changeStatus(pParam, 4, 'cancel', {
			notFrom: [3]
		});
	}

	async setDraft(pParam) {
		return this._changeStatus(pParam, 0, 'setDraft', {
			from: [4]
		});
	}

	async _changeStatus(pParam, newStatus, actionName, opts = {}) {
		let xJoResult = {};
		try {
			const decId = await _utilInstance.decrypt(pParam.id, config.cryptoKey.hashKey);
			if (decId.status_code !== '00') return decId;
			pParam.id = decId.decrypted;

			const decUser = await _utilInstance.decrypt(pParam.user_id, config.cryptoKey.hashKey);
			if (decUser.status_code !== '00') return decUser;
			pParam.user_id = decUser.decrypted;

			const xData = await _repoInstance.getById({ id: pParam.id });
			if (xData.status_code != '00') {
				return xData
			}

			const currentStatus = xData.data.status;
			if (currentStatus === newStatus) {
				return {
					status_code: '-99',
					status_msg: `Data already in status: ${actionName}`
				};
			}

			if (opts.from && !opts.from.includes(currentStatus)) {
				return {
					status_code: '-99',
					status_msg: `Tidak dapat ${actionName}, statu harus di saat: ${opts.from.join(', ')}`
				};
			}

			if (opts.notFrom && opts.notFrom.includes(currentStatus)) {
				return {
					status_code: '-99',
					status_msg: `Tidak dapat ${actionName} dari status ini`
				};
			}

			console.log(`>>> pParam.logged_is_admin: ${JSON.stringify(pParam.logged_is_admin)}`);
			if (!pParam.logged_is_admin) {
				if (opts.onlyCreator && xData.created_by !== pParam.user_id) {
					return {
						status_code: '-99',
						status_msg: `Hanya admin / pembuat dokumen yang bisa ${actionName}`
					};
				}
			}

			const upd = {
				status: newStatus,
				updated_by: pParam.user_id,
				updated_by_name: pParam.user_name,
				updatedAt: await _utilInstance.getCurrDateTime()
			};

			await _repoInstance.save({ id: pParam.id, ...upd }, 'update');

			xJoResult = {
				status_code: '00',
				status_msg: `Successfully ${actionName}`
			};
		} catch (e) {
			_utilInstance.writeLog(`${_xClassName}.${actionName}`, `Exception error: ${e.message}`, 'error');
			xJoResult = {
				status_code: '-99',
				status_msg: `${_xClassName}.${actionName}: Exception error: ${e.message}`
			};
		}
		return xJoResult;
	}
}

module.exports = VendorRegistrationService;
