const jwt = require('jsonwebtoken');
const md5 = require('md5');
const crypto = require('crypto');
const moment = require('moment');
const sequelize = require('sequelize');
const dateFormat = require('dateformat');
const Op = sequelize.Op;
const bcrypt = require('bcrypt');
const fs = require('fs');
const _ = require('lodash');

const env = process.env.NODE_ENV || 'localhost';
const config = require(__dirname + '/../config/config.json')[env];

// Utility
const Utility = require('peters-globallib-v2');
const _utilInstance = new Utility();

const GlobalUtility = require('../utils/globalutility.js');
const _globalUtilInstance = new GlobalUtility();

// Repository
const GoodsReceiptRepository = require('../repository/goodsreceiptrepository.js');
const _repoInstance = new GoodsReceiptRepository();

const PurchaseRequestRepository = require('../repository/purchaserequestrepository.js');
const _purchaseRequestRepoInstance = new PurchaseRequestRepository();

// const GoodsReceiptDetailRepository = require('../repository/GoodsReceiptdetailrepository.js');
// const _repoDetailInstance = new GoodsReceiptDetailRepository();

// OAuth Service
const OAuthService = require('../services/oauthservice.js');
const _oAuthService = new OAuthService();

const VendorCatalogueService = require('../services/vendorcatalogueservice.js');
const _catalogueService = new VendorCatalogueService();

const PurchaseRequestService = require('../services/purchaserequestservice.js');
const _purchaseRequestServiceInstance = new PurchaseRequestService();

const _xClassName = 'GoodsReceiptService';

class GoodsReceiptService {
	constructor() {}

	async detail(pParam) {
		var xJoResult = {};
		var xFlagProcess = false;
		var xDecId = null;
		var xEncId = null;
		var xJoData = {};

		try {
			if (pParam.hasOwnProperty('id')) {
				if (pParam.id != '') {
					xEncId = pParam.id;
					xDecId = await _utilInstance.decrypt(pParam.id, config.cryptoKey.hashKey);
					if (xDecId.status_code == '00') {
						pParam.id = xDecId.decrypted;
						xFlagProcess = true;
					} else {
						xJoResult = xDecId;
					}
				}

				if (xFlagProcess) {
					let xDetail = await _repoInstance.getByParameter(pParam);
					xDetail = await _utilInstance.changeIdToEncryptedId(xDetail, config.cryptoKey.hashKey);
					console.log(`>>> pParam: ${JSON.stringify(xDetail)}`);
					if (xDetail != null) {
						
						var xJoArrRequestDetailData = [];
						// var xTotalItem = 0;
						var xGrDetail = xDetail.goods_receipt_detail;
							
						// looping detail item
						for (var index in xGrDetail) {
							// if (xGrDetail[index].price_total != null && xGrDetail[index].price_total != 0) {
							// 	xTotalItem = xTotalItem + 1;
							// }
							// console.log(`>>> xDetail[index]: ${JSON.stringify(xDetail[index])}`);
							xJoArrRequestDetailData.push({
								// id: await _utilInstance.encrypt(xGrDetail[index].id, config.cryptoKey.hashKey),
								product: {
									id: xGrDetail[index].product_id,
									code: xGrDetail[index].product_code,
									name: xGrDetail[index].product_name
								},
								uom: xGrDetail[index].uom_name,
								uom_id: xGrDetail[index].uom_id,
								qty_demand: xGrDetail[index].qty_demand,
								qty_done: xGrDetail[index].qty_done,
								qty_return: xGrDetail[index].qty_return,
								description: xGrDetail[index].description,
								payment_request_detail_id: xGrDetail[index].payment_request_detail_id,
								status: xGrDetail[index].status,
							});
						}
					} else {
						
						xJoResult = {
							status_code: '-99',
							status_msg: 'Data not found'
						};
					}
					xJoResult = xDetail;
				}
			}
		} catch (e) {
			_utilInstance.writeLog(`${_xClassName}.detail`, `Exception error: ${e.message}`, 'error');

			xJoResult = {
				status_code: '-99',
				status_msg: `${_xClassName}.detail: Exception error: ${e.message}`
			};
		}

		return xJoResult;
	}

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
								document_no: xRows[i].document_no,
								company_id: xRows[i].company_id,
								company_name: xRows[i].company_name,
								employee_id: xRows[i].employee_id,
								employee_name: xRows[i].employee_name,
								department_id: xRows[i].department_id,
								department_name: xRows[i].department_name,
								received_by_name: xRows[i].received_by_name,
								submitted_by_name: xRows[i].submitted_by_name,
								received_date: xRows[i].received_date,
								received_from_vendor: xRows[i].received_from_vendor,
								receipt_type: xRows[i].receipt_type,
								status: xRows[i].status,
								created_at: moment(xRows[i].createdAt).format('DD MMM YYYY HH:mm:ss'),
								created_by_name: xRows[i].created_by_name,
								updated_at: moment(xRows[i].updatedAt).format('DD MMM YYYY HH:mm:ss'),
								updated_by_name: xRows[i].updated_by_name
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
	
