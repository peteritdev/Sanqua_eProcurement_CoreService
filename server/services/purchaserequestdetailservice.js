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

const LogService = require('../services/logservice.js');
const _logServiceInstance = new LogService();

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

		var xMethod = pParam.method;
		var xToken = pParam.token;

		if (pParam.hasOwnProperty('user_id') && pParam.hasOwnProperty('request_id')) {
			// Check if the FPB status already submit or still draft.
			// If already submit, reject
			var xPurchaseRequest = await _purchaseRequestServiceInstance.getById({
				id: pParam.request_id,
				method: xMethod,
				token: xToken
			});

			if (xPurchaseRequest != null) {
				if (xPurchaseRequest.status_code == '00') {
					if (xPurchaseRequest.data.status.id == 0) {
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
							vendor_id: pParam.vendor_id,
							request_id: pParam.request_id
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

				if (pParam.estimate_date_use == '') {
					pParam.estimate_date_use = null;
				}

				var xAddResult = await _repoInstance.save(pParam, xAct);
				xJoResult = xAddResult;

				if (xAddResult.status_code == '00') {
					// ---------------- Start: Add to log ----------------
					// console.log(`>>> pParam : ${JSON.stringify(pParam)}`);
					let xParamLog = {
						act: 'add',
						employee_id: pParam.employee_id,
						employee_name: pParam.employee_name,
						request_id: pParam.request_id,
						request_no: xPurchaseRequest.data.request_no,
						body: {
							act: 'add',
							msg: 'FPB Item created',
							before: null,
							after: {
								qty: pParam.qty,
								budget_price_per_unit: pParam.budget_price_per_unit,
								quotation_price_per_unit: pParam.quotation_price_per_unit,
								has_budget: pParam.has_budget,
								estimate_date_use: pParam.estimate_date_use,
								description: pParam.description,
								product_id: pParam.product_id,
								product_name: pParam.product_name,
								vendor_id: pParam.vendor_id,
								vendor_name: pParam.vendor_name,
								vendor_code: pParam.vendor_code,
								employee_id: pParam.employee_id,
								employee_name: pParam.employee_name,
								budget_price_total: pParam.budget_price_total
							}
						}
					};
					var xResultLog = await _logServiceInstance.addLog(xMethod, xToken, xParamLog);
					xJoResult.log_result = xResultLog;
				}
			} else if (xAct == 'add_batch') {
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

						if (xCatalogue.status_code == '00') {
							xItems[i].last_price = xCatalogue.data.last_price;
						}

						var xAddResult = await _repoInstance.save(xItems[i], xAct);
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
					let xItem = await _repoInstance.getByParam({ id: xClearId });

					if (pParam.hasOwnProperty('qty')) {
						if (pParam.hasOwnProperty('budget_price_per_unit')) {
							pParam.budget_price_total = pParam.qty * pParam.budget_price_per_unit;
						}

						if (pParam.hasOwnProperty('quotation_price_per_unit')) {
							pParam.quotation_price_total = pParam.qty * pParam.quotation_price_per_unit;
						}
					}

					if (pParam.estimate_date_use == '') {
						pParam.estimate_date_use = null;
					}
					var xUpdateResult = await _repoInstance.save(pParam, xAct);
					xJoResult = xUpdateResult;
					if (xUpdateResult.status_code == '00') {
						// ---------------- Start: Add to log ----------------
						// console.log(`>>> pParam.id : ${pParam.id}`);
						if (xItem.status_code == '00') {
							let xParamLog = {
								act: 'add',
								employee_id: pParam.employee_id,
								employee_name: pParam.employee_name,
								request_id: pParam.request_id,
								request_no: xPurchaseRequest.data.request_no,
								body: {
									act: 'update',
									msg: 'FPB item changed',
									before: {
										qty: xItem.data.qty,
										budget_price_per_unit: xItem.data.budget_price_per_unit,
										quotation_price_per_unit: xItem.data.quotation_price_per_unit,
										has_budget: xItem.data.has_budget,
										estimate_date_use: xItem.data.estimate_date_use,
										description: xItem.data.description,
										product_id: parseInt(xItem.data.product_id),
										product_name: xItem.data.product_name,
										vendor_id: parseInt(xItem.data.vendor_id),
										vendor_name: xItem.data.vendor_name,
										vendor_code: xItem.data.vendor_code,
										employee_id: xItem.data.employee_id,
										employee_name: xItem.data.employee_name,
										budget_price_total: xItem.data.budget_price_total
									},
									after: {
										qty: pParam.qty,
										budget_price_per_unit: pParam.budget_price_per_unit,
										quotation_price_per_unit: pParam.quotation_price_per_unit,
										has_budget: pParam.has_budget,
										estimate_date_use: pParam.estimate_date_use,
										description: pParam.description,
										product_id: pParam.product_id,
										product_name: pParam.product_name,
										vendor_id: pParam.vendor_id,
										vendor_name: pParam.vendor_name,
										vendor_code: pParam.vendor_code,
										employee_id: pParam.employee_id,
										employee_name: pParam.employee_name,
										budget_price_total: pParam.budget_price_total
									}
								}
							};
							var xResultLog = await _logServiceInstance.addLog(pParam.method, pParam.token, xParamLog);
							xJoResult.log_result = xResultLog;
						}
						// ---------------- End: Add to log ----------------
					}
				}
			}
		}

		return xJoResult;
	}

	async setToDraft(pParam) {
		var xJoResult = {};
		var xDecId = null;
		var xFlagProcess = false;

		if (pParam.hasOwnProperty('logged_user_id') && pParam.hasOwnProperty('id')) {
			if (pParam.id != '') {
				xDecId = await _utilInstance.decrypt(pParam.id, config.cryptoKey.hashKey);
				if (xDecId.status_code == '00') {
					pParam.id = xDecId.decrypted;
					xDecId = await _utilInstance.decrypt(pParam.logged_user_id, config.cryptoKey.hashKey);
					if (xDecId.status_code == '00') {
						pParam.logged_user_id = xDecId.decrypted;
						xFlagProcess = true;
					} else {
						xJoResult = xDecId;
					}
				} else {
					xJoResult = xDecId;
				}
			}
		}

		if (xFlagProcess) {
			// Get Detail of items
			let xDetail = await _repoInstance.getByParam({
				id: pParam.id
			});
			if (xDetail.status_code == '00') {
				if ([ 1, 2, 4, 6 ].includes(xDetail.data.status)) {
					xJoResult = {
						status_code: '-99',
						status_msg: 'You only can change to draft when item in CA or Cancel'
					};
				} else {
					let xParamUpdate = {
						id: pParam.id,
						status: 0,
						settodraft_at: await _utilInstance.getCurrDateTime(),
						settodraft_by: pParam.logged_user_id,
						settodraft_by_name: pParam.logged_user_name,
						settodraft_reason: pParam.settodraft_reason
					};
					var xUpdateResult = await _repoInstance.save(xParamUpdate, 'update');
					if (xUpdateResult.status_code == '00') {
						xJoResult = {
							status_code: '00',
							status_msg: 'Data has successfully set to draft'
						};
					} else {
						xJoResult = xUpdateResult;
					}
				}
			} else {
				xJoResult = xDetail;
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
		var xRequestId = null;

		console.log(`>>> pParam: ${JSON.stringify(pParam)}`);

		try {
			// Check first if status of header is "In Progress" or not
			if (pParam.hasOwnProperty('id')) {
				if (pParam.id != '' && pParam.id.length == 65) {
					let xDetail = await _purchaseRequestServiceInstance.getById(pParam);
					console.log(`>>> xDetail : ${JSON.stringify(xDetail)}`);
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

									xDecId = await _utilInstance.decrypt(xDetail.data.id, config.cryptoKey.hashKey);

									if (xDecId.status_code == '00') {
										xRequestId = xDecId.decrypted;
										xFlagProcess = true;
									}

									if (xFlagProcess) {
										xFlagProcess = false;
										for (var i in pParam.items) {
											// Check if line has create PR before, can not continue.
											xFlagProcess = false;
											xDecId = await _utilInstance.decrypt(
												pParam.items[i].id,
												config.cryptoKey.hashKey
											);
											if (xDecId.status_code == '00') {
												pParam.items[i].id = xDecId.decrypted;
												xFlagProcess = true;
											}

											if (xFlagProcess) {
												let xItemInfo = await _repoInstance.getByParam({
													id: pParam.items[i].id
												});
												console.log(`>>> xItemInfo : ${JSON.stringify(xItemInfo)}`);
												if (xItemInfo.status_code == '00') {
													// if (pParam.type == 'ca') {
													// 	if (xItemInfo.data.status != 0) {
													// 		xFlagProcess = false;
													// 		break;
													// 	}
													// } else if (pParam.type == 'po') {
													// 	if (
													// 		(xItemInfo.data.pr_no == '' || xItemInfo.data.pr_no == null) &&
													// 		xItemInfo.data.status == 0
													// 	) {
													// 		xLineIds.push({
													// 			product_code: pParam.items[i].product_code,
													// 			qty: pParam.items[i].qty
													// 		});
													// 	} else {
													// 		xFlagProcess = false;
													// 		break;
													// 	}
													// }
													if (xItemInfo.data.status != 0 && xItemInfo.data.status != 5) {
														xFlagProcess = false;
														break;
													} else {
														xLineIds.push({
															product_code: pParam.items[i].product_code,
															qty: pParam.items[i].qty,
															desc: pParam.items[i].description
														});
													}
												} else {
													xFlagProcess = false;
													break;
												}
											} else {
												xFlagProcess = false;
												break;
											}
										}

										if (xFlagProcess) {
											xFlagProcess = false;
											xDecId = null;

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
												if (pParam.type == 'ca') {
													for (var i in pParam.items) {
														let xParamUpdate = {
															product_code: pParam.items[i].product_code,
															user_id: pParam.logged_user_id,
															user_name: pParam.logged_user_name,
															status: 3,
															request_id: xRequestId
														};
														await _repoInstance.save(
															xParamUpdate,
															'update_by_product_code_and_request_id'
														);
													}

													xJoResult = {
														status_code: '00',
														status_msg: `You have successfully change item status to CA (Cash Advance)`
													};
												} else if (pParam.type == 'po') {
													// Start: This section to handle temporary when FPB from bawen will convert to TMP in odoo
													let xCompanyId = xDetail.data.company.id;
													if (xCompanyId == 10) {
														xCompanyId = 1;
													}

													let xParamOdoo = {
														name: 'New',
														// company_id: xDetail.data.company.id,
														company_id: xCompanyId,
														date_order: await _utilInstance.getCurrDate(),
														status:
															xDetail.data.category_pr != 'bahan_baku'
																? 'approved'
																: 'waiting_approval',
														purchase_order_type: xDetail.data.category_pr,
														user_sanqua: pParam.logged_user_name,
														no_fpb: xDetail.data.request_no,
														odoo_project_code: xDetail.data.hasOwnProperty('project')
															? xDetail.data.project.odoo_project_code
															: null,
														line_ids: xLineIds
													};

													console.log(`>>> xParamOdoo: ${JSON.stringify(xParamOdoo)}`);

													let xCreatePRResult = await _integrationServiceInstance.createPR(
														xParamOdoo
													);
													console.log(
														`>>> xCreatePRResult: ${JSON.stringify(xCreatePRResult)}`
													);

													if (xCreatePRResult.status_code == '00') {
														if (xCreatePRResult.hasOwnProperty('name')) {
															if (xCreatePRResult.name != '') {
																for (var i in pParam.items) {
																	let xParamUpdate = {
																		pr_no: xCreatePRResult.name,
																		product_code: pParam.items[i].product_code,
																		user_id: pParam.logged_user_id,
																		user_name: pParam.logged_user_name,
																		status:
																			xDetail.data.category_pr != 'bahan_baku'
																				? 2
																				: 1,
																		request_id: xRequestId
																	};
																	await _repoInstance.save(
																		xParamUpdate,
																		'update_by_product_code_and_request_id'
																	);
																}

																xJoResult = {
																	status_code: '00',
																	status_msg: `You have successfully create PR with no: ${xCreatePRResult.name}`
																};
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
														status_msg: 'Please supply valid parameter type.'
													};
												}
											}
										} else {
											xJoResult = {
												status_code: '-99',
												status_msg:
													'Please supply valid item id or maybe there is item that has been submit to PR.'
											};
										}
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

	async cancelPR(pParam) {
		console.log(`>>> pParam: ${JSON.stringify(pParam)}`);
		var xJoResult = {};
		var xDecId = null;
		var xFlagProcess = false;
		// Check is user data
		if (pParam.user_id != '') {
			xDecId = await _utilInstance.decrypt(pParam.user_id, config.cryptoKey.hashKey);
			if (xDecId.status_code == '00') {
				pParam.user_id = xDecId.decrypted;
				xFlagProcess = true;
			} else {
				xJoResult = xDecId;
			}
		}

		if (xFlagProcess) {
			try {
				// Check is pr_no parameter is not empty
				if (pParam.pr_no === '' || pParam.pr_no === null) {
					xJoResult = {
						status_code: '-99',
						status_msg: 'Cancel failed, no supply pr_no'
					};
				} else {
					const date = new Date();
					const local = date.toLocaleString('id');
					const updateAt = `[${local}]\n${pParam.cancel_reason}`;

					let xParamOdoo = {
						pr_name: pParam.pr_no,
						reason: updateAt
					};
					console.log(`>>> xParamOdoo: ${JSON.stringify(xParamOdoo)}`);

					// Call cancel api pr in odoo
					let xCancelPRResult = await _integrationServiceInstance.cancelPR(xParamOdoo);

					if (xCancelPRResult.status_code == '00') {
						// split pr_no into array and looping to check each number
						const arrPr = pParam.pr_no.split(',');
						let xResultMSG = [];
						for (let i in arrPr) {
							// check pr number is available in esanqua db ?
							let xData = await _repoInstance.getByPrNo({
								pr_no: arrPr[i]
							});
							if (xData != null) {
								if (xData.length > 0) {
									// change status each pr into cancel
									let xParamUpdate = {
										pr_no: arrPr[i],
										cancel_reason: updateAt,
										status: 5
									};
									let xCancelPR = await _repoInstance.save(xParamUpdate, 'update_by_pr_no');

									if (xCancelPR.status_code === '00') {
										xResultMSG.push({
											pr_no: arrPr[i],
											status_code: '00',
											status_msg: xCancelPR.status_msg
										});
									} else {
										xResultMSG.push({
											pr_no: arrPr[i],
											status_code: '-99',
											status_msg: xCancelPR.status_msg
										});
									}
								} else {
									xResultMSG.push({
										pr_no: arrPr[i],
										status_code: '-99',
										status_msg: 'Cancel failed, Data not found'
									});
								}
							} else {
								xResultMSG.push({
									pr_no: arrPr[i].pr_no,
									status_code: '-99',
									status_msg: 'Cancel failed, Data not found'
								});
							}
						}

						xJoResult = {
							status_code: '00',
							status_msg: `You have successfully update this PR`,
							data: xResultMSG
						};
						console.log('xJoResult >>>>>', xJoResult);
					} else {
						xJoResult = xCancelPRResult;
					}
				}
			} catch (error) {
				xJoResult = {
					status_code: '-99',
					status_msg: `Exception error <${_xClassName}.cancelPR>: ${e.message}`
				};
			}
		}

		return xJoResult;
	}

	async checkItem(pParam) {
		var xJoResult = {};
		var xDecId = null;
		var xFlagProcess = false;
		// Check is user data
		if (pParam.user_id != '') {
			xDecId = await _utilInstance.decrypt(pParam.user_id, config.cryptoKey.hashKey);
			if (xDecId.status_code == '00') {
				pParam.user_id = xDecId.decrypted;
				xFlagProcess = true;
			} else {
				xJoResult = xDecId;
			}
		}

		if (xFlagProcess) {
			try {
				console.log(`>>> PARAM>>>>>>: ${JSON.stringify(pParam)}`);
				if (pParam.items.length > 0) {
					let xParamOdoo = pParam;

					// Call check item api in odoo
					let xCheckItemResult = await _integrationServiceInstance.checkItem(xParamOdoo);

					if (xCheckItemResult.status_code == '00') {
						xJoResult = {
							status_code: '00',
							status_msg: xCheckItemResult.status_msg,
							data: xCheckItemResult.data[0].eSanqua
						};
					} else {
						xJoResult = xCheckItemResult;
					}
				} else {
					xJoResult = {
						status_code: '-99',
						status_msg: 'You must supply some value',
						data: null
					};
				}
			} catch (e) {
				xJoResult = {
					status_code: '-99',
					status_msg: `Exception error <${_xClassName}.checkItem>: ${e.message}`
				};
			}
		}

		return xJoResult;
	}

	async updatePo(pParam) {
		console.log(`>>> pParam: ${JSON.stringify(pParam)}`);
		var xJoResult = {};

		try {
			// Check is pr_no parameter is not empty
			if (pParam.pr_no === '' || pParam.pr_no === null) {
				xJoResult = {
					status_code: '-99',
					status_msg: 'Update failed, no supply pr_no'
				};
			} else {
				let xParamUpdate = {
					pr_no: pParam.pr_no,
					is_po_created: pParam.is_po_created
				};

				// update column with given pr
				let xUpdateResult = await _repoInstance.save(xParamUpdate, 'update_by_pr_no');

				if (xUpdateResult.status_code === '00') {
					xJoResult = {
						status_code: '00',
						status_msg: 'Update success'
					};
				} else {
					xJoResult = xUpdateResult;
				}
			}
		} catch (error) {
			xJoResult = {
				status_code: '-99',
				status_msg: `Exception error <${_xClassName}.cancelPR>: ${e.message}`
			};
		}

		return xJoResult;
	}
}

module.exports = PurchaseRequestDetailService;
