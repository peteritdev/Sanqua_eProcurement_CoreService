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
const PurchaseRequestDetailRepository = require('../repository/purchaserequestdetailrepository.js');
const _repoInstance = new PurchaseRequestDetailRepository();

// Service
const ProductServiceRepository = require('../services/productservice.js');
const _productServiceInstance = new ProductServiceRepository();

const VendorServiceRepository = require('../services/vendorservice.js');
const _vendorServiceInstance = new VendorServiceRepository();

const PurchaseRequestService = require('../services/purchaserequestservice.js');
const _purchaseRequestServiceInstance = new PurchaseRequestService();

const IntegrationService = require('../services/oauthservice.js');
const _integrationServiceInstance = new IntegrationService();

const _xClassName = 'PurchaseRequestDetailService';

class PurchaseRequestDetailService {
	constructor() {}

	async save(pParam) {
		var xJoResult;
		var xAct = pParam.act;
		var xFlagProcess = false;
		var xDecId = null;
		var xRequestIdClear = 0;

		console.log(`>>> pParam [PurchaseRequestDetailService] : ${JSON.stringify(pParam)}`);

		delete pParam.act;

		if (pParam.hasOwnProperty('user_id') && pParam.hasOwnProperty('request_id')) {
			// Check if the FPB status already submit or still draft.
			// If already submit, reject
			var xPurchaseRequest = await _purchaseRequestServiceInstance.getById({ id: pParam.request_id });

			if (xPurchaseRequest != null) {
				if (xPurchaseRequest.status_code == '00') {
					if (xPurchaseRequest.data.status == 0) {
						xFlagProcess = true;
					} else {
						xJoResult = {
							status_code: '-99',
							status_msg: 'This FPB already submitted. You can not take an action of this FPB.'
						};
					}
				} else {
					xJoResult = xPurchaseRequest;
				}
			}

			if (xFlagProcess) {
				if (pParam.user_id != '') {
					xDecId = await _utilInstance.decrypt(pParam.user_id, config.cryptoKey.hashKey);
					if (xDecId.status_code == '00') {
						pParam.user_id = xDecId.decrypted;
						xFlagProcess = true;
						xDecId = await _utilInstance.decrypt(pParam.request_id, config.cryptoKey.hashKey);
						if (xDecId.status_code == '00') {
							pParam.request_id = xDecId.decrypted;
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
						status_msg: 'Parameter user_id and request_id can not be empty'
					};
				}
			}
		} else {
			xJoResult = {
				status_code: '-99',
				status_msg: 'You need to supply correct parameter'
			};
		}

		if (xFlagProcess) {
			if (xAct == 'add') {
				var xPurchaseRequestDetail = null,
					xProductDetail = null,
					xVendorDetail = null;

				if (pParam.hasOwnProperty('product_id') && pParam.hasOwnProperty('vendor_id')) {
					if (pParam.product_id != '' && pParam.vendor_id != '') {
						// Check first whether product_id and vendor_id already exists in detail or not
						xPurchaseRequestDetail = await _repoInstance.getByProductIdVendorId({
							product_id: pParam.product_id,
							vendor_id: pParam.vendor_id
						});
					}
				}

				if (
					xPurchaseRequestDetail != null &&
					xPurchaseRequestDetail.budget_price_per_unit == pParam.budget_price_per_unit
				) {
					var xParamUpdate = {
						id: xPurchaseRequestDetail.id,
						qty: sequelize.literal(`qty + ${pParam.qty}`),
						budget_price_total:
							(xPurchaseRequestDetail.qty + pParam.qty) * xPurchaseRequestDetail.budget_price_per_unit
					};
					pParam = null;
					pParam = xParamUpdate;

					xAct = 'update';
				} else {
					if (pParam.hasOwnProperty('product_id')) {
						if (pParam.product_id != '') {
							// Get Product detail by Id
							xProductDetail = await _productServiceInstance.getById({
								id: await _utilInstance.encrypt(pParam.product_id.toString(), config.cryptoKey.hashKey)
							});
							if (xProductDetail != null) {
								console.log(JSON.stringify(xProductDetail));
								pParam.product_code = xProductDetail.data.code;
								pParam.product_name = xProductDetail.data.name;
							}
						}
					}

					if (pParam.hasOwnProperty('vendor_id')) {
						if (pParam.vendor_id != '') {
							// Get Vendor detail by id
							xVendorDetail = await _vendorServiceInstance.getVendorById({
								id: await _utilInstance.encrypt(pParam.vendor_id.toString(), config.cryptoKey.hashKey)
							});
							if (xVendorDetail != null) {
								pParam.vendor_code = xVendorDetail.data.code;
								pParam.vendor_name = xVendorDetail.data.name;
							}
						}
					}

					pParam.budget_price_total = pParam.qty * pParam.budget_price_per_unit;
				}

				var xAddResult = await _repoInstance.save(pParam, xAct);
				xJoResult = xAddResult;
			}
			if (xAct == 'add_batch') {
				if (pParam.hasOwnProperty('items')) {
					var xItems = pParam.items;
					for (var i in xItems) {
						// Check first whether product_id and vendor_id already exists in detail or not
						var xPurchaseRequestDetail = await _repoInstance.getByProductIdVendorId({
							product_id: xItems[i].product_id,
							vendor_id: xItems[i].vendor_id
						});

						if (
							xPurchaseRequestDetail != null &&
							xPurchaseRequestDetail.budget_price_per_unit == xItems[i].budget_price_per_unit
						) {
							var xParamUpdate = {
								id: xPurchaseRequestDetail.id,
								qty: sequelize.literal(`qty + ${xItems[i].qty}`),
								budget_price_total:
									(xPurchaseRequestDetail.qty + xItems[i].qty) *
									xPurchaseRequestDetail.budget_price_per_unit
							};

							xItems[i] = null;
							xItems[i] = xParamUpdate;

							xAct = 'update';
						} else {
							// Get Product detail by Id
							var xProductDetail = await _productServiceInstance.getById({
								id: await _utilInstance.encrypt(
									xItems[i].product_id.toString(),
									config.cryptoKey.hashKey
								)
							});
							if (xProductDetail != null) {
								console.log(JSON.stringify(xProductDetail));
								xItems[i].product_code = xProductDetail.data.code;
								xItems[i].product_name = xProductDetail.data.name;
							}

							// Get Vendor detail by id
							var xVendorDetail = await _vendorServiceInstance.getVendorById({
								id: await _utilInstance.encrypt(
									xItems[i].vendor_id.toString(),
									config.cryptoKey.hashKey
								)
							});
							if (xVendorDetail != null) {
								xItems[i].vendor_code = xVendorDetail.data.code;
								xItems[i].vendor_name = xVendorDetail.data.name;
							}

							xItems[i].budget_price_total = xItems[i].qty * xItems[i].budget_price_per_unit;
							xItems[i].request_id = xRequestIdClear;
							xItems[i].user_id = pParam.user_id;
							xItems[i].user_name = pParam.user_name;

							xAct = 'add';
						}

						var xAddResult = await _repoInstance.save(xItems[i], xAct);
						xJoResult = xAddResult;
					}
				}
			} else if (xAct == 'update') {
				xDecId = await _utilInstance.decrypt(pParam.id, config.cryptoKey.hashKey);
				if (xDecId.status_code == '00') {
					pParam.id = xDecId.decrypted;
					xFlagProcess = true;
				} else {
					xJoResult = xDecId;
				}

				if (xFlagProcess) {
					if (pParam.hasOwnProperty('qty')) {
						if (pParam.hasOwnProperty('budget_price_per_unit')) {
							pParam.budget_price_total = pParam.qty * pParam.budget_price_per_unit;
						}

						if (pParam.hasOwnProperty('quotation_price_per_unit')) {
							pParam.quotation_price_total = pParam.qty * pParam.quotation_price_per_unit;
						}
					}

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

	// Processing Odoo
	// Format: {
	//	id: '', --> id from tr_purchaserequest
	//  detail: [
	// 		{
	// 			code: '',
	// 			qty: 0
	// 		}
	// ]
	//}
	async createPR(pParam) {
		var xJoResult = {};
		var xDecId = null;
		var xFlagProcess = false;

		try {
			// Check first if status of header is "In Progress" or not
			if (pParam.hasOwnProperty('id')) {
				if (pParam.id != '' && pParam.id.length == 65) {
					let xDetail = await _purchaseRequestServiceInstance.getById(pParam);
					if (xDetail.status_code == '00') {
						if (xDetail.hasOwnProperty('data')) {
							if (xDetail.data.status.id != 2) {
								xJoResult = {
									status_code: '-99',
									status_msg:
										'You can not process this item to PR since this FPB not approved yet. Please contact the approver user first.'
								};
							} else {
								if (pParam.items.length > 0) {
									let xLineIds = [];
									for (var i in pParam.items) {
										xLineIds.push({
											product_code: pParam.items[i].product_code,
											qty: pParam.items[i].qty
										});
									}
									let xParamOdoo = {
										name: 'New',
										company_id: xDetail.data.company.id,
										date_order: await _utilInstance.getCurrDate(),
										status: 'waiting_approval',
										purchase_order_type: xDetail.data.category_pr,
										user_sanqua: pParam.logged_user_name,
										no_fpb: xDetail.data.request_no,
										line_ids: xLineIds
									};

									let xCreatePRResult = await _integrationServiceInstance.createPR(xParamOdoo);

									if (xCreatePRResult.status_code == '00') {
										if (xCreatePRResult.hasOwnProperty('name')) {
											if (xCreatePRResult.name != '') {
												if (pParam.logged_user_id != '') {
													xDecId = await _utilInstance.decrypt(
														pParam.logged_user_id,
														config.cryptoKey.hashKey
													);
													if (xDecId.status_code == '00') {
														xFlagProcess = true;
														pParam.logged_user_id = xDecId.decrypted;
													} else {
														xJoResult = xDecId;
													}
												} else {
													xFlagProcess = true;
												}

												if (xFlagProcess) {
													for (var i in pParam.items) {
														let xParamUpdate = {
															pr_no: xCreatePRResult.name,
															product_code: pParam.items[i].product_code,
															user_id: pParam.logged_user_id,
															user_name: pParam.logged_user_name
														};
														await _repoInstance.save(
															xParamUpdate,
															'update_by_product_code'
														);
													}

													xJoResult = {
														status_code: '00',
														status_msg: `You have successfully create PR with no: ${xCreatePRResult.name}`
													};
												}
											} else {
												xJoResult = {
													status_code: '-99',
													status_msg: `Failed create PR on odoo since it doesn't have PR No. Please check at Odoo System.`
												};
											}
										} else {
											xJoResult = {
												status_code: '-99',
												status_msg: `Error result from Odoo. Please contact MIS`
											};
										}
									} else {
										xJoResult = xCreatePRResult;
									}
								} else {
									xJoResult = {
										status_code: '-99',
										status_msg: 'Can not process create PR since items can not be empty.'
									};
								}
							}
						}
					} else {
						xJoResult = {
							status_code: '-99',
							status_msg: 'Data not found.'
						};
					}
				}
			}
		} catch (e) {
			xJoResult = {
				status_code: '-99',
				status_msg: `Exception error <${_xClassName}.createPR>: ${e.message}`
			};
		}

		return xJoResult;
	}
}

module.exports = PurchaseRequestDetailService;
