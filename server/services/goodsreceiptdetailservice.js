const jwt = require('jsonwebtoken');
const md5 = require('md5');
const crypto = require('crypto');
const moment = require('moment');
const sequelize = require('sequelize');
const dateFormat = require('dateformat');
const Op = sequelize.Op;
const bcrypt = require('bcrypt');
const fs = require('fs');

const env = process.env.NODE_ENV || 'localhost';
const config = require(__dirname + '/../config/config.json')[env];

// Utility
const Utility = require('peters-globallib-v2');
const _utilInstance = new Utility();

// Repository
const GoodsReceiptDetailRepository = require('../repository/goodsreceiptdetailrepository.js');
const _repoInstance = new GoodsReceiptDetailRepository();

const GoodsReceiptRepository = require('../repository/goodsreceiptrepository.js');
const _goodsReceiptRepoInstance = new GoodsReceiptRepository();

// Service
const ProductServiceRepository = require('./productservice.js');
const _productServiceInstance = new ProductServiceRepository();

const VendorServiceRepository = require('./vendorservice.js');
const _vendorServiceInstance = new VendorServiceRepository();

const IntegrationService = require('./oauthservice.js');
const _integrationServiceInstance = new IntegrationService();

const LogService = require('./logservice.js');
const e = require('express');
const _logServiceInstance = new LogService();

// const NotificationService = require('./notificationservice.js');
// const _notificationService = new NotificationService();

const _xClassName = 'GoodsReceiptDetailService';

