const jwt = require('jsonwebtoken');
const md5 = require('md5');
const crypto = require('crypto');
const moment = require('moment');
const Sequelize = require('sequelize');
const dateFormat = require('dateformat');
const Op = Sequelize.Op;
const bcrypt = require('bcrypt');
const fs = require('fs');

const env = process.env.NODE_ENV || 'localhost';
const config = require(__dirname + '/../config/config.json')[env];

// Utility
const Utility = require('peters-globallib-v2');
const _utilInstance = new Utility();

const GlobalUtility = require('../utils/globalutility.js');
const _globalUtilInstance = new GlobalUtility();

// Repository
const ProcurementQuotationItemRepository = require('../repository/procurementquotationitemrepository.js');
const _repoInstance = new ProcurementQuotationItemRepository();

class ProcurementQuotationItemService {
	constructor() {}

	async addItemCopyFromProcurementItem(pParam) {
		var xJoResult = {};
		var xFlagProcess = true;

		// This line use when the procurement_id and vendor_id is encrypted.
		// For now, this is clear because the function only used by internal
		// if( pParam.hasOwnProperty('procurement_id') && pParam.hasOwnProperty('vendor_id') ){
		//     if( pParam.procurement_id != '' ){
		//         var xDecId = await _utilInstance.decrypt( pParam.procurement_id, config.cryptoKey.hashKey );
		//         if( xDecId.status_code == '00' ){
		//             pParam.procurement_id = xDecId.decrypted;
		//             xFlagProcess = true;
		//         }else{
		//             xJoResult = xDecId;
		//         }
		//     }

		//     if( pParam.vendor_id != '' ){
		//         var xDecId = await _utilInstance.decrypt( pParam.vendor_id, config.cryptoKey.hashKey );
		//         if( xDecId.status_code == '00' ){
		//             pParam.vendor_id = xDecId.decrypted;
		//             xFlagProcess = true;
		//         }else{
		//             xJoResult = xDecId;
		//         }
		//     }
		// }

		if (xFlagProcess) {
			var xAddResult = await _repoInstance.addItemCopyFromProcurementItem(pParam);
			xJoResult = xAddResult;
		}

		return xJoResult;
	}

	async list(pParam) {
		var xJoResult = {};
		var xJoArrData = [];
		var xFlagProcess = false;

		if (pParam.hasOwnProperty('procurement_vendor_id')) {
			if (pParam.procurement_vendor_id != '') {
				var xDecId = await _utilInstance.decrypt(pParam.procurement_vendor_id, config.cryptoKey.hashKey);
				if (xDecId.status_code == '00') {
					pParam.procurement_vendor_id = xDecId.decrypted;
					xFlagProcess = true;
				} else {
					xJoResult = xDecId;
				}
			}
		}

		if (xFlagProcess) {
			var xResultList = await _repoInstance.list(pParam);

			if (xResultList.count > 0) {
				var xRows = xResultList.rows;
				var xProcurementDetail = {};

				for (var index in xRows) {
					if (index == 0) {
						xProcurementDetail = {
							procurement_no: xRows[index].procurement_vendor.procurement.procurement_no,
							name: xRows[index].procurement_vendor.procurement.name,
							year: xRows[index].procurement_vendor.procurement.year,
							total_hps: xRows[index].procurement_vendor.procurement.total_hps
						};

						console.log('>>> Index : ' + index);
						console.log('>>> Data : ' + JSON.stringify(xProcurementDetail));
					}

					xJoArrData.push({
						id: await _utilInstance.encrypt(xRows[index].id.toString(), config.cryptoKey.hashKey),
						product: xRows[index].product,
						unit: xRows[index].unit,
						currency: xRows[index].currency,
						qty: xRows[index].qty,
						unit_price: xRows[index].unit_price,
						total: xRows[index].total,
						description: xRows[index].description,

						qty_negotiation: xRows[index].qty_negotiation,
						unit_price_negotiation: xRows[index].unit_price_negotiation,
						total_negotiation: xRows[index].total_negotiation,
						description_negotiation: xRows[index].description_negotiation,

						created_at: moment(xRows[index].createdAt).format('YYYY-MM-DD hh:mm:ss'),
						created_by_name: xRows[index].created_by_name
					});
				}
				xJoResult = {
					status_code: '00',
					status_msg: 'OK',
					total_record: xResultList.count,
					data: {
						procurement_detail: xProcurementDetail,
						item: xJoArrData
					}
				};
			} else {
				xJoResult = {
					status_code: '-99',
					status_msg: 'Data not found'
				};
			}
		}

		return xJoResult;
	}