	async save(pParam) {
		var xJoResult;
		var xAct = pParam.act;
		var xFlagProcess = false;
		var xDecId = null;

		delete pParam.act;

		if (pParam.hasOwnProperty('user_id')) {
			
			if (pParam.user_id != '') {
				xDecId = await _utilInstance.decrypt(pParam.user_id, config.cryptoKey.hashKey);
				if (xDecId.status_code == '00') {
					pParam.user_id = xDecId.decrypted;
					if (pParam.hasOwnProperty('purchase_request_id')) {
						if (pParam.purchase_request_id != '') {
							if (pParam.purchase_request_id.length == 65) {
								xDecId = await _utilInstance.decrypt(pParam.purchase_request_id, config.cryptoKey.hashKey);
								if (xDecId.status_code == '00') {
									pParam.purchase_request_id = xDecId.decrypted;
									// xFlagProcess = true;
									var xPurchaseRequest = await _purchaseRequestRepoInstance.getById({id: xDecId.decrypted});
						
									if (xPurchaseRequest != null) {
										
										if (xPurchaseRequest.status == 2) {
											pParam.company_id = xPurchaseRequest.company_id
											pParam.company_code = xPurchaseRequest.company_code
											pParam.company_name = xPurchaseRequest.company_name
											pParam.department_id = xPurchaseRequest.department_id
											pParam.department_name = xPurchaseRequest.department_name
											xFlagProcess = true;
										} else {
											xJoResult = {
												status_code: '-99',
												status_msg: 'This .'
											};
										}
									} else {
										xJoResult = {
											status_code: '-99',
											status_msg: 'FPB not found / Invalid ID'
										};
									}
								} else {
									xJoResult = xDecId;
								}
							} else {
								xFlagProcess = true;
							}
						}
					} else {
						xFlagProcess = true;
					}
				} else {
					xJoResult = xDecId;
				}
			}
		}

		if (xFlagProcess) {
			if (xAct == 'add' || xAct == 'add_batch_in_item') {
				// var xJoArrItems = [];

				// if (pParam.hasOwnProperty('payment_request_detail')) {
				// 	xJoArrItems = pParam.payment_request_detail;
				// 	if (xJoArrItems.length > 0) {
				// 		for (var i in xJoArrItems) {
				// 			if (
				// 				xJoArrItems[i].hasOwnProperty('qty_request') &&
				// 				xJoArrItems[i].hasOwnProperty('price_request')
				// 			) {
				// 				xJoArrItems[i].price_total =
				// 					xJoArrItems[i].qty_request * xJoArrItems[i].price_request;
				// 			}
				// 		}
				// 	}
				// 	pParam.purchase_request_detail = xJoArrItems;
				// }

				let xResult = await _repoInstance.save(pParam, xAct);
				xJoResult = xResult;
			} else if (xAct == 'update') {
				var xDecId = await _utilInstance.decrypt(pParam.id, config.cryptoKey.hashKey);
				if (xDecId.status_code == '00') {
					pParam.id = xDecId.decrypted;
					pParam.updated_by = pParam.user_id;
					pParam.updated_by_name = pParam.user_name;
					xFlagProcess = true;
				} else {
					xJoResult = xDecId;
				}

				if (xFlagProcess) {
					let xResult = await _repoInstance.save(pParam, xAct);
					xJoResult = xResult;
				}
			}
		}

		return xJoResult;
	}

