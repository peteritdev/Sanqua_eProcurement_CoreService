const jwt = require('jsonwebtoken');
const md5 = require('md5');
const crypto = require('crypto');
const moment = require('moment');
const Sequelize = require('sequelize');
const dateFormat = require('dateformat');
const Op = Sequelize.Op;
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
const PurchaseRequestRepository = require('../repository/purchaserequestrepository.js');
const _repoInstance = new PurchaseRequestRepository();

// Repository
const PurchaseRequestDetailRepository = require('../repository/purchaserequestdetailrepository.js');
const _repoDetailInstance = new PurchaseRequestDetailRepository();

// OAuth Service
const OAuthService = require('../services/oauthservice.js');
const _oAuthService = new OAuthService();

const VendorCatalogueService = require('../services/vendorcatalogueservice.js');
const _catalogueService = new VendorCatalogueService();

const NotificationService = require('../services/notificationservice.js');
const _notificationService = new NotificationService();

const LogService = require('../services/logservice.js');
const _logServiceInstance = new LogService();

const ProjectService = require('../services/projectservice.js');
const purchaserequestdetail = require('../models/purchaserequestdetail.js');
const _projectServiceInstance = new ProjectService();

const _xClassName = 'PurchaseRequestService';

class PurchaseRequestService {
	constructor() {}

	async save(pParam) {
		var xJoResult;
		var xAct = pParam.act;
		var xFlagProcess = false;
		var xDecId = null;
		var bDect = null;

		delete pParam.act;

		if (pParam.hasOwnProperty('user_id')) {
			if (pParam.user_id != '') {
				xDecId = await _utilInstance.decrypt(pParam.user_id, config.cryptoKey.hashKey);
				if (xDecId.status_code == '00') {
					pParam.user_id = xDecId.decrypted;
					xFlagProcess = true;
					if (pParam.hasOwnProperty('employee_id')) {
						if (pParam.employee_id != '') {
							if (pParam.employee_id.length == 65) {
								xDecId = await _utilInstance.decrypt(pParam.employee_id, config.cryptoKey.hashKey);
								if (xDecId.status_code == '00') {
									pParam.employee_id = xDecId.decrypted;
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
								status_msg: 'Parameter employee_id can not be empty'
							};
						}
					} else {
						xFlagProcess = true;
					}
				} else {
					xJoResult = xDecId;
				}
			} else {
				xJoResult = {
					status_code: '-99',
					status_msg: 'Parameter user_id can not be empty'
				};
			}
		}

		if (xFlagProcess) {
			xFlagProcess = false;
			/*
				At: 10/11/2023
				Description: Checking when the parameter project is set, category_time must be 7 and category_pr must be 'asset'

				At: 30/12/2023
				Description: Since for project, the category pr must be project also then in backend will force to categpry_pr become 'project'
			*/
			// if (pParam.hasOwnProperty('project_id')) {
			// 	if (
			// 		pParam.project_id != '' &&
			// 		pParam.project_id != null &&
			// 		(pParam.category_item != 7 || pParam.category_pr != 'asset')
			// 	) {
			// 		xJoResult = {
			// 			status_code: '-99',
			// 			status_msg: 'Kategori Barang dan Kategori PR tidak sesuai dengan peruntukan project.'
			// 		};
			// 	} else {
			// 		// Check if project_id is match with FPB company

			// 		xFlagProcess = true;
			// 	}
			// } else {
			// 	xFlagProcess = true;
			// }

			if (pParam.hasOwnProperty('project_id')) {
				if (pParam.project_id != '' && pParam.project_id != null) {
					pParam.category_pr = 'project';
					xFlagProcess = true;
				} else {
					xFlagProcess = true;
				}
			} else {
				xFlagProcess = true;
			}

			// if (pParam.hasOwnProperty('budget_plan_id')) {
			// 	bDect = await _utilInstance.decrypt(pParam.budget_plan_id, config.cryptoKey.hashKey);
			// 	if (bDect.status_code == '00') {
			// 		pParam.budget_plan_id = bDect.decrypted
			// 	}
			// }

			if (xFlagProcess) {
				if (xAct == 'add' || xAct == 'add_batch_in_item') {
					// Calculate the total
					var xJoArrItems = [];

					if (pParam.hasOwnProperty('purchase_request_detail')) {
						xJoArrItems = pParam.purchase_request_detail;
						if (xJoArrItems.length > 0) {
							for (var i in xJoArrItems) {
								if (
									xJoArrItems[i].hasOwnProperty('qty') &&
									xJoArrItems[i].hasOwnProperty('budget_price_per_unit')
								) {
									xJoArrItems[i].budget_price_total =
										xJoArrItems[i].qty * xJoArrItems[i].budget_price_per_unit;
								}

								if (xJoArrItems[i].hasOwnProperty('estimate_date_use')) {
									if (xJoArrItems[i].estimate_date_use == '') {
										xJoArrItems[i].estimate_date_use = null;
									}
								}
								// Get Last price from etalase ecatalogue
								let xCatalogue = await _catalogueService.getByVendorCodeAndProductCode({
									vendor_code: xJoArrItems[i].vendor_code,
									product_code: xJoArrItems[i].product_code
								});

								if (xCatalogue.status_code == '00') {
									xJoArrItems[i].last_price = xCatalogue.data.last_price;
									xJoArrItems[i].uom_id = xCatalogue.data.uom_id;
									xJoArrItems[i].uom_name = xCatalogue.data.uom_name;
								}
							}
						}
						pParam.purchase_request_detail = xJoArrItems;
					}

					var xAddResult = await _repoInstance.save(pParam, xAct);
					if (xAddResult.status_code == '00' && xAddResult.created_id != '' && xAddResult.clear_id != '') {
						// Generate FPB No
						var xFPBNo = await _globalUtilInstance.generatePurchaseRequestNo(
							xAddResult.clear_id,
							pParam.company_code
						);
						var xParamUpdate = {
							request_no: xFPBNo,
							id: xAddResult.clear_id
						};

						var xUpdate = await _repoInstance.save(xParamUpdate, 'update');

						if (xUpdate.status_code == '00') {
							xJoResult = xAddResult;
							// ---------------- Start: Add to log ----------------
							let xParamLog = {
								act: 'add',
								employee_id: pParam.employee_id,
								employee_name: pParam.employee_name,
								request_id: xAddResult.clear_id,
								request_no: xFPBNo,
								body: {
									act: 'add',
									msg: 'FPB created'
								}
							};
							console.log(`>>> xParamLog : ${JSON.stringify(xParamLog)}`);
							var xResultLog = await _logServiceInstance.addLog(pParam.method, pParam.token, xParamLog);
							xJoResult.log_result = xResultLog;
							// ---------------- End: Add to log ----------------

							delete xJoResult.clear_id;
						} else {
							xJoResult = xUpdate;
						}
					} else {
						xJoResult = xAddResult;
					}
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
						// Get data before update
						let xDataBeforeUpdate = await _repoInstance.getById({ id: pParam.id });
						delete xDataBeforeUpdate.purchase_request_detail;

						// ---------------- Start: Add to log ----------------
						// let xParamLog = {
						// 	act: 'add',
						// 	employee_id: pParam.employee_id,
						// 	employee_name: pParam.employee_name,
						// 	request_id: pParam.id,
						// 	request_no: xDataBeforeUpdate.request_no,
						// 	body: {
						// 		act: 'update',
						// 		msg: 'FPB changed',
						// 		before: {
						// 			category_item: xDataBeforeUpdate.category_item,
						// 			category_pr: xDataBeforeUpdate.category_pr,
						// 			reference_from_ecommerce: xDataBeforeUpdate.reference_from_ecommerce,
						// 			budget_is_approved: xDataBeforeUpdate.budget_is_approved,
						// 			memo_special_request: xDataBeforeUpdate.memo_special_request
						// 		},
						// 		after: pParam
						// 	}
						// };

						delete pParam.employee_id;
						delete pParam.employee_name;
						delete pParam.department_id;
						delete pParam.department_name;
						var xAddResult = await _repoInstance.save(pParam, xAct);
						// set is_item_match_with_odoo to null if existing document project is not null and updated to null
						if (xDataBeforeUpdate.project != null && pParam.project_id == null) {
							const xItemParam = {
								request_id: xDataBeforeUpdate.id,
								is_item_match_with_odoo: null
							};
							const xUpdateItemStatus = await _repoDetailInstance.save(
								xItemParam,
								'update_by_request_id'
							);
							console.log(`>>> xUpdateItemStatus: ${JSON.stringify(xDataBeforeUpdate.project)} `);
						}
						xJoResult = xAddResult;

						// if (xJoResult.status_code == '00') {
						// 	var xResultLog = await _logServiceInstance.addLog(pParam.method, pParam.token, xParamLog);
						// 	xJoResult.log_result = xResultLog;
						// 	// ---------------- End: Add to log ----------------
						// }
					}
				}
			}
		}

		return xJoResult;
	}