	async getById(pParam) {
		var xJoResult = {};
		var xJoData = {};
		var xFlagProcess = true;
		var xEncId = '';

		if (pParam.hasOwnProperty('id')) {
			if (pParam.id != '') {
				xEncId = pParam.id;
				var xDecId = await _utilInstance.decrypt(pParam.id, config.cryptoKey.hashKey);
				if (xDecId.status_code == '00') {
					pParam.id = xDecId.decrypted;
				} else {
					xFlagProcess = false;
					xJoResult = xDecId;
				}
			}
		}

		if (xFlagProcess) {
			var xResult = await _repoInstance.getById(pParam);

			if (xResult != null) {
				xJoData = {
					id: await _utilInstance.encrypt(xResult.id.toString(), config.cryptoKey.hashKey),
					product: xResult.product,
					unit: xResult.unit,
					currency: xResult.currency,
					qty: xResult.qty,
					description: xResult.description,
					unit_price: xResult.unit_price,

					unit_price_negotiation: xResult.unit_price_negotiation,
					qty_negotiation: xResult.qty_negotiation,
					total_negotiation: xResult.total_negotiation,
					description_negotiation: xResult.description_negotiation,

					created_at: moment(xResult.createdAt).format('YYYY-mm-dd H:i:s'),
					created_by_name: xResult.created_by_name
				};

				xJoResult = {
					status_code: '00',
					status_msg: 'OK',
					data: xJoData
				};
			} else {
				xJoResult = {
					status_code: '-99',
					status_msg: 'Data not found'
				};
			}
		}

		return xJoResult;
	}

	async save(pParam) {
		var xJoResult;
		var xAct = pParam.act;
		var xFlagProcess = true;

		delete pParam.act;

		if (xFlagProcess) {
			// Only update, add via invite
			if (xAct == 'update') {
				var xDecId = await _utilInstance.decrypt(pParam.id, config.cryptoKey.hashKey);
				if (xDecId.status_code == '00') {
					pParam.id = xDecId.decrypted;
					xDecId = await _utilInstance.decrypt(pParam.user_id, config.cryptoKey.hashKey);
					if (xDecId.status_code == '00') {
						pParam.updated_by = xDecId.decrypted;
						pParam.updated_by_name = pParam.user_name;
					} else {
						xFlagProcess = false;
						xJoResult = xDecId;
					}
				} else {
					xFlagProcess = false;
					xJoResult = xDecId;
				}

				if (xFlagProcess) {
					var xProcurementDetail = await _repoInstance.getById(pParam);

					if (xProcurementDetail != null) {
						if (xProcurementDetail.status == 1) {
							pParam.total = xProcurementDetail.qty * pParam.unit_price;

							var xAddResult = await _repoInstance.save(pParam, xAct);
							xJoResult = xAddResult;
						} else if (xProcurementDetail.status == 2) {
							xJoResult = {
								status_code: '-99',
								status_msg: 'You can not update item when procurement has been closed'
							};
						} else {
							xJoResult = {
								status_code: '-99',
								status_msg: 'You can not update item when procurement has been inactive / cancel.'
							};
						}
					} else {
						xJoResult = {
							status_code: '-99',
							status_msg: 'The Procurement ID that supplied not exist.'
						};
					}
				}
			} else if (xAct == 'update_after_negotiation') {
				var xDecId = await _utilInstance.decrypt(pParam.id, config.cryptoKey.hashKey);
				if (xDecId.status_code == '00') {
					pParam.id = xDecId.decrypted;
					xDecId = await _utilInstance.decrypt(pParam.user_id, config.cryptoKey.hashKey);
					if (xDecId.status_code == '00') {
						pParam.update_negotiate_at = await _utilInstance.getCurrDateTime();
						pParam.update_negotiate_by = xDecId.decrypted;
						pParam.update_negotiate_by_name = pParam.user_name;
					} else {
						xFlagProcess = false;
						xJoResult = xDecId;
					}
				} else {
					xFlagProcess = false;
					xJoResult = xDecId;
				}

				if (xFlagProcess) {
					var xProcurementDetail = await _repoInstance.getById(pParam);
					if (xProcurementDetail != null) {
						if (xProcurementDetail.status == 1) {
							pParam.total_negotiation = pParam.qty_negotiation * pParam.unit_price_negotiation;
							var xAddResult = await _repoInstance.save(pParam, xAct);
							xJoResult = xAddResult;
						} else {
							xJoResult = {
								status_code: '-99',
								status_msg: 'You can not update item when procurement has been cancel or closed'
							};
						}
					} else {
						xJoResult = {
							status_code: '-99',
							status_msg: 'The Procurement ID that supplied not exist.'
						};
					}
				}
			}
		}

		return xJoResult;
	}
}

module.exports = ProcurementQuotationItemService;
