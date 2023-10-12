var env = process.env.NODE_ENV || 'localhost';
var config = require(__dirname + '/../config/config.json')[env];
var Sequelize = require('sequelize');
var sequelize = new Sequelize(config.database, config.username, config.password, config);
const { hash } = require('bcryptjs');
const Op = Sequelize.Op;

// Model
const _modelDb = require('../models').tr_purchaserequests;
const _modelPurchaseRequestDetail = require('../models').tr_purchaserequestdetails;
const _modelVendorCatalogueDb = require('../models').ms_vendorcatalogues;

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
				as: 'purchase_request_detail',
				include: [
					{
						model: _modelVendorCatalogueDb,
						as: 'vendor_catalogue'
					}
				]
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

	// async list(pParam) {
	// 	var xOrder = [ 'requested_at', 'DESC' ];
	// 	var xInclude = [];
	// 	var xWhere = [];
	// 	var xWhereAnd = [],
	// 		xWhereOr = [];
	// 	var xFlagFilterDepartment = false;
	// 	var xJoResult = {};

	// 	xInclude = [
	// 		{
	// 			model: _modelPurchaseRequestDetail,
	// 			as: 'purchase_request_detail',
	// 			required: true
	// 		}
	// 	];

	// 	if (pParam.hasOwnProperty('order_by') && pParam.hasOwnProperty('order_type')) {
	// 		if (pParam.order_by != '') {
	// 			xOrder = [ pParam.order_by, pParam.order_type == 'desc' ? 'DESC' : 'ASC' ];
	// 		}
	// 	}

	// 	if (pParam.hasOwnProperty('year')) {
	// 		if (pParam.year != '') {
	// 			xWhereAnd.push({
	// 				category_id: pParam.year
	// 			});
	// 		}
	// 	}

	// 	if (pParam.hasOwnProperty('company_id')) {
	// 		if (pParam.company_id != '') {
	// 			xWhereAnd.push({
	// 				company_id: pParam.company_id
	// 			});
	// 		}
	// 	}

	// 	if (pParam.hasOwnProperty('request_date_start') && pParam.hasOwnProperty('request_date_end')) {
	// 		if (pParam.request_date_start != '' && pParam.request_date_end != '') {
	// 			xWhereAnd.push({
	// 				requested_at: {
	// 					[Op.between]: [ request_date_start, request_date_end ]
	// 				}
	// 			});
	// 		}
	// 	}

	// 	if (pParam.hasOwnProperty('is_archived')) {
	// 		if (pParam.is_archived != '') {
	// 			xWhereAnd.push({
	// 				is_delete: pParam.is_archived
	// 			});
	// 		} else {
	// 			xWhereAnd.push({
	// 				is_delete: 0
	// 			});
	// 		}
	// 	} else {
	// 		xWhereAnd.push({
	// 			is_delete: 0
	// 		});
	// 	}

	// 	if (pParam.hasOwnProperty('status')) {
	// 		if (pParam.status != '') {
	// 			xWhereAnd.push({
	// 				status: pParam.status
	// 			});
	// 		}
	// 	}

	// 	// if (pParam.hasOwnProperty('user_id') && pParam.is_admin == 0) {
	// 	// 	if (pParam.user_id != '') {
	// 	// 		xWhereAnd.push({
	// 	// 			created_by: pParam.user_id
	// 	// 		});
	// 	// 	}
	// 	// }

	// 	let xJArrFilter = [];

	// 	if (pParam.hasOwnProperty('owned_document_no') && pParam.is_admin == 0) {
	// 		if (pParam.owned_document_no.length > 0) {
	// 			xJArrFilter.push({
	// 				request_no: {
	// 					[Op.in]: pParam.owned_document_no
	// 				}
	// 			});
	// 			if (pParam.hasOwnProperty('department_id') && pParam.is_admin == 0) {
	// 				if (pParam.department_id != '') {
	// 					if (!xFlagFilterDepartment) {
	// 						xJArrFilter.push({
	// 							department_id: pParam.department_id
	// 						});
	// 						xFlagFilterDepartment = true;
	// 					}
	// 				}
	// 			}

	// 			xWhereAnd.push({
	// 				[Op.and]: xJArrFilter
	// 			});
	// 		}
	// 	}

	// 	xJArrFilter = [];
	// 	if (pParam.hasOwnProperty('keyword')) {
	// 		if (pParam.keyword != '') {
	// 			xJArrFilter.push(
	// 				{
	// 					request_no: {
	// 						[Op.iLike]: '%' + pParam.keyword + '%'
	// 					}
	// 				},
	// 				{
	// 					employee_name: {
	// 						[Op.iLike]: '%' + pParam.keyword + '%'
	// 					}
	// 				},
	// 				{
	// 					department_name: {
	// 						[Op.iLike]: '%' + pParam.keyword + '%'
	// 					}
	// 				},
	// 				{
	// 					'$purchase_request_detail.product_code$': {
	// 						[Op.iLike]: '%' + pParam.keyword + '%'
	// 					}
	// 				},
	// 				{
	// 					'$purchase_request_detail.product_name$': {
	// 						[Op.iLike]: '%' + pParam.keyword + '%'
	// 					}
	// 				}
	// 			);

	// 			xWhereAnd.push({
	// 				[Op.or]: xJArrFilter
	// 			});

	// 			if (!xFlagFilterDepartment) {
	// 				if (pParam.hasOwnProperty('department_id') && pParam.is_admin == 0) {
	// 					if (pParam.department_id != '') {
	// 						if (!xFlagFilterDepartment) {
	// 							xWhereAnd.push({
	// 								department_id: pParam.department_id
	// 							});
	// 							xFlagFilterDepartment = true;
	// 						}
	// 					}
	// 				}
	// 			}
	// 		}
	// 	}

	// 	if (!xFlagFilterDepartment && pParam.is_admin == 0) {
	// 		if (pParam.department_id != '') {
	// 			if (!xFlagFilterDepartment) {
	// 				xJArrFilter.push({
	// 					department_id: pParam.department_id
	// 				});
	// 				xFlagFilterDepartment = true;
	// 				xWhereAnd.push({
	// 					[Op.or]: xJArrFilter
	// 				});
	// 			}
	// 		}
	// 	}

	// 	if (xWhereAnd.length > 0) {
	// 		xWhere.push({
	// 			[Op.and]: xWhereAnd
	// 		});
	// 	}

	// 	if (xWhereOr.length > 0) {
	// 		xWhere.push({
	// 			[Op.or]: xWhereOr
	// 		});
	// 	}

	// 	var xParamQuery = {
	// 		where: {
	// 			[Op.or]: [ xWhereAnd, xWhereOr ]
	// 		},
	// 		include: xInclude,
	// 		order: [ xOrder ],
	// 		subQuery: true,
	// 		distinct: true
	// 	};

	// 	if (pParam.hasOwnProperty('offset') && pParam.hasOwnProperty('limit')) {
	// 		if (pParam.offset != '' && pParam.limit != '') {
	// 			xParamQuery.offset = pParam.offset;
	// 			xParamQuery.limit = pParam.limit;
	// 		}
	// 	}

	// 	var xData = await _modelDb.findAll(xParamQuery);

	// 	xParamQuery.subQuery = false;
	// 	delete xParamQuery.offset;
	// 	delete xParamQuery.limit;
	// 	let xTotalRecord = await _modelDb.count(xParamQuery);
	// 	if (xData != null) {
	// 		xJoResult = {
	// 			status_code: '00',
	// 			status_msg: 'OK',
	// 			data: xData,
	// 			total_record: xTotalRecord
	// 		};
	// 	} else {
	// 		xJoResult = {
	// 			status_code: '-99',
	// 			status_msg: 'Data not found',
	// 			data: []
	// 		};
	// 	}

	// 	return xJoResult;
	// }

	async list(pParam) {
		var xData,
			xTotalRecord = [];
		var xSql,
			xSqlCount = '';
		var xObjJsonWhere = {};
		var xSqlWhere = ' (1=1) ';
		var xSqlWhereOr = [];
		var xSqlWhereOrOwnedDocument = [];
		var xSqlOrderBy = '';
		var xSqlLimit = '';
		var xFlagFilterDepartment = false;
		var xSqlGroupBy = '';

		if (pParam.hasOwnProperty('order_by')) {
			if (pParam.order_by != '') {
				xSqlOrderBy = ` ORDER BY pr.${pParam.order_by} ${pParam.order_type != '' ? pParam.order_type : 'ASC'}`;
			} else {
				xSqlOrderBy = ` ORDER BY pr.requested_at DESC`;
			}
		} else {
			xSqlOrderBy = ` ORDER BY pr.requested_at DESC`;
		}

		if (pParam.hasOwnProperty('department_id')) {
			if (pParam.department_id != '') {
				xSqlWhere += ' AND pr.department_id = :departmentId ';
				xObjJsonWhere.departmentId = pParam.department_id;
			}
		}

		if (pParam.hasOwnProperty('category_item')) {
			if (pParam.category_item != '') {
				xSqlWhere += ' AND pr.category_item = :categoryItem ';
				xObjJsonWhere.categoryItem = pParam.category_item;
			}
		}

		if (pParam.hasOwnProperty('request_date_start') && pParam.hasOwnProperty('request_date_end')) {
			if (pParam.request_date_start != '' && pParam.request_date_end != '') {
				xSqlWhere += ' AND pr.requested_at BETWEEN :startDate AND :endDate ';
				xObjJsonWhere.startDate = pParam.request_date_start;
				xObjJsonWhere.endDate = pParam.request_date_end;
			}
		}

		if (pParam.hasOwnProperty('is_archived')) {
			if (pParam.is_archived != '') {
				xSqlWhere += ' AND pr.is_delete = :isArchived ';
				xObjJsonWhere.isArchived = pParam.is_archived;
			} else {
				xSqlWhere += ' AND pr.is_delete = 0 ';
			}
		} else {
			xSqlWhere += ' AND pr.is_delete = 0 ';
		}

		if (pParam.hasOwnProperty('status')) {
			if (pParam.status != '') {
				xSqlWhere += ' AND pr.status = :status ';
				xObjJsonWhere.status = pParam.status;
			}
		}

		if (pParam.hasOwnProperty('user_id') && (pParam.is_admin == 0 || pParam.logged_is_admin == 0)) {
			if (pParam.user_id != '') {
				// xSqlWhereOr.push(' pr.created_by = :createdBy ');
				xSqlWhere += ' AND pr.created_by = :createdBy ';
				xObjJsonWhere.createdBy = pParam.user_id;
			}
		}

		if (pParam.hasOwnProperty('company_id')) {
			if (pParam.company_id != '') {
				xSqlWhere += ' AND pr.company_id = :companyId ';
				xObjJsonWhere.companyId = pParam.company_id;
			}
		}

		if (pParam.hasOwnProperty('owned_document_no')) {
			if (pParam.owned_document_no.length > 0) {
				xSqlWhereOr.push(' request_no IN (:ownedDocNo) ');
				xSqlWhereOr.join(' OR ');
				xObjJsonWhere.ownedDocNo = pParam.owned_document_no;

				let xSqlWhereCompanyOwnedDoc = '';
				if (pParam.hasOwnProperty('company_id')) {
					if (pParam.company_id != '') {
						xSqlWhereCompanyOwnedDoc = ' AND company_id = :companyId';
					}
				}
				xSqlWhere = ` (( ${xSqlWhere} ) OR (${xSqlWhereOr} ${xSqlWhereCompanyOwnedDoc != ''
					? xSqlWhereCompanyOwnedDoc
					: ''} ))`;
			}
		}

		if (pParam.hasOwnProperty('keyword')) {
			if (pParam.keyword != '') {
				let xSqlWhereKeyword = ` 
						pr.request_no ILIKE :keyword OR
						pr.employee_name ILIKE :keyword OR
						pr.department_name ILIKE :keyword OR
						prd.product_code ILIKE :keyword OR
						prd.product_name ILIKE :keyword
					`;

				xObjJsonWhere.keyword = `%${pParam.keyword}%`;
				xSqlWhere = ` ${xSqlWhere} AND (${xSqlWhereKeyword}) `;
			}
		}

		// if (pParam.hasOwnProperty('owned_document_no') && (pParam.is_admin == 0 || pParam.logged_is_admin == 0)) {
		// 	if (pParam.owned_document_no.length > 0) {
		// 		xSqlWhereOr.push(' request_no IN (:ownedDocNo) ');
		// 		xObjJsonWhere.ownedDocNo = pParam.owned_document_no;

		// 		if (pParam.hasOwnProperty('department_id') && (pParam.is_admin == 0 || pParam.logged_is_admin == 0)) {
		// 			if (pParam.department_id != '') {
		// 				if (!xFlagFilterDepartment) {
		// 					xSqlWhereOr.push(' pr.department_id = :departmentId ');
		// 					xObjJsonWhere.departmentId = pParam.department_id;
		// 					xFlagFilterDepartment = true;
		// 				}
		// 			}
		// 		}
		// 	}
		// }

		// if (pParam.hasOwnProperty('keyword')) {
		// 	if (pParam.keyword != '') {
		// 		xSqlWhere += `AND (
		// 				pr.request_no ILIKE :keyword OR
		// 				pr.employee_name ILIKE :keyword OR
		// 				pr.department_name ILIKE :keyword
		// 				-- prd.product_code ILIKE :keyword OR
		// 				-- prd.product_name ILIKE :keyword
		// 			)`;

		// 		xObjJsonWhere.keyword = `%${pParam.keyword}%`;
		// 	} else {
		// 		if (pParam.hasOwnProperty('company_id')) {
		// 			if (pParam.company_id != '') {
		// 				xSqlWhere += ' AND pr.company_id = :companyId ';
		// 				xObjJsonWhere.companyId = pParam.company_id;
		// 			}
		// 		}
		// 	}
		// } else {
		// 	if (pParam.hasOwnProperty('company_id')) {
		// 		if (pParam.company_id != '') {
		// 			xSqlWhere += ' AND pr.company_id = :companyId ';
		// 			xObjJsonWhere.companyId = pParam.company_id;
		// 		}
		// 	}
		// }

		if (!xFlagFilterDepartment) {
			if (pParam.hasOwnProperty('department_id') && (pParam.is_admin == 0 || pParam.logged_is_admin == 0)) {
				if (pParam.department_id != '') {
					if (!xFlagFilterDepartment) {
						xSqlWhereOr.push(' pr.department_id = :departmentId ');
						xObjJsonWhere.departmentId = pParam.department_id;
						xFlagFilterDepartment = true;
					}
				}
			}
		}

		// if (xSqlWhereOr.length > 0) {
		// 	xSqlWhere += ` AND ( ${xSqlWhereOr.join(' OR ')} ) `;
		// }

		// if (xSqlWhereOrOwnedDocument.length > 0) {
		// 	xSqlWhere += ` OR ( ${xSqlWhereOrOwnedDocument.join(' OR ')} ) `;
		// }

		if (!pParam.hasOwnProperty('is_export')) {
			xSqlGroupBy = ` GROUP BY pr.id, 
						pr.request_no, 
						pr.requested_at, 
						pr.employee_id, 
						pr.employee_name, 
						pr.department_id, 
						pr.department_name,
							pr.status, 
						pr.company_id, 
						pr.company_code, 
						pr.company_name,
						prd.product_code,
						prd.product_name,
						prd.qty,
						prd.budget_price_per_unit,
						prd.budget_price_total,
						prd.quotation_price_per_unit,
						prd.quotation_price_total,
						prd.estimate_date_use,
						prd.pr_no,
						prd.last_price,
						prd.uom_name`;

			if (pParam.hasOwnProperty('offset') && pParam.hasOwnProperty('limit')) {
				if (pParam.offset != '' && pParam.limit != '') {
					xSqlLimit = ` OFFSET ${pParam.offset} LIMIT ${pParam.limit} `;
				}
			}
		}

		xSql = ` SELECT pr.id, pr.request_no, pr.requested_at, pr.employee_id, pr.employee_name, pr.department_id, pr.department_name,
						pr.status, pr.company_id, pr.company_code, pr.company_name, pr.created_at, pr.total_price, pr.total_quotation_price, pr.category_item,
						prd.product_code,
						prd.product_name,
						prd.qty,
						prd.budget_price_per_unit,
						prd.budget_price_total,
						prd.quotation_price_per_unit,
						prd.quotation_price_total,
						prd.estimate_date_use,
						prd.pr_no,
						prd.last_price,
						prd.uom_name
				 FROM tr_purchaserequests pr 
						LEFT JOIN tr_purchaserequestdetails prd ON pr.id = prd.request_id
				 WHERE ${xSqlWhere} ${xSqlGroupBy}
				  ${xSqlOrderBy}${xSqlLimit} `;

		xSqlCount = ` SELECT count(distinct pr.request_no) AS total_record
		  FROM tr_purchaserequests pr 
		  	LEFT JOIN tr_purchaserequestdetails prd ON pr.id = prd.request_id
		  WHERE ${xSqlWhere}`;

		console.log(`>>> xSqlCount: ${xSqlCount}`);

		xData = await sequelize.query(xSql, {
			replacements: xObjJsonWhere,
			type: sequelize.QueryTypes.SELECT
		});

		xTotalRecord = await sequelize.query(xSqlCount, {
			replacements: xObjJsonWhere,
			type: sequelize.QueryTypes.SELECT
		});

		return {
			status_code: '00',
			status_msg: 'OK',
			data: xData,
			total_record: xTotalRecord[0].total_record
		};
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

					// Call update total on table tr_purchaserequest
					sequelize.query(
						`update tr_purchaserequests set total_qty = (
							select sum( qty )
							from tr_purchaserequestdetails
							where request_id = ${xSaved.id}
						),
						total_price = (
							select sum( budget_price_total )
							from tr_purchaserequestdetails
							where request_id = ${xSaved.id}
						),
						total_quotation_price = (
							select sum( quotation_price_total )
							from tr_purchaserequestdetails
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
				pAct == 'update' ||
				pAct == 'submit_fpb' ||
				pAct == 'cancel_fpb' ||
				pAct == 'set_to_draft_fpb' ||
				pAct == 'close_fpb'
			) {
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
						pParam.cancel_reason = pParam.cancel_reason;
						break;
					case 'set_to_draft_fpb':
						pParam.set_to_draft_at = await _utilInstance.getCurrDateTime();
						pParam.set_to_draft_by = pParam.user_id;
						pParam.set_to_draft_by_name = pParam.user_name;
						xComment = 'set to draft';
						break;
					case 'close_fpb':
						xComment = 'closed';
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
