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

// Repository
const BudgetPlanRepo = require('../repository/budgetplanrepository.js');
const _budgetPlanRepoInstance = new BudgetPlanRepo();

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
				// console.log(`>>> xResultList: ${JSON.stringify(xResultList)}`);
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
								vendor_recomendation_id: xRows[i].vendor_recomendation_id,
								vendor_recomendation_code: xRows[i].vendor_recomendation_code,
								budget_plan: xRows[i].budget_plan,
								section_title: xRows[i].section_title,
								// fpb_ids: xRows[i].fpb_ids,
								rab_origin: xRows[i].rab_origin != null ? {
									id: await _utilInstance.encrypt(xRows[i].rab_origin.id.toString(), config.cryptoKey.hashKey),
									name: xDetail[index].rab_origin.name,
									document_no: xDetail[index].rab_origin.budget_no,
								} : null,
								deviation_fpb_item_id: xRows[i].deviation_fpb_item_id,
								log_subtitute: xRows[i].log_subtitute,
								currency_id: xRows[i].currency_id,
								currency_code: xRows[i].currency_code,
								currency_symbol: xRows[i].currency_symbol
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
						// xFlagProcess = true;
						xDecId = await _utilInstance.decrypt(pParam.request_id, config.cryptoKey.hashKey);
						if (xDecId.status_code == '00') {
							pParam.request_id = xDecId.decrypted;
							xRequestIdClear = xDecId.decrypted;
							// xFlagProcess = true;
							if (pParam.hasOwnProperty('rab_origin_id') && pParam.rab_origin_id != '' && pParam.rab_origin_id != null) {
								// Check if rab_origin_id is encrypted or not
								xDecId = await _utilInstance.decrypt(pParam.rab_origin_id, config.cryptoKey.hashKey);
								if (xDecId.status_code == '00') {
									pParam.rab_origin_id = xDecId.decrypted;
									xFlagProcess = true;
								} else {
									xJoResult = xDecId;
								}
							} else {
								xFlagProcess = true;
							}
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

				if (pParam.hasOwnProperty('estimate_date_use')) {
					if (pParam.estimate_date_use == ''|| isNaN(new Date(pParam.estimate_date_use).getTime())) {
						pParam.estimate_date_use = new Date().toISOString().split('T')[0];
					}
				}
				// Validate if product_id is null (free keyin for project), estimate_fulfillment
				// console.log(`>>> pParam save : ${JSON.stringify(pParam)}`);
				var xAddResult = await _repoInstance.save(pParam, xAct);
				xJoResult = xAddResult;

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
							
							xItems[i].qty_remain = xItems[i].qty;
							xItems[i].budget_price_total = xItems[i].qty * xItems[i].budget_price_per_unit;
							xItems[i].request_id = xRequestIdClear;
							xItems[i].user_id = pParam.user_id;
							xItems[i].user_name = pParam.user_name;
							if (xItems[i].hasOwnProperty('rab_origin_id') && xItems[i].rab_origin_id != '' && xItems[i].rab_origin_id != null) {
								// Check if rab_origin_id is encrypted or not
								let origin_id = await _utilInstance.decrypt(xItems[i].rab_origin_id, config.cryptoKey.hashKey);
								if (origin_id.status_code == '00') {
									xItems[i].rab_origin_id = origin_id.decrypted;
								}
								
							}

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

							if (pParam.hasOwnProperty('estimate_date_use')) {
								if (pParam.estimate_date_use == '' || isNaN(new Date(pParam.estimate_date_use).getTime())) {
									pParam.estimate_date_use = new Date().toISOString().split('T')[0];
								}
							}

							var xUpdateResult = await _repoInstance.save(pParam, xAct);
							xJoResult = xUpdateResult;
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
	
	async dropdown(pParam) {
		var xJoResult = {};
		var xJoArrData = [];
		var xDecId = null;
		var xFlagProcess = false;

		try {
			if (pParam.hasOwnProperty('request_id')) {
				if (pParam.request_id != '' && pParam.request_id.length > 15) {
					xDecId = await _utilInstance.decrypt(pParam.request_id, config.cryptoKey.hashKey);
					if (xDecId.status_code == '00') {
						pParam.request_id = xDecId.decrypted;
						xFlagProcess = true;
					} else {
						xJoResult = xDecId;
					}
				} else {
					xFlagProcess = true;
				}
			} else {
				xJoResult = {
					status_code: '-99',
					status_msg: 'You need to supply correct parameter'
				};
			}
			
			// console.log(`>>> xFlagProcess: ${JSON.stringify(xFlagProcess)}`);
			// console.log(`>>> xJoResult: ${JSON.stringify(xJoResult)}`);
			if (xFlagProcess) {
				var xResultList = await _repoInstance.list(pParam);
				if (xResultList) {
					// console.log(`>>> xResultList: ${JSON.stringify(xResultList)}`);
					if (xResultList.status_code == '00') {
						var xRows = xResultList.data.rows;
						if (xRows.length > 0) {
							for (var i in xRows) {
								xJoArrData.push({
									// id: await _utilInstance.encrypt(xRows[i].id.toString(), config.cryptoKey.hashKey),
									// request_id: xRows[i].request_id,
									product: {
										id: xRows[i].product_id,
										code: xRows[i].product_code,
										name: xRows[i].product_name,
										uom_id: xRows[i].uom_id,
										uom_name: xRows[i].uom_name,
										last_price: xRows[i].last_price,
										currency_id: xRows[i].currency_id,
										currency_code: xRows[i].currency_code,
										currency_symbol: xRows[i].currency_symbol
									},
									vendor: {
										id: xRows[i].vendor_id,
										code: xRows[i].vendor_code,
										name: xRows[i].vendor_name
									},
									qty: xRows[i].qty,
									qty_remain: xRows[i].qty_remain,
									id: await _utilInstance.encrypt(xRows[i].id.toString(), config.cryptoKey.hashKey),
									estimate_date_use: moment(xRows[i].estimate_date_use).format('DD MMM YYYY HH:mm:ss'),
									budget_price_per_unit: xRows[i].budget_price_per_unit
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
			}
		} catch (e) {
			_utilInstance.writeLog(`${_xClassName}.dropdown`, `Exception error: ${e.message}`, 'error');

			xJoResult = {
				status_code: '-99',
				status_msg: `${_xClassName}.dropdown: Exception error: ${e.message}`
			};
		}

		return xJoResult;
	}
	
	async updateItemQtyLeft(pParam, pAct, rab){
		let xPurchaseRequestDetail = pParam.purchase_request_detail
		// console.log(`>>> xPurchaseRequestDetail: ${JSON.stringify(xPurchaseRequestDetail)}`);
		// console.log(`>>> pAct: ${JSON.stringify(pAct)}`);
		// console.log(`>>> rab: ${JSON.stringify(rab)}`);
		if (pParam.budget_plan != null) {
			let xRabId = pParam.budget_plan.id
			// check rab
			var xRabDetail = rab || await _budgetPlanRepoInstance.getById({id: xRabId})
			if (xRabDetail != null) {
				// let xRabDetailItem = xRabDetail.budget_plan_detail
				// console.log(`>>> xRabDetailItem: ${JSON.stringify(xRabDetailItem)}`);
				for (let i = 0; i < xPurchaseRequestDetail.length; i++) {
					// let xCheckRabItem = xRabDetailItem.find(({ product_id, product_code, product_name }) => product_id == xPurchaseRequestDetail[i].product_id && product_code == xPurchaseRequestDetail[i].product_code && product_name == xPurchaseRequestDetail[i].product_name)
					let xCheckRabItem = await _repoInstance.getByParam({id: xPurchaseRequestDetail[i].rab_item.id})
					// console.log(`>>> xCheckRabItem: ${JSON.stringify(xCheckRabItem)}`);
					// console.log(`>>> pr.product_id: ${JSON.stringify(xPurchaseRequestDetail[i].product_id)}`);
					// console.log(`>>> pr.product_code: ${JSON.stringify(xPurchaseRequestDetail[i].product_code)}`);
					// console.log(`>>> pr.product_name: ${JSON.stringify(xPurchaseRequestDetail[i].product_name)}`);
					if (xCheckRabItem != null && xCheckRabItem.length > 0) {
						for (let j = 0; j < xCheckRabItem.length; j++) {
							let xQtyLeft = xCheckRabItem[j].qty_remain || 0
							let xCalculatedQty = 0
							if (pAct == 'return') {
								xCalculatedQty = xQtyLeft + xPurchaseRequestDetail[i].qty
							} else if (pAct == 'decrease') {
								xCalculatedQty = xQtyLeft - xPurchaseRequestDetail[i].qty
							}
							let xUpdateItemParam = {
								id: xCheckRabItem[j].id,
								qty_remain: xCalculatedQty
							}
							// console.log(`>>> xUpdateItem[${i+1}]: ${JSON.stringify(xUpdateItemParam)}`);
							let xUpdateItem = await _repoInstance.save(xUpdateItemParam, 'update')
						}
					}
				}
			}
		}
		return null
	}
}

module.exports = BudgetPlanDetailService;