	async submit(pParam) {
		var xJoResult = {};
		var xFlagProcess = false;
		var xDecId = null;
		var xEncId = null;
		var xJoData = {};

		try {
			if (pParam.id != '' && pParam.user_id != '') {
				xDecId = await _utilInstance.decrypt(pParam.id, config.cryptoKey.hashKey);
				if (xDecId.status_code == '00') {
					xFlagProcess = true;
					xEncId = pParam.id;
					pParam.id = xDecId.decrypted;
					xDecId = await _utilInstance.decrypt(pParam.user_id, config.cryptoKey.hashKey);
					if (xDecId.status_code == '00') {
						pParam.user_id = xDecId.decrypted;
						xFlagProcess = true;
					} else {
						xJoResult = xDecId;
					}
				} else {
					xJoResult = xDecId;
				}
			}

			if (xFlagProcess) {
				var xDetail = await _repoInstance.getByParameter({
					id: pParam.id
				});
				console.log(`>>> xDetail: ${JSON.stringify(xDetail)}`,pParam.id);
				

				if (xDetail != null) {
					if (xDetail.status == 0) {
						pParam.status = 1;
						var xUpdate = await _repoInstance.save(pParam, 'submit');
						xJoResult = xUpdate;
					} else {
						xJoResult = {
							status_code: '-99',
							status_msg: `GR already in process`
						};
					}
				} else {
					xJoResult = {
						status_code: '-99',
						status_msg: `GR id not found`
					};
				}
			}
		} catch (e) {
			_utilInstance.writeLog(`${_xClassName}.submit`, `Exception error: ${e.message}`, 'error');

			xJoResult = {
				status_code: '-99',
				status_msg: `${_xClassName}.submit: Exception error: ${e.message}`
			};
		}

		return xJoResult;
	}

	async setToDraft(pParam) {
		var xJoResult = {};
		var xFlagProcess = false;
		var xDecId = null;
		var xEncId = null;
		var xJoData = {};

		try {
			if (pParam.id != '' && pParam.user_id != '') {
				xDecId = await _utilInstance.decrypt(pParam.id, config.cryptoKey.hashKey);
				if (xDecId.status_code == '00') {
					xFlagProcess = true;
					xEncId = pParam.id;
					pParam.id = xDecId.decrypted;
					xDecId = await _utilInstance.decrypt(pParam.user_id, config.cryptoKey.hashKey);
					if (xDecId.status_code == '00') {
						pParam.user_id = xDecId.decrypted;
						xFlagProcess = true;
					} else {
						xJoResult = xDecId;
					}
				} else {
					xJoResult = xDecId;
				}
			}

			if (xFlagProcess) {
				var xDetail = await _repoInstance.getByParameter({
					id: pParam.id
				});

				if (xDetail != null) {
					if (xDetail.status != 0) {
						pParam.status = 0;
						var xUpdate = await _repoInstance.save(pParam, 'set_to_draft');
						xJoResult = xUpdate;
					} else {
						xJoResult = {
							status_code: '-99',
							status_msg: `GR already draft`
						};
					}
				} else {
					xJoResult = {
						status_code: '-99',
						status_msg: `GR id not found`
					};
				}
			}
		} catch (e) {
			_utilInstance.writeLog(`${_xClassName}.setToDraft`, `Exception error: ${e.message}`, 'error');

			xJoResult = {
				status_code: '-99',
				status_msg: `${_xClassName}.setToDraft: Exception error: ${e.message}`
			};
		}

		return xJoResult;
	}

	async cancel(pParam) {
		var xJoResult = {};
		var xFlagProcess = false;
		var xDecId = null;
		var xEncId = null;
		var xJoData = {};

		try {
			if (pParam.id != '' && pParam.user_id != '') {
				xDecId = await _utilInstance.decrypt(pParam.id, config.cryptoKey.hashKey);
				if (xDecId.status_code == '00') {
					xFlagProcess = true;
					xEncId = pParam.id;
					pParam.id = xDecId.decrypted;
					xDecId = await _utilInstance.decrypt(pParam.user_id, config.cryptoKey.hashKey);
					if (xDecId.status_code == '00') {
						pParam.user_id = xDecId.decrypted;
						xFlagProcess = true;
					} else {
						xJoResult = xDecId;
					}
				} else {
					xJoResult = xDecId;
				}
			}

			if (xFlagProcess) {
				var xDetail = await _repoInstance.getByParameter({
					id: pParam.id
				});

				if (xDetail != null) {
					if (xDetail.status != 4) {
						pParam.status = 4;
						var xUpdate = await _repoInstance.save(pParam, 'cancel');
						xJoResult = xUpdate;
					} else {
						xJoResult = {
							status_code: '-99',
							status_msg: `GR already cancel`
						};
					}
				} else {
					xJoResult = {
						status_code: '-99',
						status_msg: `GR id not found`
					};
				}
			}
		} catch (e) {
			_utilInstance.writeLog(`${_xClassName}.cancel`, `Exception error: ${e.message}`, 'error');

			xJoResult = {
				status_code: '-99',
				status_msg: `${_xClassName}.cancel: Exception error: ${e.message}`
			};
		}

		return xJoResult;
	}
}

module.exports = GoodsReceiptService;