	async list(pParam) {
		var xJoResult = {};
		var xJoArrData = [];
		var xFlagProcess = false;
		var xDecId = {};
		var xFlagAPIResult = false;
		var xArrOwnedDocNo = [];

		if (pParam.hasOwnProperty('user_id')) {
			if (pParam.user_id != '') {
				xDecId = await _utilInstance.decrypt(pParam.user_id, config.cryptoKey.hashKey);
				if (xDecId.status_code == '00') {
					pParam.user_id = xDecId.decrypted;
					xFlagProcess = true;
				} else {
					xJoResult = xDecId;
				}
			}
		}

		if (xFlagProcess) {
			// Rules of show FPB List :
			// - FPB that has same department
			// - FPB that the user as an approver

			let xOwnedDocument = await _oAuthService.getApprovalMatrix(pParam.method, pParam.token, {
				application_id: config.applicationId,
				table_name: config.dbTables.fpb,
				document_id: '',
				user_id: pParam.user_id
			});
			// console.log(`>>> xOwnedDocument : ${JSON.stringify(xOwnedDocument)}`);

			if (xOwnedDocument.status_code == '00') {
				if (xOwnedDocument.hasOwnProperty('token_data')) {
					if (xOwnedDocument.token_data.status_code == '00') {
						xFlagAPIResult = true;
						for (var i in xOwnedDocument.token_data.data) {
							xArrOwnedDocNo.push(xOwnedDocument.token_data.data[i].document_no);
						}
					} else {
						xFlagAPIResult = true;
					}
				}
			} else {
				xFlagAPIResult = true;
			}

			if (xFlagAPIResult) {
				pParam.owned_document_no = xArrOwnedDocNo;

				// if (pParam.logged_is_admin == 1) {
				// 	if (!pParam.hasOwnProperty('company_id')) {
				// 		pParam.company_id = pParam.logged_company_id;
				// 	} else {
				// 		if (pParam.company_id == '') {
				// 			// pParam.company_id = pParam.logged_company_id;
				// 		}
				// 	}

				// 	if (!pParam.hasOwnProperty('department_id')) {
				// 		pParam.department_id = pParam.logged_department_id;
				// 	} else {
				// 		if (pParam.department_id == '') {
				// 			// pParam.department_id = pParam.logged_department_id;
				// 		}
				// 	}
				// } else {
				// 	pParam.company_id = pParam.logged_company_id;
				// 	pParam.department_id = pParam.logged_department_id;

				// }

				// Commented first for testing
				if (!pParam.hasOwnProperty('company_id')) {
					pParam.company_id = pParam.logged_company_id;
				}

				if (!pParam.hasOwnProperty('department_id')) {
					pParam.department_id = pParam.logged_department_id;
				}
				// if (pParam.hasOwnProperty('budget_plan_id')) {
				// 	const bDect = await _utilInstance.decrypt(pParam.budget_plan_id, config.cryptoKey.hashKey);
				// 	if (bDect.status_code == '00') {
				// 		pParam.budget_plan_id = bDect.decrypted
				// 	}
				// }

				// console.log(`>>> pParam 2: ${JSON.stringify(pParam)}`);
				var xResultList = await _repoInstance.list(pParam);

				if (xResultList.total_record > 0) {
					var xRows = xResultList.data;
					console.log('xRows>>>>>>>>', xRows);

					if (pParam.hasOwnProperty('is_export')) {
						if (pParam.is_export) {
							for (var index in xRows) {
								xJoArrData.push({
									id: await _utilInstance.encrypt(
										xRows[index].id.toString(),
										config.cryptoKey.hashKey
									),
									project: {
										id: xRows[index].project_id,
										code: xRows[index].project_code,
										name: xRows[index].project_name,
										odoo_project_code: xRows[index].odoo_project_code
									},
									// budget_plan: {
									// 	id: xRows[index].budget_plan_id,
									// 	name: xRows[index].budget_plan_name
									// },
									request_no: xRows[index].request_no,
									requested_at:
										xRows[index].requested_at == null
											? ''
											: moment(xRows[index].requested_at).tz(config.timezone).format('DD MMM'),
									employee: {
										id: await _utilInstance.encrypt(
											xRows[index].employee_id.toString(),
											config.cryptoKey.hashKey
										),
										name: xRows[index].employee_name
									},
									department: {
										id: xRows[index].department_id,
										name: xRows[index].department_name
									},
									status: {
										id: xRows[index].status,
										name:
											xRows[index].status == -1
												? 'Rejected'
												: config.statusDescription.purchaseRequest[xRows[index].status]
									},

									company: {
										id: xRows[index].company_id,
										code: xRows[index].company_code,
										name: xRows[index].company_name
									},

									created_at:
										xRows[index].created_at != null
											? moment(xRows[index].created_at).format('DD-MM-YYYY HH:mm:ss')
											: null,

									total_price: xRows[index].total_price,
									total_quotation_price: xRows[index].total_quotation_price,
									category_item: {
										id: xRows[index].category_item,
										name: config.categoryItem[xRows[index].category_item]
									},

									item: {
										product_code: xRows[index].product_code,
										product_name: xRows[index].product_name,
										qty: xRows[index].qty,
										budget_price_per_unit: xRows[index].budget_price_per_unit,
										budget_price_total: xRows[index].budget_price_total,
										quotation_price_per_unit: xRows[index].quotation_price_per_unit,
										quotation_price_total: xRows[index].quotation_price_total,
										estimate_date_use: xRows[index].estimate_date_use,
										pr_no: xRows[index].pr_no,
										last_price: xRows[index].last_price,
										uom_name: xRows[index].uom_name,
										// add new 16/11/2023
										estimate_fulfillment: xRows[index].estimate_fulfillment,
										status: xRows[index].item_detail_status
									}
								});
							}
						} else {
							for (var index in xRows) {
								xJoArrData.push({
									id: await _utilInstance.encrypt(
										xRows[index].id.toString(),
										config.cryptoKey.hashKey
									),
									project: {
										id: xRows[index].project_id,
										code: xRows[index].project_code,
										name: xRows[index].project_name,
										odoo_project_code: xRows[index].odoo_project_code
									},
									request_no: xRows[index].request_no,
									requested_at:
										xRows[index].requested_at == null
											? ''
											: moment(xRows[index].requested_at).tz(config.timezone).format('DD MMM'),
									employee: {
										id: await _utilInstance.encrypt(
											xRows[index].employee_id.toString(),
											config.cryptoKey.hashKey
										),
										name: xRows[index].employee_name
									},
									department: {
										id: xRows[index].department_id,
										name: xRows[index].department_name
									},
									status: {
										id: xRows[index].status,
										name:
											xRows[index].status == -1
												? 'Rejected'
												: config.statusDescription.purchaseRequest[xRows[index].status]
									},

									company: {
										id: xRows[index].company_id,
										code: xRows[index].company_code,
										name: xRows[index].company_name
									},

									created_at:
										xRows[index].created_at != null
											? moment(xRows[index].created_at).format('DD-MM-YYYY HH:mm:ss')
											: null,

									total_price: xRows[index].total_price,
									total_quotation_price: xRows[index].total_quotation_price,
									category_item: {
										id: xRows[index].category_item,
										name: config.categoryItem[xRows[index].category_item]
									}
								});
							}
						}
					} else {
						for (var index in xRows) {
							xJoArrData.push({
								id: await _utilInstance.encrypt(xRows[index].id.toString(), config.cryptoKey.hashKey),
								project: {
									id: xRows[index].project_id,
									code: xRows[index].project_code,
									name: xRows[index].project_name,
									odoo_project_code: xRows[index].odoo_project_code
								},
								// budget_plan: {
								// 	id: xRows[index].budget_plan_id,
								// 	name: xRows[index].budget_plan_name
								// },
								request_no: xRows[index].request_no,
								requested_at:
									xRows[index].requested_at == null
										? ''
										: moment(xRows[index].requested_at).tz(config.timezone).format('DD MMM'),
								employee: {
									id: await _utilInstance.encrypt(
										xRows[index].employee_id.toString(),
										config.cryptoKey.hashKey
									),
									name: xRows[index].employee_name
								},
								department: {
									id: xRows[index].department_id,
									name: xRows[index].department_name
								},
								status: {
									id: xRows[index].status,
									name:
										xRows[index].status == -1
											? 'Rejected'
											: config.statusDescription.purchaseRequest[xRows[index].status]
								},

								company: {
									id: xRows[index].company_id,
									code: xRows[index].company_code,
									name: xRows[index].company_name
								},

								created_at:
									xRows[index].created_at != null
										? moment(xRows[index].created_at).format('DD-MM-YYYY HH:mm:ss')
										: null,

								total_price: xRows[index].total_price,
								total_quotation_price: xRows[index].total_quotation_price,
								category_item: {
									id: xRows[index].category_item,
									name: config.categoryItem[xRows[index].category_item]
								}
							});
						}
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
			}
		}
		// 24/10/2023
		return xJoResult;
	}

	async getById(pParam) {
		var xJoResult = {};
		var xJoData = {};
		var xFlagProcess = false;
		var xDecId = null;
		var xEncId = '';
		var xArrUserCanCancel = [];
		try {
			xDecId = await _utilInstance.decrypt(pParam.id, config.cryptoKey.hashKey);
			if (xDecId.status_code == '00') {
				xEncId = pParam.id;
				xFlagProcess = true;
				pParam.id = xDecId.decrypted;
			} else {
				xJoResult = xDecId;
			}

			if (xFlagProcess) {
				var xResult = await _repoInstance.getById(pParam);

				// console.log(`>>> xResult: ${JSON.stringify(xResult)}`);

				if (xResult != null) {
					var xJoArrRequestDetailData = [];
					var xDetail = xResult.purchase_request_detail;
					// 17/11/2023 array for send to odoo check item
					var xOdooArrItem = [];
					// --

					let xFileArr = [];
					var xTotalItem = 0;
					// var xTotalRealization = 0
					for (var j in xResult.file) {
						xFileArr.push({
							subject: xResult.file[j].subject,
							file:
								xResult.file[j].file != null
									? `${config.imagePathESanQua}/eprocurement/fpb/${xResult.file[j].file}`
									: null
						});
					}
					// looping detail item fpb
					for (var index in xDetail) {
						// 17/11/2023 array for send to odoo check item
						if (xDetail[index].is_item_match_with_odoo != 1) {
							if (xResult.project !== null) {
								xOdooArrItem.push({
									id: xDetail[index].id,
									code: null,
									name: xDetail[index].product_name,
									uom: xDetail[index].uom_name != null ? xDetail[index].uom_name : '',
									index: index
									// request_id: xDetail[index].request_id
								});
							} else {
								xOdooArrItem.push({
									id: xDetail[index].id,
									code: xDetail[index].product_code,
									name: xDetail[index].product_name,
									uom: xDetail[index].uom_name != null ? xDetail[index].uom_name : '',
									index: index
									// request_id: xDetail[index].request_id
								});
							}
						}
						// ----
						// 05/06/2024 add totalItem & realization
						if (xDetail[index].budget_price_total != null && xDetail[index].budget_price_total != 0) {
							xTotalItem = xTotalItem + 1;
							// xTotalRealization = xTotalRealization + (xDetail[index].realization != null ? xDetail[index].realization : 0)
						}
						console.log(`>>> xDetail[index]: ${JSON.stringify(xDetail[index])}`);
						xJoArrRequestDetailData.push({
							id: await _utilInstance.encrypt(xDetail[index].id, config.cryptoKey.hashKey),
							product: {
								id: xDetail[index].product_id,
								code: xDetail[index].product_code,
								name: xDetail[index].product_name
							},
							qty: xDetail[index].qty,
							current_stock: xDetail[index].current_stock,
							// uom: xDetail[index].vendor_catalogue != null ? xDetail[index].vendor_catalogue.uom_name : null,
							uom: xDetail[index].uom_name,
							uom_id: xDetail[index].uom_id,
							budget_price_per_unit: xDetail[index].budget_price_per_unit,
							pdf_budget_price_per_unit:
								xDetail[index].budget_price_per_unit == null
									? 0
									: xDetail[index].budget_price_per_unit
											.toFixed(2)
											.replace(/\d(?=(\d{3})+\.)/g, '$&,'),
							budget_price_total: xDetail[index].budget_price_total,
							pdf_budget_price_total:
								xDetail[index].budget_price_total == null
									? 0
									: xDetail[index].budget_price_total.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,'),
							quotation_price_per_unit: xDetail[index].quotation_price_per_unit,
							pdf_quotation_price_per_unit:
								xDetail[index].quotation_price_per_unit == null
									? 0
									: xDetail[index].quotation_price_per_unit
											.toFixed(2)
											.replace(/\d(?=(\d{3})+\.)/g, '$&,'),
							vendor: {
								id: xDetail[index].vendor_id,
								code: xDetail[index].vendor_code,
								name: xDetail[index].vendor_name
							},
							has_budget: xDetail[index].has_budget,
							estimate_date_use:
								xDetail[index].estimate_date_use != null
									? moment(xDetail[index].estimate_date_use).format('DD MMM YYYY')
									: '',
							description: xDetail[index].description,
							pr_no: xDetail[index].pr_no,
							status: {
								id: xDetail[index].status,
								name:
									xDetail[index].status == -1
										? 'Rejected'
										: config.statusDescription.purchaseRequestDetail[xDetail[index].status]
							},
							last_price: xDetail[index].last_price,
							cancel_reason: xDetail[index].cancel_reason,
							is_po_created: xDetail[index].is_po_created,
							estimate_fulfillment: xDetail[index].estimate_fulfillment,

							updated_by: xDetail[index].updated_by,
							updated_by_name: xDetail[index].updated_by_name,
							is_item_match_with_odoo: xDetail[index].is_item_match_with_odoo,
							realization: xDetail[index].realization
						});
					}
					// Get Approval Matrix
					var xParamApprovalMatrix = {
						application_id: config.applicationId,
						table_name: config.dbTables.fpb,
						document_id: xEncId
					};
					var xResultApprovalMatrix = await _oAuthService.getApprovalMatrix(
						pParam.method,
						pParam.token,
						xParamApprovalMatrix
					);

					// console.log(`>>> xResultApprovalMatrix: ${JSON.stringify(xResultApprovalMatrix)}`);

					if (xResultApprovalMatrix != null) {
						if (xResultApprovalMatrix.status_code == '00') {
							let xListApprover = xResultApprovalMatrix.token_data.data;
							for (var i in xListApprover) {
								let xApproverUsers = _.filter(xListApprover[i].approver_user, { status: 1 }).map(
									// update 08/08/2023 prevent user is null
									(v) => (v.user != null ? v.user.email : v.user)
								);
								xArrUserCanCancel.push.apply(xArrUserCanCancel, xApproverUsers);
								// console.log(`>>> xApproverUsers: ${JSON.stringify(xApproverUsers)}`);
							}
						}
					}

					// Call check item in odoo
					if (xResult.status == 0) {
						// console.log(`>>>xOdooArrItem ${JSON.stringify(xOdooArrItem)}`);
						// console.log(`>>>xResult.id ${JSON.stringify(xResult.id)}`);
						let xCheckItemInOdoo = await _oAuthService.checkItem({ items: xOdooArrItem });
						if (xCheckItemInOdoo.status_code === '00') {
							const xResultArr = xCheckItemInOdoo.data[0].eSanqua;
							for (let i = 0; i < xResultArr.length; i++) {
								var xItemCode = null;
								const xResultItem = xResultArr[i];
								Object.assign(xJoArrRequestDetailData[xResultItem.index], {
									check_result: xResultItem
								});

								if (xResult.project !== null) {
									if (xResultItem.code == null) {
										const xFindCode = xDetail.find(
											({ product_name }) => product_name === xResultItem.name
										);
										xItemCode = xFindCode.product_code;
									}
								} else {
									xItemCode = xResultItem.code;
								}

								const xParamUpdate = {
									// id: xOdooArrItem[parseInt(xResult[i].index)].id,
									request_id: xResult.id,
									// id: xResult[i].id,
									is_item_match_with_odoo: xResultItem.status == '00' ? 1 : 0,
									user_id: xJoArrRequestDetailData[0].updated_by,
									user_name: xJoArrRequestDetailData[0].updated_by_name,
									product_code: xItemCode,
									product_name: xResultItem.name
								};
								console.log(`>>>>>>> xParamUpdate: ${JSON.stringify(xParamUpdate)}`);
								let xUpdateParamChecking = await _repoDetailInstance.save(
									xParamUpdate,
									'update_by_product_code_and_request_id'
								);
								console.log(`>>>>>>> xUpdateParamChecking: ${JSON.stringify(xUpdateParamChecking)}`);
							}
						}
					}

					xJoData = {
						id: await _utilInstance.encrypt(xResult.id.toString(), config.cryptoKey.hashKey),
						project: xResult.project,
						request_no: xResult.request_no,
						// requested_at: xResult.requested_at,
						employee: {
							// id: await _utilInstance.encrypt(xResult.employee_id.toString(), config.cryptoKey.hashKey),
							id: xResult.employee_id,
							name: xResult.employee_name
						},
						department: {
							id: xResult.department_id,
							name: xResult.department_name
						},
						reference_from_ecommerce: xResult.reference_from_ecommerce,
						budget_is_approved: xResult.budget_is_approved,
						memo_special_request: xResult.memo_special_request,

						total_qty: xResult.total_qty,
						total_price: xResult.total_price,

						status: {
							id: xResult.status,
							name:
								xResult.status == -1
									? 'Rejected'
									: config.statusDescription.purchaseRequest[xResult.status]
						},
						reject_reason: xResult.reject_reason,
						closed_reason: xResult.closed_reason,
						requested_at: moment(xResult.requested_at).format('DD MMM YYYY HH:mm'),
						printed_fpb_at: moment(xResult.printed_fpb_at).format('DD MMM YYYY HH:mm'),
						submit_price_quotation_at: moment(xResult.submit_price_quotation_at).format(
							'DD MMM YYYY HH:mm'
						),

						purchase_request_detail: xJoArrRequestDetailData,

						approval_matrix:
							xResultApprovalMatrix.status_code == '00' &&
							xResultApprovalMatrix.token_data.status_code == '00'
								? xResultApprovalMatrix.token_data.data
								: null,

						company: {
							id: xResult.company_id,
							code: xResult.company_code,
							name: xResult.company_name
						},
						// file: xResult.file != null ? `${config.imagePathESanQua}/eprocurement/fpb/${xResult.file}` : null,
						file: xFileArr,
						category_item: xResult.category_item,
						category_pr: xResult.category_pr,
						created_at: xResult.createdAt != null ? moment(xResult.createdAt).format('DD MMM YYYY') : '',

						cancel_at:
							xResult.cancel_at != null ? moment(xResult.cancel_at).format('DD MMM YYYY HH:mm:ss') : '',
						cancel_by_name: xResult.cancel_by_name,
						cancel_reason: xResult.cancel_reason,

						approver_users: xArrUserCanCancel,

						took_at:
							xResult.took_at != null ? moment(xResult.took_at).format('DD MMM YYYY HH:mm:ss') : null,
						took_by_name: xResult.took_by_name,
						fpb_type: xResult.fpb_type,
						// budget_plan: xResult.budget_plan,
						// total_realization: xTotalRealization,
						total_item_with_budget: xTotalItem
					};

					xJoResult = {
						status_code: '00',
						status_msg: 'OK',
						data: xJoData
					};
				} else {
					xJoResult = {
						status_code: '-99',
						status_msg: 'Data not found'
					};
				}
			}
		} catch (e) {
			xJoResult = {
				status_code: '-99',
				status_msg: `purchaseRequestService.detail: Exception error: ${e.message}`
			};
		}

		return xJoResult;
	}

	async submitFPB(pParam) {
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
			var xPRDetail = await _repoInstance.getById({ id: xClearId });
			if (false) {
				//xPRDetail.status != 0) {
				xJoResult = {
					status_code: '-99',
					status_msg: 'You can not submit this document. Please check again.'
				};
			} else {
				pParam.requested_at = await _utilInstance.getCurrDateTime();
				pParam.status = 1;

				var xUpdateResult = await _repoInstance.save(pParam, 'submit_fpb');
				xJoResult = xUpdateResult;
				// Next Phase : Approval Matrix & Notification to admin
				if (xUpdateResult.status_code == '00') {
					if (xPRDetail != null) {
						// Add Approval Matrix
						var xParamAddApprovalMatrix = {
							act: 'add',
							document_id: xEncId,
							document_no: xPRDetail.request_no,
							application_id: config.applicationId,
							table_name: config.dbTables.fpb,
							company_id: xPRDetail.company_id,
							department_id: xPRDetail.department_id,
							ecatalogue_fpb_category_item: xPRDetail.category_item == 7 ? xPRDetail.category_item : null,
							logged_company_id: pParam.logged_company_id
						};

						var xApprovalMatrixResult = await _oAuthService.addApprovalMatrix(
							pParam.method,
							pParam.token,
							xParamAddApprovalMatrix
						);
						xJoResult.approval_matrix_result = xApprovalMatrixResult;

						if (xApprovalMatrixResult.status_code == '00') {
							if (xApprovalMatrixResult.approvers.length > 0) {
								let xApproverSeq1 = xApprovalMatrixResult.approvers.find((el) => el.sequence === 1);
								if (xApproverSeq1 != null) {
									for (var i in xApproverSeq1.approver_user) {
										// In App notification
										let xInAppNotificationResult = await _notificationService.inAppNotification({
											document_code: xPRDetail.request_no,
											document_id: xEncId,
											document_status: xPRDetail.status,
											mode: 'request_approval_fpb',
											method: pParam.method,
											token: pParam.token,
											employee_id: await _utilInstance.encrypt(
												xApproverSeq1.approver_user[i].employee_id.toString(),
												config.cryptoKey.hashKey
											)
										});

										_utilInstance.writeLog(
											`${_xClassName}.submitFPB`,
											`xInAppNotificationResult: ${JSON.stringify(xInAppNotificationResult)}`,
											'info'
										);

										console.log(
											`>>> xInAppNotificationResult: ${JSON.stringify(xInAppNotificationResult)}`
										);

										// Email Notification
										let xParamEmailNotification,
											xNotificationResult = {};

										console.log(
											`>>> xApproverSeq1.approver_user[i]: ${JSON.stringify(
												xApproverSeq1.approver_user[i]
											)}`
										);

										if (xApproverSeq1.approver_user[i].notification_via_email) {
											xParamEmailNotification = {
												mode: 'request_approval_fpb',
												id: xEncId,
												request_no: xPRDetail.request_no,
												company_name: xPRDetail.company_name,
												department_name: xPRDetail.department_name,
												created_by: xPRDetail.employee_name,
												created_at:
													xPRDetail.createdAt != null
														? moment(xPRDetail.createdAt).format('DD MMM YYYY')
														: '',
												items: xPRDetail.purchase_request_detail,
												approver_user: {
													employee_name: xApproverSeq1.approver_user[i].user_name,
													email: xApproverSeq1.approver_user[i].email
												}
											};
											console.log(
												`>>> xParamEmailNotification: ${JSON.stringify(
													xParamEmailNotification
												)}`
											);
											xNotificationResult = await _notificationService.sendNotificationEmail_FPBNeedApproval(
												xParamEmailNotification,
												pParam.method,
												pParam.token
											);

											console.log(
												`>>> xNotificationResult: ${JSON.stringify(xNotificationResult)}`
											);
										}
									}
								}
							}
						}

						// Active: 02-01-2023
						// Description: After submit, it will hit api PR on odoo
						// let xLineIds = [];
						// if (xPRDetail.purchase_request_detail != null) {
						// 	for (var i in xPRDetail.purchase_request_detail) {
						// 		xLineIds.push({
						// 			product_code: xPRDetail.purchase_request_detail[i].product_code,
						// 			qty: xPRDetail.purchase_request_detail[i].qty
						// 		});
						// 	}
						// }
						// var xParamOdoo = {
						// 	name: 'New',
						// 	company_id: xPRDetail.company_id,
						// 	date_order: await _utilInstance.getCurrDate(),
						// 	status: 'waiting_approval',
						// 	purchase_order_type: xPRDetail.purchase_order_type,
						// 	user_sanqua: pParam.user_name,
						// 	no_fpb: xPRDetail.request_no,
						// 	line_ids: xLineIds
						// };
					} else {
						xJoResult = {
							status_code: '-99',
							status_msg: 'Data not found. Please supply valid identifier'
						};
					}
				} else {
					xJoResult = xUpdateResult;
				}
			}
		}

		return xJoResult;
	}

	// async cancelFPB(pParam) {
	// 	var xJoResult = {};
	// 	var xDecId = null;
	// 	var xFlagProcess = false;

	// 	if (pParam.id != '' && pParam.user_id != '') {
	// 		xDecId = await _utilInstance.decrypt(pParam.id, config.cryptoKey.hashKey);
	// 		if (xDecId.status_code == '00') {
	// 			xFlagProcess = true;
	// 			pParam.id = xDecId.decrypted;
	// 			xDecId = await _utilInstance.decrypt(pParam.user_id, config.cryptoKey.hashKey);
	// 			if (xDecId.status_code == '00') {
	// 				pParam.user_id = xDecId.decrypted;
	// 				xFlagProcess = true;
	// 			} else {
	// 				xJoResult = xDecId;
	// 			}
	// 		} else {
	// 			xJoResult = xDecId;
	// 		}
	// 	}

	// 	if (xFlagProcess) {
	// 		let xData = await _repoInstance.getById(pParam);
	// 		if (xData != null) {
	// 			if (xData.status != 0 || xData.status != 2) {
	// 				if (xData.status == 2) {

	// 				} else {
	// 					pParam.cancel_at = await _utilInstance.getCurrDateTime();
	// 					pParam.status = 4;

	// 					var xUpdateResult = await _repoInstance.save(pParam, 'cancel_fpb');
	// 					xJoResult = xUpdateResult;
	// 					// Next Phase : Notification to adamin
	// 				}
	// 			} else {
	// 				xJoResult = {
	// 					status_code: '-99',
	// 					status_msg: "You can't cancel this document."
	// 				};
	// 			}
	// 		} else {
	// 			xJoResult = {
	// 				status_code: '-99',
	// 				status_msg: 'Document not found.'
	// 			};
	// 		}
	// 	}

	// 	return xJoResult;
	// }

	async setToDraftFPB(pParam) {
		var xJoResult = {};
		var xDecId = null;
		var xFlagProcess = false;

		if (pParam.id != '' && pParam.user_id != '') {
			xDecId = await _utilInstance.decrypt(pParam.id, config.cryptoKey.hashKey);
			if (xDecId.status_code == '00') {
				xFlagProcess = true;
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
			pParam.set_to_draft_at = await _utilInstance.getCurrDateTime();
			pParam.status = 0;

			var xUpdateResult = await _repoInstance.save(pParam, 'set_to_draft_fpb');
			xJoResult = xUpdateResult;
			// Next Phase : Notification to adamin
		}

		return xJoResult;
	}

	async confirmFPB(pParam) {
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
			var xPRDetail = await _repoInstance.getById({ id: pParam.document_id });
			if (xPRDetail != null) {
				if (xPRDetail.status != 1) {
					xJoResult = {
						status_code: '-99',
						status_msg: 'This document already confirmed before.'
					};
				} else {
					var xParamApprovalMatrixDocument = {
						document_id: xEncId,
						status: 1,
						application_id: config.applicationId,
						table_name: config.dbTables.fpb
					};

					var xResultApprovalMatrixDocument = await _oAuthService.confirmApprovalMatrix(
						pParam.method,
						pParam.token,
						xParamApprovalMatrixDocument
					);

					if (xResultApprovalMatrixDocument != null) {
						if (xResultApprovalMatrixDocument.status_code == '00') {
							let xResultApprove = null;
							if (xResultApprovalMatrixDocument.status_document_approved == true) {
								// Update price eCatalogue
								// Comment At: 09-01-2023
								// Reason: No need for current
								// if (xPRDetail.purchase_request_detail.length > 0) {
								// 	// var xPRItem = xPRDetail.purchase_request_detail;
								// 	// for (var i in xPRItem) {
								// 	// 	var xParamUpdateCatalogue = {
								// 	// 		vendor_id: xPRItem[i].vendor_id,
								// 	// 		product_id: xPRItem[i].product_id,
								// 	// 		last_price: xPRItem[i].quotation_price_per_unit,
								// 	// 		last_ordered: xPRDetail.createdAt,
								// 	// 		last_purchase_plant: xPRDetail.company_name,
								// 	// 		act: 'update_by_vendor_id_product_id'
								// 	// 	};
								// 	// 	var xUpdateCatalogueResult = await _catalogueService.save(xParamUpdateCatalogue);
								// 	// 	console.log(`>>> Update Result : ${JSON.stringify(xUpdateCatalogueResult)}`);
								// 	// }
								// } else {
								// 	xJoResult = {
								// 		status_code: '00',
								// 		status_msg: 'FPB successfully approved but nothing to update price'
								// 	};
								// }

								// Update status FPB to be confirmed
								// At: 08/12/2023
								// Description: After confirm (approved by last approver), the status will change to "Pending".
								//				This status indicate that procurement must be process it, so they need press button "Take" in terms of change to "In Progress"
								// var xParamUpdatePR = {
								// 	id: pParam.document_id,
								// 	status: 2
								// };
								var xParamUpdatePR = {
									id: pParam.document_id,
									status: 5
								};
								var xUpdateResult = await _repoInstance.save(xParamUpdatePR, 'update');

								if (xUpdateResult.status_code == '00') {
									xJoResult = {
										status_code: '00',
										status_msg: 'FPB successfully approved'
									};
								} else {
									xJoResult = xUpdateResult;
								}
							} else {
								// Sort first
								xResultApprovalMatrixDocument.approvers = xResultApprovalMatrixDocument.approvers.sort(
									(a, b) => {
										if (a.sequence < b.sequence) {
											return -1;
										}
									}
								);

								// Send to next approver...
								let xNextApprover = xResultApprovalMatrixDocument.approvers[0].approver_user;
								console.log(`>>> xNextApprover : ${JSON.stringify(xNextApprover)}`);
								if (xNextApprover != null) {
									for (var i in xNextApprover) {
										let xInAppNotificationResult = await _notificationService.inAppNotification({
											document_code: xPRDetail.request_no,
											document_id: xEncId,
											document_status: xPRDetail.status,
											mode: 'request_approval_fpb',
											method: pParam.method,
											token: pParam.token,
											employee_id: await _utilInstance.encrypt(
												xNextApprover[i].employee_id.toString(),
												config.cryptoKey.hashKey
											)
										});

										// Email Notification
										let xParamEmailNotification,
											xNotificationResult = {};

										if (xNextApprover[i].notification_via_email) {
											xParamEmailNotification = {
												mode: 'request_approval_fpb',
												id: xEncId,
												request_no: xPRDetail.request_no,
												company_name: xPRDetail.company_name,
												department_name: xPRDetail.department_name,
												created_by: xPRDetail.employee_name,
												created_at:
													xPRDetail.createdAt != null
														? moment(xPRDetail.createdAt).format('DD MMM YYYY')
														: '',
												items: xPRDetail.purchase_request_detail,
												approver_user: {
													employee_name: xNextApprover[i].user_name,
													email: xNextApprover[i].email
												}
											};
											console.log(
												`>>> xParamEmailNotification: ${JSON.stringify(
													xParamEmailNotification
												)}`
											);
											xNotificationResult = await _notificationService.sendNotificationEmail_FPBNeedApproval(
												xParamEmailNotification,
												pParam.method,
												pParam.token
											);

											console.log(
												`>>> xNotificationResult: ${JSON.stringify(xNotificationResult)}`
											);
										}
									}
								}

								xJoResult = {
									status_code: '00',
									status_msg: 'FPB successfully approved. Document available for next approver',
									result_approval_matrix: xResultApprovalMatrixDocument
								};
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

	async rejectFPB(pParam) {
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
			var xPRDetail = await _repoInstance.getById({ id: pParam.document_id });
			if (xPRDetail != null) {
				if (xPRDetail.status != 1) {
					xJoResult = {
						status_code: '-99',
						status_msg: 'This document already confirmed before.'
					};
				} else {
					var xParamApprovalMatrixDocument = {
						document_id: xEncId,
						status: -1,
						application_id: config.applicationId,
						table_name: config.dbTables.fpb
					};

					var xResultApprovalMatrixDocument = await _oAuthService.confirmApprovalMatrix(
						pParam.method,
						pParam.token,
						xParamApprovalMatrixDocument
					);

					await _utilInstance.writeLog(
						`${_xClassName}.rejectFPB`,
						`xResultApprovalMatrixDocument: ${xResultApprovalMatrixDocument}`,
						'debug'
					);

					if (xResultApprovalMatrixDocument != null) {
						if (xResultApprovalMatrixDocument.status_code == '00') {
							// Update status FPB to be confirmed
							var xParamUpdatePR = {
								id: pParam.document_id,
								status: -1,
								reject_reason: pParam.reject_reason
							};
							var xUpdateResult = await _repoInstance.save(xParamUpdatePR, 'update');

							if (xUpdateResult.status_code == '00') {
								xJoResult = {
									status_code: '00',
									status_msg: 'FPB successfully rejected'
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

	async closeFPB(pParam) {
		var xJoResult = {};
		var xDecId = null;
		var xFlagProcess = false;

		if (pParam.document_id != '' && pParam.logged_user_id != '') {
			xDecId = await _utilInstance.decrypt(pParam.document_id, config.cryptoKey.hashKey);
			if (xDecId.status_code == '00') {
				xFlagProcess = true;
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

		if (xFlagProcess) {
			let xData = await _repoInstance.getById({
				id: pParam.id
			});
			if (xData != null) {
				if (xData.status == 2) {
					pParam.closed_at = await _utilInstance.getCurrDateTime();
					pParam.closed_by = pParam.logged_user_id;
					pParam.closed_by_name = pParam.logged_user_name;
					pParam.status = 3;

					var xUpdateResult = await _repoInstance.save(pParam, 'close_fpb');
					xJoResult = xUpdateResult;
				} else {
					xJoResult = {
						status_code: '-99',
						status_msg: "You can't close this FPB. Only FPB with In Progress status that can be close."
					};
				}
			} else {
				xJoResult = {
					status_code: '-99',
					status_msg: 'Data not found.'
				};
			}
		}

		return xJoResult;
	}

	async cancelFPB(pParam) {
		var xJoResult = {};
		var xDecId = null;
		var xFlagProcess = false;

		if (pParam.document_id != '' && pParam.user_id != '') {
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
			// console.log(`>>> pParam: ${JSON.stringify(pParam)}`);
			let xData = await _repoInstance.getById({
				id: pParam.document_id
			});
			if (xData != null) {
				if (xData.status == 0 || xData.status == 2) {
					pParam.status = 4;
					if (xData.status == 2) {
						// Check if all the items still in draft
						let xItems = await _repoDetailInstance.getByParam({
							request_id: pParam.document_id,
							status: [ 2, 3, 4 ]
						});
						if (xItems.status_code == '00') {
							xJoResult = {
								status_code: '-99',
								status_msg: "You can't close this FPB because there are items that already processed."
							};
						} else {
							var xUpdateResult = await _repoInstance.save(
								{
									id: pParam.document_id,
									status: pParam.status,
									user_id: pParam.user_id,
									user_name: pParam.user_name,
									cancel_reason: pParam.cancel_reason
								},
								'cancel_fpb'
							);
							xJoResult = xUpdateResult;
						}
					} else {
						var xUpdateResult = await _repoInstance.save(
							{
								id: pParam.document_id,
								status: pParam.status,
								user_id: pParam.user_id,
								user_name: pParam.user_name,
								cancel_reason: pParam.cancel_reason
							},
							'cancel_fpb'
						);
						xJoResult = xUpdateResult;
					}
				} else {
					xJoResult = {
						status_code: '-99',
						status_msg: "You can't close this FPB. Only FPB with In Progress status that can be close."
					};
				}
			} else {
				xJoResult = {
					status_code: '-99',
					status_msg: 'Data not found.'
				};
			}
		}

		return xJoResult;
	}

	async fpbProjectList(pParam) {
		var xJoResult = {};
		var xJoArrData = [];
		var xFlagProcess = false;
		var xDecId = {};
		var xFlagAPIResult = false;
		var xArrOwnedDocNo = [];

		if (pParam.hasOwnProperty('user_id')) {
			if (pParam.user_id != '') {
				xDecId = await _utilInstance.decrypt(pParam.user_id, config.cryptoKey.hashKey);
				if (xDecId.status_code == '00') {
					pParam.user_id = xDecId.decrypted;
					xFlagProcess = true;
				} else {
					xJoResult = xDecId;
				}
			}
		}

		if (xFlagProcess) {
			let xOwnedDocument = await _oAuthService.getApprovalMatrix(pParam.method, pParam.token, {
				application_id: config.applicationId,
				table_name: config.dbTables.fpb,
				document_id: '',
				user_id: pParam.user_id
			});
			// console.log(`>>> xOwnedDocument : ${JSON.stringify(xOwnedDocument)}`);

			if (xOwnedDocument.status_code == '00') {
				if (xOwnedDocument.hasOwnProperty('token_data')) {
					if (xOwnedDocument.token_data.status_code == '00') {
						xFlagAPIResult = true;
						for (var i in xOwnedDocument.token_data.data) {
							xArrOwnedDocNo.push(xOwnedDocument.token_data.data[i].document_no);
						}
					} else {
						xFlagAPIResult = true;
					}
				}
			} else {
				xFlagAPIResult = true;
			}

			if (xFlagAPIResult) {
				pParam.owned_document_no = xArrOwnedDocNo;

				if (!pParam.hasOwnProperty('company_id')) {
					pParam.company_id = pParam.logged_company_id;
				}

				if (!pParam.hasOwnProperty('department_id')) {
					pParam.department_id = pParam.logged_department_id;
				}

				var xResultList = await _repoInstance.fpbProjectList(pParam);

				if (xResultList.total_record > 0) {
					var xRows = xResultList.data;
					console.log('xRows>>>>>>>>', xRows);

					for (var index in xRows) {
						xJoArrData.push({
							id: await _utilInstance.encrypt(xRows[index].id.toString(), config.cryptoKey.hashKey),
							project: {
								id: xRows[index].project_id,
								code: xRows[index].project_code,
								name: xRows[index].project_name,
								odoo_project_code: xRows[index].odoo_project_code
							},
							request_no: xRows[index].request_no,
							requested_at:
								xRows[index].requested_at == null
									? ''
									: moment(xRows[index].requested_at).tz(config.timezone).format('DD MMM'),
							employee: {
								id: await _utilInstance.encrypt(
									xRows[index].employee_id.toString(),
									config.cryptoKey.hashKey
								),
								name: xRows[index].employee_name
							},
							department: {
								id: xRows[index].department_id,
								name: xRows[index].department_name
							},
							status: {
								id: xRows[index].status,
								name:
									xRows[index].status == -1
										? 'Rejected'
										: config.statusDescription.purchaseRequest[xRows[index].status]
							},

							company: {
								id: xRows[index].company_id,
								code: xRows[index].company_code,
								name: xRows[index].company_name
							},

							created_at:
								xRows[index].created_at != null
									? moment(xRows[index].created_at).format('DD-MM-YYYY HH:mm:ss')
									: null,

							total_price: xRows[index].total_price,
							total_quotation_price: xRows[index].total_quotation_price,
							category_item: {
								id: xRows[index].category_item,
								name: config.categoryItem[xRows[index].category_item]
							},
							item: {
								product_code: xRows[index].product_code,
								product_name: xRows[index].product_name,
								qty: xRows[index].qty,
								budget_price_per_unit: xRows[index].budget_price_per_unit,
								budget_price_total: xRows[index].budget_price_total,
								quotation_price_per_unit: xRows[index].quotation_price_per_unit,
								quotation_price_total: xRows[index].quotation_price_total,
								estimate_date_use: xRows[index].estimate_date_use,
								pr_no: xRows[index].pr_no,
								last_price: xRows[index].last_price,
								uom_name: xRows[index].uom_name,
								// add new 16/11/2023
								estimate_fulfillment: xRows[index].estimate_fulfillment,
								fulfillment_status: xRows[index].fulfillment_status,
								fulfillment_status_name:
									xRows[index].fulfillment_status == 1 ? 'Lengkap' : 'Belum Lengkap',
								id:
									xRows[index].item_detail_id != null
										? await _utilInstance.encrypt(
												xRows[index].item_detail_id.toString(),
												config.cryptoKey.hashKey
											)
										: xRows[index].item_detail_id,
								status: xRows[index].item_detail_status,
								status_name: config.statusDescription.purchaseRequest[xRows[index].item_detail_status],
								is_po_created: xRows[index].is_po_created
							}
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
			}
		}
		// 24/10/2023
		return xJoResult;
	}

	async dropDown(pParam) {
		var xJoResult = {};
		var xJoArrData = [];

		try {
			var xResultList = await _repoInstance.list(pParam);

			if (xResultList.total_record > 0) {
				var xRows = xResultList.data;
				for (var index in xRows) {
					xJoArrData.push({
						id: xRows[index].id,
						request_no: xRows[index].request_no
					});
				}

				xJoResult = {
					status_code: '00',
					status_msg: 'OK',
					total_record: xResultList.total_record,
					data: xJoArrData
				};
			}
		} catch (e) {
			xJoResult = {
				status_code: '-99',
				status_msg: `Exception error <${_xClassName}.dropDown>: ${e.message}`
			};
		}

		return xJoResult;
	}

	async takeFPB(pParam) {
		var xJoResult = {};
		var xDecId = null;
		var xFlagProcess = false;
		var xEncId = '';
		var xClearId = '';

		try {
			if (!pParam.logged_is_admin) {
				xJoResult = {
					status_msg: "You don't have permission of this access.",
					status_code: '-99'
				};
			} else {
				if (pParam.document_id != '' && pParam.user_id != '') {
					xDecId = await _utilInstance.decrypt(pParam.document_id, config.cryptoKey.hashKey);
					if (xDecId.status_code == '00') {
						xFlagProcess = true;
						xEncId = pParam.document_id;
						pParam.document_id = xDecId.decrypted;
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
					// Check if this request id valid or not
					var xPRDetail = await _repoInstance.getById({ id: pParam.document_id });
					if (xPRDetail != null) {
						if (xPRDetail.status != 5) {
							xJoResult = {
								status_code: '-99',
								status_msg: 'This document can not take since the status is not Pending.'
							};
						} else {
							var xParamUpdatePR = {
								id: pParam.document_id,
								status: 2,
								user_id: pParam.user_id,
								user_name: pParam.user_name
							};
							var xUpdateResult = await _repoInstance.save(xParamUpdatePR, 'take_fpb');

							if (xUpdateResult.status_code == '00') {
								xJoResult = {
									status_code: '00',
									status_msg: 'FPB successfully rejected'
								};
							} else {
								xJoResult = xUpdateResult;
							}
						}
					}
				}
			}
		} catch (e) {
			xJoResult = {
				status_code: '-99',
				status_msg: `Exception error <${_xClassName}.takeFPB>: ${e.message}`
			};
		}

		return xJoResult;
	}

	async transaction_history(pParam) {
		var xJoResult = {};
		var xJoArrData = [];
		var xFlagProcess = false;
		var xDecId = {};

		if (pParam.hasOwnProperty('user_id')) {
			if (pParam.user_id != '') {
				xDecId = await _utilInstance.decrypt(pParam.user_id, config.cryptoKey.hashKey);
				if (xDecId.status_code == '00') {
					pParam.user_id = xDecId.decrypted;
					xFlagProcess = true;
				} else {
					xJoResult = xDecId;
				}
			}
		}

		if (xFlagProcess) {
			var xResultList = await _repoInstance.transaction_history(pParam);

			console.log(`>>> xResultList : ${JSON.stringify(xResultList)}`);
			if (xResultList.total_record > 0) {
				var xRows = xResultList.data;
				for (var index in xRows) {
					xJoArrData.push({
						id: await _utilInstance.encrypt(xRows[index].id.toString(), config.cryptoKey.hashKey),
						request_no: xRows[index].request_no,
						project:
							xRows[index].project_id != null
								? {
										id: xRows[index].project_id,
										code: xRows[index].project_code,
										name: xRows[index].project_name,
										odoo_project_code: xRows[index].odoo_project_code
									}
								: null,
						request_no: xRows[index].request_no,
						created_at: xRows[index].created_at,
						requested_at:
							xRows[index].requested_at == null
								? ''
								: moment(xRows[index].requested_at).tz(config.timezone).format('DD-MM-YYYY HH:mm:ss'),
						employee: {
							id: xRows[index].employee_id,
							name: xRows[index].employee_name
						},
						department: {
							id: xRows[index].department_id,
							name: xRows[index].department_name
						},
						fpb_status: {
							id: xRows[index].fpb_status,
							name:
								xRows[index].fpb_status == -1
									? 'Rejected'
									: config.statusDescription.purchaseRequest[xRows[index].fpb_status]
						},

						company: {
							id: xRows[index].company_id,
							code: xRows[index].company_code,
							name: xRows[index].company_name
						},

						created_at:
							xRows[index].created_at != null
								? moment(xRows[index].created_at).format('DD-MM-YYYY HH:mm:ss')
								: null,
						category_item: {
							id: xRows[index].category_item,
							name: config.categoryItem[xRows[index].category_item]
						},
						category_pr: xRows[index].category_pr,
						qty: xRows[index].qty,
						uom: {
							id: xRows[index].uom_id,
							name: xRows[index].uom_name
						},
						last_price: xRows[index].last_price,
						budget_price_per_unit: xRows[index].budget_price_per_unit,
						budget_price_total: xRows[index].budget_price_total,
						item_status: xRows[index].item_status,
						product: {
							id: xRows[index].product_id,
							name: xRows[index].product_name,
							code: xRows[index].product_code
						},
						vendor: {
							id: xRows[index].vendor_id,
							name: xRows[index].vendor_name,
							code: xRows[index].vendor_code
						},
						item_status: {
							id: xRows[index].item_status,
							name:
								xRows[index].item_status == -1
									? 'Rejected'
									: config.statusDescription.purchaseRequestDetail[xRows[index].item_status]
						}
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
		}
		// 24/10/2023
		return xJoResult;
	}
}

module.exports = PurchaseRequestService;
