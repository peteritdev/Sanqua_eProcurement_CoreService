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

	// async list(pParam) {
	// 	var xData,
	// 		xTotalRecord = [];
	// 	var xSql,
	// 		xSqlCount = '';
	// 	var xObjJsonWhere = {};
	// 	var xSqlWhere = ' (1=1) ';
	// 	var xSqlWhereOr = [];
	// 	var xSqlWhereOrOwnedDocument = [];
	// 	var xSqlOrderBy = '';
	// 	var xSqlLimit = '';
	// 	var xFlagFilterDepartment = false;
	// 	var xSqlGroupBy = '';
	// 	var xSqlFields = '';

	// 	if (pParam.hasOwnProperty('order_by')) {
	// 		if (pParam.order_by != '') {
	// 			xSqlOrderBy = ` ORDER BY ${pParam.order_by} ${pParam.order_type != '' ? pParam.order_type : 'ASC'}`;
	// 		} else {
	// 			xSqlOrderBy = ` ORDER BY bp.created_at DESC`;
	// 		}
	// 	} else {
	// 		xSqlOrderBy = ` ORDER BY bp.created_at DESC`;
	// 	}

	// 	if (pParam.hasOwnProperty('department_id')) {
	// 		if (pParam.department_id != '') {
	// 			xSqlWhere += ' AND bp.department_id = :departmentId ';
	// 			xObjJsonWhere.departmentId = pParam.department_id;
	// 		}
	// 	}

	// 	if (pParam.hasOwnProperty('project_id')) {
	// 		if (pParam.project_id != '') {
	// 			xSqlWhere += ' AND bp.project_id = :projectId ';
	// 			xObjJsonWhere.projectId = pParam.project_id;
	// 		}
	// 	}

	// 	// if (pParam.hasOwnProperty('request_date_start') && pParam.hasOwnProperty('request_date_end')) {
	// 	// 	if (pParam.request_date_start != '' && pParam.request_date_end != '') {
	// 	// 		xSqlWhere += ' AND pr.requested_at BETWEEN :startDate AND :endDate ';
	// 	// 		xObjJsonWhere.startDate = pParam.request_date_start;
	// 	// 		xObjJsonWhere.endDate = pParam.request_date_end;
	// 	// 	}
	// 	// }

	// 	if (pParam.hasOwnProperty('is_archived')) {
	// 		if (pParam.is_archived != '') {
	// 			xSqlWhere += ' AND bp.is_delete = :isArchived ';
	// 			xObjJsonWhere.isArchived = pParam.is_archived;
	// 		} else {
	// 			xSqlWhere += ' AND bp.is_delete = 0 ';
	// 		}
	// 	} else {
	// 		xSqlWhere += ' AND bp.is_delete = 0 ';
	// 	}

	// 	if (pParam.hasOwnProperty('status')) {
	// 		if (pParam.status != '') {
	// 			xSqlWhere += ' AND bp.status = :status ';
	// 			xObjJsonWhere.status = pParam.status;
	// 		}
	// 	}

	// 	if (pParam.hasOwnProperty('user_id') && (pParam.is_admin == 0 || pParam.logged_is_admin == 0)) {
	// 		if (pParam.user_id != '') {
	// 			// xSqlWhereOr.push(' bp.created_by = :createdBy ');
	// 			xSqlWhere += ' AND bp.created_by = :createdBy ';
	// 			xObjJsonWhere.createdBy = pParam.user_id;
	// 		}
	// 	}

	// 	if (pParam.hasOwnProperty('company_id')) {
	// 		if (pParam.company_id != '') {
	// 			xSqlWhere += ' AND bp.company_id = :companyId ';
	// 			xObjJsonWhere.companyId = pParam.company_id;
	// 		}
	// 	}

	// 	// if (pParam.hasOwnProperty('owned_document_no')) {
	// 	// 	if (pParam.owned_document_no.length > 0) {
	// 	// 		xSqlWhereOr.push(' request_no IN (:ownedDocNo) ');
	// 	// 		xSqlWhereOr.join(' OR ');
	// 	// 		xObjJsonWhere.ownedDocNo = pParam.owned_document_no;

	// 	// 		let xSqlWhereCompanyOwnedDoc = '';
	// 	// 		if (pParam.hasOwnProperty('company_id')) {
	// 	// 			if (pParam.company_id != '') {
	// 	// 				xSqlWhereCompanyOwnedDoc = ' AND pr.company_id = :companyId';
	// 	// 			}
	// 	// 		}
	// 	// 		// 28/11/2023
	// 	// 		let xSqlWhereDepartmentOwnedDoc = '';
	// 	// 		if (pParam.hasOwnProperty('department_id')) {
	// 	// 			if (pParam.department_id != '') {
	// 	// 				xSqlWhereDepartmentOwnedDoc = ' AND pr.department_id = :departmentId';
	// 	// 			}
	// 	// 		}
	// 	// 		// 28/11/2023
	// 	// 		let xSqlWhereCategoryOwnedDoc = '';
	// 	// 		if (pParam.hasOwnProperty('category_item')) {
	// 	// 			if (pParam.category_item != '') {
	// 	// 				xSqlWhereCategoryOwnedDoc = ' AND pr.category_item = :categoryItem';
	// 	// 			}
	// 	// 		}

	// 	// 		// 16/11/2023 to show fpb-project with product code is null
	// 	// 		let xSqlWhereProjectOwnedDoc = '';
	// 	// 		if (pParam.hasOwnProperty('project_id')) {
	// 	// 			if (pParam.project_id != '') {
	// 	// 				xSqlWhereProjectOwnedDoc = ' AND pr.project_id = :projectId';
	// 	// 			}
	// 	// 		}

	// 	// 		xSqlWhere = ` (( ${xSqlWhere} ) OR (${xSqlWhereOr} ${xSqlWhereCompanyOwnedDoc != ''
	// 	// 			? xSqlWhereCompanyOwnedDoc
	// 	// 			: ''} ${xSqlWhereProjectOwnedDoc} ${xSqlWhereCategoryOwnedDoc} ${xSqlWhereDepartmentOwnedDoc}))`;
	// 	// 	}
	// 	// }

	// 	if (pParam.hasOwnProperty('keyword')) {
	// 		if (pParam.keyword != '') {
	// 			let xSqlWhereKeyword = ` 
    //                     bp.name ILIKE :keyword OR
	// 					bp.request_no ILIKE :keyword OR
	// 					bp.employee_name ILIKE :keyword OR
	// 					bp.department_name ILIKE :keyword OR
	// 					bp.project_code ILIKE :keyword OR
	// 					bp.project_name ILIKE :keyword OR
	// 				`;

	// 			xObjJsonWhere.keyword = `%${pParam.keyword}%`;
	// 			xSqlWhere = ` ${xSqlWhere} AND (${xSqlWhereKeyword}) `;
	// 		}
	// 	}

	// 	// if (pParam.hasOwnProperty('owned_document_no') && (pParam.is_admin == 0 || pParam.logged_is_admin == 0)) {
	// 	// 	if (pParam.owned_document_no.length > 0) {
	// 	// 		xSqlWhereOr.push(' request_no IN (:ownedDocNo) ');
	// 	// 		xObjJsonWhere.ownedDocNo = pParam.owned_document_no;

	// 	// 		if (pParam.hasOwnProperty('department_id') && (pParam.is_admin == 0 || pParam.logged_is_admin == 0)) {
	// 	// 			if (pParam.department_id != '') {
	// 	// 				if (!xFlagFilterDepartment) {
	// 	// 					xSqlWhereOr.push(' pr.department_id = :departmentId ');
	// 	// 					xObjJsonWhere.departmentId = pParam.department_id;
	// 	// 					xFlagFilterDepartment = true;
	// 	// 				}
	// 	// 			}
	// 	// 		}
	// 	// 	}
	// 	// }

	// 	// if (pParam.hasOwnProperty('keyword')) {
	// 	// 	if (pParam.keyword != '') {
	// 	// 		xSqlWhere += `AND (
	// 	// 				pr.request_no ILIKE :keyword OR
	// 	// 				pr.employee_name ILIKE :keyword OR
	// 	// 				pr.department_name ILIKE :keyword
	// 	// 				-- prd.product_code ILIKE :keyword OR
	// 	// 				-- prd.product_name ILIKE :keyword
	// 	// 			)`;

	// 	// 		xObjJsonWhere.keyword = `%${pParam.keyword}%`;
	// 	// 	} else {
	// 	// 		if (pParam.hasOwnProperty('company_id')) {
	// 	// 			if (pParam.company_id != '') {
	// 	// 				xSqlWhere += ' AND pr.company_id = :companyId ';
	// 	// 				xObjJsonWhere.companyId = pParam.company_id;
	// 	// 			}
	// 	// 		}
	// 	// 	}
	// 	// } else {
	// 	// 	if (pParam.hasOwnProperty('company_id')) {
	// 	// 		if (pParam.company_id != '') {
	// 	// 			xSqlWhere += ' AND pr.company_id = :companyId ';
	// 	// 			xObjJsonWhere.companyId = pParam.company_id;
	// 	// 		}
	// 	// 	}
	// 	// }

	// 	if (!xFlagFilterDepartment) {
	// 		if (pParam.hasOwnProperty('department_id') && (pParam.is_admin == 0 || pParam.logged_is_admin == 0)) {
	// 			if (pParam.department_id != '') {
	// 				if (!xFlagFilterDepartment) {
	// 					xSqlWhereOr.push(' bp.department_id = :departmentId ');
	// 					xObjJsonWhere.departmentId = pParam.department_id;
	// 					xFlagFilterDepartment = true;
	// 				}
	// 			}
	// 		}
    //     }
        
	// 	// if (!pParam.hasOwnProperty('is_export')) {
    //     // xSqlFields = ` pr.id, pr.request_no, pr.requested_at, pr.employee_id, pr.employee_name, pr.department_id, pr.department_name,
    //     // pr.status, pr.company_id, pr.company_code, pr.company_name, pr.created_at, pr.total_price, pr.total_quotation_price, pr.category_item,
    //     // p.id AS "project_id", p.code AS "project_code",p.name AS "project_name",p.odoo_project_code`;

    //     xSqlGroupBy = ` GROUP BY pr.id, 
    //                 pr.request_no, 
    //                 pr.requested_at, 
    //                 pr.employee_id, 
    //                 pr.employee_name, 
    //                 pr.department_id, 
    //                 pr.department_name,
    //                     pr.status, 
    //                 pr.company_id, 
    //                 pr.company_code, 
    //                 pr.company_name,
    //                 p.id,p.code,p.name,p.odoo_project_code`;

    //     if (pParam.hasOwnProperty('offset') && pParam.hasOwnProperty('limit')) {
    //         if (pParam.offset != '' && pParam.limit != '') {
    //             xSqlLimit = ` OFFSET ${pParam.offset} LIMIT ${pParam.limit} `;
    //         }
    //     }
	// 	// } else {
	// 	// 	if (pParam.is_export) {
	// 	// 		xSqlFields = ` pr.id, pr.request_no, pr.requested_at, pr.employee_id, pr.employee_name, pr.department_id, pr.department_name,
	// 	// 						pr.status, pr.company_id, pr.company_code, pr.company_name, pr.created_at, pr.total_price, pr.total_quotation_price, pr.category_item, 
	// 	// 						prd.product_code,
	// 	// 						prd.product_name,
	// 	// 						prd.qty,
	// 	// 						prd.budget_price_per_unit,
	// 	// 						prd.budget_price_total,
	// 	// 						prd.quotation_price_per_unit,
	// 	// 						prd.quotation_price_total,
	// 	// 						prd.estimate_date_use,
	// 	// 						prd.pr_no,
	// 	// 						prd.last_price,
	// 	// 						prd.estimate_fulfillment,
	// 	// 						prd.uom_name,
	// 	// 						prd.status AS "item_detail_status",
	// 	// 						p.id AS "project_id", p.code AS "project_code",p.name AS "project_name",p.odoo_project_code`;

	// 	// 		xSqlGroupBy = ` `;
	// 	// 	} else {
	// 	// 		xSqlFields = ` pr.id, pr.request_no, pr.requested_at, pr.employee_id, pr.employee_name, pr.department_id, pr.department_name,
	// 	// 	pr.status, pr.company_id, pr.company_code, pr.company_name, pr.created_at, pr.total_price, pr.total_quotation_price, pr.category_item,
	// 	// 	p.id AS "project_id", p.code AS "project_code",p.name AS "project_name",p.odoo_project_code`;

	// 	// 		xSqlGroupBy = ` GROUP BY pr.id, 
	// 	// 				pr.request_no, 
	// 	// 				pr.requested_at, 
	// 	// 				pr.employee_id, 
	// 	// 				pr.employee_name, 
	// 	// 				pr.department_id, 
	// 	// 				pr.department_name,
	// 	// 					pr.status, 
	// 	// 				pr.company_id, 
	// 	// 				pr.company_code, 
	// 	// 				pr.company_name,
	// 	// 				p.id,p.code,p.name,p.odoo_project_code`;

	// 	// 		if (pParam.hasOwnProperty('offset') && pParam.hasOwnProperty('limit')) {
	// 	// 			if (pParam.offset != '' && pParam.limit != '') {
	// 	// 				xSqlLimit = ` OFFSET ${pParam.offset} LIMIT ${pParam.limit} `;
	// 	// 			}
	// 	// 		}
	// 	// 	}
	// 	// }

	// 	xSql = ` SELECT *
	// 			 FROM tr_budgetplans bp
	// 					LEFT JOIN ms_projects p ON p.id = bp.project_id
	// 			 WHERE ${xSqlWhere} ${xSqlGroupBy}
	// 			  ${xSqlOrderBy}${xSqlLimit} `;

	// 	xSqlCount = ` SELECT count(distinct bp.request_no) AS total_record
	// 	  FROM tr_budgetplans bp
	// 		  LEFT JOIN ms_projects p ON p.id = bp.project_id
	// 	  WHERE ${xSqlWhere}`;

	// 	xData = await sequelize.query(xSql, {
	// 		replacements: xObjJsonWhere,
	// 		type: sequelize.QueryTypes.SELECT
	// 	});

	// 	xTotalRecord = await sequelize.query(xSqlCount, {
	// 		replacements: xObjJsonWhere,
	// 		type: sequelize.QueryTypes.SELECT
	// 	});

	// 	return {
	// 		status_code: '00',
	// 		status_msg: 'OK',
	// 		data: xData,
	// 		total_record: xTotalRecord[0].total_record
	// 	};
	// }
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
							request_no: {
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
