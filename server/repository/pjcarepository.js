var env = process.env.NODE_ENV || 'localhost';
var config = require(__dirname + '/../config/config.json')[env];
var Sequelize = require('sequelize');
var sequelize = new Sequelize(config.database, config.username, config.password, config);
const { hash } = require('bcryptjs');
const Op = Sequelize.Op;

// Model
const _modelDb = require('../models').tr_pjcas;
const _modelPJCADetail = require('../models').tr_pjcadetails;
const _modelPaymentRequest = require('../models').tr_paymentrequests;
const _modelPayreqDetail = require('../models').tr_paymentrequestdetails;
const _modelPurchaseRequestDetail = require('../models').tr_purchaserequestdetails;
const _modelVendorCatalogueDb = require('../models').ms_vendorcatalogues;
const _modelProduct = require('../models').ms_products;
const _modelUnit = require('../models').ms_units;
const _modelTax = require('../models').ms_taxes;
// const _modelBudgetPlan = require('../models').tr_budgetplans;

const Utility = require('peters-globallib-v2');
const { param } = require('express-validator');
const _utilInstance = new Utility();
const _xClassName = 'pjcaRepository';

class PJCARepository {
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
					model: _modelPaymentRequest,
					as: 'payment_request',
					attributes: [ 'id', 'document_no', 'created_at' ],
					include: [
						{
							model: _modelPayreqDetail,
							as: 'payment_request_detail',
						}
					]
				},
				{
					model: _modelPJCADetail,
					as: 'pjca_detail',
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
							model: _modelPayreqDetail,
							as: 'payment_request_detail',
							attributes: [ 'id', 'discount_amount', 'discount_percent', 'item_type', 'price_request', 'price_total', 'qty_done', 'qty_request', 'status', 'tax_type'],
							include: [
								{
									model: _modelPayreqDetail,
									as: 'origin_detail',
									attributes: [ 'id', 'discount_amount', 'discount_percent', 'item_type', 'price_request', 'price_total', 'qty_done', 'qty_request', 'status', 'tax_type']
								}
							]
						}
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
				order: [ [ 'pjca_detail', 'id', 'ASC' ] ]
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
		var xOrder = [ 'id', 'ASC' ];
		var xWhere = [];
		var xWhereOr = [];
		var xWhereAnd = [];
		var xInclude = [];
		var xJoResult = {};

		try {
			xInclude = [
				{
					model: _modelPaymentRequest,
					as: 'payment_request',
					attributes: [ 'id', 'document_no'],
				},
			];

			if (pParam.hasOwnProperty('payment_request_id')) {
				if (pParam.payment_request_id != '') {
					xWhereAnd.push({
						payment_request_id: pParam.payment_request_id
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

			if (pParam.hasOwnProperty('status')) {
				if (pParam.status != '') {
					if (Array.isArray(pParam.status)) {
						xWhereAnd.push({
							status: {
								[Op.in]: pParam.status
							}
						});
					} else {
						xWhereAnd.push({
							status: pParam.status
						});
					}
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

			if (pParam.hasOwnProperty('current_approval_ids')) {
				if (pParam.current_approval_ids != '') {
					xWhereAnd.push(
						 Sequelize.literal(
							`"tr_pjcas"."current_approval_ids"::jsonb @> '["${pParam.current_approval_ids}"]'::jsonb`
						)
					);
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
							'$payment_request.document_no$': {
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
							company_name: {
								[Op.iLike]: {[Op.any]: keywords}
								// [Op.iLike]: '%' + pParam.keyword + '%'
							}
						},
						{
							department_name: {
								[Op.iLike]: {[Op.any]: keywords}
								// [Op.iLike]: '%' + pParam.keyword + '%'
							}
						},
						{
							to_department_name: {
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
						created_id: await _utilInstance.encrypt(xSaved.id.toString(), config.cryptoKey.hashKey),
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

				console.log(`>>> before xSave:end ${JSON.stringify(pParam)}`, pAct);
				xSaved = await _modelDb.create(
					pParam,
					{
						include: [
							{
								model: _modelPJCADetail,
								as: 'pjca_detail'
							}
						]
					},
					{ transaction: xTransaction }
				);
				console.log(`>>> after xSave:end ${JSON.stringify(xSaved)}`);

				if (xSaved != null && xSaved.id != null) {
					xJoResult = {
						status_code: '00',
						status_msg: 'Data has been successfully saved',
						created_id: await _utilInstance.encrypt(xSaved.id.toString(), config.cryptoKey.hashKey),
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
			} else if (
				pAct == 'update' ||
				pAct == 'submit'
			) {
				var xId = pParam.id;
				delete pParam.id;
				var xWhere = {
					where: {
						id: xId
					}
				};

				xSaved = await _modelDb.update(pParam, xWhere, { xTransaction });
				// console.log
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
			'id': { sql: 'tr.id' },
			'created_at': { sql: 'tr.created_at' },
			'document_no': { sql: 'tr.document_no' },
			'company_name': { sql: 'tr.company_name' },
			'department_name': { sql: 'tr.department_name' },
			'status': { sql: 'tr.status' }
		};
		// Whitelist kolom yang boleh difilter lewat parameter `filter`
		var xFilterColumnWhitelist = {
			'company_id': 'tr.company_id',
			'department_id': 'tr.department_id',
			'status': 'tr.status',
			'payment_request_id': 'tr.payment_request_id',
			'employee_id': 'tr.employee_id',
			'is_delete': 'tr.is_delete'
			// tambahkan key lain di sini kalau frontend butuh filter kolom lain
		};

		try {
			var xAndConditions = [];
			var xOrConditions = [];
			var xReplacements = {};
        	var xNeedDetailJoin = false;

			if (pParam.hasOwnProperty('payment_request_id') && pParam.payment_request_id != '') {
				xAndConditions.push(`tr.payment_request_id = :paymentRequestId`);
				xReplacements.paymentRequestId = pParam.payment_request_id;
			}

			if (pParam.hasOwnProperty('company_id')) {
				xAndConditions.push(`tr.company_id = :companyId`);
				xReplacements.companyId = pParam.company_id != '' ? pParam.company_id : pParam.logged_company_id;
			}

			if (pParam.hasOwnProperty('department_id') && pParam.department_id != '') {
				xAndConditions.push(`tr.department_id = :departmentId`);
				xReplacements.departmentId = pParam.department_id;
			}

			if (pParam.hasOwnProperty('status') && pParam.status != '') {
				if (Array.isArray(pParam.status)) {
					xAndConditions.push(`tr.status IN (:statusList)`);
					xReplacements.statusList = pParam.status;
				} else {
					xAndConditions.push(`tr.status = :statusSingle`);
					xReplacements.statusSingle = pParam.status;
				}
			}

			if (pParam.hasOwnProperty('start_date') && pParam.hasOwnProperty('end_date')) {
				if (pParam.start_date != '' && pParam.end_date != '') {
					xAndConditions.push(`tr.created_at BETWEEN :startDate AND :endDate`);
					xReplacements.startDate = pParam.start_date + ' 00:00:00';
					xReplacements.endDate = pParam.end_date + ' 23:59:59';
				}
			}

			if (pParam.hasOwnProperty('current_approval_ids') && pParam.current_approval_ids != '') {
				xAndConditions.push(`tr.current_approval_ids::jsonb @> :currentApprovalId::jsonb`);
				xReplacements.currentApprovalId = JSON.stringify([pParam.current_approval_ids]);
			}

			if (pParam.hasOwnProperty('filter') && pParam.filter != null && pParam.filter != undefined && pParam.filter != '') {
				var xFilter = JSON.parse(pParam.filter);
				if (Array.isArray(xFilter) && xFilter.length > 0) {
					xFilter.forEach((xFilterItem, xFilterIdx) => {
						Object.keys(xFilterItem).forEach((xKey, xKeyIdx) => {
							if (xFilterColumnWhitelist.hasOwnProperty(xKey)) {
								var xValue = xFilterItem[xKey];
								var xParamName = `filterParam_${xFilterIdx}_${xKeyIdx}`;

								if (Array.isArray(xValue)) {
									xAndConditions.push(`${xFilterColumnWhitelist[xKey]} IN (:${xParamName})`);
								} else {
									xAndConditions.push(`${xFilterColumnWhitelist[xKey]} = :${xParamName}`);
								}
								xReplacements[xParamName] = xValue;
							} else {
								_utilInstance.writeLog(
									`${_xClassName}.list`,
									`Ignored unknown filter key: ${xKey}`,
									'warning'
								);
							}
						});
					});
				}
			}

			if (pParam.hasOwnProperty('keyword') && pParam.keyword != '') {
				let keywordArray = Array.isArray(pParam.keyword)
					? pParam.keyword
					: pParam.keyword.split(',').map(item => item.trim()).filter(item => item !== '');
				var xKeywords = keywordArray.map(item => `%${item}%`);

				xNeedDetailJoin = true;

				xOrConditions.push(`pmt.document_no ILIKE ANY(ARRAY[:keywords])`);
				xOrConditions.push(`tr.document_no ILIKE ANY(ARRAY[:keywords])`);
				xOrConditions.push(`tr.company_name ILIKE ANY(ARRAY[:keywords])`);
				xOrConditions.push(`tr.department_name ILIKE ANY(ARRAY[:keywords])`);
				xOrConditions.push(`tr.to_department_name ILIKE ANY(ARRAY[:keywords])`);
				xOrConditions.push(`tr.employee_name ILIKE ANY(ARRAY[:keywords])`);
				xOrConditions.push(`tr.description ILIKE ANY(ARRAY[:keywords])`);
				xOrConditions.push(`pd.product_code ILIKE ANY(ARRAY[:keywords])`);
				xOrConditions.push(`pd.product_name ILIKE ANY(ARRAY[:keywords])`);
				xReplacements.keywords = xKeywords;
			}

			if (pParam.hasOwnProperty('product_id') && pParam.product_id != null && pParam.product_id != '') {
				var xProductIds = JSON.parse(pParam.product_id);
				if (xProductIds.length > 0) {
					xNeedDetailJoin = true;
					xAndConditions.push(`pd.product_id IN (:productIds)`);
					xReplacements.productIds = xProductIds;
				}
			}

			if (pParam.hasOwnProperty('owned_document_no') && pParam.owned_document_no != '') {
				xOrConditions.push(`tr.document_no IN (:ownedDocumentNo)`);
				xReplacements.ownedDocumentNo = pParam.owned_document_no;
			}
			// --- ORDER BY dari whitelist ---
			var xOrderKey = 'id';
			var xOrderDir = 'ASC';
			if (pParam.hasOwnProperty('order_by') && pParam.order_by != '' && xOrderWhitelist.hasOwnProperty(pParam.order_by)) {
				xOrderKey = pParam.order_by;
				xOrderDir = pParam.order_type == 'desc' ? 'DESC' : 'ASC';
			}
			var xOrderCol = xOrderWhitelist[xOrderKey].sql;

			// --- Susun WHERE ---
			var xWhereParts = [];
			if (xAndConditions.length > 0) xWhereParts.push(`(${xAndConditions.join(' AND ')})`);
			if (xOrConditions.length > 0) xWhereParts.push(`(${xOrConditions.join(' OR ')})`);
			var xWhereSql = xWhereParts.length > 0 ? `WHERE ${xWhereParts.join(' AND ')}` : '';

			var xJoinSql = `LEFT JOIN tr_paymentrequests pmt ON pmt.id = tr.payment_request_id`;
			if (xNeedDetailJoin) {
				xJoinSql += ` LEFT JOIN tr_pjcadetails pd ON pd.pjca_id = tr.id`;
			}

			// --- Query 1: total distinct payreq ---
			var xCountSql = `
				SELECT COUNT(DISTINCT tr.id) AS total
				FROM tr_pjcas tr
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
				FROM tr_pjcas tr
				${xJoinSql}
				${xWhereSql}
				GROUP BY tr.id
				ORDER BY ${xOrderCol} ${xOrderDir}
				${xLimitOffsetSql}
			`;
			var xIdRows = await _modelDb.sequelize.query(xIdSql, {
				replacements: xReplacements,
				type: Sequelize.QueryTypes.SELECT
			});
			var xIds = xIdRows.map(r => r.id);

			// --- Query 3: fetch data lengkap + semua include, id sudah unik & terpaginasi ---
			var xData = xIds.length > 0 ? await _modelDb.findAll({
				where: { id: { [Op.in]: xIds } },
				include: [
					{
						model: _modelPaymentRequest,
						as: 'payment_request',
						attributes: [ 'id', 'document_no' ]
					}
				]
			}) : [];

        	// Re-sort sesuai urutan xIds dari step 2
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

module.exports = PJCARepository;
