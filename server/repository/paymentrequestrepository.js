var env = process.env.NODE_ENV || 'localhost';
var config = require(__dirname + '/../config/config.json')[env];
var Sequelize = require('sequelize');
var sequelize = new Sequelize(config.database, config.username, config.password, config);
const { hash } = require('bcryptjs');
const Op = Sequelize.Op;
const moment = require('moment');

// Model
const _modelDb = require('../models').tr_paymentrequests;
const _modelPaymentRequestDetail = require('../models').tr_paymentrequestdetails;
const _modelPurchaseRequest = require('../models').tr_purchaserequests;
const _modelPurchaseRequestDetail = require('../models').tr_purchaserequestdetails;
const _modelVendorCatalogueDb = require('../models').ms_vendorcatalogues;
const _modelProduct = require('../models').ms_products;
const _modelUnit = require('../models').ms_units;
const _modelTax = require('../models').ms_taxes;
const _modelPJCADb = require('../models').tr_pjcas;
const _modelProject = require('../models').ms_projects;
const _modelBudgetPlan = require('../models').tr_budgetplans;

const Utility = require('peters-globallib-v2');
const { param } = require('express-validator');
const _utilInstance = new Utility();
const _xClassName = 'PaymentRequestRepository';

class PaymentRequestRepository {
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
					attributes: [ 'id', 'request_no' ],
					include: [
						{
							model: _modelBudgetPlan,
							as: 'budget_plan',
							attributes: [ 'id', 'name', 'budget_no' ]
						},
						{
							model: _modelProject,
							as: 'project',
							attributes: [ 'id', 'code', 'name', 'odoo_project_code' ]
						},
					]
				},
				{
					model: _modelPaymentRequestDetail,
					as: 'payment_request_detail',
					include: [
						{
							model: _modelTax,
							as: 'tax',
							attributes: [['id', 'tax_id'], 'name', 'type', 'value'],
						},
						{
							model: _modelPurchaseRequestDetail,
							as: 'purchase_request_detail',
							attributes: ['id', 'request_id', 'product_id', 'product_code', 'product_name', 'qty', 'qty_done', 'qty_paid', ['budget_price_per_unit', 'unit_price'], 'uom_name', 'uom_id', 'store_link'],
						},
						{
							model: _modelPaymentRequestDetail,
							as: 'origin_detail',
							attributes: [ 'id', 'origin_id', 'description', 'discount_amount', 'discount_percent', 'item_type', 'price_request', 'price_total', 'product_code', 'product_id', 'product_name', 'qty_done', 'qty_request', 'status', 'tax_type', 'uom_id', 'uom_name'],
						},
					]
				},
				{
					model: _modelPJCADb,
					as: 'pjca',
					attributes: ['id', 'document_no', 'status'],
				}
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
				order: [ [ 'payment_request_detail', 'id', 'ASC' ] ]
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
		var xOrder = [ 'created_at', 'ASC' ];
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
				},
				{
					model: _modelPJCADb,
					as: 'pjca',
					attributes: ['id', 'document_no', 'status'],
				}
			];

			if (pParam.hasOwnProperty('product_id')) {
				if (pParam.product_id != null && pParam.product_id != undefined && pParam.product_id != '') {
					var xProduct = JSON.parse(pParam.product_id);
					if (xProduct.length > 0) {
						xInclude.push(
							{
								model: _modelPaymentRequestDetail,
								as: 'payment_request_detail'
							}
						)

						xWhereAnd.push({
							'$payment_request_detail.product_id$': {
								[Op.in]: xProduct
							}
						});
					}
				}
			}
			if (pParam.hasOwnProperty('prd_id')) {
				if (pParam.prd_id != null && pParam.prd_id != undefined && pParam.prd_id != '') {
					xInclude.push(
						{
							model: _modelPaymentRequestDetail,
							as: 'payment_request_detail'
						}
					)
					xWhereAnd.push({
						'$payment_request_detail.prd_id$': {
							[Op.in]: [pParam.prd_id]
						}
					});
				}
			}

			if (pParam.hasOwnProperty('purchase_request_id')) {
				if (pParam.purchase_request_id != '') {
					xWhereAnd.push({
						purchase_request_id: pParam.purchase_request_id,
						// status: 3
					});
				}
			}

			if (pParam.hasOwnProperty('company_id')) {
				if (pParam.company_id != '') {
					xWhereAnd.push({
						company_id: pParam.company_id
					});
				} else {
					xWhereAnd.push({
						company_id: pParam.logged_company_id
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
			
			if (pParam.hasOwnProperty('vendor_id')) {
				if (pParam.vendor_id != '') {
					xWhereAnd.push({
						vendor_id: pParam.vendor_id
					});
				}
			}
			
			if (pParam.hasOwnProperty('status')) {
				if (pParam.status != null && pParam.status != undefined && pParam.status != '') {
					var xStatus = JSON.parse(pParam.status);
					// console.log(`>>> xStatus: ${Array.isArray(xStatus)}`);
					if (Array.isArray(xStatus) && xStatus.length > 0) {
						xWhereAnd.push({
							status: {
								[Op.in]: xStatus
							}
						});
					} else {
						xWhereAnd.push({
							status: pParam.status
						});
					}
				}
			}
			
			if (pParam.hasOwnProperty('current_approval_ids')) {
				if (pParam.current_approval_ids != '') {
					xWhereAnd.push(
						 Sequelize.literal(
							`"tr_paymentrequests"."current_approval_ids"::jsonb @> '["${pParam.current_approval_ids}"]'::jsonb`
						)
					);
				}
			}
			// if (pParam.hasOwnProperty('filter')) {
			// 	if (pParam.filter != null && pParam.filter != undefined && pParam.filter != '') {
			// 		var xFilter = JSON.parse(pParam.filter);
			// 		if (xFilter.length > 0) {
			// 			for (var index in xFilter) {
			// 				xWhereAnd.push(xFilter[index]);
			// 			}
			// 		}
			// 	}
			// }

			if (pParam.hasOwnProperty('start_date') && pParam.hasOwnProperty('end_date')) {
				if (pParam.start_date != '' && pParam.end_date != '') {
					xWhereAnd.push({
						created_at: {
							[Op.between]: [ pParam.start_date + ' 00:00:00', pParam.end_date + ' 23:59:59' ]
						}
					});
					// xWhereOr.push(
					// 	{
					// 		[Op.and]: {
					// 			created_at: {
					// 				[Op.between]: [ pParam.start_time + ' 00:00:00', pParam.end_time + ' 23:59:59' ]
					// 			}
					// 		}
					// 	}
					// );
				}
			}
			
			if (pParam.hasOwnProperty('app_category')) {
				if (pParam.app_category != '') {
					xWhereAnd.push({
						app_category: pParam.app_category
					});
				}
			}

			if (pParam.hasOwnProperty('keyword')) {
				if (pParam.keyword != '') {
					let keywordArray = [];

					if (Array.isArray(pParam.keyword)) {
						keywordArray = pParam.keyword;
					} else {
						keywordArray = pParam.keyword
							.split(',')
							.map(item => item.trim())
							.filter(item => item !== '');
					}
					const keywords = keywordArray.map(
						(item) => `%${item}%`
					);

					xWhereOr.push(
						{
							'$purchase_request.request_no$': {
								[Op.iLike]: {[Op.any]: keywords}
								// [Op.iLike]: '%' + pParam.keyword + '%'
							}
						},
						{
							document_no: {
								[Op.iLike]: {[Op.any]: keywords}
								// [Op.iLike]: '%' + pParam.keyword + '%'
							}
						},
						{
							vendor_name: {
								[Op.iLike]: {[Op.any]: keywords}
								// [Op.iLike]: '%' + pParam.keyword + '%'
							}
						},
						{
							employee_name: {
								[Op.iLike]: {[Op.any]: keywords}
								// [Op.iLike]: '%' + pParam.keyword + '%'
							}
						},
						{
							description: {
								[Op.iLike]: {[Op.any]: keywords}
								// [Op.iLike]: '%' + pParam.keyword + '%'
							}
						}
					);
				}
			}
			
			if (pParam.hasOwnProperty('owned_document_no')) {
				if (pParam.owned_document_no != '') {
					xWhereOr.push(
						{
							document_no: {
								[Op.in]: pParam.owned_document_no
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
				subQuery: false,
				loging: true
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
				console.log(`>>> xSave:end ${JSON.stringify(xSaved)}`);

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
				
				console.log(`>>> pParam.total_price ${JSON.stringify(pParam.total_price)}`);
				xSaved = await _modelDb.create(
					pParam,
					{
						transaction: xTransaction,
						include: [
							{
								model: _modelPaymentRequestDetail,
								as: 'payment_request_detail'
							}
						],
						logging: true
					}
				);

				if (xSaved != null && xSaved.id != null) {
					xJoResult = {
						status_code: '00',
						status_msg: 'Data has been successfully saved',
						created_id: await _utilInstance.encrypt(xSaved.id.toString(), config.cryptoKey.hashKey),
						clear_id: xSaved.id
					};

					// sequelize.query(
					// 	'ALTER TABLE "tr_paymentrequestdetails" ENABLE TRIGGER "trg_update_total_item_afterinsert"'
					// );

					// //// Call update total on table tr_purchaserequest
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
			} else if (
				pAct == 'update' ||
				pAct == 'submit'
			) {
				var xId = pParam.id;
				delete pParam.id;
				var xWhere = {
					where: {
						id: xId
					},
					transaction: xTransaction,
					logging: true
				};
				
				xSaved = await _modelDb.update(pParam, xWhere);
				if (xSaved[0] > 0) {
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

	async list_v2(pParam) {
		var xJoResult = {};

		// Whitelist kolom untuk ORDER BY — cegah SQL injection via order_by
		var xOrderWhitelist = {
			'id': { sql: 'tr.id', jsField: 'id' },
			'created_at': { sql: 'tr.created_at', jsField: 'createdAt' },
			'document_no': { sql: 'tr.document_no', jsField: 'document_no' },
			'vendor_name': { sql: 'tr.vendor_name', jsField: 'vendor_name' },
			'employee_name': { sql: 'tr.employee_name', jsField: 'employee_name' },
			'status': { sql: 'tr.status', jsField: 'status' },
			'request_no': { sql: 'pr.request_no', jsField: 'request_no' } // dari relasi purchase_request
		};

		try {
			var xAndConditions = [];
			var xOrConditions = [];
			var xReplacements = {};
			var xNeedPrdJoin = false;

			if (pParam.hasOwnProperty('product_id') && pParam.product_id != null && pParam.product_id != undefined && pParam.product_id != '') {
				var xProduct = JSON.parse(pParam.product_id);
				if (xProduct.length > 0) {
					xNeedPrdJoin = true;
					xAndConditions.push(`prd.product_id IN (:productIds)`);
					xReplacements.productIds = xProduct;
				}
			}

			if (pParam.hasOwnProperty('prd_id') && pParam.prd_id != null && pParam.prd_id != undefined && pParam.prd_id != '') {
				xNeedPrdJoin = true;
				xAndConditions.push(`prd.prd_id = :prdId`);
				xReplacements.prdId = pParam.prd_id;
			}

			if (pParam.hasOwnProperty('purchase_request_id') && pParam.purchase_request_id != '') {
				xAndConditions.push(`tr.purchase_request_id = :purchaseRequestId`);
				xReplacements.purchaseRequestId = pParam.purchase_request_id;
			}

			if (pParam.hasOwnProperty('company_id')) {
				xAndConditions.push(`tr.company_id = :companyId`);
				xReplacements.companyId = pParam.company_id != '' ? pParam.company_id : pParam.logged_company_id;
			}

			if (pParam.hasOwnProperty('department_id') && pParam.department_id != '') {
				xAndConditions.push(`tr.department_id = :departmentId`);
				xReplacements.departmentId = pParam.department_id;
			}

			if (pParam.hasOwnProperty('vendor_id') && pParam.vendor_id != '') {
				xAndConditions.push(`tr.vendor_id = :vendorId`);
				xReplacements.vendorId = pParam.vendor_id;
			}

			if (pParam.hasOwnProperty('status') && pParam.status != null && pParam.status != undefined && pParam.status != '') {
				var xStatus = JSON.parse(pParam.status);
				if (Array.isArray(xStatus) && xStatus.length > 0) {
					xAndConditions.push(`tr.status IN (:statusList)`);
					xReplacements.statusList = xStatus;
				} else {
					xAndConditions.push(`tr.status = :statusSingle`);
					xReplacements.statusSingle = pParam.status;
				}
			}

			if (pParam.hasOwnProperty('current_approval_ids') && pParam.current_approval_ids != '') {
				xAndConditions.push(`tr.current_approval_ids::jsonb @> :currentApprovalId::jsonb`);
				xReplacements.currentApprovalId = JSON.stringify([pParam.current_approval_ids]);
			}

			if (pParam.hasOwnProperty('start_date') && pParam.hasOwnProperty('end_date')) {
				if (pParam.start_date != '' && pParam.end_date != '') {
					xAndConditions.push(`tr.created_at BETWEEN :startDate AND :endDate`);
					xReplacements.startDate = pParam.start_date + ' 00:00:00';
					xReplacements.endDate = pParam.end_date + ' 23:59:59';
				}
			}

			if (pParam.hasOwnProperty('app_category') && pParam.app_category != '') {
				xAndConditions.push(`tr.app_category = :appCategory`);
				xReplacements.appCategory = pParam.app_category;
			}

			var xNeedPrJoin = true; // pr selalu di-LEFT JOIN karena dipakai untuk keyword & order_by request_no

			if (pParam.hasOwnProperty('keyword') && pParam.keyword != '') {
				let keywordArray = Array.isArray(pParam.keyword)
					? pParam.keyword
					: pParam.keyword.split(',').map(item => item.trim()).filter(item => item !== '');
				var xKeywords = keywordArray.map(item => `%${item}%`);

				xNeedPrdJoin = true;

				xOrConditions.push(`pr.request_no ILIKE ANY (ARRAY[:keywords])`);
				xOrConditions.push(`tr.document_no ILIKE ANY (ARRAY[:keywords])`);
				xOrConditions.push(`tr.vendor_name ILIKE ANY (ARRAY[:keywords])`);
				xOrConditions.push(`tr.employee_name ILIKE ANY (ARRAY[:keywords])`);
				xOrConditions.push(`tr.description ILIKE ANY (ARRAY[:keywords])`);
				xOrConditions.push(`prd.product_code ILIKE ANY (ARRAY[:keywords])`);
				xOrConditions.push(`prd.product_name ILIKE ANY (ARRAY[:keywords])`);
				xReplacements.keywords = xKeywords;
			}

			if (pParam.hasOwnProperty('owned_document_no') && pParam.owned_document_no != '') {
				xOrConditions.push(`tr.document_no IN (:ownedDocumentNo)`);
				xReplacements.ownedDocumentNo = pParam.owned_document_no;
			}

			// --- ORDER BY dari whitelist ---
			var xOrderKey = 'created_at';
			var xOrderDir = 'ASC';
			if (pParam.hasOwnProperty('order_by') && pParam.order_by != '' && xOrderWhitelist.hasOwnProperty(pParam.order_by)) {
				xOrderKey = pParam.order_by;
				xOrderDir = pParam.order_type == 'desc' ? 'DESC' : 'ASC';
			}
			var xOrderCol = xOrderWhitelist[xOrderKey].sql;
			var xOrderJsField = xOrderWhitelist[xOrderKey].jsField;

			// --- Susun WHERE ---
			var xWhereParts = [];
			if (xAndConditions.length > 0) xWhereParts.push(`(${xAndConditions.join(' AND ')})`);
			if (xOrConditions.length > 0) xWhereParts.push(`(${xOrConditions.join(' OR ')})`);
			var xWhereSql = xWhereParts.length > 0 ? `WHERE ${xWhereParts.join(' AND ')}` : '';

			// --- Susun JOIN (nama tabel fisik sesuai model) ---
			var xJoinSql = `LEFT JOIN tr_purchaserequests pr ON pr.id = tr.purchase_request_id`;
			if (xNeedPrdJoin) {
				xJoinSql += ` LEFT JOIN tr_paymentrequestdetails prd ON prd.payment_request_id = tr.id`;
			}

			// --- Query 1: total distinct payreq ---
			var xCountSql = `
				SELECT COUNT(DISTINCT tr.id) AS total
				FROM tr_paymentrequests tr
				${xJoinSql}
				${xWhereSql}
			`;
			console.log(`>>> xCountSql: ${JSON.stringify(xCountSql)}`);
			var xCountResult = await _modelDb.sequelize.query(xCountSql, {
				replacements: xReplacements,
				type: Sequelize.QueryTypes.SELECT
			});
			console.log(`>>> xCountResult: ${JSON.stringify(xCountResult)}`);
			var xCountDataWithoutLimit = parseInt(xCountResult[0].total, 10);
			console.log(`>>> xCountDataWithoutLimit: ${JSON.stringify(xCountDataWithoutLimit)}`);

			// --- Query 2: ID unik + pagination ---
			var xLimitOffsetSql = '';
			if (pParam.hasOwnProperty('offset') && pParam.hasOwnProperty('limit') &&
				pParam.offset != '' && pParam.limit != '' && pParam.limit != 'all') {
				xReplacements.limitVal = parseInt(pParam.limit, 10);
				xReplacements.offsetVal = parseInt(pParam.offset, 10);
				xLimitOffsetSql = `LIMIT :limitVal OFFSET :offsetVal`;
			}

			var xIdSql = `
				SELECT tr.id
				FROM tr_paymentrequests tr
				${xJoinSql}
				${xWhereSql}
				GROUP BY tr.id, pr.id
				ORDER BY ${xOrderCol} ${xOrderDir}
				${xLimitOffsetSql}
			`;
			var xIdRows = await _modelDb.sequelize.query(xIdSql, {
				replacements: xReplacements,
				type: Sequelize.QueryTypes.SELECT
			});
			var xIds = xIdRows.map(r => r.id);

			// --- Query 3: fetch data lengkap + semua include, id sudah unik & terpaginasi ---
			var xOrderClause = xOrderKey === 'request_no'
				? [ [ { model: _modelPurchaseRequest, as: 'purchase_request' }, 'request_no', xOrderDir ] ]
				: [ [ xOrderJsField, xOrderDir ] ];
			// lalu pakai: order: xOrderClause
			var xData = xIds.length > 0 ? await _modelDb.findAll({
				where: { id: { [Op.in]: xIds } },
				// order: [ [xOrderJsField.includes('.') ? xOrderJsField.split('.') : xOrderJsField, xOrderDir] ],
				order: xOrderClause,
				include: [
					{
						model: _modelPurchaseRequest,
						as: 'purchase_request',
						attributes: [ 'id', 'request_no' ]
					},
					{
						model: _modelPJCADb,
						as: 'pjca',
						attributes: ['id', 'document_no', 'status']
					},
					{
						model: _modelPaymentRequestDetail,
						as: 'payment_request_detail'
					}
				]
			}) : [];

			var xDataMap = new Map(xData.map(d => [d.id, d]));
			xData = xIds.map(id => xDataMap.get(id)).filter(Boolean);

			xJoResult = {
				status_code: '00',
				status_msg: 'OK',
				data: { rows: xData, count: xData.length },
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
}

module.exports = PaymentRequestRepository;
