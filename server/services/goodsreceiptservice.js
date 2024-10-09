const jwt = require('jsonwebtoken');
const md5 = require('md5');
const crypto = require('crypto');
const moment = require('moment');
const sequelize = require('sequelize');
const dateFormat = require('dateformat');
const dateTime = require("node-datetime");
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

const PurchaseRequestDetailRepository = require('../repository/purchaserequestdetailrepository.js');
const _purchaseRequestDetailRepoInstance = new PurchaseRequestDetailRepository();

const PaymentRequestRepository = require('../repository/paymentrequestrepository.js');
const _paymentRequestRepoInstance = new PaymentRequestRepository();

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
						if (xDetail.status_code == '00') {
						
							var xJoArrRequestDetailData = [];
							// var xTotalItem = 0;
							var xGrDetail = xDetail.data.goods_receipt_detail;
							delete xDetail.data.goods_receipt_detail;
							delete xDetail.data.purchase_request_id;
								
							// looping detail item
							for (var index in xGrDetail) {
								// if (xGrDetail[index].price_total != null && xGrDetail[index].price_total != 0) {
								// 	xTotalItem = xTotalItem + 1;
								// }
								// console.log(`>>> xDetail[index]: ${JSON.stringify(xDetail[index])}`);
								xJoArrRequestDetailData.push({
									id: xGrDetail[index].id,
									product: {
										id: xGrDetail[index].product_id,
										code: xGrDetail[index].product_code,
										name: xGrDetail[index].product_name
									},
									uom_name: xGrDetail[index].uom_name,
									uom_id: xGrDetail[index].uom_id,
									qty_demand: xGrDetail[index].qty_demand,
									qty_request: xGrDetail[index].qty_request,
									qty_done: xGrDetail[index].qty_done,
									qty_return: xGrDetail[index].qty_return,
									description: xGrDetail[index].description,
									// payment_request_id: xGrDetail[index].payment_request_id,
									purchase_request_detail: xGrDetail[index].purchase_request_detail,
									payment_request: xGrDetail[index].payment_request,
									// payment_request_detail_id: xGrDetail[index].payment_request_detail_id,
									status: xGrDetail[index].status,
									prd_id: xGrDetail[index].prd_id,
								});
							}
							xDetail.data.goods_receipt_detail = xJoArrRequestDetailData
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
								updated_by_name: xRows[i].updated_by_name,
								purchase_request: xRows[i].purchase_request,
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
												status_msg: 'This fpb cannot ready for payreq yet.'
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
				var xJoArrItems = [];

				if (pParam.hasOwnProperty('goods_receipt_detail')) {
					xJoArrItems = pParam.goods_receipt_detail;
					if (xJoArrItems.length > 0) {
						for (var i in xJoArrItems) {
							// doo something here
							var xPrdId = await _utilInstance.decrypt(xJoArrItems[i].prd_id, config.cryptoKey.hashKey);
							if (xPrdId.status_code == '00') {
								xJoArrItems[i].prd_id = xPrdId.decrypted;
								// delete xJoArrItems[i].prd_id
							}
							console.log(`>>> xPrdId ${JSON.stringify(xPrdId)}`);
						}
					}
					pParam.goods_receipt_detail = xJoArrItems;
				}

				let xResult = await _repoInstance.save(pParam, xAct);
				
				console.log(`>>> xResult ${JSON.stringify(xResult)}`);
				if (xResult.status_code == '00') {
					var dt = dateTime.create();
					var xDate = dt.format('ym');
					var xGrNo = `${pParam.company_code}/GR/${xDate}/` + xResult.clear_id.toString().padStart(5,'0');

					var xParamUpdate = {
						document_no: xGrNo,
						id: xResult.clear_id
					};

					var xUpdate = await _repoInstance.save(xParamUpdate, 'update');
				}

				xJoResult = xResult;
			} else if (xAct == 'update') {
				var xDecId = await _utilInstance.decrypt(pParam.id, config.cryptoKey.hashKey);
				if (xDecId.status_code == '00') {
					pParam.id = xDecId.decrypted;
					pParam.updatedAt = await _utilInstance.getCurrDateTime();
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
				

				if (xDetail != null) {
					console.log(`>>> xDetail: ${JSON.stringify(xDetail)}`, pParam.id);
					if (xDetail.status_code == '00') {
						if (xDetail.data.status == 0) {
							if (xDetail.data.goods_receipt_detail != null) {

								
								// var xPayreqDetail = await _paymentRequestRepoInstance.getByParameter({
								// 	id: xDetail.data.goods_receipt_detail[0].payment_request_id
								// });
								// if (xPayreqDetail.status_code == '00') {
								// 	if (xPayreqDetail.data.status == 3) {
								// 		pParam.status = 1;
								// 		pParam.requested_at = await _utilInstance.getCurrDateTime();
								// 		var xUpdate = await _repoInstance.save(pParam, 'update');
								// 		xJoResult = xUpdate;
								// 		if (xUpdate.status_code == '00') {
								// 			this.updatePrdItemQtyReceived(xDetail.data, 'submit')
								// 		}
								// 	} else {
								// 		xJoResult = {
								// 			status_code: '-99',
								// 			status_msg: `Payment request (${xPayreqDetail.data.document_no}) not paid yet, please pay first`
								// 		};
								// 	}
								// } else {
								// 	xJoResult = xDetail;
								// }

								// 09/10/2024 now gr not linked by payreq
								
								var xArrGrItem = xDetail.data.goods_receipt_detail
								console.log(`>>> xDetail.items 2: ${JSON.stringify(xDetail.data.goods_receipt_detail)}`);
								for (let i = 0; i < xArrGrItem.length; i++) {
									if (xArrGrItem[i].qty_done > xArrGrItem[i].purchase_request_detail.qty_paid) {
										xJoResult = {
											status_code: '-99',
											status_msg: `(${xArrGrItem[i].product_code}) insufficient Balance.\n Qty received = ${xArrGrItem[i].qty_done} exceeded qty paid on FPB = ${xArrGrItem[i].purchase_request_detail.qty_paid}`
										};
										xFlagProcess = false
									}
								}

								if (xFlagProcess) {
									pParam.status = 1;
									pParam.requested_at = await _utilInstance.getCurrDateTime();
									var xUpdate = await _repoInstance.save(pParam, 'update');
									xJoResult = xUpdate;
									if (xUpdate.status_code == '00') {
										this.updatePrdItemQtyReceived(xDetail.data, 'submit')
									}
								}
							} else {
								xJoResult = {
									status_code: '-99',
									status_msg: `Detail item cannot be empty`
								};
							}
						} else {
							xJoResult = {
								status_code: '-99',
								status_msg: `Dokumen request already in process`
							};
						}
					} else {
						xJoResult = xDetail;
					}
				} else {
					xJoResult = {
						status_code: '-99',
						status_msg: `Dokumen request id not found`
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
				var xGrDetail = await _repoInstance.getByParameter({ id: pParam.id });
				if (xGrDetail != null) {
					if (xGrDetail.status_code == '00') {
						if (xGrDetail.data.status == 0) {
							xJoResult = {
								status_code: '-99',
								status_msg: 'This document already draft'
							};
						} else {
							var xParamUpdate = {
								id: pParam.id,
								status: 0,
								set_to_draft_at: await _utilInstance.getCurrDateTime(),
								set_to_draft_by: pParam.user_id,
								set_to_draft_by_name: pParam.user_name,
							};
							var xUpdateResult = await _repoInstance.save(xParamUpdate, 'update');

							if (xUpdateResult.status_code == '00') {
								xJoResult = {
									status_code: '00',
									status_msg: 'Payreq successfully set to draft'
								};
							} else {
								xJoResult = xUpdateResult;
							}
						}
					
					} else {
						xJoResult = xGrDetail
					}
				} else {
					xJoResult = {
						status_code: '-99',
						status_msg: 'Data not found'
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
				var xGrDetail = await _repoInstance.getByParameter({ id: pParam.id });
				if (xGrDetail != null) {
					if (xGrDetail.status_code == '00') {
						if (xGrDetail.data.status == 5) {
							xJoResult = {
								status_code: '-99',
								status_msg: 'This document already cancel'
							};
						} else {
							var xParamUpdate = {
								id: pParam.id,
								status: 2,
								canceled_at: await _utilInstance.getCurrDateTime(),
								canceled_reason: pParam.cancel_reason,
								// approved_at: await _utilInstance.getCurrDateTime()
							};
							var xUpdateResult = await _repoInstance.save(xParamUpdate, 'update');

							if (xUpdateResult.status_code == '00') {
								if (xGrDetail.data.status != 0) {
									this.updatePrdItemQtyReceived(xGrDetail.data, 'cancel')
								}
								xJoResult = {
									status_code: '00',
									status_msg: 'Dokumen successfully canceled'
								};
							} else {
								xJoResult = xUpdateResult;
							}
						}
					
					} else {
						xJoResult = xGrDetail
					}
				} else {
					xJoResult = {
						status_code: '-99',
						status_msg: 'Data not found'
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
	
	async updatePrdItemQtyReceived(pParam, pAct){
		let xGoodsReceiptDetail = pParam.goods_receipt_detail
		console.log(`>>> xGoodsReceiptDetail: ${JSON.stringify(xGoodsReceiptDetail)}`);
		for (let i = 0; i < xGoodsReceiptDetail.length; i++) {
			var xPrDetailItem = await _purchaseRequestDetailRepoInstance.getByParam({id: xGoodsReceiptDetail[i].prd_id})
			console.log(`>>> xPrDetailItem: ${JSON.stringify(xPrDetailItem)}`);
			if (xPrDetailItem.status_code == '00') {
				let xQtyDone = xPrDetailItem.data.qty_done || 0
				let xCalculatedQty = 0
				if (pAct == 'submit') {
					xCalculatedQty = xQtyDone + xGoodsReceiptDetail[i].qty_done
				} else if (pAct == 'cancel' ){
					xCalculatedQty = xQtyDone - xGoodsReceiptDetail[i].qty_done
				}
				let xPrdUpdateParam = {
					id: xPrDetailItem.data.id,
					qty_done: xCalculatedQty
				}
				
				let xUpdatePrdItem = await _purchaseRequestDetailRepoInstance.save(xPrdUpdateParam, 'update')
				console.log(`>>> xUpdatePrdItem: ${JSON.stringify(xUpdatePrdItem)}`);
			}
		}
	}
}

module.exports = GoodsReceiptService;
