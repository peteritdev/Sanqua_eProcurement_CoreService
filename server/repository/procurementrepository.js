var env = process.env.NODE_ENV || 'localhost';
var config = require(__dirname + '/../config/config.json')[env];
var Sequelize = require('sequelize');
var sequelize = new Sequelize(config.database, config.username, config.password, config);
const { hash } = require('bcryptjs');
const Op = Sequelize.Op;

// Model
const _modelDb = require('../models').tr_procurements;
const _modelProcurementItem = require('../models').tr_procurementitems;
const _modelProcurementSchedule = require('../models').tr_procurementschedules;
const _modelScheduleAttribute = require('../models').ms_procurementscheduleattributes;
const _modelProcurementTerm = require('../models').tr_procurementterms;
const _modelProduct = require('../models').ms_products;
const _modelUnit = require('../models').ms_units;
const _modelCurrency = require('../models').ms_currencies;

const Utility = require('peters-globallib-v2');
const _utilInstance = new Utility();

const GlobalUtility = require('../utils/globalutility.js');
const _globalUtilInstance = new GlobalUtility();

class ProcurementRepository {
	constructor() {}

	async getById(pParam) {
		var xData = {};
		var xInclude = [];
		var xWhere = {};
		var xWhereAnd = [],
			xWhereOr = [];

		xInclude = [
			{
				model: _modelProcurementItem,
				as: 'procurement_item',
				attributes: [ 'id', 'unit_price', 'qty', 'total', 'description' ],
				include: [
					{
						model: _modelUnit,
						as: 'unit',
						attributes: [ 'id', 'name' ]
					},
					{
						model: _modelProduct,
						as: 'product',
						attributes: [ 'id', 'name' ]
					}
				]
			},
			{
				model: _modelProcurementSchedule,
				as: 'procurement_schedule',
				include: [
					{
						model: _modelScheduleAttribute,
						as: 'schedule_attribute',
						attributes: [ 'id', 'name' ]
					}
				],
				attributes: [ 'id', 'start_date', 'end_date' ]
			},
			{
				model: _modelProcurementTerm,
				as: 'procurement_term',
				attributes: [ 'id', 'term', 'description' ]
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
		var xOrder = [ 'name', 'ASC' ];
		var xInclude = [];
		var xWhere = {};
		var xWhereAnd = [],
			xWhereOr = [];

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

		if (pParam.hasOwnProperty('period_start') && pParam.hasOwnProperty('period_end')) {
			if (pParam.period_start != '' && pParam.period_end != '') {
				xWhereOr.push(
					{
						[Op.and]: {
							period_start: pParam.period_start,
							period_end: pParam.period_end
						}
					},
					{
						[Op.and]: {
							period_start: {
								[Op.between]: [ pParam.period_start, pParam.period_end ]
							},
							period_end: {
								[Op.gt]: pParam.period_end
							}
						}
					},
					{
						[Op.and]: {
							period_start: {
								[Op.lt]: pParam.period_start
							},
							period_end: {
								[Op.between]: [ pParam.period_start, pParam.period_end ]
							}
						}
					},
					{
						[Op.and]: {
							period_end: pParam.period_start,
							period_end: {
								[Op.between]: [ pParam.period_start, pParam.period_end ]
							}
						}
					},
					{
						[Op.and]: {
							period_start: {
								[Op.lt]: pParam.period_start,
								[Op.lt]: pParam.period_end
							},
							[Op.and]: {
								period_end: {
									[Op.gt]: pParam.period_start,
									[Op.gt]: pParam.period_end
								}
							}
						}
					},
					{
						[Op.and]: {
							period_start: {
								[Op.between]: [ pParam.period_start, pParam.period_end ]
							},
							period_end: {
								[Op.between]: [ pParam.period_start, pParam.period_end ]
							}
						}
					}
				);
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
						name: {
							[Op.iLike]: '%' + pParam.keyword + '%'
						}
					},
					{
						procurement_no: {
							[Op.iLike]: '%' + pParam.keyword + '%'
						}
					},
					{
						qualification: {
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
				pParam.status_approval = 0; // First the status_approval is draft
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
					status_msg: 'Data has been successfully updated',
					id: xId
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

module.exports = ProcurementRepository;
