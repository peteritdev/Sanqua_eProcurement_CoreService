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
const PaymentRequestDetailRepository = require('../repository/paymentrequestdetailrepository.js');
const _repoInstance = new PaymentRequestDetailRepository();

const PaymentRequestRepository = require('../repository/paymentrequestrepository.js');
const _paymentRequestRepoInstance = new PaymentRequestRepository();

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

const _xClassName = 'PaymentRequestDetailService';

class PaymentRequestDetailService {
	constructor() {}
	async save(pParam) {
		var xJoResult;
		var xAct = pParam.act;
		var xFlagProcess = false;
		var xDecId = null;
		var xRequestIdClear = 0;

		// console.log(`>>> pParam [PaymentRequestDetailService] : ${JSON.stringify(pParam)}`);

		delete pParam.act;

		var xMethod = pParam.method;
		var xToken = pParam.token;

		if (pParam.hasOwnProperty('user_id') && pParam.hasOwnProperty('payment_request_id')) {
			if (pParam.user_id != '') {
				
				xDecId = await _utilInstance.decrypt(pParam.payment_request_id, config.cryptoKey.hashKey);
				if (xDecId.status_code == '00') {
					pParam.payment_request_id = xDecId.decrypted;
					var xPaymentRequest = await _paymentRequestRepoInstance.getByParameter({
						id: pParam.payment_request_id,
						method: xMethod,
						token: xToken
					});
					console.log(`>>> xPaymentRequest : ${JSON.stringify(xPaymentRequest)}`);
		
					if (xPaymentRequest != null) {
						if (xPaymentRequest.status_code == '00') {
							if (xPaymentRequest.data.status == 0) {
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
									status_msg: 'This Payreq already submitted. You can not take an action now.'
								};
							}
						} else {
							xJoResult = xPaymentRequest;
						}
					} else {
						xJoResult = {
							status_code: '-99',
							status_msg: 'Payment request not found'
						};
					}
				} else {
					xJoResult = xDecId;
				}
			} else {
				xJoResult = {
					status_code: '-99',
					status_msg: 'Parameter user_id and payment_request_id can not be empty'
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
				var xPaymentRequestDetail = null,
					xProductDetail = null,
					xVendorDetail = null;

				if (pParam.hasOwnProperty('product_id')) {
					if (pParam.product_id != null) {
						// Check first whether product_id and vendor_id already exists in detail or not
						xPaymentRequestDetail = await _repoInstance.getByProductId({
							product_id: pParam.product_id,	
							payment_request_id: pParam.payment_request_id
						});
					}
				}
				// console.log(`>>> xPaymentRequestDetail : ${JSON.stringify(xPaymentRequestDetail)}`);
				// console.log(Math.round((xPaymentRequestDetail.qty_request + pParam.qty_request) * 1000) / 1000);

				if (
					xPaymentRequestDetail != null &&
					xPaymentRequestDetail.price_request == pParam.price_request
				) {
					var xParamUpdate = {
						id: xPaymentRequestDetail.id,
						qty_request: Math.round((xPaymentRequestDetail.qty_request + pParam.qty_request) * 1000) / 1000,
						price_total:
							Math.round(
								(xPaymentRequestDetail.qty_request + pParam.qty_request) *
									xPaymentRequestDetail.price_request *
									1000
							) / 1000
					};
					pParam = null;
					pParam = xParamUpdate;

					xAct = 'update';
				} else {
					console.log(`>>> pParam CEK CEK CEK : ${JSON.stringify(pParam)}`);
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

					pParam.price_total = Math.round(pParam.qty_request * pParam.price_request * 1000) / 1000;
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
						var xPaymentRequestDetail = await _repoInstance.getByProductId({
							payment_request_id: pParam.payment_request_id,
							product_id: xItems[i].product_id
						});

						if (
							xPaymentRequestDetail != null &&
							xPaymentRequestDetail.price_request == xItems[i].price_request
						) {
							var xParamUpdate = {
								id: xPaymentRequestDetail.id,
								qty: Math.round((xPaymentRequestDetail.qty_request + xItems[i].qty_request) * 1000) / 1000,
								price_total:
									Math.round(
										(xPaymentRequestDetail.qty_request + xItems[i].qty_request) *
											xPaymentRequestDetail.price_request *
											1000
									) / 1000
							};

							xItems[i] = null;
							xItems[i] = xParamUpdate;
							xItems[i].payment_request_id = xRequestIdClear;

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

							xItems[i].price_total =
								Math.round(xItems[i].qty_request * xItems[i].price_request * 1000) / 1000;
							xItems[i].payment_request_id = xRequestIdClear;
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
					if (pParam.hasOwnProperty('qty_request')) {
						if (pParam.hasOwnProperty('price_request')) {
							pParam.price_total =
								Math.round(pParam.qty_request * pParam.price_request * 1000) / 1000;
						}
					}

					// console.log(`>>> editDetail : ${JSON.stringify(pParam)}`);
					var xUpdateResult = await _repoInstance.save(pParam, xAct);
					xJoResult = xUpdateResult;
				}
			}
		}

		return xJoResult;
	}
	
	async dropdown(pParam) {
		var xJoResult = {};
		var xJoArrData = [];

		try {
			if (pParam.hasOwnProperty('purchase_request_id')) {
				if (pParam.purchase_request_id != '') {
					// xEncId = pParam.purchase_request_id;
					let xDecId = await _utilInstance.decrypt(pParam.purchase_request_id, config.cryptoKey.hashKey);
					if (xDecId.status_code == '00') {
						pParam.purchase_request_id = xDecId.decrypted;
					}
				}
			}

			var xResultList = await _repoInstance.dropdown(pParam);
			if (xResultList) {
				// console.log(`>>> xResultList: ${JSON.stringify(xResultList)}`);
				if (xResultList.status_code == '00') {
					var xRows = xResultList.data;
					if (xRows.length > 0) {
						for (var i in xRows) {
							xJoArrData.push({
								id: await _utilInstance.encrypt(xRows[i].id.toString(), config.cryptoKey.hashKey),
								product_id: xRows[i].product_id,
								product_code: xRows[i].product_code,
								product_name: xRows[i].product_name,
								qty_demand: xRows[i].qty_demand,
								qty_request: xRows[i].qty_request,
								qty_left: xRows[i].qty_left,
								price_demand: xRows[i].price_demand,
								qty_left: xRows[i].qty_left,
								price_request: xRows[i].price_request,
								uom_id: xRows[i].uom_id,
								uom_name: xRows[i].uom_name,
								payment_request_id: xRows[i].payment_request_id,
								document_no: xRows[i].document_no,
								vendor_name: xRows[i].vendor_name
							});
						}

						xJoResult = {
							status_code: '00',
							status_msg: 'OK',
							data: xJoArrData
						};
					} else {
						xJoResult = {
							status_code: '-99',
							status_msg: 'Data not found'
						};
					}
				} else {
					xJoResult = xResultList;
				}
			} else {
				xJoResult = xResultList;
			}
		} catch (e) {
			_utilInstance.writeLog(`${_xClassName}.list`, `Exception error: ${e.message}`, 'error');

			xJoResult = {
				status_code: '-99',
				status_msg: `${_xClassName}.list: Exception error: ${e.message}`
			};
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

module.exports = PaymentRequestDetailService;
