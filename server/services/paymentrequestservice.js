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
const PaymentRequestRepository = require('../repository/paymentrequestrepository.js');
const _repoInstance = new PaymentRequestRepository();

const PurchaseRequestRepository = require('../repository/purchaserequestrepository.js');
const _purchaseRequestRepoInstance = new PurchaseRequestRepository();

// const PaymentRequestDetailRepository = require('../repository/paymentrequestdetailrepository.js');
// const _repoDetailInstance = new PaymentRequestDetailRepository();

// OAuth Service
const OAuthService = require('../services/oauthservice.js');
const _oAuthService = new OAuthService();

const VendorCatalogueService = require('../services/vendorcatalogueservice.js');
const _catalogueService = new VendorCatalogueService();

const PurchaseRequestService = require('../services/purchaserequestservice.js');
const _purchaseRequestServiceInstance = new PurchaseRequestService();

const _xClassName = 'PaymentRequestService';

class PaymentRequestService {
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
					console.log(`>>> xDetail: ${JSON.stringify(xDetail)}`);
					if (xDetail != null) {
						if (xDetail.status_code == '00') {
								
							var xJoArrRequestDetailData = [];
							// var xTotalItem = 0;
							// var xPayreqDetail = xDetail.data.payment_request_detail;
								
							// // looping detail item
							// // for (var index in xPayreqDetail) {
							// // 	// if (xPayreqDetail[index].price_total != null && xPayreqDetail[index].price_total != 0) {
							// // 	// 	xTotalItem = xTotalItem + 1;
							// // 	// }
							// // 	// console.log(`>>> xDetail[index]: ${JSON.stringify(xDetail[index])}`);
							// // 	xJoArrRequestDetailData.push({
							// // 		id: await _utilInstance.encrypt(xPayreqDetail[index].id, config.cryptoKey.hashKey),
							// // 		product: {
							// // 			id: xPayreqDetail[index].product_id,
							// // 			code: xPayreqDetail[index].product_code,
							// // 			name: xPayreqDetail[index].product_name
							// // 		},
							// // 		uom: xPayreqDetail[index].uom_name,
							// // 		uom_id: xPayreqDetail[index].uom_id,
							// // 		qty_demand: xPayreqDetail[index].qty_demand,
							// // 		price_demand: xPayreqDetail[index].price_demand,
							// // 		qty_request: xPayreqDetail[index].qty_request,
							// // 		price_request: xPayreqDetail[index].price_request,
							// // 		tax: xPayreqDetail[index].tax,
							// // 		discount: xPayreqDetail[index].discount,
							// // 		discount_percent: xPayreqDetail[index].discount_percent,
							// // 		price_total: xPayreqDetail[index].price_total,
							// // 		description: xPayreqDetail[index].description,
							// // 		status: xPayreqDetail[index].status,
							// // 	});
							// // }
							
							delete xDetail.data.purchase_request_id;
							// get Detail FPB
							// let xFpbDetail = await _purchaseRequestRepoInstance.getById({ id: xDetail.data.purchase_request_id })
							// if (xFpbDetail != null) {
							// 	xDetail.data.fpb_no = xFpbDetail.request_no
							// }
							
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
				// console.log(`>>> xResultList: ${JSON.stringify(xResultList)}`);
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
								status: xRows[i].status,
								vendor_id: xRows[i].vendor_id,
								vendor_name: xRows[i].vendor_name,
								payreq_type: xRows[i].payreq_type,
								payment_type: xRows[i].payment_type,
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

			var xResultList = await _repoInstance.list(pParam);
			if (xResultList) {
				// console.log(`>>> xResultList: ${JSON.stringify(xResultList)}`);
				if (xResultList.status_code == '00') {
					var xRows = xResultList.data.rows;
					if (xRows.length > 0) {
						for (var i in xRows) {
							xJoArrData.push({
								id: await _utilInstance.encrypt(xRows[i].id.toString(), config.cryptoKey.hashKey),
								document_no: xRows[i].document_no,
								vendor_id: xRows[i].vendor_id,
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
											status_msg: 'Invalid FPB ID'
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

				if (pParam.hasOwnProperty('payment_request_detail')) {
					xJoArrItems = pParam.payment_request_detail;
					if (xJoArrItems.length > 0) {
						for (var i in xJoArrItems) {
							if (
								xJoArrItems[i].hasOwnProperty('qty_request') &&
								xJoArrItems[i].hasOwnProperty('price_request')
							) {
								xJoArrItems[i].price_total =
									xJoArrItems[i].qty_request * xJoArrItems[i].price_request;
							}
						}
					}
					pParam.purchase_request_detail = xJoArrItems;
				}

				let xResult = await _repoInstance.save(pParam, xAct);
				console.log(`>>> xResult ${JSON.stringify(xResult)}`);
				if (xResult.status_code == '00') {
					var dt = dateTime.create();
					var xDate = dt.format('ym');
					var xPayreqNo = `${pParam.company_code}/PAYREQ/${xDate}/` + xResult.clear_id.toString().padStart(5,'0');

					var xParamUpdate = {
						document_no: xPayreqNo,
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
					console.log(`>>> xDetail: ${JSON.stringify(xDetail.status)}`, pParam.id);
					if (xDetail.status_code == '00') {
						if (xDetail.data.status == 0) {
							pParam.status = 1;
							var xUpdate = await _repoInstance.save(pParam, 'submit');
							xJoResult = xUpdate;
						} else {
							xJoResult = {
								status_code: '-99',
								status_msg: `Payment request already in process`
							};
						}
					} else {
						xJoResult = xDetail;
					}
				} else {
					xJoResult = {
						status_code: '-99',
						status_msg: `Payment request id not found`
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
				var xPayreqDetail = await _repoInstance.getByParameter({ id: pParam.id });
				if (xPayreqDetail != null) {
					if (xPayreqDetail.status_code == '00') {
						if (xPayreqDetail.data.status == 0) {
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
						xJoResult = xPayreqDetail
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
				var xPayreqDetail = await _repoInstance.getByParameter({ id: pParam.id });
				if (xPayreqDetail != null) {
					if (xPayreqDetail.status_code == '00') {
						if (xPayreqDetail.data.status == 5) {
							xJoResult = {
								status_code: '-99',
								status_msg: 'This document already cancel'
							};
						} else {
							var xParamUpdate = {
								id: pParam.id,
								status: 5,
								canceled_at: await _utilInstance.getCurrDateTime(),
								canceled_reason: pParam.cancel_reason,
								// approved_at: await _utilInstance.getCurrDateTime()
							};
							var xUpdateResult = await _repoInstance.save(xParamUpdate, 'update');

							if (xUpdateResult.status_code == '00') {
								xJoResult = {
									status_code: '00',
									status_msg: 'Payreq successfully canceled'
								};
							} else {
								xJoResult = xUpdateResult;
							}
						}
					
					} else {
						xJoResult = xPayreqDetail
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
	
	async confirm(pParam) {
		var xJoResult = {};
		var xDecId = null;
		var xFlagProcess = false;
		var xEncId = '';

		if (pParam.document_id != '' && pParam.user_id != '') {
			xEncId = pParam.document_id;
			xDecId = await _utilInstance.decrypt(pParam.document_id, config.cryptoKey.hashKey);
			if (xDecId.status_code == '00') {
				xFlagProcess = true;
				pParam.document_id = xDecId.decrypted;
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
			// Check if this request id valid or not
			var xPayreqDetail = await _repoInstance.getByParameter({ id: pParam.document_id });
			if (xPayreqDetail != null) {
				if (xPayreqDetail.status_code == '00') {
					if (xPayreqDetail.data.status == 1) {
						var xParamUpdate = {
							id: pParam.document_id,
							status: 2,
							// approved_at: await _utilInstance.getCurrDateTime()
						};
						var xUpdateResult = await _repoInstance.save(xParamUpdate, 'update');

						if (xUpdateResult.status_code == '00') {
							xJoResult = {
								status_code: '00',
								status_msg: 'Payreq successfully approved'
							};
						} else {
							xJoResult = xUpdateResult;
						}
					} else {
						xJoResult = {
							status_code: '-99',
							status_msg: 'This document already confirmed before.'
						};
					}
				
				} else {
					xJoResult = xPayreqDetail
				}
			} else {
				xJoResult = {
					status_code: '-99',
					status_msg: 'Data not found'
				};
			}
		}

		return xJoResult;
	}

	async reject(pParam) {
		var xJoResult = {};
		var xDecId = null;
		var xFlagProcess = false;
		var xEncId = '';

		if (pParam.document_id != '' && pParam.user_id != '') {
			xEncId = pParam.document_id;
			xDecId = await _utilInstance.decrypt(pParam.document_id, config.cryptoKey.hashKey);
			if (xDecId.status_code == '00') {
				xFlagProcess = true;
				pParam.document_id = xDecId.decrypted;
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
			// Check if this request id valid or not
			var xPayreqDetail = await _repoInstance.getByParameter({ id: pParam.document_id });
			if (xPayreqDetail != null) {
				if ( xPayreqDetail.status == 1) {
					var xParamUpdate = {
						id: pParam.document_id,
						status: 6,
						// approved_at: await _utilInstance.getCurrDateTime()
					};
					var xUpdateResult = await _repoInstance.save(xParamUpdate, 'update');

					if (xUpdateResult.status_code == '00') {
						xJoResult = {
							status_code: '00',
							status_msg: 'Payreq successfully rejected'
						};
					} else {
						xJoResult = xUpdateResult;
					}
				} else {
					xJoResult = {
						status_code: '-99',
						status_msg: 'This document already rejected before.'
					};
				}
			} else {
				xJoResult = {
					status_code: '-99',
					status_msg: 'Data not found'
				};
			}
		}

		return xJoResult;
	}
	
	async paid(pParam) {
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
				var xPayreqDetail = await _repoInstance.getByParameter({ id: pParam.id });
				if (xPayreqDetail != null) {
					if (xPayreqDetail.status_code == '00') {
						if (xPayreqDetail.data.status != 2) {
							xJoResult = {
								status_code: '-99',
								status_msg: 'This document cannot be processed'
							};
						} else {
							var xParamUpdate = {
								id: pParam.id,
								status: 3
								// approved_at: await _utilInstance.getCurrDateTime()
							};
							var xUpdateResult = await _repoInstance.save(xParamUpdate, 'update');

							if (xUpdateResult.status_code == '00') {
								xJoResult = {
									status_code: '00',
									status_msg: 'Payreq successfully paid'
								};
							} else {
								xJoResult = xUpdateResult;
							}
						}
					
					} else {
						xJoResult = xPayreqDetail
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
	
	async done(pParam) {
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
				var xPayreqDetail = await _repoInstance.getByParameter({ id: pParam.id });
				if (xPayreqDetail != null) {
					if (xPayreqDetail.status_code == '00') {
						if (xPayreqDetail.data.status != 3) {
							xJoResult = {
								status_code: '-99',
								status_msg: 'This document cannot be processed'
							};
						} else {
							var xParamUpdate = {
								id: pParam.id,
								status: 4
								// approved_at: await _utilInstance.getCurrDateTime()
							};
							var xUpdateResult = await _repoInstance.save(xParamUpdate, 'update');

							if (xUpdateResult.status_code == '00') {
								xJoResult = {
									status_code: '00',
									status_msg: 'Payreq successfully done'
								};
							} else {
								xJoResult = xUpdateResult;
							}
						}
					
					} else {
						xJoResult = xPayreqDetail
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
}

module.exports = PaymentRequestService;
