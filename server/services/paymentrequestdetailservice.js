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

const PurchaseRequestDetailRepository = require('../repository/purchaserequestdetailrepository.js');
const _purchaseRequestDetailRepoInstance = new PurchaseRequestDetailRepository();

const PjcaDetailRepository = require('../repository/pjcadetailrepository.js');
const _pjcaDetailRepoInstance = new PjcaDetailRepository();

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
		var xPrDetailItem = null
		var xPaymentRequest = null

		// console.log(`>>> pParam [PaymentRequestDetailService] : ${JSON.stringify(pParam)}`);

		delete pParam.act;

		var xMethod = pParam.method;
		var xToken = pParam.token;
		var xUpdateResult;

		if (pParam.hasOwnProperty('user_id') && pParam.hasOwnProperty('payment_request_id')) {
			if (pParam.user_id != '') {
				
				xDecId = await _utilInstance.decrypt(pParam.payment_request_id, config.cryptoKey.hashKey);
				if (xDecId.status_code == '00') {
					pParam.payment_request_id = xDecId.decrypted;
					xPaymentRequest = await _paymentRequestRepoInstance.getByParameter({
						id: pParam.payment_request_id,
						method: xMethod,
						token: xToken
					});
					console.log(`>>> xPaymentRequest : ${JSON.stringify(xPaymentRequest)}`);
		
					if (xPaymentRequest != null) {
						if (xPaymentRequest.status_code == '00') {
							if (xPaymentRequest.data.status == 0 || (pParam.hasOwnProperty('item_type') && pParam.item_type == 2)) {
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
		
		// console.log(`>>> pParam.prd_id : ${JSON.stringify(pParam.prd_id)}`);
		if (pParam.hasOwnProperty('prd_id')) {
			if (pParam.prd_id != null) {
				if (pParam.prd_id.length >= 65) {
					var xPrdId = await _utilInstance.decrypt(pParam.prd_id, config.cryptoKey.hashKey);
					if (xPrdId.status_code == '00') {
						pParam.prd_id = xPrdId.decrypted;
					}
				}
				
				// var xPrDetailItem = await _purchaseRequestDetailRepoInstance.getByParam({id: pParam.prd_id})
				// if (xPrDetailItem.status_code == '00') {
				// 	xFlagProcess = true;
				// } else {
				// 	xJoResult = xPaymentRequest;
				// 	xFlagProcess = false;
				// }
			}
		}

		// console.log(`>>> xPrDetailItem : ${JSON.stringify(xPrDetailItem)}`);
		// xFlagProcess = false;
		if (xFlagProcess) {
			if (xAct == 'add') {
				if (xPaymentRequest.data.app_category != 2) {
					// if payreq category no billing
					var xPaymentRequestDetail = null;
					var	xProductDetail = null;
					var	xVendorDetail = null;

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
						xPaymentRequestDetail.prd_id == pParam.prd_id
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
						
						pParam.item_type = pParam.item_type ? pParam.item_type : 1
					}
					// Validate if product_id is null (free keyin for project), estimate_fulfillment

				} else {
					// if payreq category is billing
					// type code hereee............
				}
				var xAddResult = await _repoInstance.save(pParam, xAct);
				xJoResult = xAddResult;
			} else if (xAct == 'add_batch') {
				if (pParam.hasOwnProperty('items')) {
					var xItems = pParam.items;
					var arrMsg = [];
					if (xPaymentRequest.data.app_category != 2) {
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
								xItems[i].item_type = xItems[i].item_type ? xItems[i].item_type : 1

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
					} else {
						// let xParamAddItemBatcj = [];
						for (var i in xItems) {
							Object.assign(xItems[i], {
								payment_request_id: pParam.payment_request_id,
								created_at: await _utilInstance.getCurrDateTime(),
								created_by: pParam.user_id,
								created_by_name: pParam.user_name,
								status: 0,
								is_delete: 0
							})
						}
						var xAddResult = await _repoInstance.save(xItems, xAct);
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
					// check if given param item_type = 2 then update status payreq item to -1 (revision) 
					// and create new item with item_type = 2
					console.log(`>>> ItemType : ${JSON.stringify(pParam)}`);
					if (pParam.hasOwnProperty('item_type') && pParam.item_type == 2) {
						console.log(`>>> update and create new item .>>>`);
						// get detail old item first
						const xGetCaItem = await _repoInstance.getByParam({id: pParam.id});
						if (xGetCaItem.status_code == '00') {
							// check old item already used by pjca or not, if there's one then must be deleted first
							const xCheckCreatedPJCA = await _pjcaDetailRepoInstance.getByParam({cad_id: pParam.id});
							if (xCheckCreatedPJCA.status_code == '00') {
								xUpdateResult = {
									status_code: '-99',
									status_msg: 'Item already used in PJCA, You cannot create revision item for this item'
								}
								// please cancel the PJCA then delete this item from its detail first
							} else {
								// then check if there are already created revision item with same origin_id or not
								// if yes then return error
								const xCheckRevisionItem = await _repoInstance.getByParam({origin_id: pParam.id});
								console.log(`>>> xCheckRevisionItem .>>>`, xCheckRevisionItem);
								if (xCheckRevisionItem.status_code == '-99' && xCheckRevisionItem.status_msg == 'Data not found') {
									const xUpdateOldItem = {
										id: pParam.id,
										status: -1
									}
									xUpdateResult = await _repoInstance.save(xUpdateOldItem, 'update');
									if (xUpdateResult.status_code == '00') {
										// update purchase request detail item qty_done with revised qty_request - old qty_request
										var xPrDetailItem = await _purchaseRequestDetailRepoInstance.getByParam({id: pParam.prd_id})
										if (xPrDetailItem.status_code == '00') {
											let xQtyLeft = xPrDetailItem.data.qty_paid || 0
											let xPrdUpdateParam = {
												id: pParam.prd_id,
												qty_paid: xQtyLeft - (xGetCaItem.data.qty_request - pParam.qty_request)
											}
											let xUpdatePrdItem = await _purchaseRequestDetailRepoInstance.save(xPrdUpdateParam, 'revision')
											console.log(`>>> xUpdatePrdItem .>>>`, xUpdatePrdItem);
											if (xUpdatePrdItem.status_code == '00') {
												// create new revision item
												const xAddRevisionItem = {
													origin_id: pParam.id,
													payment_request_id: pParam.payment_request_id,
													prd_id: pParam.prd_id,
													qty_request: pParam.qty_request,
													price_request: pParam.price_request,
													discount_amount: pParam.discount_amount,
													discount_percent: pParam.discount_percent,
													tax_type: pParam.tax_type,
													description: pParam.description,
													item_type: pParam.item_type,
													price_total: pParam.price_total,
													product_id: xGetCaItem.data.product_id,
													product_code: xGetCaItem.data.product_code,
													product_name: xGetCaItem.data.product_name,
													uom_id: xGetCaItem.data.uom_id,
													uom_name: xGetCaItem.data.uom_name,
													qty_done: xGetCaItem.data.qty_done
												}
												
												console.log(`>>> xAddRevisionItem .>>>`, xAddRevisionItem);
												xUpdateResult = await _repoInstance.save(xAddRevisionItem, 'add');
											}
										}
									}
								} else {
									xUpdateResult = {
										status_code: '-99',
										status_msg: 'Revision item already exists, You cannot create revision item with this item anymore'
									}
								}
							}
						} else {
							xUpdateResult = {
								status_code: '-99',
								status_msg: 'Revision failed, invalid ID of original item'
							}
						}
					} else {
						console.log(`>>> update heree 222.>>>`);
						xUpdateResult = await _repoInstance.save(pParam, xAct);
					}
					console.log(`>>> save payreq item : ${JSON.stringify(pParam)}`);
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
				console.log(`>>> xResultList: ${JSON.stringify(xResultList)}`);
				if (xResultList.status_code == '00') {
					var xRows = xResultList.data;
					if (xRows.length > 0) {
						for (var i in xRows) {
							xJoArrData.push({
								id: await _utilInstance.encrypt(xRows[i].id.toString(), config.cryptoKey.hashKey),
								product_id: xRows[i].product_id,
								product_code: xRows[i].product_code,
								product_name: xRows[i].product_name,
								// qty_demand: xRows[i].qty_demand,
								qty_request: xRows[i].qty_request,
								qty_left: xRows[i].qty_left,
								// price_demand: xRows[i].price_demand,
								price_request: xRows[i].price_request,
								uom_id: xRows[i].uom_id,
								uom_name: xRows[i].uom_name,
								payment_request_id: xRows[i].payment_request_id,
								document_no: xRows[i].document_no,
								vendor_name: xRows[i].vendor_name,
								prd_id: xRows[i].prd_id
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
			console.log(`>>> delete payment request detail with id: ${pParam}`)
			// check if item already used by pjca and its pjca status is not cancelled or not
			const xCheckPjcaDetail = await _pjcaDetailRepoInstance.getByParam({cad_id: pParam.id});
			console.log(`xCheckPjcaDetail: ${JSON.stringify(xCheckPjcaDetail)}`)
			if (xCheckPjcaDetail.status_code == '00') {
				// if (xCheckPjcaDetail.data.pjca.status != 3) { // 3 = cancelled
				xJoResult = {
					status_code: '-99',
					status_msg: 'Cannot delete item, already used in PJCA'
				};
				return xJoResult;
				// }
			}
			// get detail item first
			const xGetDetailItem = await _repoInstance.getByParam({id: pParam.id});
			if (xGetDetailItem.status_code == '00') {
				// check if deleted item type is 2 and has origin id or not,
				// if yes then update origin item status to active (0)
				if (xGetDetailItem.data.item_type == 2 && xGetDetailItem.data.origin_id) {
					var xUpdateOriginItem = await _repoInstance.save({id: xGetDetailItem.data.origin_id, status: 0}, 'update');
					if (xUpdateOriginItem.status_code == '00') {
						console.log(`>>> update origin item status: ${JSON.stringify(xUpdateOriginItem)}`);
						var xPrDetailItem = await _purchaseRequestDetailRepoInstance.getByParam({id: xGetDetailItem.data.prd_id})
						// then update purchase request detail item qty_done with original qty_request
						if (xPrDetailItem.status_code == '00') {
							let xQtyLeft = xPrDetailItem.data.qty_paid || 0

							let xPrdUpdateParam = {
								id: xGetDetailItem.data.prd_id,
								qty_paid: xQtyLeft + (Math.abs(xGetDetailItem.data.qty_request - xGetDetailItem.data.origin_detail.qty_request))
							}
							
							let xUpdatePrdItem = await _purchaseRequestDetailRepoInstance.save(xPrdUpdateParam, 'update')
						}
					}
				}
			} else {
				xJoResult = {
					status_code: '-99',
					status_msg: 'Cannot delete item, already used in PJCA'
				};
				return xJoResult;
			}
			console.log(`>>> xGetDetailItem : ${JSON.stringify(xGetDetailItem)}`);
			var xDeleteResult = await _repoInstance.delete(pParam);
			xJoResult = xDeleteResult
		}

		return xJoResult;
	}

}

module.exports = PaymentRequestDetailService;