class GoodsReceiptDetailService {
	constructor() {}
	async save(pParam) {
		var xJoResult;
		var xAct = pParam.act;
		var xFlagProcess = false;
		var xDecId = null;
		var xRequestIdClear = 0;

		// console.log(`>>> pParam [GoodsReceiptDetailService] : ${JSON.stringify(pParam)}`);

		delete pParam.act;

		var xMethod = pParam.method;
		var xToken = pParam.token;

		if (pParam.hasOwnProperty('user_id') && pParam.hasOwnProperty('goods_receipt_id')) {
			if (pParam.user_id != '') {
				
				xDecId = await _utilInstance.decrypt(pParam.goods_receipt_id, config.cryptoKey.hashKey);
				if (xDecId.status_code == '00') {
					pParam.goods_receipt_id = xDecId.decrypted;
					var xGoodsReceipt = await _goodsReceiptRepoInstance.getByParameter({
						id: pParam.goods_receipt_id,
						method: xMethod,
						token: xToken
					});
					console.log(`>>> xGoodsReceipt : ${JSON.stringify(xGoodsReceipt)}`);
		
					if (xGoodsReceipt != null) {
						if (xGoodsReceipt.status_code == '00') {
							if (xGoodsReceipt.data.status == 0) {
								xDecId = await _utilInstance.decrypt(pParam.user_id, config.cryptoKey.hashKey);
								if (xDecId.status_code == '00') {
									pParam.user_id = xDecId.decrypted;
									xFlagProcess = true;
									// xDecId = await _utilInstance.decrypt(pParam.id, config.cryptoKey.hashKey);
									// if (xDecId.status_code == '00') {
									// 	pParam.id = xDecId.decrypted;
									// 	xRequestIdClear = xDecId.decrypted;
									// 	xFlagProcess = true;
									// } else {
									// 	xJoResult = xDecId;
									// }
								} else {
									xJoResult = xDecId;
								}

							} else {
								xJoResult = {
									status_code: '-99',
									status_msg: 'This GR already submitted. You can not take an action now.'
								};
							}
						} else {
							xJoResult = xGoodsReceipt;
						}
					} else {
						xJoResult = {
							status_code: '-99',
							status_msg: 'GR not found'
						};
					}
				} else {
					xJoResult = xDecId;
				}
			} else {
				xJoResult = {
					status_code: '-99',
					status_msg: 'Parameter user_id and goods_receipt_id can not be empty'
				};
			}
		} else {
			xJoResult = {
				status_code: '-99',
				status_msg: 'You need to supply correct parameter'
			};
		}

		if (pParam.hasOwnProperty('prd_id')) {
			if (pParam.prd_id != null) {
				if (pParam.prd_id.length >= 65) {
					var xPrdId = await _utilInstance.decrypt(pParam.prd_id, config.cryptoKey.hashKey);
					if (xPrdId.status_code == '00') {
						pParam.prd_id = xPrdId.decrypted;
					}
				}
			}
		}

		if (xFlagProcess) {
			if (xAct == 'add') {
				var xGoodsReceiptDetail = null,
					xProductDetail = null,
					xVendorDetail = null;

				if (pParam.hasOwnProperty('product_id')) {
					if (pParam.product_id != null) {
						// Check first whether product_id and vendor_id already exists in detail or not
						xGoodsReceiptDetail = await _repoInstance.getByProductId({
							product_id: pParam.product_id,	
							goods_receipt_id: pParam.goods_receipt_id
						});
					}
				}

				if (
					xGoodsReceiptDetail != null &&
					xGoodsReceiptDetail.prd_id == pParam.prd_id
				) {
					var xParamUpdate = {
						id: xGoodsReceiptDetail.id,
						qty_done: Math.round((xGoodsReceiptDetail.qty_done + pParam.qty_done) * 1000) / 1000
					};
					pParam = null;
					pParam = xParamUpdate;

					xAct = 'update';
				} else {
					// console.log(`>>> pParam CEK CEK CEK : ${JSON.stringify(pParam)}`);
					if (pParam.hasOwnProperty('product_id')) {
						if (pParam.product_id != null) {
							// Get Product detail by Id
							xProductDetail = await _productServiceInstance.getById({
								id: await _utilInstance.encrypt(pParam.product_id.toString(), config.cryptoKey.hashKey)
							});
							if (xProductDetail != null) {
								// console.log(JSON.stringify(xProductDetail));
								pParam.product_code = xProductDetail.data.code;
								pParam.product_name = xProductDetail.data.name;
							}
						}
					}

					// pParam.price_total = Math.round(pParam.qty_request * pParam.price_request * 1000) / 1000;
				}
				// Validate if product_id is null (free keyin for project), estimate_fulfillment

				var xAddResult = await _repoInstance.save(pParam, xAct);
				xJoResult = xAddResult;
			} else if (xAct == 'add_batch') {
				if (pParam.hasOwnProperty('items')) {
					var xItems = pParam.items;
					var arrMsg = [];
					for (var i in xItems) {
						// Check first whether product_id and vendor_id already exists in detail or not
						var xGoodsReceiptDetail = await _repoInstance.getByProductId({
							goods_receipt_id: pParam.goods_receipt_id,
							product_id: xItems[i].product_id
						});

						if (
							xGoodsReceiptDetail != null &&
							xGoodsReceiptDetail.prd_id == xItems[i].prd_id
						) {
							var xParamUpdate = {
								id: xGoodsReceiptDetail.id,
								qty_done: Math.round((xGoodsReceiptDetail.qty_done + xItems[i].qty_done) * 1000) / 1000
							};

							xItems[i] = null;
							xItems[i] = xParamUpdate;
							xItems[i].goods_receipt_id = xRequestIdClear;

							xAct = 'update';
						} else {
							// Get Product detail by Id
							if (xItems[i].product_id !== null) {
								var xProductDetail = await _productServiceInstance.getById({
									id: await _utilInstance.encrypt(
										xItems[i].product_id.toString(),
										config.cryptoKey.hashKey
									)
								});
								if (xProductDetail != null) {
									// console.log(JSON.stringify(xProductDetail));
									xItems[i].product_code = xProductDetail.data.code;
									xItems[i].product_name = xProductDetail.data.name;
								}
							}

							// xItems[i].price_total =
							// 	Math.round(xItems[i].qty_request * xItems[i].price_request * 1000) / 1000;
							xItems[i].goods_receipt_id = xRequestIdClear;
							xItems[i].user_id = pParam.user_id;
							xItems[i].user_name = pParam.user_name;

							xAct = 'add';
						}

						// if (xCatalogue.status_code == '00') {
						// 	xItems[i].last_price = xCatalogue.data.last_price;
						// }
						var xAddResult = await _repoInstance.save(xItems[i], xAct);
						arrMsg.push({
							index: i,
							status_code: xAddResult.status_code,
							status_msg: xAddResult.status_msg
						});
						xJoResult = xAddResult;
					}
				}
			} else if (xAct == 'update') {
				let xClearId = 0;
				xDecId = await _utilInstance.decrypt(pParam.id, config.cryptoKey.hashKey);
				if (xDecId.status_code == '00') {
					pParam.id = xDecId.decrypted;
					xClearId = xDecId.decrypted;
					xFlagProcess = true;
				} else {
					xJoResult = xDecId;
				}

				if (xFlagProcess) {
					// if (pParam.hasOwnProperty('qty_request')) {
					// 	if (pParam.hasOwnProperty('price_request')) {
					// 		pParam.price_total =
					// 			Math.round(pParam.qty_request * pParam.price_request * 1000) / 1000;
					// 	}
					// }

					// console.log(`>>> editDetail : ${JSON.stringify(pParam)}`);
					var xUpdateResult = await _repoInstance.save(pParam, xAct);
					xJoResult = xUpdateResult;
				}
			}
		}

		return xJoResult;
	}

	async delete(pParam) {
		var xJoResult = {};
		var xFlagProcess = false;
		var xDecId = null;

		if (pParam.id != '') {
			xDecId = await _utilInstance.decrypt(pParam.id, config.cryptoKey.hashKey);
			if (xDecId.status_code == '00') {
				xFlagProcess = true;
				pParam.id = xDecId.decrypted;
			} else {
				xJoResult = xDecId;
			}
		}

		if (xFlagProcess) {
			var xDeleteResult = await _repoInstance.delete(pParam);
			xJoResult = xDeleteResult;
		}

		return xJoResult;
	}
}

module.exports = GoodsReceiptDetailService;
