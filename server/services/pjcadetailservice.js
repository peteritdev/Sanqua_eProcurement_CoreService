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
const PJCADetailRepository = require('../repository/pjcadetailrepository.js');
const _repoInstance = new PJCADetailRepository();

const PJCARepository = require('../repository/pjcarepository.js');
const _PJCARepoInstance = new PJCARepository();

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

const _xClassName = 'PJCADetailService';

class PJCADetailService {
	constructor() {}
	async save(pParam) {
		var xJoResult;
		var xAct = pParam.act;
		var xFlagProcess = false;
		var xDecId = null;
		var xRequestIdClear = 0;

		// console.log(`>>> pParam [PJCADetailService] : ${JSON.stringify(pParam)}`);

		delete pParam.act;

		var xMethod = pParam.method;
		var xToken = pParam.token;

		if (pParam.hasOwnProperty('user_id') && pParam.hasOwnProperty('pjca_id')) {
			if (pParam.user_id != '') {
				
				xDecId = await _utilInstance.decrypt(pParam.pjca_id, config.cryptoKey.hashKey);
				if (xDecId.status_code == '00') {
					pParam.pjca_id = xDecId.decrypted;
					var xPJCA = await _PJCARepoInstance.getByParameter({
						id: pParam.pjca_id,
						method: xMethod,
						token: xToken
					});
					console.log(`>>> xPJCA : ${JSON.stringify(xPJCA)}`);
		
					if (xPJCA != null) {
						if (xPJCA.status_code == '00') {
							if (xPJCA.data.status == 0) {
								xDecId = await _utilInstance.decrypt(pParam.user_id, config.cryptoKey.hashKey);
								if (xDecId.status_code == '00') {
									pParam.user_id = xDecId.decrypted;
									xFlagProcess = true;
									xDecId = await _utilInstance.decrypt(pParam.id, config.cryptoKey.hashKey);
									if (xDecId.status_code == '00') {
										pParam.id = xDecId.decrypted;
										xRequestIdClear = xDecId.decrypted;
										xFlagProcess = true;
									} else {
										xJoResult = xDecId;
									}
								} else {
									xJoResult = xDecId;
								}

							} else {
								xJoResult = {
									status_code: '-99',
									status_msg: 'This PJCA submitted. You can not take an action now.'
								};
							}
						} else {
							xJoResult = xPJCA;
						}
					} else {
						xJoResult = {
							status_code: '-99',
							status_msg: 'PJCA not found'
						};
					}
				} else {
					xJoResult = xDecId;
				}
			} else {
				xJoResult = {
					status_code: '-99',
					status_msg: 'Parameter user_id and pjca_id can not be empty'
				};
			}
		} else {
			xJoResult = {
				status_code: '-99',
				status_msg: 'You need to supply correct parameter'
			};
		}

		if (xFlagProcess) {
			if (xAct == 'add') {
				var xPJCADetail = null,
					xProductDetail = null,
					xVendorDetail = null;

				if (pParam.hasOwnProperty('product_id')) {
					if (pParam.product_id != null) {
						// Check first whether product_id and vendor_id already exists in detail or not
						xPJCADetail = await _repoInstance.getByProductId({
							product_id: pParam.product_id,	
							pjca_id: pParam.pjca_id
						});
					}
				}

				if (
					xPJCADetail != null
				) {
					var xParamUpdate = {
						id: xPJCADetail.id,
						// qty_done: Math.round((xPJCADetail.qty_done + pParam.qty_done) * 1000) / 1000
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
						var xPJCADetail = await _repoInstance.getByProductId({
							pjca_id: pParam.pjca_id,
							product_id: xItems[i].product_id
						});

						if (
							xPJCADetail != null
						) {
							var xParamUpdate = {
								id: xPJCADetail.id,
								// qty: Math.round((xPJCADetail.qty_request + xItems[i].qty_request) * 1000) / 1000
							};

							xItems[i] = null;
							xItems[i] = xParamUpdate;
							xItems[i].pjca_id = xRequestIdClear;

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
							xItems[i].pjca_id = xRequestIdClear;
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
}

module.exports = PJCADetailService;
