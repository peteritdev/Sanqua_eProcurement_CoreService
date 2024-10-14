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
const PJCARepository = require('../repository/pjcarepository.js');
const _repoInstance = new PJCARepository();

const PaymentRequestRepository = require('../repository/paymentrequestrepository.js');
const _paymentRequestRepoInstance = new PaymentRequestRepository();

const PaymentRequestDetailRepository = require('../repository/paymentrequestdetailrepository.js');
const _paymentRequestDetailRepoInstance = new PaymentRequestDetailRepository();
// const PJCADetailRepository = require('../repository/PJCAdetailrepository.js');
// const _repoDetailInstance = new PJCADetailRepository();

// OAuth Service
const OAuthService = require('./oauthservice.js');
const _oAuthService = new OAuthService();

const VendorCatalogueService = require('./vendorcatalogueservice.js');
const _catalogueService = new VendorCatalogueService();

const PaymentRequestService = require('./paymentrequestservice.js');
const _paymentRequestServiceInstance = new PaymentRequestService();

const _xClassName = 'PJCAService';

class PJCAService {
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
					console.log(`>>> pParam: ${JSON.stringify(xDetail)}`);
					if (xDetail != null) {
						if (xDetail.status_code == '00') {
								
							let xFileArr = [];
							for (var j in xDetail.file) {
								xFileArr.push({
									subject: xDetail.file[j].subject,
									file:
										xDetail.file[j].file != null
											? `${config.imagePathESanQua}/eprocurement/pjca/${xDetail.file[j].file}`
											: null
								});
							}
							xDetail.file = xFileArr
							var xPjcaDetail = xDetail.data.pjca_detail;
							var xGlobalAmount = xDetail.data.global_discount 
							var xGlobalPercent = xDetail.data.global_discount_percent
							var xTotalBasePrice = 0;
							var xTotalDiscItem = 0;
							var xTotalDiscWoTax = 0;
							var xTaxes = 0;
								
							// // looping detail item
							for (var i in xPjcaDetail) {
								// delete xPjcaDetail[i].price_total
								var xPricePerItem = xPjcaDetail[i].price_done
								// var xTotalPrice = Math.round((xPjcaDetail[i].price_request * xPjcaDetail[i].qty_request) * 1000) / 1000
								var xDiscAmount = xPjcaDetail[i].discount_amount || 0
								var xDiscPercent = xPjcaDetail[i].discount_percent || 0
								var xDiscWoTax = 0
								var xTotalDisc = 0
								var xTax = 0
								var xPriceWithDisc = 0
								var xPriceBeforeTax = 0
								var xTotalPrice = 0
								var xSubtotal = 0

								// calc discount
								if (xPjcaDetail[i].discount_percent != null && xPjcaDetail[i].discount_percent != 0) {
									xDiscAmount = Math.round((xPricePerItem * (xPjcaDetail[i].discount_percent / 100)) * 1000) / 1000
									xPjcaDetail[i].discount_amount = Math.round(xDiscAmount * 1000) / 1000
								}
								if (xPjcaDetail[i].discount_amount != null && xPjcaDetail[i].discount_amount != 0) {
									xDiscPercent = (xPjcaDetail[i].discount_amount / xPricePerItem) * 100
									xPjcaDetail[i].discount_percent = Math.round(xDiscPercent * 1000) / 1000
								}
								
								xDiscWoTax = Math.round((xPricePerItem * (xDiscPercent / 100)) * 1000) / 1000

								xPriceWithDisc = Math.round((xPricePerItem - xDiscWoTax) * 1000) / 1000
								// calc price after tax
								if (xPjcaDetail[i].tax != null) {
									var taxValue = xPjcaDetail[i].tax.value / 100
									if (xPjcaDetail[i].tax.type == 1) {
										taxValue = 1 + taxValue
										xPriceBeforeTax = Math.round((xPriceWithDisc / taxValue) * 1000) / 1000
										xTax = Math.round((xPriceWithDisc - xPriceBeforeTax) * 1000) / 1000
										// xTotalPriceWithTax = Math.round((xTotalPrice - xTax) * 1000) / 1000
										if (xDiscPercent != 0) {
											xTotalDisc = Math.round((xDiscWoTax / taxValue) * 1000) / 1000
										}
										xTotalPrice = Math.round((xPriceWithDisc - xTax) * 1000) / 1000
									}else{
										xPriceBeforeTax = Math.round((xPriceWithDisc / taxValue) * 1000) / 1000
										xTax = Math.round((xPriceWithDisc - xPriceBeforeTax) * 1000) / 1000
										xTotalDisc = xDiscWoTax
										xTotalPrice = xPriceWithDisc
									}
								} else {
									xTotalDisc = xDiscWoTax
									xTotalPrice = xPriceWithDisc
								}
								
								// xTotalDisc = 
								xSubtotal = Math.round((xTotalPrice * xPjcaDetail[i].qty_done) * 1000) / 1000
								xPjcaDetail[i].subtotal = xSubtotal

								xTotalDiscWoTax += Math.round((xDiscWoTax * xPjcaDetail[i].qty_done) * 1000) / 1000
								xTotalDiscItem += Math.round((xTotalDisc * xPjcaDetail[i].qty_done) * 1000) / 1000
								xPjcaDetail[i].total_discount = Math.round((xTotalDisc * xPjcaDetail[i].qty_done) * 1000) / 1000

								xTaxes += Math.round((xTax * xPjcaDetail[i].qty_done) * 1000) / 1000

								xTotalBasePrice += xSubtotal

								xPjcaDetail[i].tax_amount = xTax
							}
							
							delete xDetail.data.payment_request_id;
							xDetail.data.total_discount_wo_tax = xTotalDiscWoTax
							xDetail.data.total_base_price = Math.round((xTotalBasePrice + xTotalDiscItem || 0) * 1000) / 1000
							xDetail.data.total_discount = Math.round((xTotalDiscItem || 0) * 1000) / 1000

							if (xDetail.data.global_discount != null & xDetail.data.global_discount != 0) {
								if (xTotalDiscItem != 0) {
									xGlobalPercent = (xDetail.data.global_discount / xTotalDiscItem) * 100
								} else {
									xGlobalPercent = (xDetail.data.global_discount / xTotalBasePrice) * 100
								}
							}
							
							if (xDetail.data.global_discount_percent != null & xDetail.data.global_discount_percent != 0) {
								if (xTotalDiscItem != 0) {
									xGlobalAmount = (xDetail.data.global_discount_percent * xTotalDiscWoTax ) / 100
								} else {
									xGlobalAmount = (xDetail.data.global_discount_percent * xTotalBasePrice) / 100
								}
							}
							
							xDetail.data.global_discount_percent = Math.round(xGlobalPercent * 1000) / 1000
							xDetail.data.global_discount = Math.round(xGlobalAmount * 1000) / 1000

							if (xGlobalAmount == 0) {
								xDetail.data.untaxed_amount = Math.round((xDetail.data.total_base_price - xDetail.data.total_discount || 0 ) * 1000) / 1000
								xDetail.data.total_tax_amount = Math.round(( xTaxes || 0 ) * 1000) / 1000
							} else { 
								xDetail.data.untaxed_amount = Math.round((xDetail.data.total_base_price - xGlobalAmount || 0) * 1000) / 1000
								
								if (xPjcaDetail.every( ({ tax_type }) => tax_type == 3 || tax_type == 4)) {
									xDetail.data.total_tax_amount = (Math.round((xDetail.data.untaxed_amount * 0.11) * 1000 )  / 1000) || 0
								} else {
									xDetail.data.total_tax_amount = (Math.round((xTaxes) * 1000 )  / 1000) || 0
								}
								// xDetail.data.total_tax_amount = (Math.round((xTaxes - (xTaxes * (xDetail.data.global_discount_percent / 100))) * 1000 )  / 1000) || 0
							}

							xDetail.data.total_price = Math.round((xDetail.data.untaxed_amount + xDetail.data.total_tax_amount || 0) * 1000) / 1000
							
							// Get Approval Matrix
							var xParamApprovalMatrix = {
								application_id: 8,
								table_name: config.dbTables.pjca,
								document_id: xEncId
							};
							var xResultApprovalMatrix = await _oAuthService.getApprovalMatrix(
								pParam.method,
								pParam.token,
								xParamApprovalMatrix
							);

							if (xResultApprovalMatrix != null) {
								if (xResultApprovalMatrix.status_code == '00') {
									let xListApprover = xResultApprovalMatrix.token_data.data;
									for (var i in xListApprover) {
										let xApproverUsers = _.filter(xListApprover[i].approver_user, { status: 0 }).map(
											// update 08/08/2023 prevent user is null
											(v) => (v.user != null ? v.user.email : v.user)
										);
										xArrUserCanCancel.push.apply(xArrUserCanCancel, xApproverUsers);
									}
								}
							}
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
			if (pParam.hasOwnProperty('payment_request_id')) {
				if (pParam.payment_request_id != '') {
					// xEncId = pParam.payment_request_id;
					let xDecId = await _utilInstance.decrypt(pParam.payment_request_id, config.cryptoKey.hashKey);
					if (xDecId.status_code == '00') {
						pParam.payment_request_id = xDecId.decrypted;
					}
				}
			}
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
								updated_by_name: xRows[i].updated_by_name,
								payment_request: xRows[i].payment_request,
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
									var xPaymentRequest = await _paymentRequestRepoInstance.getByParameter({id: xDecId.decrypted});
									console.log(`>>> xPaymentRequest ${JSON.stringify(xPaymentRequest)}`);
									if (xPaymentRequest != null) {
										if (xPaymentRequest.status_code == '00') {
											if (xPaymentRequest.data.status == 3) {
												pParam.company_id = xPaymentRequest.data.company_id
												pParam.company_code = xPaymentRequest.data.company_code
												pParam.company_name = xPaymentRequest.data.company_name
												pParam.department_id = xPaymentRequest.data.department_id
												pParam.department_name = xPaymentRequest.data.department_name
												xFlagProcess = true;
											} else {
												xJoResult = {
													status_code: '-99',
													status_msg: 'Cannot be processed yet'
												};
											}
										} else {
											xJoResult = xPaymentRequest
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
				var xJoArrItems = [];

				if (pParam.hasOwnProperty('pjca_detail')) {
					xJoArrItems = pParam.pjca_detail;
					if (xJoArrItems.length > 0) {
						for (var i in xJoArrItems) {
							var xPrdId = await _utilInstance.decrypt(xJoArrItems[i].prd_id, config.cryptoKey.hashKey);
							if (xPrdId.status_code == '00') {
								xJoArrItems[i].prd_id = xPrdId.decrypted;
								// delete xJoArrItems[i].prd_id
							}
							console.log(`>>> xPrdId ${JSON.stringify(xPrdId)}`);
							if (
								xJoArrItems[i].hasOwnProperty('price_done') &&
								xJoArrItems[i].hasOwnProperty('qty_done')
							) {
								xJoArrItems[i].price_total =
									xJoArrItems[i].qty_done * xJoArrItems[i].price_done;
							}
						}
					}

					console.log(`>>> xJoArrItems ${JSON.stringify(xJoArrItems)}`);
					pParam.pjca_detail = xJoArrItems;
				}

				let xResult = await _repoInstance.save(pParam, xAct);
				if (xResult.status_code == '00') {
					var dt = dateTime.create();
					var xDate = dt.format('ym');
					var xPJCANo = `${pParam.company_code}/PJCA/${xDate}/` + xResult.clear_id.toString().padStart(5,'0');

					var xParamUpdate = {
						document_no: xPJCANo,
						id: xResult.clear_id
					};

					var xUpdate = await _repoInstance.save(xParamUpdate, 'update');
				}

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
				

				if (xDetail != null) {
					console.log(`>>> xDetail: ${JSON.stringify(xDetail.status)}`, pParam.id);
					if (xDetail.status_code == '00') {
						if (xDetail.data.status == 0) {
							pParam.status = 1;
							pParam.created_at = await _utilInstance.getCurrDateTime();
							var xUpdate = await _repoInstance.save(pParam, 'submit');
							xJoResult = xUpdate;

							// Next Phase : Approval Matrix & Notification to admin
							if (xUpdate.status_code == '00') {
								var xParamAddApprovalMatrix = {
									act: 'add',
									document_id: xEncId,
									document_no: xDetail.data.document_no,
									application_id: 8,
									table_name: config.dbTables.pjca,
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

								xJoResult.approval_matrix_result = xApprovalMatrixResult;
							} else {
								xJoResult = xUpdate;
							}
						} else {
							xJoResult = {
								status_code: '-99',
								status_msg: `PJCA already in process`
							};
						}
					} else {
						xJoResult = xDetail;
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
				var xPJCADetail = await _repoInstance.getByParameter({ id: pParam.id });
				if (xPJCADetail != null) {
					if (xPJCADetail.status_code == '00') {
						if (xPJCADetail.data.status == 0) {
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
									status_msg: 'PJCA successfully set to draft'
								};
							} else {
								xJoResult = xUpdateResult;
							}
						}
					
					} else {
						xJoResult = xPJCADetail
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
				var xPJCADetail = await _repoInstance.getByParameter({ id: pParam.id });
				if (xPJCADetail != null) {
					if (xPJCADetail.status_code == '00') {
						if (xPJCADetail.data.status == 4) {
							xJoResult = {
								status_code: '-99',
								status_msg: 'This document already cancel'
							};
						} else {
							var xParamUpdate = {
								id: pParam.id,
								status: 4,
								canceled_at: await _utilInstance.getCurrDateTime(),
								canceled_reason: pParam.cancel_reason,
								// approved_at: await _utilInstance.getCurrDateTime()
							};
							var xUpdateResult = await _repoInstance.save(xParamUpdate, 'update');

							if (xUpdateResult.status_code == '00') {
								xJoResult = {
									status_code: '00',
									status_msg: 'PJCA successfully canceled'
								};
							} else {
								xJoResult = xUpdateResult;
							}
						}
					
					} else {
						xJoResult = xPJCADetail
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
			var xPjcaDetail = await _repoInstance.getByParameter({ id: pParam.document_id });
			if (xPjcaDetail != null) {
				if (xPjcaDetail.status_code == '00') {
					if (xPjcaDetail.data.status != 1) {
						xJoResult = {
							status_code: '-99',
							status_msg: 'This document already confirmed before.'
						};
					} else {
						var xParamApprovalMatrixDocument = {
							document_id: xEncId,
							status: 1,
							application_id: 8,
							table_name: config.dbTables.pjca
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
										status_msg: 'PJCA successfully confirmed'
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
					xJoResult = xPjcaDetail
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
			var xPjcaDetail = await _repoInstance.getByParameter({ id: pParam.document_id });
			if (xPjcaDetail != null) {
				if (xPjcaDetail.data.status != 1) {
					xJoResult = {
						status_code: '-99',
						status_msg: 'This document already confirmed before.'
					};
				} else {
					var xParamApprovalMatrixDocument = {
						document_id: xEncId,
						status: -1,
						application_id: 8,
						table_name: config.dbTables.pjca
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
							// Update status Pjca to be confirmed
							var xParamUpdatePR = {
								id: pParam.document_id,
								status: 5,
								reject_reason: pParam.reject_reason
							};
							var xUpdateResult = await _repoInstance.save(xParamUpdatePR, 'update');

							if (xUpdateResult.status_code == '00') {
								xJoResult = {
									status_code: '00',
									status_msg: 'PJCA successfully rejected'
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
				var xPJCADetail = await _repoInstance.getByParameter({ id: pParam.id });
				if (xPJCADetail != null) {
					if (xPJCADetail.status_code == '00') {
						if (xPJCADetail.data.status != 2) {
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
								var xPayreqUpdate = {
									id: xPJCADetail.data.payment_request_id,
									status: 4
									// approved_at: await _utilInstance.getCurrDateTime()
								};
								var xUpdateResult = await _paymentRequestRepoInstance.save(xPayreqUpdate, 'update');
								if (xUpdateResult.status_code == '00') {
									this.updatePyrdItemQtyRelease(xPJCADetail.data, 'done')
									xJoResult = {
										status_code: '00',
										status_msg: 'PJCA successfully done'
									};
								} else {
									
									var xParamUpdate = {
										id: pParam.id,
										status: 2
										// approved_at: await _utilInstance.getCurrDateTime()
									};
									var xUpdateResult = await _repoInstance.save(xParamUpdate, 'update');
									
									xJoResult = {
										status_code: '-99',
										status_msg: 'Failed update status'
									};
								}
							} else {
								xJoResult = xUpdateResult;
							}
						}
					
					} else {
						xJoResult = xPJCADetail
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

	async fetchMatrixPjca(pParam) {
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
			// Get PJCA Detail
			var xPjcaDetail = await _repoInstance.getByParameter({ id: xClearId });
			console.log(`>>> xFetchPayreqDetail: ${JSON.stringify(xPjcaDetail)}`);
			if (xPjcaDetail != null) {
				if (xPjcaDetail.data.status != 1) {
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
							document_no: xPjcaDetail.data.document_no,
							application_id: 8,
							table_name: config.dbTables.pjca,
							company_id: xPjcaDetail.data.company_id,
							department_id: xPjcaDetail.data.department_id,
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
	
	async updatePyrdItemQtyRelease(pParam, pAct){
		let xPjcaDetail = pParam.pjca_detail
		console.log(`>>> xPjcaDetail: ${JSON.stringify(xPjcaDetail)}`);
		for (let i = 0; i < xPjcaDetail.length; i++) {
			var xPyrDetailItem = await _paymentRequestDetailRepoInstance.getByParam(
				{
					payment_request_id: pParam.payment_request_id,
					prd_id: xPjcaDetail[i].prd_id
				}
			)
			console.log(`>>> xPyrDetailItem: ${JSON.stringify(xPyrDetailItem)}`);
			if (xPyrDetailItem.status_code == '00') {
				let xQtyRelease = xPyrDetailItem.data.qty_done || 0
				let xCalculatedQty = 0
				if (pAct == 'done') {
					xCalculatedQty = xQtyRelease + xPjcaDetail[i].qty_done
				} else if (pAct == 'reject' || pAct == 'cancel' ){
					xCalculatedQty = xQtyRelease - xPjcaDetail[i].qty_done
				}
				let xPyrdUpdateParam = {
					id: xPyrDetailItem.data.id,
					qty_done: xCalculatedQty
				}
				
				let xUpdatePyrdItem = await _paymentRequestDetailRepoInstance.save(xPyrdUpdateParam, 'update')
				console.log(`>>> xUpdatePyrdItem: ${JSON.stringify(xUpdatePyrdItem)}`);
			}
		}
	}
}

module.exports = PJCAService;
