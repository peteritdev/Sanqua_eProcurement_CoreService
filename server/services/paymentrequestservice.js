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

const PurchaseRequestDetailRepository = require('../repository/purchaserequestdetailrepository.js');
const _purchaseRequestDetailRepoInstance = new PurchaseRequestDetailRepository();
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
		var xArrUserCanCancel = [];

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
								
							// var xJoArrRequestDetailData = [];
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
							
							// Get Approval Matrix
							var xParamApprovalMatrix = {
								application_id: 8,
								table_name: config.dbTables.payreq,
								document_id: xEncId
							};
							var xResultApprovalMatrix = await _oAuthService.getApprovalMatrix(
								pParam.method,
								pParam.token,
								xParamApprovalMatrix
							);

							console.log(`>>> xResultApprovalMatrix: ${JSON.stringify(xResultApprovalMatrix)}`);

							if (xResultApprovalMatrix != null) {
								if (xResultApprovalMatrix.status_code == '00') {
									let xListApprover = xResultApprovalMatrix.token_data.data;
									console.log(`>>> xListApprover: ${JSON.stringify(xListApprover)}`);
									for (var i in xListApprover) {
										console.log(`>>> approver_user[${i}]: ${JSON.stringify(xListApprover[i].approver_user)}`);
										let xApproverUsers = _.filter(xListApprover[i].approver_user, { status: 0 }).map(
											// update 08/08/2023 prevent user is null
											(v) => (v.user != null ? v.user.email : v.user)
										);
										console.log(`>>> xApproverUsers: ${JSON.stringify(xApproverUsers)}`);
										xArrUserCanCancel.push.apply(xArrUserCanCancel, xApproverUsers);
									}
								}
							}
							console.log(`>>> xArrUserCanCancel: ${JSON.stringify(xArrUserCanCancel)}`);
							xDetail.data.approver_users = xArrUserCanCancel
							xDetail.data.approval_matrix = xResultApprovalMatrix.status_code == '00' && xResultApprovalMatrix.token_data.status_code == '00' ? xResultApprovalMatrix.token_data.data : null

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
							var xPrdId = await _utilInstance.decrypt(xJoArrItems[i].prd_id, config.cryptoKey.hashKey);
							if (xPrdId.status_code == '00') {
								xJoArrItems[i].prd_id = xPrdId.decrypted;
								// delete xJoArrItems[i].prd_id
							}
							console.log(`>>> xPrdId ${JSON.stringify(xPrdId)}`);
							if (
								xJoArrItems[i].hasOwnProperty('qty_request') &&
								xJoArrItems[i].hasOwnProperty('price_request')
							) {
								xJoArrItems[i].price_total =
									xJoArrItems[i].qty_request * xJoArrItems[i].price_request;
							}
						}
					}

					console.log(`>>> xJoArrItems ${JSON.stringify(xJoArrItems)}`);
					pParam.purchase_request_detail = xJoArrItems;
				}

				let xResult = await _repoInstance.save(pParam, xAct);
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
				console.log(`>>> xDetail: ${JSON.stringify(xDetail)}`);
				

				if (xDetail != null) {
					if (xDetail.status_code == '00') {
						if (xDetail.data.status == 0) {
							pParam.status = 1;
							pParam.requested_at = await _utilInstance.getCurrDateTime();
							// check total qty is not exceed qty_left in detail fpb
							let xArrPrdId = []
							let xPyrDetail = xDetail.data.payment_request_detail
							console.log(`>>> xPyrDetail: ${JSON.stringify(xPyrDetail)}`);
							for (let i = 0; i < xPyrDetail.length; i++) {
								xArrPrdId.push(xPyrDetail[i].prd_id)
							}
							let xUniq = [...new Set(xArrPrdId)];
							for (let i = 0; i < xUniq.length; i++) {
								let xPrDetailItem = await _purchaseRequestDetailRepoInstance.getByParam({id: xUniq[i]})
								if (xPrDetailItem.status_code = '00') {
									let xPrdQtyLeft = xPrDetailItem.data.qty_left
									let xArrPyrd = xPyrDetail.filter(({ prd_id }) => prd_id == xUniq[i])
									let xPyrdTotalQty = xArrPyrd.reduce((accum, item) => accum + item.qty_request, 0)
									if ( xPyrdTotalQty > xPrdQtyLeft) {
										xFlagProcess = false
										xJoResult = {
											status_code: '-99',
											status_msg: `Total qty of item ${xArrPyrd[0].product_code} (${xPyrdTotalQty}) is exceed Left Qty on FPB (${xPrdQtyLeft})`
										};
										break;
									}
								}
							}

							if (xFlagProcess) {
								var xUpdate = await _repoInstance.save(pParam, 'submit');
								xJoResult = xUpdate;
								
								// Next Phase : Approval Matrix & Notification to admin
								if (xUpdate.status_code == '00') {
									this.updatePrdItemQtyLeft(xDetail.data, 'submit')
									
									var xParamAddApprovalMatrix = {
										act: 'add',
										document_id: xEncId,
										document_no: xDetail.data.document_no,
										application_id: 8,
										table_name: config.dbTables.payreq,
										company_id: xDetail.data.company_id,
										department_id: xDetail.data.department_id,
										ecatalogue_fpb_category_item: null,
										logged_company_id: pParam.logged_company_id
									};

									var xApprovalMatrixResult = await _oAuthService.addApprovalMatrix(
										pParam.method,
										pParam.token,
										xParamAddApprovalMatrix
									);
									console.log(`>>> xApprovalMatrixResult: ${JSON.stringify(xApprovalMatrixResult)}`);

									xJoResult.approval_matrix_result = xApprovalMatrixResult;
								} else {
									xJoResult = xUpdate;
								}
							}
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
								if (xPayreqDetail.data.status != 0) {
									this.updatePrdItemQtyLeft(xPayreqDetail.data, 'cancel')
								}
								
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
					if (xPayreqDetail.data.status != 1) {
						xJoResult = {
							status_code: '-99',
							status_msg: 'This document already confirmed before.'
						};
					} else {
						var xParamApprovalMatrixDocument = {
							document_id: xEncId,
							status: 1,
							application_id: 8,
							table_name: config.dbTables.payreq
						};
	
						var xResultApprovalMatrixDocument = await _oAuthService.confirmApprovalMatrix(
							pParam.method,
							pParam.token,
							xParamApprovalMatrixDocument
						);
	
						if (xResultApprovalMatrixDocument != null) {
							if (xResultApprovalMatrixDocument.status_code == '00') {
								// Update status Pjca to be confirmed
								var xParamUpdatePR = {
									id: pParam.document_id,
									status: 2,
									reject_reason: pParam.reject_reason
								};
								var xUpdateResult = await _repoInstance.save(xParamUpdatePR, 'update');
	
								if (xUpdateResult.status_code == '00') {
									xJoResult = {
										status_code: '00',
										status_msg: 'Payreq successfully confirmed'
									};
								} else {
									xJoResult = xUpdateResult;
								}
							} else {
								xJoResult = xResultApprovalMatrixDocument;
							}
						} else {
							xJoResult = {
								status_code: '-99',
								status_msg: 'There is problem on approval matrix processing. Please try again'
							};
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
				if (xPayreqDetail.data.status != 1) {
					xJoResult = {
						status_code: '-99',
						status_msg: 'This document already confirmed before.'
					};
				} else {
					var xParamApprovalMatrixDocument = {
						document_id: xEncId,
						status: -1,
						application_id: 8,
						table_name: config.dbTables.payreq
					};

					var xResultApprovalMatrixDocument = await _oAuthService.confirmApprovalMatrix(
						pParam.method,
						pParam.token,
						xParamApprovalMatrixDocument
					);

					// await _utilInstance.writeLog(
					// 	`${_xClassName}.rejectPayreq`,
					// 	`xResultApprovalMatrixDocument: ${xResultApprovalMatrixDocument}`,
					// 	'debug'
					// );

					if (xResultApprovalMatrixDocument != null) {
						if (xResultApprovalMatrixDocument.status_code == '00') {
							// Update status Payreq to be confirmed
							var xParamUpdatePR = {
								id: pParam.document_id,
								status: 6,
								reject_reason: pParam.reject_reason
							};
							var xUpdateResult = await _repoInstance.save(xParamUpdatePR, 'update');

							if (xUpdateResult.status_code == '00') {
								this.updatePrdItemQtyLeft(xPayreqDetail.data, 'reject')

								xJoResult = {
									status_code: '00',
									status_msg: 'Payreq successfully rejected'
								};
							} else {
								xJoResult = xUpdateResult;
							}
						} else {
							xJoResult = xResultApprovalMatrixDocument;
						}
					} else {
						xJoResult = {
							status_code: '-99',
							status_msg: 'There is problem on approval matrix processing. Please try again'
						};
					}
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
	
	async fetchMatrixPayreq(pParam) {
		var xJoResult = {};
		var xDecId = null;
		var xFlagProcess = false;
		var xEncId = '';
		var xClearId = '';

		if (pParam.id != '' && pParam.user_id != '') {
			xDecId = await _utilInstance.decrypt(pParam.id, config.cryptoKey.hashKey);
			if (xDecId.status_code == '00') {
				xFlagProcess = true;
				xEncId = pParam.id;
				pParam.id = xDecId.decrypted;
				xClearId = xDecId.decrypted;
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
			// Get PR Detail
			var xPayreqDetail = await _repoInstance.getByParameter({ id: xClearId });
			console.log(`>>> xFetchPayreqDetail: ${JSON.stringify(xPayreqDetail)}`);
			if (xPayreqDetail != null) {
				if (xPayreqDetail.data.status != 1) {
					xJoResult = {
						status_code: '-99',
						status_msg: 'Fetch matrix cannot be processed, please check again'
					};
				} else {
					pParam.approved_at = null;
					const xUpdateParam = {
						id: xClearId,
						approved_at: null,
						user_id: pParam.user_id,
						user_name: pParam.user_name
					}
					var xUpdateResult = await _repoInstance.save(xUpdateParam, 'update');
					console.log(`>>> xUpdateResult: ${JSON.stringify(xUpdateResult)}`);
					xJoResult = xUpdateResult;
					// Next Phase : Approval Matrix & Notification to admin
					if (xUpdateResult.status_code == '00') {
						// Fetch Approval Matrix
						var xParamAddApprovalMatrix = {
							act: 'fetch_matrix',
							document_id: xEncId,
							document_no: xPayreqDetail.data.document_no,
							application_id: 8,
							table_name: config.dbTables.payreq,
							company_id: xPayreqDetail.data.company_id,
							department_id: xPayreqDetail.data.department_id,
							ecatalogue_fpb_category_item: null,
							logged_company_id: pParam.logged_company_id
						};

						var xApprovalMatrixResult = await _oAuthService.addApprovalMatrix(
							pParam.method,
							pParam.token,
							xParamAddApprovalMatrix
						);
						console.log(`>>> xApprovalMatrixResult: ${JSON.stringify(xApprovalMatrixResult)}`);
						xJoResult.approval_matrix_result = xApprovalMatrixResult;
	
					} else {
						xJoResult = xUpdateResult;
					}
				}
			} else {
				xJoResult = {
					status_code: '-99',
					status_msg: 'Data not found. Please supply valid identifier'
				};
			}
		}

		return xJoResult;
	}

	async updatePrdItemQtyLeft(pParam, pAct){
		let xPaymentRequestDetail = pParam.payment_request_detail
		console.log(`>>> xPaymentRequestDetail: ${JSON.stringify(xPaymentRequestDetail)}`);
		for (let i = 0; i < xPaymentRequestDetail.length; i++) {
			var xPrDetailItem = await _purchaseRequestDetailRepoInstance.getByParam({id: xPaymentRequestDetail[i].prd_id})
			console.log(`>>> xPrDetailItem: ${JSON.stringify(xPrDetailItem)}`);
			if (xPrDetailItem.status_code == '00') {
				let xQtyLeft = xPrDetailItem.data.qty_left || 0
				let xCalculatedQty = 0
				if (pAct == 'submit') {
					xCalculatedQty = xQtyLeft - xPaymentRequestDetail[i].qty_request
				} else if (pAct == 'reject' || pAct == 'cancel' ){
					xCalculatedQty = xQtyLeft + xPaymentRequestDetail[i].qty_request
				}
				let xPrdUpdateParam = {
					id: xPaymentRequestDetail[i].prd_id,
					qty_left: xCalculatedQty
				}
				
				let xUpdatePrdItem = await _purchaseRequestDetailRepoInstance.save(xPrdUpdateParam, 'update')
				console.log(`>>> xUpdatePrdItem: ${JSON.stringify(xUpdatePrdItem)}`);
			}
		}
	}
}

module.exports = PaymentRequestService;
