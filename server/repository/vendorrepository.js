var env = process.env.NODE_ENV || 'localhost';
var config = require(__dirname + '/../config/config.json')[env];
var Sequelize = require('sequelize');
var sequelize = new Sequelize(config.database, config.username, config.password, config);
const { hash } = require('bcryptjs');
const Op = sequelize.Op;

//Model
const _modelVendor = require('../models').ms_vendors;
const _modelBusinessEntity = require('../models').ms_businessentities;
const _modelClassification = require('../models').ms_classifications;
const _modelSubClassification = require('../models').ms_subclassifications;
const _modelProvince = require('../models').ms_provinces;
const _modelCity = require('../models').ms_cities;
const _modelVendorDocument = require('../models').ms_vendordocuments;
const _modelCurrency = require('../models').ms_currencies;

const Utility = require('peters-globallib-v2');
const _utilInstance = new Utility();

var _xClassName = 'VendorRepository';

class VendorRepository {
	constructor() {}

	async isDataExists(pName, pEmail) {
		var data = await _modelVendor.findOne({
			where: {
				name: pName,
				email: pEmail,
				is_delete: 0
			}
		});

		return data;
	}

	async getVendorDocumentByDocumentTypeId(pParam) {
		var xData = await _modelVendorDocument.findOne({
			where: {
				document_type_id: pParam.document_type_id,
				vendor_id: pParam.vendor_id
			},
			limit: pParam.limit,
			offset: pParam.offset
		});

		return xData;
	}

	async list(pParam) {
		var xOrder = [ 'name', 'ASC' ];
		var xWhere = {};
		var xWhereVendorStatus = {};
		var xQuery = {};

		if (pParam.hasOwnProperty('status')) {
			if (pParam.status != '') {
				xWhereVendorStatus = {
					status: pParam.status
				};
			}
		}

		var xWhereAnd = [
			{
				is_delete: 0
			},
			xWhereVendorStatus
		];

		xWhere.$and = xWhereAnd;

		var xWhereOr = [];
		if (pParam.keyword != '' && pParam.hasOwnProperty('keyword')) {
			xWhereOr = [
				{
					code: {
						[Op.iLike]: '%' + pParam.keyword + '%'
					}
				},
				{
					name: {
						[Op.iLike]: '%' + pParam.keyword + '%'
					}
				},
				{
					email: {
						[Op.iLike]: '%' + pParam.keyword + '%'
					}
				}
			];
			xWhere.$or = xWhereOr;
		}

		var xJoinedTable = [
			{
				model: _modelBusinessEntity,
				as: 'business_entity'
			},
			{
				model: _modelProvince,
				as: 'province'
			},
			{
				model: _modelCity,
				as: 'city'
			},
			{
				model: _modelClassification,
				as: 'classification'
			},
			{
				attributes: [ 'id', 'name', 'code' ],
				model: _modelCurrency,
				as: 'currency'
			}
		];

		if (pParam.order_by != '') {
			xOrder = [ pParam.order_by, pParam.order_type == 'desc' ? 'DESC' : 'ASC' ];
		}

		xQuery.where = xWhere;
		xQuery.include = xJoinedTable;

		if (pParam.hasOwnProperty('offset') && pParam.hasOwnProperty('limit')) {
			if (pParam.offset != '' && pParam.limit != '') {
				if (pParam.limit != 'all') {
					xQuery.limit = pParam.limit;
					xQuery.offset = pParam.offset;
				}
			}
		}

		xQuery.order = [ xOrder ];

		var xData = await _modelVendor.findAndCountAll(xQuery);

		return xData;
	}

	async getVendorById(pId) {
		var xData = await _modelVendor.findOne({
			include: [
				{
					attributes: [ 'id', 'name' ],
					model: _modelBusinessEntity,
					as: 'business_entity'
				},
				{
					attributes: [ 'id', 'name' ],
					model: _modelProvince,
					as: 'province'
				},
				{
					attributes: [ 'id', 'name' ],
					model: _modelCity,
					as: 'city'
				},
				{
					attributes: [ 'id', 'name' ],
					model: _modelClassification,
					as: 'classification'
				},
				{
					attributes: [ 'id', 'name' ],
					model: _modelSubClassification,
					as: 'sub_classification'
				},
				{
					attributes: [ 'id', 'name', 'code' ],
					model: _modelCurrency,
					as: 'currency'
				}
			],
			where: {
				id: pId
			}
		});

		return xData;
	}

	async save(pParam) {
		let transaction;
		var joResult = {};
		var xAct = pParam.act;
		var xId = 0;

		console.log(JSON.stringify(pParam));

		delete pParam.act;

		try {
			var saved = null;
			transaction = await sequelize.transaction();

			if (xAct == 'add') {
				pParam.status = 1;
				pParam.is_delete = 0;
				pParam.created_by = pParam.user_id;
				pParam.created_by_name = pParam.user_name;
				delete pParam.user_id;
				delete pParam.user_name;

				saved = await _modelVendor.create(pParam, { transaction });

				await transaction.commit();

				joResult = {
					status_code: '00',
					status_msg: 'Data has been successfully saved',
					created_id: await _utilInstance.encrypt(saved.id),
					clear_id: saved.id
				};
			} else if (xAct == 'update') {
				xId = pParam.id;
				delete pParam.id;

				if (pParam.logo == '') {
					delete pParam.logo;
				}

				saved = await _modelVendor.update(pParam, { where: { id: xId } }, { transaction });

				await transaction.commit();

				joResult = {
					status_code: '00',
					status_msg: 'Data has been successfully updated'
				};
			} else if (pAct == 'update_by_code') {
				pParam.updatedAt = await _utilInstance.getCurrDateTime();
				var xCode = pParam.code;
				delete pParam.code;
				var xWhere = {
					where: {
						code: xCode
					}
				};
				saved = await _modelVendor.update(pParam, xWhere, { transaction });

				await transaction.commit();

				joResult = {
					status_code: '00',
					status_msg: 'Data has been successfully updated'
				};
			}

			return joResult;
		} catch (e) {
			if (transaction) await transaction.rollback();
			joResult = {
				status_code: '-99',
				status_msg: 'Failed save or update data',
				err_msg: e
			};

			return joResult;
		}
	}

