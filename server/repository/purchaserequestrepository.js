var env = process.env.NODE_ENV || 'localhost';
var config = require(__dirname + '/../config/config.json')[env];
var Sequelize = require('sequelize');
var sequelize = new Sequelize(config.database, config.username, config.password, config);
const { hash } = require('bcryptjs');
const Op = Sequelize.Op;

// Model
const _modelDb = require('../models').tr_purchaserequests;
const _modelPurchaseRequestDetail = require('../models').tr_purchaserequestdetails;

const Utility = require('peters-globallib-v2');
const _utilInstance = new Utility();

class PurchaseRequestRepository {
	constructor() {}

	async getById(pParam) {
		var xData = {};
		var xInclude = [];
		var xWhere = {};
		var xWhereAnd = [],
			xWhereOr = [];

		xInclude = [
			{
				model: _modelPurchaseRequestDetail,
				as: 'purchase_request_detail'
			}
		];

		var xData = await _modelDb.findOne({
			where: {
				id: pParam.id
			},
			include: xInclude
		});

		return xData;
	}

	async list(pParam) {
		var xOrder = [ 'requested_at', 'DESC' ];
		var xInclude = [];
		var xWhere = {};
		var xWhereAnd = [],
			xWhereOr = [];

		xInclude = [
			{
				model: _modelPurchaseRequestDetail,
				as: 'purchase_request_detail'
			}
		];

		if (pParam.hasOwnProperty('order_by') && pParam.hasOwnProperty('order_type')) {
			if (pParam.order_by != '') {
				xOrder = [ pParam.order_by, pParam.order_type == 'desc' ? 'DESC' : 'ASC' ];
			}
		}

		if (pParam.hasOwnProperty('year')) {
			if (pParam.year != '') {
				xWhereAnd.push({
					category_id: pParam.year
				});
			}
		}

		if (pParam.hasOwnProperty('request_date_start') && pParam.hasOwnProperty('request_date_end')) {
			if (pParam.request_date_start != '' && pParam.request_date_end != '') {
				xWhereAnd.push({
					requested_at: {
						[Op.between]: [ request_date_start, request_date_end ]
					}
				});
			}
		}

		if (pParam.hasOwnProperty('is_archived')) {
			if (pParam.is_archived != '') {
				xWhereAnd.push({
					is_delete: pParam.is_archived
				});
			} else {
				xWhereAnd.push({
					is_delete: 0
				});
			}
		} else {
			xWhereAnd.push({
				is_delete: 0
			});
		}

		if (pParam.hasOwnProperty('status')) {
			if (pParam.status != '') {
				xWhereAnd.push({
					status: pParam.status
				});
			}
		}

		if (pParam.hasOwnProperty('user_id') && pParam.is_admin == 0) {
			if (pParam.user_id != '') {
				xWhereAnd.push({
					created_by: pParam.user_id
				});
			}
		}

		if (pParam.hasOwnProperty('keyword')) {
			if (pParam.keyword != '') {
				xWhereOr.push(
					{
						request_no: {
							[Op.iLike]: '%' + pParam.keyword + '%'
						}
					},
					{
						employee_name: {
							[Op.iLike]: '%' + pParam.keyword + '%'
						}
					},
					{
						department_name: {
							[Op.iLike]: '%' + pParam.keyword + '%'
						}
					}
				);
			}
		}

		if (xWhereAnd.length > 0) {
			xWhere.$and = xWhereAnd;
		}

		if (xWhereOr.length > 0) {
			xWhere.$or = xWhereOr;
		}

		var xParamQuery = {
			where: xWhere,
			include: xInclude,
			order: [ xOrder ]
		};

		if (pParam.hasOwnProperty('offset') && pParam.hasOwnProperty('limit')) {
			if (pParam.offset != '' && pParam.limit != '') {
				xParamQuery.offset = pParam.offset;
				xParamQuery.limit = pParam.limit;
			}
		}

		var xData = await _modelDb.findAndCountAll(xParamQuery);

		return xData;
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

				xSaved = await _modelDb.create(pParam, { transaction: xTransaction });

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

				sequelize.query(
					'ALTER TABLE "tr_purchaserequestdetails" DISABLE TRIGGER "trg_update_total_item_afterinsert"'
				);

				xSaved = await _modelDb.create(
					pParam,
					{
						include: [
							{
								model: _modelPurchaseRequestDetail,
								as: 'purchase_request_detail'
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

					sequelize.query(
						'ALTER TABLE "tr_purchaserequestdetails" ENABLE TRIGGER "trg_update_total_item_afterinsert"'
					);

					await xTransaction.commit();
				} else {
					if (xTransaction) await xTransaction.rollback();

					xJoResult = {
						status_code: '-99',
						status_msg: 'Failed save to database'
					};
				}
			} else if (pAct == 'update' || pAct == 'submit_fpb' || pAct == 'cancel_fpb' || pAct == 'set_to_draft_fpb') {
				var xComment = '';

				switch (pAct) {
					case 'update':
						xComment = 'changed';
						break;
					case 'submit_fpb':
						xComment = 'submitted';
						break;
					case 'cancel_fpb':
						pParam.cancel_at = await _utilInstance.getCurrDateTime();
						pParam.cancel_by = pParam.user_id;
						pParam.cancel_by_name = pParam.user_name;
						xComment = 'canceled';
						break;
					case 'set_to_draft_fpb':
						pParam.set_to_draft_at = await _utilInstance.getCurrDateTime();
						pParam.set_to_draft_by = pParam.user_id;
						pParam.set_to_draft_by_name = pParam.user_name;
						xComment = 'set to draft';
						break;
					default:
						xComment = 'changed';
				}

				pParam.updatedAt = await _utilInstance.getCurrDateTime();
				var xId = pParam.id;
				delete pParam.id;
				var xWhere = {
					where: {
						id: xId
					}
				};

				pParam.updated_by = pParam.user_id;
				pParam.updated_by_name = pParam.user_name;

				xSaved = await _modelDb.update(pParam, xWhere, { xTransaction });

				await xTransaction.commit();

				xJoResult = {
					status_code: '00',
					status_msg: `Data has been successfully ${xComment}`
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

	async getByIdAndUserId(pParam) {
		var xData = {};
		var xInclude = [];
		var xWhere = {};
		var xWhereAnd = [],
			xWhereOr = [];

		xData = await _modelDb.findOne({
			where: {
				id: pParam.id,
				created_by: pParam.user_id
			}
		});

		return xData;
	}
}

module.exports = PurchaseRequestRepository;
