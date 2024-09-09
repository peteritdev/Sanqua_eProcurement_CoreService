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
const CashAdvanceResponsibilityRepository = require('../repository/cashadvanceresponsibilityrepository.js');
const _repoInstance = new CashAdvanceResponsibilityRepository();

const PaymentRequestRepository = require('../repository/paymentrequestrepository.js');
const _paymentRequestRepoInstance = new PaymentRequestRepository();

// const CashAdvanceResponsibilityDetailRepository = require('../repository/CashAdvanceResponsibilitydetailrepository.js');
// const _repoDetailInstance = new CashAdvanceResponsibilityDetailRepository();

// OAuth Service
const OAuthService = require('../services/oauthservice.js');
const _oAuthService = new OAuthService();

const VendorCatalogueService = require('../services/vendorcatalogueservice.js');
const _catalogueService = new VendorCatalogueService();

const PaymentRequestService = require('../services/paymentrequestservice.js');
const _paymentRequestServiceInstance = new PaymentRequestService();

const _xClassName = 'CashAdvanceResponsibilityService';

class CashAdvanceResponsibilityService {
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
						var xPjcaDetail = xDetail.cash_advance_responsibility_detail;
							
						// looping detail item
						for (var index in xPjcaDetail) {
							// if (xPjcaDetail[index].price_total != null && xPjcaDetail[index].price_total != 0) {
							// 	xTotalItem = xTotalItem + 1;
							// }
							// console.log(`>>> xDetail[index]: ${JSON.stringify(xDetail[index])}`);
							xJoArrRequestDetailData.push({
								// id: await _utilInstance.encrypt(xPjcaDetail[index].id, config.cryptoKey.hashKey),
								product: {
									id: xPjcaDetail[index].product_id,
									code: xPjcaDetail[index].product_code,
									name: xPjcaDetail[index].product_name
								},
								uom: xPjcaDetail[index].uom_name,
								uom_id: xPjcaDetail[index].uom_id,
								qty_request: xPjcaDetail[index].qty_request,
								price_request: xPjcaDetail[index].price_request,
								qty_done: xPjcaDetail[index].qty_done,
								price_done: xPjcaDetail[index].price_done,
								description: xPjcaDetail[index].description,
								discount: xPjcaDetail[index].discount,
								discount_percent: xPjcaDetail[index].discount_percent,
								tax: xPjcaDetail[index].tax,
								total: xPjcaDetail[index].total,
								status: xPjcaDetail[index].status,
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
								to_department_id: xRows[i].to_department_id,
								to_department_name: xRows[i].to_department_name,
								total_qty_released: xRows[i].total_qty_released,
								total_price_released: xRows[i].total_price_released,
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
					if (pParam.hasOwnProperty('payment_request_id')) {
						if (pParam.payment_request_id != '') {
							if (pParam.payment_request_id.length == 65) {
								xDecId = await _utilInstance.decrypt(pParam.payment_request_id, config.cryptoKey.hashKey);
								if (xDecId.status_code == '00') {
									pParam.payment_request_id = xDecId.decrypted;
									// xFlagProcess = true;
									var xPaymentRequest = await _paymentRequestRepoInstance.getById({id: xDecId.decrypted});
						
									if (xPaymentRequest != null) {
										
										if (xPaymentRequest.status == 2) {
											pParam.company_id = xPaymentRequest.company_id
											pParam.company_code = xPaymentRequest.company_code
											pParam.company_name = xPaymentRequest.company_name
											pParam.department_id = xPaymentRequest.department_id
											pParam.department_name = xPaymentRequest.department_name
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
											status_msg: 'Payreq not found / Invalid ID'
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
							status_msg: `PJCA already in process`
						};
					}
				} else {
					xJoResult = {
						status_code: '-99',
						status_msg: `PJCA id not found`
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
							status_msg: `PJCA already draft`
						};
					}
				} else {
					xJoResult = {
						status_code: '-99',
						status_msg: `PJCA id not found`
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
							status_msg: `PJCA already cancel`
						};
					}
				} else {
					xJoResult = {
						status_code: '-99',
						status_msg: `PJCA id not found`
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

module.exports = CashAdvanceResponsibilityService;
