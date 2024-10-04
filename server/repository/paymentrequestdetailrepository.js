var env = process.env.NODE_ENV || 'localhost';
var config = require(__dirname + '/../config/config.json')[env];
var Sequelize = require('sequelize');
var sequelize = new Sequelize(config.database, config.username, config.password, config);
const { hash } = require('bcryptjs');
const Op = Sequelize.Op;

// Model
const _modelDb = require('../models').tr_paymentrequestdetails;
const _modelPaymentRequest = require('../models').tr_paymentrequests;
const _modelEmployee = require('../models').ms_employees;
const _modelProduct = require('../models').ms_products;
const _modelUnit = require('../models').ms_units;

const Utility = require('peters-globallib-v2');
const _utilInstance = new Utility();

const _xClassName = 'PaymentRequestDetailRepository';

class PaymentRequestDetailRepository {
	constructor() {}

	async dropdown(pParam) {
		var xJoResult = {};
		var xSql = '';
		var xObjJsonWhere = {};
		var xSqlWhere = ' (1=1) ';
		var xSqlWhereOr = [];
		var xSqlOrderBy = '';
		var xSqlLimit = '';
		var xSqlGroupBy = '';
		var xSqlFields = '';

		try {
			if (pParam.hasOwnProperty('purchase_request_id')) {
				if (pParam.purchase_request_id != '') {
					xSqlWhere += ' AND b.purchase_request_id = :purchaseRequestId ';
					xObjJsonWhere.purchaseRequestId = pParam.purchase_request_id;
				}
			}

			if (pParam.hasOwnProperty('vendor_name')) {
				if (pParam.vendor_name != '') {
					xSqlWhere += ' AND b.vendor_name = :vendorName ';
					xObjJsonWhere.vendorName = pParam.vendor_name;
				}
			}

			if (pParam.hasOwnProperty('keyword')) {
				if (pParam.keyword != '') {
					let xSqlWhereKeyword = ` 
							a.product_code ILIKE :keyword OR
							a.product_name ILIKE :keyword
						`;
					xObjJsonWhere.keyword = `%${pParam.keyword}%`;
					xSqlWhere = ` ${xSqlWhere} AND (${xSqlWhereKeyword}) `;
				}
			}

			xSqlFields = ` a.id, a.product_id, a.product_code, a.product_name,
			a.qty_request, a.qty_left, a.price_request,
			a.uom_id, a.uom_name,
			a.payment_request_id, a.prd_id, b.document_no, b.vendor_name`;

			xSql = ` SELECT ${xSqlFields}
			FROM tr_paymentrequestdetails as a
				LEFT JOIN tr_paymentrequests as b on a.payment_request_id = b.id
			WHERE ${xSqlWhere}`;
  
			let xData = await sequelize.query(xSql, {
				replacements: xObjJsonWhere,
				type: sequelize.QueryTypes.SELECT,
				// logging: console.log
			});

			console.log(`>>> xData: ${JSON.stringify(xData)}`);
			if (xData != null && xData.length > 0) {
				xJoResult = {
					status_code: '00',
					status_msg: 'OK',
					data: xData,
				};
			} else {
				xJoResult = {
					status_code: '-99',
					status_msg: 'Data Not Found'
				};
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
						// created_id: await _utilInstance.encrypt(toString(xSaved.id), config.cryptoKey.hashKey)
						//// clear_id: xSaved.id,
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
				// var xFlag = false
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

	async getByProductId(pParam) {
		var xData = {};
		var xInclude = [];
		var xWhere = {};
		var xWhereAnd = [],
			xWhereOr = [];

		xWhereAnd.push({
			product_id: pParam.product_id
		});

		if (pParam.hasOwnProperty('payment_request_id')) {
			if (pParam.payment_request_id != '') {
				xWhereAnd.push({
					payment_request_id: pParam.payment_request_id
				});
			}
		}

		var xData = await _modelDb.findOne({
			where: xWhereAnd,
			include: xInclude
		});

		return xData;
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
					model: _modelPaymentRequest,
					as: 'payment_request',
					attributes: [ 'id', 'document_no' ]
				}
			];

			if (pParam.hasOwnProperty('id')) {
				if (pParam.id != '') {
					xWhereAnd.push({
						id: pParam.id
					});
				}
			}

			if (pParam.hasOwnProperty('payment_request_id')) {
				if (pParam.payment_request_id != '') {
					xWhereAnd.push({
						payment_request_id: pParam.payment_request_id
					});
				}
			}

			if (pParam.hasOwnProperty('prd_id')) {
				if (pParam.prd_id != '') {
					xWhereAnd.push({
						prd_id: pParam.prd_id
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

module.exports = PaymentRequestDetailRepository;
