var env = process.env.NODE_ENV || 'localhost';
var config = require(__dirname + '/../config/config.json')[env];
var Sequelize = require('sequelize');
var sequelize = new Sequelize(config.database, config.username, config.password, config);
const { hash } = require('bcryptjs');
const Op = Sequelize.Op;

// Model
const _modelDb = require('../models').tr_procurementterms;

const Utility = require('peters-globallib-v2');
const _utilInstance = new Utility();

const GlobalUtility = require('../utils/globalutility.js');
const { unit } = require('../controllers');
const _globalUtilInstance = new GlobalUtility();

class ProcurementTermRepository {
	constructor() {}

	async getById(pParam) {
		var xData = {};
		var xInclude = [];
		var xWhere = {};
		var xWhereAnd = [],
			xWhereOr = [];

		xInclude = [];

		var xData = await _modelDb.findOne({
			where: {
				id: pParam.id
			},
			include: xInclude
		});

		return xData;
	}

	async list(pParam) {
		var xOrder = [ 'id', 'ASC' ];
		var xInclude = [];
		var xWhere = {};
		var xWhereAnd = [],
			xWhereOr = [];

		xInclude = [];

		if (pParam.hasOwnProperty('order_by') && pParam.hasOwnProperty('order_type')) {
			if (pParam.order_by != '') {
				xOrder = [ pParam.order_by, pParam.order_type == 'desc' ? 'DESC' : 'ASC' ];
			}
		}

		if (pParam.hasOwnProperty('procurement_id')) {
			if (pParam.year != '') {
				xWhereAnd.push({
					procurement_id: pParam.procurement_id
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

		if (pParam.hasOwnProperty('keyword')) {
			if (pParam.keyword != '') {
				xWhereOr.push(
					{
						term: {
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
				pParam.status = 1;
				pParam.is_delete = 0;

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
			} else if (pAct == 'update') {
				pParam.updatedAt = await _utilInstance.getCurrDateTime();
				var xId = pParam.id;
				delete pParam.id;
				var xWhere = {
					where: {
						id: xId
					}
				};
				xSaved = await _modelDb.update(pParam, xWhere, { xTransaction });

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

module.exports = ProcurementTermRepository;
