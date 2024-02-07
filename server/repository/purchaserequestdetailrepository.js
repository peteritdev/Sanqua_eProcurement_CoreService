var env = process.env.NODE_ENV || 'localhost';
var config = require(__dirname + '/../config/config.json')[env];
var Sequelize = require('sequelize');
var sequelize = new Sequelize(config.database, config.username, config.password, config);
const { hash } = require('bcryptjs');
const Op = Sequelize.Op;

// Model
const _modelDb = require('../models').tr_purchaserequestdetails;
const _modelPurchaseRequest = require('../models').tr_purchaserequests;

const Utility = require('peters-globallib-v2');
const _utilInstance = new Utility();

const _xClassName = 'PurchaseRequestDetailRepository';

class PurchaseRequestDetailRepository {
	constructor() {}

	async list(pParam) {
		var xOrder = [ 'product_name', 'ASC' ];
		var xWhere = [];
		var xWhereOr = [];
		var xWhereAnd = [];
		var xInclude = [];
		var xJoResult = {};

		try {
			xInclude = [];

			if (pParam.hasOwnProperty('filter')) {
				if (pParam.filter != null && pParam.filter != undefined && pParam.filter != '') {
					var xFilter = JSON.parse(pParam.filter);
					if (xFilter.length > 0) {
						for (var index in xFilter) {
							xWhereAnd.push(xFilter[index]);
						}
					}
				}
			}

			if (pParam.hasOwnProperty('keyword')) {
				if (pParam.keyword != '') {
					xWhereOr.push(
						{
							product_name: {
								[Op.iLike]: '%' + pParam.keyword + '%'
							}
						},
						{
							description: {
								[Op.iLike]: '%' + pParam.keyword + '%'
							}
						},
						{
							vendor_code: {
								[Op.iLike]: '%' + pParam.keyword + '%'
							}
						},
						{
							vendor_name: {
								[Op.iLike]: '%' + pParam.keyword + '%'
							}
						}
					);
				}
			}

			if (xWhereAnd.length > 0) {
				xWhere.push({
					[Op.and]: xWhereAnd
				});
			}

			if (pParam.hasOwnProperty('order_by')) {
				if (pParam.order_by != '') {
					xOrder = [ pParam.order_by, pParam.order_type == 'desc' ? 'DESC' : 'ASC' ];
				}
			}

			if (xWhereOr.length > 0) {
				xWhere.push({
					[Op.or]: xWhereOr
				});
			}

			var xParamQuery = {
				where: xWhere,
				order: [ xOrder ],
				include: xInclude,
				subQuery: false
			};

			var xCountDataWithoutLimit = await _modelDb.count(xParamQuery);

			if (pParam.hasOwnProperty('offset') && pParam.hasOwnProperty('limit')) {
				if (pParam.offset != '' && pParam.limit != '' && pParam.limit != 'all') {
					xParamQuery.offset = pParam.offset;
					xParamQuery.limit = pParam.limit;
				}
			}

			var xData = await _modelDb.findAndCountAll(xParamQuery);

			// console.log(`>>> xData: ${JSON.stringify(xData)}`);

			xJoResult = {
				status_code: '00',
				status_msg: 'OK',
				data: xData,
				total_record: xCountDataWithoutLimit
			};
		} catch (e) {
			_utilInstance.writeLog(`${_xClassName}.list`, `Exception error: ${e.message}`, 'error');
			xJoResult = {
				status_code: '-99',
				status_msg: `${_xClassName}.list: Exception error: ${e.message}`
			};
		}

		return xJoResult;
	}

