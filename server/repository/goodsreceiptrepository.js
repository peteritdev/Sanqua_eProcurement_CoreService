var env = process.env.NODE_ENV || 'localhost';
var config = require(__dirname + '/../config/config.json')[env];
var Sequelize = require('sequelize');
var sequelize = new Sequelize(config.database, config.username, config.password, config);
const { hash } = require('bcryptjs');
const Op = Sequelize.Op;

// Model
const _modelDb = require('../models').tr_goodsreceipts;
const _modelGoodsReceiptDetail = require('../models').tr_goodsreceiptdetails;
const _modelPaymentRequest = require('../models').tr_paymentrequests;
// const _modelPaymentRequestDetail = require('../models').tr_paymentrequestdetails;
const _modelPurchaseRequest = require('../models').tr_purchaserequests;
const _modelPurchaseRequestDetail = require('../models').tr_purchaserequestdetails;
const _modelVendorCatalogueDb = require('../models').ms_vendorcatalogues;
const _modelProduct = require('../models').ms_products;
const _modelUnit = require('../models').ms_units;
// const _modelBudgetPlan = require('../models').tr_budgetplans;

const Utility = require('peters-globallib-v2');
const { param } = require('express-validator');
const _utilInstance = new Utility();
const _xClassName = 'GoodsReceiptRepository';

class GoodsReceiptRepository {
	constructor() {}