	async blockVendor(pParam) {
		let transaction;

		try {
			var saved = null;
			transaction = await sequelize.transaction();

			var xJoResult = {};
			var xJoUpdate = {
				status: -1,
				inactive_at: await _utilInstance.getCurrDateTime(),
				inactive_by: pParam.user_id,
				inactive_by_name: pParam.user_name,
				inactive_reason: pParam.reason
			};

			saved = await _modelVendor.update(xJoUpdate, { where: { id: pParam.id } }, { transaction });

			xJoResult = {
				status_code: '00',
				status_msg: 'Vendor successfully blocked'
			};

			return xJoResult;
		} catch (e) {
			if (transaction) await transaction.rollback();
			xJoResult = {
				status_code: '-99',
				status_msg: 'Failed save or update data',
				err_msg: e
			};

			return xJoResult;
		}
	}

	async unblockVendor(pParam) {
		let transaction;

		try {
			var saved = null;
			transaction = await sequelize.transaction();

			var xJoResult = {};
			var xJoUpdate = {
				status: 1,
				unblock_at: await _utilInstance.getCurrDateTime(),
				unblock_by: pParam.user_id,
				unblock_by_name: pParam.user_name,
				unblock_reason: pParam.reason
			};

			saved = await _modelVendor.update(xJoUpdate, { where: { id: pParam.id } }, { transaction });

			xJoResult = {
				status_code: '00',
				status_msg: 'Vendor successfully unblocked'
			};

			return xJoResult;
		} catch (e) {
			if (transaction) await transaction.rollback();
			xJoResult = {
				status_code: '-99',
				status_msg: 'Failed save or update data',
				err_msg: e
			};

			return xJoResult;
		}
	}

	async getVendorByCode(pCode, pId = null) {
		var xWhere = {
			code: pCode,
			is_delete: 0
		};

		if (pId != null) {
			xWhere.id = {
				[Op.ne]: pId
			};
		}

		var data = await _modelVendor.findOne({
			where: xWhere
		});

		return data;
	}

	async getByParameter(pParam) {
		var xInclude = [];
		var xWhereOr = [];
		var xWhereAnd = [];
		var xWhere = [];
		var xAttributes = [];
		var xJoResult = {};
		try {
			if (pParam.hasOwnProperty('code')) {
				if (pParam.code != '') {
					xWhereAnd.push({
						code: pParam.code
					});
				}
			}

			if (pParam.hasOwnProperty('name')) {
				if (pParam.name != '') {
					xWhereAnd.push({
						name: pParam.name
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
				subQuery: false
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
				status_msg: `Failed get data. Error : ${e.message}`
			};
		}

		return xJoResult;
	}

	// VENDOR'S DOCUMENT
	async isVendorDocumentExists(pVendorId, pDocumentTypeId) {
		var data = await _modelVendorDocument.findOne({
			where: {
				vendor_id: pVendorId,
				document_type_id: pDocumentTypeId,
				is_delete: 0
			}
		});

		return data;
	}

	async getTotalVendorDocumentByVendorId(pVendorId) {
		var xData = await _modelVendorDocument.count({
			where: {
				vendor_id: pVendorId,
				is_delete: 0
			}
		});

		return xData;
	}

	async saveVendorDocument(pParam) {
		let transaction;
		var joResult = {};
		var xAct = pParam.act;
		var xId,
			xDocumentTypeId = 0;

		delete pParam.act;

		try {
			var saved = null;
			transaction = await sequelize.transaction();

			if (xAct == 'add') {
				pParam.is_delete = 0;
				pParam.created_by = pParam.user_id;
				pParam.created_by_name = pParam.user_name;
				delete pParam.user_id;
				delete pParam.user_name;

				saved = await _modelVendorDocument.create(pParam, { transaction });

				await transaction.commit();

				joResult = {
					status_code: '00',
					status_msg: 'Data has been successfully saved',
					created_id: await _utilInstance.encrypt(saved.id)
				};
			} else if (xAct == 'update') {
				xId = pParam.vendor_id;
				xDocumentTypeId = pParam.document_type_id;
				delete pParam.id;
				delete pParam.document_type_id;

				saved = await _modelVendorDocument.update(
					pParam,
					{ where: { vendor_id: xId, document_type_id: xDocumentTypeId } },
					{ transaction }
				);

				await transaction.commit();

				joResult = {
					status_code: '00',
					status_msg: 'Data has been successfully updated'
				};
			}

			return joResult;
		} catch (e) {
			if (transaction) await transaction.rollback();
			joResult = {
				status_code: '-99',
				status_msg: 'Failed save or update data',
				err_msg: e
			};

			return joResult;
		}
	}

	async delete(pParam) {
		let xTransaction;
		var xJoResult = {};

		try {
			var xSaved = null;
			xTransaction = await sequelize.transaction();

			xSaved = await _modelVendor.update(
				{
					is_delete: 1,
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

module.exports = VendorRepository;
