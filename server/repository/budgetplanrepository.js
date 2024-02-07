var env = process.env.NODE_ENV || 'localhost';
var config = require(__dirname + '/../config/config.json')[env];
var Sequelize = require('sequelize');
var sequelize = new Sequelize(config.database, config.username, config.password, config);
const { hash } = require('bcryptjs');
const Op = Sequelize.Op;

// Model
const _modelDb = require('../models').tr_budgetplans;
const _modelProject = require('../models').ms_projects;
const _modelBudgetPlanDetail = require('../models').tr_budgetplandetails;
// const _modelVendorCatalogueDb = require('../models').ms_vendorcatalogues;

const Utility = require('peters-globallib-v2');
const { param } = require('express-validator');
const _utilInstance = new Utility();

const _xClassName = 'BudgetPlanRepository';

class BudgetPlanRepository {
	constructor() {}
	async list(pParam) {
		var xOrder = [ 'name', 'ASC' ];
		var xWhere = [];
		var xWhereOr = [];
		var xWhereAnd = [];
		var xInclude = [];
		var xJoResult = {};

		try {
			xInclude = [];

			if (pParam.hasOwnProperty('company_id')) {
				if (pParam.company_id != '') {
					xWhereAnd.push({
						company_id: pParam.company_id
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

			if (pParam.hasOwnProperty('keyword')) {
				if (pParam.keyword != '') {
					xWhereOr.push(
						{
							name: {
								[Op.iLike]: '%' + pParam.keyword + '%'
							}
						},
						{
							budget_no: {
								[Op.iLike]: '%' + pParam.keyword + '%'
							}
						},
						{
							project_name: {
								[Op.iLike]: '%' + pParam.keyword + '%'
							}
						},
						{
							project_code: {
								[Op.iLike]: '%' + pParam.keyword + '%'
							}
						},
						{
							employee_name: {
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
				xOrder = [ pParam.order_by, pParam.order_type == 'desc' ? 'DESC' : 'ASC' ];
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
			console.log('FIND AND COUNT ALL >>>>>', xData);
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

				// Need disable trigger first because it affect when add batch item.
				sequelize.query(
					'ALTER TABLE "tr_budgetplandetails" DISABLE TRIGGER "trg_update_total_item_afterinsert"'
				);

				xSaved = await _modelDb.create(
					pParam,
					{
						include: [
							{
								model: _modelBudgetPlanDetail,
								as: 'budget_plan_detail'
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
						'ALTER TABLE "tr_budgetplandetails" ENABLE TRIGGER "trg_update_total_item_afterinsert"'
					);

					// Call update total on table tr_budgetplans
					sequelize.query(
						`update tr_budgetplans set total_plan_qty = (
							select sum( qty )
							from tr_budgetplandetails
							where request_id = ${xSaved.id}
						),
						total_budget_plan = (
							select sum( budget_price_total )
							from tr_budgetplandetails
							where request_id = ${xSaved.id}
						)
						where id = ${xSaved.id};`,
						{
							transaction: xTransaction
						}
					);

					await xTransaction.commit();
				} else {
					if (xTransaction) await xTransaction.rollback();

					xJoResult = {
						status_code: '-99',
						status_msg: 'Failed save to database'
					};
				}
			} else if (
				pAct == 'update'||
				pAct == 'submit'||
				pAct == 'take'||
				pAct == 'done'||
				pAct == 'cancel'||
				pAct == 'set_to_draft'
			) {
				var xComment = '';
				switch (pAct) {
					case 'update':
						xComment = 'updated';
						break;
					case 'submit':
						xComment = 'submitted';
						// pParam.submited_at = await _utilInstance.getCurrDateTime();
						pParam.submited_by = pParam.user_id;
						pParam.submited_by_name = pParam.user_name;
						break;
					case 'take':
						xComment = 'take';
						// pParam.submited_at = await _utilInstance.getCurrDateTime();
						pParam.received_by = pParam.user_id;
						pParam.received_by_name = pParam.user_name;
						break;
					case 'done':
						xComment = 'take';
						// pParam.submited_at = await _utilInstance.getCurrDateTime();
						pParam.done_by = pParam.user_id;
						pParam.done_by_name = pParam.user_name;
						break;
					case 'cancel':
						xComment = 'canceled';
						// pParam.submited_at = await _utilInstance.getCurrDateTime();
						pParam.cancel_by = pParam.user_id;
						pParam.cancel_by_name = pParam.user_name;
						break;
					case 'set_to_draft':
						xComment = 'set to draft';
						// pParam.submited_at = await _utilInstance.getCurrDateTime();
						pParam.set_to_draft_by = pParam.user_id;
						pParam.set_to_draft_by_name = pParam.user_name;
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

	async getById(pParam) {
		var xData = {};
		var xInclude = [];
		var xWhere = {};
		var xWhereAnd = [],
			xWhereOr = [];

		xInclude = [
			{
				model: _modelBudgetPlanDetail,
				as: 'budget_plan_detail',
				// include: [
				// 	{
				// 		model: _modelVendorCatalogueDb,
				// 		as: 'vendor_catalogue'
				// 	}
				// ]
			},
			{
				model: _modelProject,
				as: 'project',
				attributes: [ 'id', 'code', 'name', 'odoo_project_code' ]
			}
		];

		var xData = await _modelDb.findOne({
			where: {
				id: pParam.id
			},
			include: xInclude,
			order: [ [ 'budget_plan_detail', 'id', 'ASC' ] ]
		});

		return xData;
	}
	
	async delete(pParam) {
		let xTransaction;
		var xJoResult = {};

		try {
			var xSaved = null;
			xTransaction = await sequelize.transaction();

			if (pParam.is_permanent) {
				xSaved = await _modelDb.destroy(
					{
						where: {
							id: pParam.id
						}
					},
					{ xTransaction }
				);
			} else {
				pParam.is_delete = 1;
				pParam.deletedAt = await _utilInstance.getCurrDateTime();
				pParam.deleted_by = pParam.user_id;
				pParam.deleted_by_name = pParam.user_name;
				xSaved = await _modelDb.update(pParam, xWhere, { xTransaction });
			}

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

module.exports = BudgetPlanRepository;