	async save(pParam, pAct) {
		let xTransaction;
		var xJoResult;

		try {
			var xSaved = null;
			var xSql = "";
			var xSqlErrMsg = ""
			var xFlag = false
			xTransaction = await sequelize.transaction();

			xSql = `SELECT calc_rab_item_remain_qty('{
				"pAct": "${pAct}",
				"purchase_request_detail" : ${JSON.stringify(pParam)}
			}'::json)`;

			if (pAct == 'add') {
				pParam.status = 0;
				pParam.is_delete = 0;
				pParam.created_by = pParam.user_id;
				pParam.created_by_name = pParam.user_name;

				var xDtQuery = await sequelize.query(xSql, {
					type: sequelize.QueryTypes.SELECT,
				});
				
				if (xDtQuery.length > 0) {
					if (xDtQuery[0].calc_rab_item_remain_qty.status_code == "00") {
						xFlag = true
					} else {
					//   xJoResult = xDtQuery[0].calc_rab_item_remain_qty;
						xFlag = false
						xSqlErrMsg = `, ${xDtQuery[0].calc_rab_item_remain_qty.status_msg}`
					}
				} else {
					xFlag = false
				}

				if (xFlag) {
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
				} else {
					if (xTransaction) await xTransaction.rollback();

					xJoResult = {
						status_code: '-99',
						status_msg: `Failed save to database ${xSqlErrMsg}`
					};
				}
			} else if (pAct == 'update') {
				var xFlag = false
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
				
				var xDtQuery = await sequelize.query(xSql, {
					type: sequelize.QueryTypes.SELECT,
				});

				
				if (xDtQuery.length > 0) {
					if (xDtQuery[0].calc_rab_item_remain_qty.status_code == "00") {
						xFlag = true
					} else {
					//   xJoResult = xDtQuery[0].calc_rab_item_remain_qty;
						xFlag = false
						xSqlErrMsg = xDtQuery[0].calc_rab_item_remain_qty.status_msg
					}
				} else {
					xFlag = false
				}

				if (xFlag) {
					xSaved = await _modelDb.update(pParam, xWhere);

					await xTransaction.commit();

					xJoResult = {
						status_code: '00',
						status_msg: 'Data has been successfully updated'
					};
				} else {
					if (xTransaction) await xTransaction.rollback();

					xJoResult = {
						status_code: '-99',
						status_msg: `Failed save to database ${xSqlErrMsg}`
					};
				}
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
				pParam.create_po_at = await _utilInstance.getCurrDateTime();
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
				var xProductName = pParam.product_name; // Temporary until frontend send purchase request detail id
				delete pParam.product_code;
				delete pParam.request_id;
				delete pParam.product_name;
				var xWhere = {
					where: {
						product_code: xProductCode,
						request_id: xRequestId,
						product_name: xProductName
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
			} else if (pAct == 'update_create_pr') {
				pParam.create_pr_at = await _utilInstance.getCurrDateTime();
				var xId = pParam.id;
				delete pParam.id;
				var xWhere = {
					where: {
						id: xId
					},
					transaction: xTransaction
				};

				pParam.create_pr_by = pParam.user_id;
				pParam.create_pr_by_name = pParam.user_name;

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
			var xSql = "";
			var xSqlErrMsg = ""
			var xFlag = false
			xTransaction = await sequelize.transaction();

			console.log('DELETE ITEM >>>>>', pParam);

			xSql = `SELECT calc_rab_item_remain_qty('{
				"pAct": "update",
				"purchase_request_detail" : ${JSON.stringify(pParam)}
			}'::json)`;

			var xDtQuery = await sequelize.query(xSql, {
				type: sequelize.QueryTypes.SELECT,
			});
			console.log('xUpdateResult>>>>', xDtQuery);

			
			if (xDtQuery.length > 0) {
				if (xDtQuery[0].calc_rab_item_remain_qty.status_code == "00") {
					xFlag = true
				} else {
				//   xJoResult = xDtQuery[0].calc_rab_item_remain_qty;
					xFlag = false
					xSqlErrMsg = xDtQuery[0].calc_rab_item_remain_qty.status_msg
				}
			} else {
				xFlag = false
			}

			if (xFlag) {
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
			} else {
				
				if (xTransaction) await xTransaction.rollback();

				xJoResult = {
					status_code: '-99',
					status_msg: `Failed save to database ${xSqlErrMsg}`
				};
			}

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

		xWhereAnd.push({
			product_id: pParam.product_id,
			vendor_id: pParam.vendor_id
		});

		if (pParam.hasOwnProperty('request_id')) {
			if (pParam.request_id != '') {
				xWhereAnd.push({
					request_id: pParam.request_id
				});
			}
		}

		var xData = await _modelDb.findOne({
			where: xWhereAnd,
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
			xInclude = [
				{
					model: _modelPurchaseRequest,
					as: 'purchase_request',
					attributes: [ 'id', 'request_no' ]
				}
			];

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

	async getByPrNo(pParam) {
		var xWhereAnd = [];
		var xWhere = [];

		if (pParam.hasOwnProperty('pr_no')) {
			if (pParam.pr_no != '') {
				xWhereAnd.push({
					pr_no: pParam.pr_no
				});
			}
		}

		if (xWhereAnd.length > 0) {
			xWhere.push({
				[Op.and]: xWhereAnd
			});
		}
		var xData = await _modelDb.findAll({
			where: xWhere,
			subQuery: false
		});

		return xData;
	}
}

module.exports = PurchaseRequestDetailRepository;
