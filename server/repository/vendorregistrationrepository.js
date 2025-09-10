'use strict';

var env = process.env.NODE_ENV || 'localhost';
var config = require(__dirname + '/../config/config.json')[env];
var Sequelize = require('sequelize');
var sequelize = new Sequelize(config.database, config.username, config.password, config);
const Op = Sequelize.Op;

// Models
const _modelDb = require('../models').tr_vendorregistrations;
const _modelProvince = require('../models').ms_provinces;
const _modelCity = require('../models').ms_cities;
const _modelClassification = require('../models').ms_classifications;
const _modelSubClassification = require('../models').ms_subclassifications;

const Utility = require('peters-globallib-v2');
const _utilInstance = new Utility();

const _xClassName = 'VendorRegistrationRepository';

class VendorRegistrationRepository {
	constructor() {}

	async list(pParam) {
		var xOrder = ['name', 'ASC'];
		var xWhere = [];
		var xWhereOr = [];
		var xWhereAnd = [];
		var xInclude = [];
		var xJoResult = {};

		try {
			xInclude = [
				{
					model: _modelProvince,
					as: 'province',
					attributes: ['id', 'name']
				},
				{
					model: _modelCity,
					as: 'city',
					attributes: ['id', 'name']
				},
				{
					model: _modelClassification,
					as: 'classification',
					attributes: ['id', 'name']
				},
				{
					model: _modelSubClassification,
					as: 'sub_classification',
					attributes: ['id', 'name']
				}
			];

			xWhereAnd.push({ is_delete: 0 });
			if (pParam.hasOwnProperty('company_id')) {
				if (pParam.company_id != '') {
					xWhereAnd.push({
						created_by_company_id: pParam.company_id
					});
				}
			}
			if (pParam.hasOwnProperty('classification_id')) {
				if (pParam.classification_id != '') {
					xWhereAnd.push({
						classification_id: pParam.classification_id
					});
				}
			}
			if (pParam.hasOwnProperty('sub_classification_id')) {
				if (pParam.sub_classification_id != '') {
					xWhereAnd.push({
						sub_classification_id: pParam.sub_classification_id
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

			if (pParam.hasOwnProperty('keyword') && pParam.keyword != '') {
				xWhereOr.push(
					{ name: { [Op.iLike]: '%' + pParam.keyword + '%' } },
					{ email: { [Op.iLike]: '%' + pParam.keyword + '%' } },
					{ address: { [Op.iLike]: '%' + pParam.keyword + '%' } },
					{ province_name: { [Op.iLike]: '%' + pParam.keyword + '%' } },
					{ post_code: { [Op.iLike]: '%' + pParam.keyword + '%' } },
					{ phone_number: { [Op.iLike]: '%' + pParam.keyword + '%' } },
					{ classification_name: { [Op.iLike]: '%' + pParam.keyword + '%' } },
					{ sub_classification_name: { [Op.iLike]: '%' + pParam.keyword + '%' } },
					{ website: { [Op.iLike]: '%' + pParam.keyword + '%' } }
				);
			}

			if (xWhereAnd.length > 0) {
				xWhere.push({ [Op.and]: xWhereAnd });
			}
			if (xWhereOr.length > 0) {
				xWhere.push({ [Op.or]: xWhereOr });
			}

			if (pParam.hasOwnProperty('order_by') && pParam.order_by != '') {
				xOrder = [pParam.order_by, pParam.order_type === 'desc' ? 'DESC' : 'ASC'];
			}

			var xParamQuery = {
				where: xWhere,
				order: [xOrder],
				include: xInclude,
				subQuery: false
			};

			var xCountDataWithoutLimit = await _modelDb.count({ where: xWhere });

			if (pParam.hasOwnProperty('offset') && pParam.hasOwnProperty('limit')) {
				if (pParam.offset != '' && pParam.limit != '' && pParam.limit != 'all') {
					xParamQuery.offset = pParam.offset;
					xParamQuery.limit = pParam.limit;
				}
			}

			var xData = await _modelDb.findAndCountAll(xParamQuery);

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

	async getById(pParam) {
		var xJoResult = {};

		try {
			var xInclude = [
				{
					model: _modelProvince,
					as: 'province',
					attributes: ['id', 'name']
				},
				{
					model: _modelCity,
					as: 'city',
					attributes: ['id', 'name']
				},
				{
					model: _modelClassification,
					as: 'classification',
					attributes: ['id', 'name']
				},
				{
					model: _modelSubClassification,
					as: 'sub_classification',
					attributes: ['id', 'name']
				}
			];

			var xData = await _modelDb.findOne({
				where: {
					id: pParam.id,
					is_delete: 0
				},
				include: xInclude
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
				status_msg: `Error: ${e.message}`
			};
		}

		return xJoResult;
	}

	async isDataExists(pName) {
		var xData = await _modelDb.findOne({
			where: {
				name: pName,
				is_delete: 0
			}
		});
		return xData;
	}

	async save(pParam, pAct) {
		let xTransaction;
		let xJoResult = {};

		try {
			xTransaction = await sequelize.transaction();

			if (pAct == 'add') {
				pParam.is_delete = 0;
				pParam.created_by = pParam.user_id;
				pParam.created_by_name = pParam.user_name;
				pParam.created_by_email = pParam.logged_user_email;
				pParam.created_by_company_id = pParam.logged_company_id
				pParam.created_by_company_name = pParam.logged_company_name
				pParam.created_by_department_id = pParam.logged_department_id
				pParam.created_by_department_name = pParam.logged_department_name

				var xSaved = await _modelDb.create(pParam, { transaction: xTransaction });

				if (xSaved && xSaved.id) {
					xJoResult = {
						status_code: '00',
						status_msg: 'Data has been successfully saved',
						created_id: await _utilInstance.encrypt(xSaved.id, config.cryptoKey.hashKey),
						clear_id: xSaved.id
					};

					await xTransaction.commit();
				} else {
					await xTransaction.rollback();
					xJoResult = {
						status_code: '-99',
						status_msg: 'Failed save to database'
					};
				}
			} else if (pAct == 'update') {
				let xId = pParam.id;
				delete pParam.id;

				pParam.updatedAt = await _utilInstance.getCurrDateTime();
				pParam.updated_by = pParam.user_id;
				pParam.updated_by_name = pParam.user_name;

				await _modelDb.update(pParam, { where: { id: xId } }, { transaction: xTransaction });

				await xTransaction.commit();

				xJoResult = {
					status_code: '00',
					status_msg: 'Data has been successfully updated'
				};
			} else {
				xJoResult = {
					status_code: '-99',
					status_msg: 'Invalid save action'
				};
				if (xTransaction) await xTransaction.rollback();
			}
		} catch (e) {
			if (xTransaction) await xTransaction.rollback();

			xJoResult = {
				status_code: '-99',
				status_msg: `Failed save or update data. Error: ${e.message}`,
				err_msg: e
			};
		}

		return xJoResult;
	}

	async deletePermanent(pParam) {
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
		} catch (e) {
			if (xTransaction) await xTransaction.rollback();
			xJoResult = {
				status_code: '-99',
				status_msg: 'Failed delete data. Error: ' + e.message,
				err_msg: e
			};
		}
		return xJoResult;
	}

	async delete(pParam) {
		let xTransaction;
		let xJoResult = {};

		try {
			xTransaction = await sequelize.transaction();

			let xSaved = await _modelDb.update(
				{
					is_delete: 1,
					deleted_by: pParam.user_id,
					deleted_by_name: pParam.user_name,
					deletedAt: await _utilInstance.getCurrDateTime()
				},
				{
					where: { id: pParam.id },
					transaction: xTransaction
				}
			);

			await xTransaction.commit();

			xJoResult = {
				status_code: '00',
				status_msg: 'Data has been successfully deleted'
			};
		} catch (e) {
			if (xTransaction) await xTransaction.rollback();
			xJoResult = {
				status_code: '-99',
				status_msg: 'Failed delete data. Error: ' + e.message,
				err_msg: e
			};
		}

		return xJoResult;
	}
}

module.exports = VendorRegistrationRepository;
