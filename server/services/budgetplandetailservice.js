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
const BudgetPlanDetailRepository = require('../repository/budgetplandetailrepository.js');
const _repoInstance = new BudgetPlanDetailRepository();

// Service
const ProductServiceRepository = require('../services/productservice.js');
const _productServiceInstance = new ProductServiceRepository();

const VendorCatalogueService = require('../services/vendorcatalogueservice.js');
const _catalogueService = new VendorCatalogueService();

const VendorServiceRepository = require('../services/vendorservice.js');
const _vendorServiceInstance = new VendorServiceRepository();

const BudgetPlanService = require('../services/budgetplanservice.js');
const _budgetPlanServiceInstance = new BudgetPlanService();

const IntegrationService = require('../services/oauthservice.js');
const _integrationServiceInstance = new IntegrationService();

const LogService = require('../services/logservice.js');
const e = require('express');
const _logServiceInstance = new LogService();

const _xClassName = 'BudgetDetailDetailService';

class BudgetPlanDetailService {
    constructor() { }
    
	async list(pParam) {
		var xJoResult = {};
		var xJoArrData = [];
		var xDecId = null;
		var xFlagProccess = false;

		try {
			var xResultList = await _repoInstance.list(pParam);
			if (xResultList) {
				console.log(`>>> xResultList: ${JSON.stringify(xResultList)}`);
				if (xResultList.status_code == '00') {
					var xRows = xResultList.data.rows;
					if (xRows.length > 0) {
						for (var i in xRows) {
							xJoArrData.push({
								id: await _utilInstance.encrypt(xRows[i].id.toString(), config.cryptoKey.hashKey),
								request_id: xRows[i].request_id,
								product_id: xRows[i].product_id,
								product_code: xRows[i].product_code,
								product_name: xRows[i].product_name,
								category_id: xRows[i].category_id,
								category_name: xRows[i].category_name,
								dimension: xRows[i].dimension,
								merk: xRows[i].merk,
								type: xRows[i].type,
								material: xRows[i].material,
								photo: xRows[i].photo,
								description: xRows[i].description,

								qty: xRows[i].qty,
								qty_remain: xRows[i].qty_remain,
								budget_price_per_unit: xRows[i].budget_price_per_unit,
								budget_price_total: xRows[i].budget_price_total,
								estimate_date_use: moment(xRows[i].estimate_date_use).format('DD MMM YYYY HH:mm:ss'),
								vendor_id: xRows[i].vendor_id,
								vendor_code: xRows[i].vendor_code,
								vendor_name: xRows[i].vendor_name,
								vendor_catalogue_id: xRows[i].vendor_catalogue_id,
								vendor_recomendation: xRows[i].vendor_recomendation,
								budget_plan: xRows[i].budget_plan
							});
						}

						xJoResult = {
							status_code: '00',
							status_msg: 'OK',
							total_record: xResultList.total_record,
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
	
	async save(pParam) {
		var xJoResult;
		var xAct = pParam.act;
		var xFlagProcess = false;
		var xDecId = null;
		var xRequestIdClear = 0;

		// console.log(`>>> pParam [PurchaseRequestDetailService] : ${JSON.stringify(pParam)}`);

		delete pParam.act;

		var xMethod = pParam.method;
		var xToken = pParam.token;

		if (pParam.hasOwnProperty('user_id') && pParam.hasOwnProperty('request_id')) {
			// Check if the RAB status already submit or still draft.
			// If already submit, reject
			var xBudgetPlan = await _budgetPlanServiceInstance.getById({
				id: pParam.request_id,
				method: xMethod,
				token: xToken
			});

			if (xBudgetPlan != null) {
				if (xBudgetPlan.status_code == '00') {
					if (xBudgetPlan.data.status.id == 0) {
						xFlagProcess = true;
					} else {
						xJoResult = {
							status_code: '-99',
							status_msg: 'This RAB already submitted. You can not take an action of this RAB.'
						};
					}
				} else {
					xJoResult = xBudgetPlan;
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
				var xBudgetPlanDetail = null,
					xProductDetail = null,
					xVendorDetail = null;

				// if (pParam.hasOwnProperty('product_id') && pParam.hasOwnProperty('vendor_id')) {
				// 	if (pParam.product_id != null && pParam.vendor_id != null) {
				// 		// Check first whether product_id and vendor_id already exists in detail or not
				// 		xBudgetPlanDetail = await _repoInstance.getByProductIdVendorId({
				// 			product_id: pParam.product_id,
				// 			vendor_id: pParam.vendor_id,
				// 			request_id: pParam.request_id
				// 		});
				// 	}
				// }

				// if (
				// 	xBudgetPlanDetail != null &&
				// 	xBudgetPlanDetail.budget_price_per_unit == pParam.budget_price_per_unit
				// ) {
				// 	var xParamUpdate = {
				// 		id: xBudgetPlanDetail.id,
				// 		qty: sequelize.literal(`qty + ${pParam.qty}`),
				// 		budget_price_total:
				// 			(xBudgetPlanDetail.qty + pParam.qty) * xBudgetPlanDetail.budget_price_per_unit
				// 	};
				// 	pParam = null;
				// 	pParam = xParamUpdate;

				// 	xAct = 'update';
				// } else {
					// console.log(`>>> pParam CEK CEK CEK : ${JSON.stringify(pParam)}`);
                if (pParam.hasOwnProperty('product_id')) {
                    if (pParam.product_id != null) {
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
                    if (pParam.vendor_id != null) {
                        // Get Vendor detail by id
                        xVendorDetail = await _vendorServiceInstance.getVendorById({
                            id: await _utilInstance.encrypt(pParam.vendor_id.toString(), config.cryptoKey.hashKey)
                        });
                        if (xVendorDetail != null) {
                            pParam.vendor_code = xVendorDetail.data.code;
                            pParam.vendor_name = xVendorDetail.data.name; // test
                        }
                    }
                }

                pParam.budget_price_total = pParam.qty * pParam.budget_price_per_unit;
                pParam.qty_remain = pParam.qty;
				// }

				if (pParam.estimate_date_use == '') {
					pParam.estimate_date_use = null;
				}

				// Validate if product_id is null (free keyin for project), estimate_fulfillment

				var xAddResult = await _repoInstance.save(pParam, xAct);
				xJoResult = xAddResult;

				// if (xAddResult.status_code == '00') {
				// 	// ---------------- Start: Add to log ----------------
				// 	// console.log(`>>> pParam : ${JSON.stringify(pParam)}`);
				// 	let xParamLog = {
				// 		act: 'add',
				// 		employee_id: pParam.employee_id,
				// 		employee_name: pParam.employee_name,
				// 		request_id: pParam.request_id,
				// 		request_no: xBudgetPlan.data.budget_no,
				// 		body: {
				// 			act: 'add',
				// 			msg: 'RAB Item created',
				// 			before: null,
				// 			after: {
				// 				qty: pParam.qty,
				// 				budget_price_per_unit: pParam.budget_price_per_unit,
				// 				quotation_price_per_unit: pParam.quotation_price_per_unit,
				// 				has_budget: pParam.has_budget,
				// 				estimate_date_use: pParam.estimate_date_use,
				// 				description: pParam.description,
				// 				product_id: pParam.product_id,
				// 				product_name: pParam.product_name,
				// 				vendor_id: pParam.vendor_id,
				// 				vendor_name: pParam.vendor_name,
				// 				vendor_code: pParam.vendor_code,
				// 				employee_id: pParam.employee_id,
				// 				employee_name: pParam.employee_name,
				// 				budget_price_total: pParam.budget_price_total
				// 			}
				// 		}
				// 	};
				// 	var xResultLog = await _logServiceInstance.addLog(xMethod, xToken, xParamLog);
				// 	xJoResult.log_result = xResultLog;
				// }
			} else if (xAct == 'add_batch') {
				if (pParam.hasOwnProperty('items')) {
					var xItems = pParam.items;
					for (var i in xItems) {
						// Check first whether product_id and vendor_id already exists in detail or not
						var xBudgetPlanDetail = await _repoInstance.getByProductIdVendorId({
							product_id: xItems[i].product_id,
							vendor_id: xItems[i].vendor_id
						});

						if (
							xBudgetPlanDetail != null &&
							xBudgetPlanDetail.budget_price_per_unit == xItems[i].budget_price_per_unit
						) {
							var xParamUpdate = {
								id: xBudgetPlanDetail.id,
								qty: sequelize.literal(`qty + ${xItems[i].qty}`),
								qty_remain: sequelize.literal(`qty_remain + ${xItems[i].qty}`),
								budget_price_total:
									(xBudgetPlanDetail.qty + xItems[i].qty) *
									xBudgetPlanDetail.budget_price_per_unit
							};

							xItems[i] = null;
							xItems[i] = xParamUpdate;

							xAct = 'update';
						} else {
							// Get item from etalase ecatalogue
							// Get vendor catalog by product_code & vendor_code
							let xCatalogue = await _catalogueService.getByVendorCodeAndProductCode({
								vendor_code: xItems[i].vendor_code,
								product_code: xItems[i].product_code
							});

							if (xCatalogue.status_code == '00') {
								// xItems[i].last_price = xCatalogue.data.last_price;
								xItems[i].uom_id = xCatalogue.data.uom_id;
								xItems[i].uom_name = xCatalogue.data.uom_name;
								// xItems[i].merk = xCatalogue.data.merk;
								// xItems[i].description = xCatalogue.data.spesification;
								if (xCatalogue.data.product.category !== undefined) {
									xItems[i].category_id = xCatalogue.data.product.category.id;
									xItems[i].category_name = xCatalogue.data.product.category.name;
								}
							}
							
							// if (xItems[i].product_id !== null) {
							// 	var xProductDetail = await _productServiceInstance.getById({
							// 		id: await _utilInstance.encrypt(
							// 			xItems[i].product_id.toString(),
							// 			config.cryptoKey.hashKey
							// 		)
							// 	});
							// 	console.log('Add Batch Detail | Product >>>>', xProductDetail);
							// 	if (xProductDetail != null) {
							// 		// console.log(JSON.stringify(xProductDetail));
							// 		xItems[i].product_code = xProductDetail.data.code;
							// 		xItems[i].product_name = xProductDetail.data.name;
							// 	}
							// }

							// // Get Vendor detail by id
							// if (xItems[i].vendor_id !== null) {
							// 	var xVendorDetail = await _vendorServiceInstance.getVendorById({
							// 		id: await _utilInstance.encrypt(
							// 			xItems[i].vendor_id.toString(),
							// 			config.cryptoKey.hashKey
							// 		)
							// 	});
	
							// 	if (xVendorDetail != null) {
							// 		xItems[i].vendor_code = xVendorDetail.data.code;
							// 		xItems[i].vendor_name = xVendorDetail.data.name;
							// 	}
							// }

							xItems[i].qty_remain = xItems[i].qty;
							xItems[i].budget_price_total = xItems[i].qty * xItems[i].budget_price_per_unit;
							xItems[i].request_id = xRequestIdClear;
							xItems[i].user_id = pParam.user_id;
							xItems[i].user_name = pParam.user_name;

							xAct = 'add';
						}

						// if (xCatalogue.status_code == '00') {
						// 	xItems[i].last_price = xCatalogue.data.last_price;
						// }
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
                
                    if (pParam.hasOwnProperty('id')) {
						let xItem = await _repoInstance.getByParam({ id: xClearId });
						if (xItem.length > 0) {
							if (pParam.hasOwnProperty('qty')) {
								if (pParam.hasOwnProperty('budget_price_per_unit')) {
									pParam.budget_price_total = pParam.qty * pParam.budget_price_per_unit;
								}
								pParam.qty_remain = pParam.qty;
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
									// let xParamLog = {
									//     act: 'add',
									//     employee_id: pParam.employee_id,
									//     employee_name: pParam.employee_name,
									//     request_id: pParam.request_id,
									//     request_no: xBudgetPlan.data.budget_no,
									//     body: {
									//         act: 'update',
									//         msg: 'RAB item changed',
									//         before: {
									//             qty: xItem.data.qty,
									//             budget_price_per_unit: xItem.data.budget_price_per_unit,
									//             quotation_price_per_unit: xItem.data.quotation_price_per_unit,
									//             has_budget: xItem.data.has_budget,
									//             estimate_date_use: xItem.data.estimate_date_use,
									//             description: xItem.data.description,
									//             product_id: parseInt(xItem.data.product_id),
									//             product_name: xItem.data.product_name,
									//             vendor_id: parseInt(xItem.data.vendor_id),
									//             vendor_name: xItem.data.vendor_name,
									//             vendor_code: xItem.data.vendor_code,
									//             employee_id: xItem.data.employee_id,
									//             employee_name: xItem.data.employee_name,
									//             budget_price_total: xItem.data.budget_price_total
									//         },
									//         after: {
									//             qty: pParam.qty,
									//             budget_price_per_unit: pParam.budget_price_per_unit,
									//             quotation_price_per_unit: pParam.quotation_price_per_unit,
									//             has_budget: pParam.has_budget,
									//             estimate_date_use: pParam.estimate_date_use,
									//             description: pParam.description,
									//             product_id: pParam.product_id,
									//             product_name: pParam.product_name,
									//             vendor_id: pParam.vendor_id,
									//             vendor_name: pParam.vendor_name,
									//             vendor_code: pParam.vendor_code,
									//             employee_id: pParam.employee_id,
									//             employee_name: pParam.employee_name,
									//             budget_price_total: pParam.budget_price_total
									//         }
									//     }
									// };
									// var xResultLog = await _logServiceInstance.addLog(pParam.method, pParam.token, xParamLog);
									// xJoResult.log_result = xResultLog;
								}
								// ---------------- End: Add to log ----------------
							}
						} else {
							xJoResult = {
								status_code: '-99',
								status_msg: 'Data not found'
							};
						}
                    } else {
                        xJoResult = {
                            status_code: '-99',
                            status_msg: 'Please supply parameter id'
                        };
                    }
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

module.exports = BudgetPlanDetailService;