	async getByParameter(pParam) {
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
					attributes: [ 'id', 'request_no'],
				},
				{
					model: _modelGoodsReceiptDetail,
					as: 'goods_receipt_detail',
					include: [
						// {
						// 	model: _modelPaymentRequestDetail,
						// 	as: 'payment_request_detail',
						// 	attributes: [ 'id', 'prd_id'],
						// },
						{
							model: _modelPurchaseRequestDetail,
							as: 'purchase_request_detail',
							attributes: ['id', 'request_id', 'product_id', 'product_code', 'product_name', 'qty', 'qty_done', 'qty_left','uom_name', 'uom_id'],
						},
						{
							model: _modelPaymentRequest,
							as: 'payment_request',
							attributes: [ 'id', 'document_no'],
							// include: [
							// 	{
							// 		model: _modelUnit,
							// 		as: 'unit',
							// 		attributes: [ 'id', 'name'],
							// 	}
							// ]
						},
					]
				},
			]

			if (pParam.hasOwnProperty('id')) {
				if (pParam.id != '') {
					xWhereAnd.push({
						id: pParam.id
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
				order: [ [ 'goods_receipt_detail', 'id', 'ASC' ] ]
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
			_utilInstance.writeLog(`${_xClassName}.getByParameter`, `Exception error: ${e.message}`, 'error');
			xJoResult = {
				status_code: '-99',
				status_msg: `${_xClassName}.getByParameter: Exception error: ${e.message}`
			};
		}

		return xJoResult;
	}

	async list(pParam) {
		var xOrder = [ 'name', 'ASC' ];
		var xWhere = [];
		var xWhereOr = [];
		var xWhereAnd = [];
		var xInclude = [];
		var xJoResult = {};

		try {
			xInclude = [
				{
					model: _modelPurchaseRequest,
					as: 'purchase_request',
					attributes: [ 'id', 'request_no' ]
				}
			];

			if (pParam.hasOwnProperty('company_id')) {
				if (pParam.company_id != '') {
					xWhereAnd.push({
						company_id: pParam.company_id
					});
				}
			}

			if (pParam.hasOwnProperty('department_id')) {
				if (pParam.department_id != '') {
					xWhereAnd.push({
						department_id: pParam.department_id
					});
				}
			}

			if (pParam.hasOwnProperty('status')) {
				if (pParam.status != '') {
					xWhereAnd.push({
						status: pParam.status
					});
				}
			}

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

			if (pParam.hasOwnProperty('start_date') && pParam.hasOwnProperty('end_date')) {
				if (pParam.start_date != '' && pParam.end_date != '') {
					xWhereAnd.push({
						created_at: {
							[Op.between]: [ pParam.start_date + ' 00:00:00', pParam.end_date + ' 23:59:59' ]
						}
					});
				}
			}

			if (pParam.hasOwnProperty('keyword')) {
				if (pParam.keyword != '') {
					xWhereOr.push(
						{
							'$purchase_request.request_no$': {
								[Op.iLike]: '%' + pParam.keyword + '%'
							}
						},
						{
							document_no: {
								[Op.iLike]: '%' + pParam.keyword + '%'
							}
						},
						{
							po_no: {
								[Op.iLike]: '%' + pParam.keyword + '%'
							}
						},
						{
							sj_no: {
								[Op.iLike]: '%' + pParam.keyword + '%'
							}
						},
						{
							received_no: {
								[Op.iLike]: '%' + pParam.keyword + '%'
							}
						},
						{
							received_from_vendor_name: {
								[Op.iLike]: '%' + pParam.keyword + '%'
							}
						},
						{
							submitted_by_name: {
								[Op.iLike]: '%' + pParam.keyword + '%'
							}
						},
						{
							received_by_name: {
								[Op.iLike]: '%' + pParam.keyword + '%'
							}
						},
						{
							employee_name: {
								[Op.iLike]: '%' + pParam.keyword + '%'
							}
						},
						{
							description: {
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
		var xJoResult = {};

		try {
			var xSaved = null;
			xTransaction = await sequelize.transaction();

			if (pAct == 'add') {
				pParam.status = 0;
				pParam.is_delete = 0;
				pParam.created_by = pParam.user_id;
				pParam.created_by_name = pParam.user_name;
				// console.log(`>>> xSave: ${JSON.stringify(pParam)}`);
				
				xSaved = await _modelDb.create(pParam, { transaction: xTransaction });
				// console.log(`>>> xSave:end ${JSON.stringify(xSaved)}`);

				if (xSaved.id != null) {
					xJoResult = {
						status_code: '00',
						status_msg: 'Data has been successfully saved',
						created_id: await _utilInstance.encrypt(xSaved.id, config.cryptoKey.hashKey),
						clear_id: xSaved.id
					};
					await xTransaction.commit();
				} else {
					if (xTransaction) await xTransaction.rollback();

					xJoResult = {
						status_code: '-99',
						status_msg: 'Failed save to database'
					};
				}
			}
			if (pAct == 'add_batch_in_item') {
				
				pParam.status = 0;
				pParam.is_delete = 0;
				pParam.created_by = pParam.user_id;
				pParam.created_by_name = pParam.user_name;

				//// Need disable trigger first because it affect when add batch item.
				// sequelize.query(
				// 	'ALTER TABLE "tr_paymentrequestdetails" DISABLE TRIGGER "trg_update_total_item_afterinsert"'
				// );

				xSaved = await _modelDb.create(
					pParam,
					{
						include: [
							{
								model: _modelGoodsReceiptDetail,
								as: 'goods_receipt_detail'
							}
						]
					},
					{ transaction: xTransaction }
				);

				if (xSaved.id != null) {
					xJoResult = {
						status_code: '00',
						status_msg: 'Data has been successfully saved',
						created_id: await _utilInstance.encrypt(xSaved.id, config.cryptoKey.hashKey),
						clear_id: xSaved.id
					};

					// sequelize.query(
					// 	'ALTER TABLE "tr_paymentrequestdetails" ENABLE TRIGGER "trg_update_total_item_afterinsert"'
					// );

					//// Call update total on table tr_purchaserequest
					// sequelize.query(
					// 	`update tr_paymentrequests set total_qty = (
					// 		select sum( qty_request )
					// 		from tr_paymentrequestdetails
					// 		where payment_request_id = ${xSaved.id}
					// 	),
					// 	total_price = (
					// 		select sum( price_request )
					// 		from tr_paymentrequestdetails
					// 		where payment_request_id = ${xSaved.id}
					// 	),
					// 	where id = ${xSaved.id};`,
					// 	{
					// 		transaction: xTransaction
					// 	}
					// );

					await xTransaction.commit();
				} else {
					if (xTransaction) await xTransaction.rollback();

					xJoResult = {
						status_code: '-99',
						status_msg: 'Failed save to database'
					};
				}
			} else if (pAct == 'update') {

				var xId = pParam.id;
				delete pParam.id;
				var xWhere = {
					where: {
						id: xId
					}
				};

				xSaved = await _modelDb.update(pParam, xWhere, { xTransaction });
				console.log(`>>> xSaved: ${JSON.stringify(xSaved)}`);
				if (xSaved.length > 0) {
					await xTransaction.commit();

					xJoResult = {
						status_code: '00',
						status_msg: `Data has been successfully ${pAct}`
					};
				} else {
					await xTransaction.rollback();
					xJoResult = {
						status_code: '-99',
						status_msg: `Data Failed ${pAct}`
					};
				}
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

	async archive(pParam) {
		let xTransaction;
		var xJoResult = {};
		var xLabel = '';

		try {
			var xSaved = null;
			xTransaction = await sequelize.transaction();

			xSaved = await _modelDb.update(
				{
					is_delete: pParam.is_delete,
					deleted_by: pParam.deleted_by,
					deleted_by_name: pParam.deleted_by_name,
					deleted_at: await _utilInstance.getCurrDateTime()
				},
				{
					where: {
						id: pParam.id
					}
				},
				{ xTransaction }
			);

			await xTransaction.commit();

			if (pParam.is_delete == 0) {
				xLabel = 'Unarchived';
			} else if (pParam.is_delete == 1) {
				xLabel = 'Archived';
			}

			xJoResult = {
				status_code: '00',
				status_msg: `Data has been successfully ${xLabel}`
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
}

module.exports = GoodsReceiptRepository;
