var env = process.env.NODE_ENV || 'localhost';
var config = require(__dirname + '/../config/config.json')[env];
var Sequelize = require('sequelize');
var sequelize = new Sequelize(config.database, config.username, config.password, config);
const { hash } = require('bcryptjs');
const Op = Sequelize.Op;

// Model
const _modelDb = require('../models').tr_vendorratehistories;
const _modelVendor = require('../models').ms_vendors;

const Utility = require('peters-globallib-v2');
const _utilInstance = new Utility();

class VendorRateHistoryRepository {
	constructor() {}

	async getById(pParam) {
		var xData = await _modelDb.findOne({
			where: {
				id: pParam.id,
				is_delete: 0
			}
		});

		return xData;
	}

	async list(pParam) {
		var xOrder = [ 'rate_date', 'ASC' ];
		var xWhereVendorId = {};

		if (pParam.order_by != '' && pParam.hasOwnProperty('order_by')) {
			xOrder = [ pParam.order_by, pParam.order_type == 'desc' ? 'DESC' : 'ASC' ];
		}

		if (pParam.hasOwnProperty('vendor_id')) {
			xWhereVendorId = {
				vendor_id: pParam.vendor_id
			};
		}

		var xParamQuery = {
			where: {
				[Op.and]: [
					{
						is_delete: 0
					},
					xWhereVendorId
				]
			},
			order: [ xOrder ]
		};

		if (pParam.hasOwnProperty('offset') && pParam.hasOwnProperty('limit')) {
			if (pParam.offset != '' && pParam.limit != '' && pParam.offset != 0 && pParam.limit != 0) {
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
		var xAvgRate = pParam.avg_rate;

		try {
			var xSaved = null;
			xTransaction = await sequelize.transaction();

			if (pAct == 'add') {
				pParam.status = 1;
				pParam.is_delete = 0;

				xSaved = await _modelDb.create(pParam, { xTransaction });

				if (xSaved.id != null) {
					// Update to vendor's avg_rate
					var xUpdateVendor = await _modelVendor.update(
						{ avg_rate: xAvgRate },
						{ where: { id: pParam.vendor_id } },
						{ xTransaction }
					);

					await xTransaction.commit();

					xJoResult = {
						status_code: '00',
						status_msg: 'Data has been successfully saved',
						created_id: await _utilInstance.encrypt(xSaved.id, config.cryptoKey.hashKey)
					};
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

				// Update to vendor's avg_rate
				var xUpdateVendor = await _modelVendor.update(
					{ avg_rate: xAvgRate },
					{ where: { id: pParam.vendor_id } },
					{ xTransaction }
				);

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

	async delete(pParam) {
		let xTransaction;
		var xJoResult = {};

		try {
			var xSaved = null;
			xTransaction = await sequelize.transaction();

			xSaved = await _modelDb.update(
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

module.exports = VendorRateHistoryRepository;
