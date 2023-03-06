var env = process.env.NODE_ENV || 'localhost';
var config = require(__dirname + '/../config/config.json')[env];
var Sequelize = require('sequelize');
var sequelize = new Sequelize(config.database, config.username, config.password, config);
const { hash } = require('bcryptjs');
const Op = Sequelize.Op;

// Model
const _modelDb = require('../models').tr_purchaserequestdetails;

const Utility = require('peters-globallib-v2');
const _utilInstance = new Utility();

class PurchaseRequestDetailRepository {
	constructor() {}

	async save(pParam, pAct) {
		let xTransaction;
		var xJoResult;

		try {
			var xSaved = null;
			xTransaction = await sequelize.transaction();

			if (pAct == 'add') {
				pParam.status = 0;
				pParam.is_delete = 0;
				pParam.created_by = pParam.user_id;
				pParam.created_by_name = pParam.user_name;

				xSaved = await _modelDb.create(pParam, { transaction: xTransaction });

				if (xSaved.id != null) {
					xJoResult = {
						status_code: '00',
						status_msg: 'Data has been successfully saved',
						created_id: await _utilInstance.encrypt(xSaved.id, config.cryptoKey.hashKey)
						// clear_id: xSaved.id,
					};

					await xTransaction.commit();
				} else {
					if (xTransaction) await xTransaction.rollback();

					xJoResult = {
						status_code: '-99',
						status_msg: 'Failed save to database'
					};
				}
			} else if (pAct == 'update') {
				pParam.updatedAt = await _utilInstance.getCurrDateTime();
				var xId = pParam.id;
				delete pParam.id;
				var xWhere = {
					where: {
						id: xId
					},
					transaction: xTransaction
				};

				pParam.updated_by = pParam.user_id;
				pParam.updated_by_name = pParam.user_name;

				xSaved = await _modelDb.update(pParam, xWhere);

				await xTransaction.commit();

				xJoResult = {
					status_code: '00',
					status_msg: 'Data has been successfully updated'
				};
			} else if (pAct == 'update_by_product_code') {
				pParam.updatedAt = await _utilInstance.getCurrDateTime();
				var xProductCode = pParam.product_code;
				delete pParam.product_code;
				var xWhere = {
					where: {
						product_code: xProductCode
					},
					transaction: xTransaction
				};

				pParam.updated_by = pParam.user_id;
				pParam.updated_by_name = pParam.user_name;

				xSaved = await _modelDb.update(pParam, xWhere);

				await xTransaction.commit();

				xJoResult = {
					status_code: '00',
					status_msg: 'Data has been successfully updated'
				};
			} else if (pAct == 'update_by_pr_no') {
				pParam.updatedAt = await _utilInstance.getCurrDateTime();
				var xPRNo = pParam.pr_no;
				delete pParam.pr_no;
				var xWhere = {
					where: {
						pr_no: xPRNo
					},
					transaction: xTransaction
				};

				xSaved = await _modelDb.update(pParam, xWhere);

				await xTransaction.commit();

				xJoResult = {
					status_code: '00',
					status_msg: 'Data has been successfully updated'
				};
			} else if (pAct == 'update_by_product_code_and_request_id') {
				pParam.updatedAt = await _utilInstance.getCurrDateTime();
				var xProductCode = pParam.product_code;
				var xRequestId = pParam.request_id;
				delete pParam.product_code;
				delete pParam.request_id;
				var xWhere = {
					where: {
						product_code: xProductCode,
						request_id: xRequestId
					},
					transaction: xTransaction
				};

				pParam.updated_by = pParam.user_id;
				pParam.updated_by_name = pParam.user_name;

				xSaved = await _modelDb.update(pParam, xWhere);

				await xTransaction.commit();

				xJoResult = {
					status_code: '00',
					status_msg: 'Data has been successfully updated'
				};
			}
		} catch (e) {
			if (xTransaction) await xTransaction.rollback();
			xJoResult = {
				status_code: '-99',
				status_msg: 'Failed save or update data. Error : ' + e,
				err_msg: e
			};
		}

		return xJoResult;
	}

	async delete(pParam) {
		let xTransaction;
		var xJoResult = {};

		try {
			var xSaved = null;
			xTransaction = await sequelize.transaction();

			xSaved = await _modelDb.destroy(
				{
					where: {
						id: pParam.id
					}
				},
				{ xTransaction }
			);

			await xTransaction.commit();

			xJoResult = {
				status_code: '00',
				status_msg: 'Data has been successfully deleted'
			};

			return xJoResult;
		} catch (e) {
			if (xTransaction) await xTransaction.rollback();
			xJoResult = {
				status_code: '-99',
				status_msg: 'Failed save or update data',
				err_msg: e
			};

			return xJoResult;
		}
	}

	async getByProductIdVendorId(pParam) {
		var xData = {};
		var xInclude = [];
		var xWhere = {};
		var xWhereAnd = [],
			xWhereOr = [];

		var xData = await _modelDb.findOne({
			where: {
				product_id: pParam.product_id,
				vendor_id: pParam.vendor_id
			},
			include: xInclude
		});

		return xData;
	}

	async getByParam(pParam) {
		var xInclude = [];
		var xWhereOr = [];
		var xWhereAnd = [];
		var xWhere = [];
		var xAttributes = [];
		var xJoResult = {};

		try {
			xInclude = [];

			if (pParam.hasOwnProperty('id')) {
				if (pParam.id != '') {
					xWhereAnd.push({
						id: pParam.id
					});
				}
			}

			if (pParam.hasOwnProperty('request_id')) {
				if (pParam.request_id != '') {
					xWhereAnd.push({
						request_id: pParam.request_id
					});
				}
			}

			if (pParam.hasOwnProperty('product_code')) {
				if (pParam.product_code != '') {
					xWhereAnd.push({
						product_code: pParam.product_code
					});
				}
			}

			if (pParam.hasOwnProperty('status')) {
				if (pParam.status != null && pParam.status != '') {
					xWhereAnd.push({
						status: {
							[Op.in]: pParam.status
						}
					});
				}
			}

			if (pParam.hasOwnProperty('pr_no')) {
				if (typeof pParam.pr_no === 'boolean') {
					if (pParam.pr_no) {
						xWhereAnd.push({
							pr_no: {
								[Op.ne]: null
							}
						});
					} else {
						xWhereAnd.push({
							pr_no: {
								[Op.eq]: null
							}
						});
					}
				} else {
					if (pParam.pr_no != '') {
						xWhereAnd.push({
							pr_no: pParam.pr_no
						});
					}
				}
			}

			if (xWhereAnd.length > 0) {
				xWhere.push({
					[Op.and]: xWhereAnd
				});
			}

			var xData = await _modelDb.findOne({
				where: xWhere,
				include: xInclude,
				subQuery: false
			});

			if (xData) {
				xJoResult = {
					status_code: '00',
					status_msg: 'OK',
					data: xData
				};
			} else {
				xJoResult = {
					status_code: '-99',
					status_msg: 'Data not found'
				};
			}
		} catch (e) {
			_utilInstance.writeLog(`${_xClassName}.getById`, `Exception error: ${e.message}`, 'error');
			xJoResult = {
				status_code: '-99',
				status_msg: `Failed get data. Error : ${e.message}`
			};
		}

		return xJoResult;
	}
}

module.exports = PurchaseRequestDetailRepository;
