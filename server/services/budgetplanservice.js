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
const dateTime = require('node-datetime');

const env = process.env.NODE_ENV || 'localhost';
const config = require(__dirname + '/../config/config.json')[env];

// Utility
const Utility = require('peters-globallib-v2');
const _utilInstance = new Utility();

const GlobalUtility = require('../utils/globalutility.js');
const _globalUtilInstance = new GlobalUtility();

// Repository
const BudgetPlanRepository = require('../repository/budgetplanrepository.js');
const _repoInstance = new BudgetPlanRepository();

// Repository
// const BudgetPlanDetailRepository = require('../repository/budgetplandetailrepository.js');
// const _repoDetailInstance = new BudgetPlanDetailRepository();

const VendorCatalogueService = require('../services/vendorcatalogueservice.js');
const _catalogueService = new VendorCatalogueService();

// OAuth Service
const OAuthService = require('../services/oauthservice.js');
const _oAuthService = new OAuthService();

const LogService = require('../services/logservice.js');
const _logServiceInstance = new LogService();

const ProjectService = require('../services/projectservice.js');
const _projectServiceInstance = new ProjectService();

const _xClassName = 'BudgetPlanService';

class BudgetPlanService {
    constructor() { }
    
	async list(pParam) {
		var xJoResult = {};
		var xJoArrData = [];
		var xFlagProcess = false;
		var xDecId = {};
		var xFlagAPIResult = false;
		var xArrOwnedDocNo = [];

        try {
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
                // Rules of show RAB List :
                // - RAB that has same department
                // - RAB that the user as an approver

                let xOwnedDocument = await _oAuthService.getApprovalMatrix(pParam.method, pParam.token, {
                    application_id: config.applicationId,
                    table_name: config.dbTables.rab,
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

                    // Commented first for testing
                    if (!pParam.hasOwnProperty('company_id')) {
                        pParam.company_id = pParam.logged_company_id;
                    }

                    if (!pParam.hasOwnProperty('department_id')) {
                        pParam.department_id = pParam.logged_department_id;
                    }

                    if (pParam.hasOwnProperty("filter")) {
                        let filter = JSON.parse(pParam.filter)
                        console.log('Filter raw >>>>', filter);
                        for (let i = 0; i < filter.length; i++) {
                            if (filter[i]['project_id'] !== undefined) {
                                if (typeof filter[i]['project_id'] === 'string') {
                                    const xId = await _utilInstance.decrypt(filter[i]['project_id'], config.cryptoKey.hashKey)
                                    filter[i].project_id = Number(xId.decrypted)
                                    break
                                }
                            }
                        }
                        pParam.filter = JSON.stringify(filter)
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
                                        name: xRows[i].name,
                                        budget_no: xRows[i].budget_no,
                                        project: {
                                            id: xRows[i].project_id,
                                            code: xRows[i].project_code,
                                            name: xRows[i].project_name,
                                            // odoo_project_code: xRows[i].odoo_project_code
                                        },
                                        company: {
                                            id: xRows[i].company_id,
                                            // code: xRows[i].company_code,
                                            name: xRows[i].company_name
                                        },
                                        department: {
                                            id: xRows[i].department_id,
                                            name: xRows[i].department_name
                                        },
                                        employee: {
                                            id: xRows[i].employee_id,
                                            nik: xRows[i].employee_nik,
                                            name: xRows[i].employee_name
                                        },
                                        pic_employee: {
                                            id: xRows[i].pic_employee_id,
                                            nik: xRows[i].pic_employee_nik,
                                            name: xRows[i].pic_employee_name
                                        },
                                        total_plan_qty: xRows[i].total_plan_qty,
                                        total_budget_plan: xRows[i].total_budget_plan,
                                        // reject_reason: xRows[i].reject_reason,
                                        // cancel_reason: xRows[i].cancel_reason,
                                        status: {
                                            id: xRows[i].status,
                                            name: config.statusDescription.budgetPlan[xRows[i].status]
                                        },
                                        created_at: xRows[i].createdAt != null ? moment(xRows[i].createdAt).format('DD MMM YYYY HH:mm:ss') : null,
                                        created_by_name: xRows[i].created_by_name,
                                        updated_at: xRows[i].updatedAt != null ? moment(xRows[i].updatedAt).format('DD MMM YYYY HH:mm:ss') : null,
                                        updated_by_name: xRows[i].updated_by_name,
                                        submited_at: xRows[i].submitedAt != null ? moment(xRows[i].submitedAt).format('DD MMM YYYY HH:mm:ss') : null,
                                        submited_by_name: xRows[i].submited_by_name,
                                        // received_at: moment(xRows[i].receivedAt).format('DD MMM YYYY HH:mm:ss'),
                                        // received_by_name: xRows[i].received_by_name,
                                        // done_at: moment(xRows[i].doneAt).format('DD MMM YYYY HH:mm:ss'),
                                        // done_by_name: xRows[i].done_by_name,
                                        // cancel_at: moment(xRows[i].cancelAt).format('DD MMM YYYY HH:mm:ss'),
                                        // cancel_by_name: xRows[i].cancel_by_name,
                                        // set_to_draft_at: moment(xRows[i].set_to_draftAt).format('DD MMM YYYY HH:mm:ss'),
                                        // set_to_draft_by_name: xRows[i].set_to_draft_by_name,
                                        // deleted_at: moment(xRows[i].deletedAt).format('DD MMM YYYY HH:mm:ss'),
                                        // deleted_by_name: xRows[i].deleted_by_name
                                    });
                                }
        
                                xJoResult = {
                                    status_code: '00',
                                    status_msg: 'OK',
                                    filtered_record: xResultList.data.count,
                                    total_record: xResultList.total_record,
                                    data: xJoArrData,
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

		try {
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
                
                if (pParam.hasOwnProperty('project_id')) {
                    if (pParam.project_id != '' && pParam.project_id != null) {
                        xFlagProcess = true;
                    } else {
                        xFlagProcess = true;
                    }
                } else {
                    xFlagProcess = true;
                }

                if (xFlagProcess) {
                    if (xAct == 'add' || xAct == 'add_batch_in_item') {
                        // Calculate the total
                        var xJoArrItems = [];
                        if (pParam.hasOwnProperty('budget_plan_detail')) {
                        	xJoArrItems = pParam.budget_plan_detail;
                        	if (xJoArrItems.length > 0) {
                        		for (var i in xJoArrItems) {
                        			if (
                        				xJoArrItems[i].hasOwnProperty('qty') &&
                        				xJoArrItems[i].hasOwnProperty('budget_price_per_unit')
                        			) {
                        				xJoArrItems[i].budget_price_total =
                        					xJoArrItems[i].qty * xJoArrItems[i].budget_price_per_unit;
                                            xJoArrItems[i].qty_remain = xJoArrItems[i].qty;
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
                                    console.log('xCatalogue >>>>', xCatalogue.data.product.category);

                        			if (xCatalogue.status_code == '00') {
                        				// xJoArrItems[i].last_price = xCatalogue.data.last_price;
                        				xJoArrItems[i].uom_id = xCatalogue.data.uom_id;
                                        xJoArrItems[i].uom_name = xCatalogue.data.uom_name;
                                        // xJoArrItems[i].merk = xCatalogue.data.merk;
                                        // xJoArrItems[i].description = xCatalogue.data.spesification;
                                        if (xCatalogue.data.product.category !== undefined) {
                                            xJoArrItems[i].category_id = xCatalogue.data.product.category.id;
                                            xJoArrItems[i].category_name = xCatalogue.data.product.category.name;
                                        }
                        			}
                        		}
                        	}
                        	pParam.budget_plan_detail = xJoArrItems;
                        }

                        var xAddResult = await _repoInstance.save(pParam, xAct);
                        if (xAddResult.status_code == '00' && xAddResult.created_id != '' && xAddResult.clear_id != '') {
                            // Generate RAB No
                            
                            var dt = dateTime.create();
                            var xDate = dt.format('ym');
                            var xRABNo = `${pParam.company_code}/RAB/${xDate}/` + xAddResult.clear_id.padStart(5, '0');
                            // var xRABNo = await _globalUtilInstance.generatePurchaseRequestNo(
                            // 	xAddResult.clear_id,
                            // 	pParam.company_code
                            // );
                            
                            var xParamUpdate = {
                                budget_no: xRABNo,
                                id: xAddResult.clear_id
                            };

                            var xUpdate = await _repoInstance.save(xParamUpdate, 'update');

                            if (xUpdate.status_code == '00') {
                                xJoResult = xAddResult;
                                // // ---------------- Start: Add to log ----------------
                                // let xParamLog = {
                                // 	act: 'add',
                                // 	employee_id: pParam.employee_id,
                                // 	employee_name: pParam.employee_name,
                                // 	request_id: xAddResult.clear_id,
                                // 	request_no: xRABNo,
                                // 	body: {
                                // 		act: 'add',
                                // 		msg: 'RAB created'
                                // 	}
                                // };
                                // console.log(`>>> xParamLog : ${JSON.stringify(xParamLog)}`);
                                // var xResultLog = await _logServiceInstance.addLog(pParam.method, pParam.token, xParamLog);
                                // xJoResult.log_result = xResultLog;
                                // // ---------------- End: Add to log ----------------

                                // delete xJoResult.clear_id;
                            } else {
                                xJoResult = xUpdate;
                            }
                        } else {
                            xJoResult = xAddResult;
                        }
                    } else if (xAct == 'update') {
                        if (pParam.hasOwnProperty('id')) {

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

                        } else {
                            xJoResult = {
                                status_code: '-99',
                                status_msg: 'Parameter id can not be empty'
                            };
                        }
                    }
                }
            }

		} catch (e) {
			_utilInstance.writeLog(`${_xClassName}.save`, `Exception error: ${e.message}`, 'error');

			xJoResult = {
				status_code: '-99',
				status_msg: `${_xClassName}.save: Exception error: ${e.message}`
			};
        }
        
		return xJoResult;
    }
    
	async getById(pParam) {
		var xJoResult = {};
		var xJoData = {};
		var xFlagProcess = false;
		var xDecId = null;
		var xEncId = '';
		var xArrUserCanCancel = [];

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
				var xJoArrBudgetDetailData = [];
				var xDetail = xResult.budget_plan_detail;

				for (var index in xDetail) {

					xJoArrBudgetDetailData.push({
						id: await _utilInstance.encrypt(xDetail[index].id, config.cryptoKey.hashKey),
						product: {
							id: xDetail[index].product_id,
							code: xDetail[index].product_code,
							name: xDetail[index].product_name
						},
						category: {
							id: xDetail[index].category_id,
							name: xDetail[index].category_name
						},
						dimension: xDetail[index].dimension,
						merk: xDetail[index].merk,
						type: xDetail[index].type,
						material: xDetail[index].material,
						photo: xDetail[index].photo,
						description: xDetail[index].description,
						qty: xDetail[index].qty,
                        qty_remain: xDetail[index].qty_remain,
                        uom: {
                            id: xDetail[index].uom_id,
                            name: xDetail[index].uom_name
                        },
						budget_price_per_unit: xDetail[index].budget_price_per_unit,
						budget_price_total: xDetail[index].budget_price_total,
						vendor: {
							id: xDetail[index].vendor_id,
							code: xDetail[index].vendor_code,
							name: xDetail[index].vendor_name
						},
						vendor_recomendation: xDetail[index].vendor_recomendation,
						vendor_catalogue_id: xDetail[index].vendor_catalogue_id,
						estimate_date_use:
							xDetail[index].estimate_date_use != null
								? moment(xDetail[index].estimate_date_use).format('DD MMM YYYY')
								: ''
					});
				}
				// Get Approval Matrix
				var xParamApprovalMatrix = {
					application_id: config.applicationId,
					table_name: config.dbTables.rab,
					document_id: xEncId
				};
				var xResultApprovalMatrix = await _oAuthService.getApprovalMatrix(
					pParam.method,
					pParam.token,
					xParamApprovalMatrix
				);

				// console.log(`>>> xResultApprovalMatrix: ${JSON.stringify(xResultApprovalMatrix)}`);

				// if (xResultApprovalMatrix != null) {
				// 	if (xResultApprovalMatrix.status_code == '00') {
				// 		let xListApprover = xResultApprovalMatrix.token_data.data;
				// 		for (var i in xListApprover) {
				// 			let xApproverUsers = _.filter(xListApprover[i].approver_user, { status: 1 }).map(
				// 				(v) => (v.user != null ? v.user.email : v.user)
				// 			);
				// 			xArrUserCanCancel.push.apply(xArrUserCanCancel, xApproverUsers);
				// 		}
				// 	}
				// }

				xJoData = {
					id: await _utilInstance.encrypt(xResult.id.toString(), config.cryptoKey.hashKey),
                    project: {
                      id: xResult.project_id,
                      code: xResult.project_code,
                      name: xResult.project_name,    
                    },
					name: xResult.name,
					budget_no: xResult.budget_no,
					employee: {
						// id: await _utilInstance.encrypt(xResult.employee_id.toString(), config.cryptoKey.hashKey),
						id: xResult.employee_id,
						nik: xResult.employee_nik,
						name: xResult.employee_name
					},
					company: {
						id: xResult.company_id,
						name: xResult.company_name
					},
					department: {
						id: xResult.department_id,
						name: xResult.department_name
					},
					pic_employee: {
						// id: await _utilInstance.encrypt(xResult.employee_id.toString(), config.cryptoKey.hashKey),
						id: xResult.pic_employee_id,
						nik: xResult.pic_employee_nik,
						name: xResult.pic_employee_name
					},

					total_plan_qty: xResult.total_plan_qty,
					total_budget_plan: xResult.total_budget_plan,

					status: {
						id: xResult.status,
						name: config.statusDescription.budgetPlan[xResult.status]
					},
					reject_reason: xResult.reject_reason,

					budget_plan_detail: xJoArrBudgetDetailData,

					approver_users: xArrUserCanCancel,
                    approval_matrix: xResultApprovalMatrix.status_code == '00'
                        && xResultApprovalMatrix.token_data.status_code == '00'
                        ? xResultApprovalMatrix.token_data.data : null,

					submited_at: xResult.submitedAt != null ? moment(xResult.submitedAt).format('DD MMM YYYY HH:mm:ss') : null,
                    submited_by_name: xResult.submited_by_name,

					received_at: xResult.receivedAt != null ? moment(xResult.receivedAt).format('DD MMM YYYY HH:mm:ss') : null,
                    received_by_name: xResult.received_by_name,
                    
					created_at: xResult.createdAt != null ? moment(xResult.createdAt).format('DD MMM YYYY') : null,
                    created_by_name: xResult.created_by_name,
                    
					updated_at: xResult.updatedAt != null ? moment(xResult.updatedAt).format('DD MMM YYYY') : null,
					updated_by_name: xResult.updated_by_name,

					cancel_at:
						xResult.cancelAt != null ? moment(xResult.cancelAt).format('DD MMM YYYY HH:mm:ss') : null,
					cancel_by_name: xResult.cancel_by_name,
                    cancel_reason: xResult.cancel_reason,
                    
					set_to_draft_at: xResult.set_to_draftAt != null ? moment(xResult.set_to_draftAt).format('DD MMM YYYY HH:mm:ss') : null,
                    set_to_draft_by_name: xResult.set_to_draft_by_name,

					done_at: xResult.doneAt != null ? moment(xResult.doneAt).format('DD MMM YYYY HH:mm:ss') : null,
                    done_by_name: xResult.done_by_name,
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

		return xJoResult;
    }
    
	async submitRAB(pParam) {
		var xJoResult = {};
		var xDecId = null;
		var xFlagProcess = false;
		var xEncId = '';
		var xClearId = '';
        try {
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
                // Get RAB Detail
                var xRABDetail = await _repoInstance.getById({ id: xClearId });
                if (xRABDetail !== null) {
                    if (xRABDetail.status != 0) {
                        //xRABDetail.status != 0) {
                        xJoResult = {
                            status_code: '-99',
                            status_msg: 'You can not submit this document. Please check again.'
                        };
                    } else {
                        pParam.submitedAt = await _utilInstance.getCurrDateTime();
                        pParam.status = 1;

                        var xUpdateResult = await _repoInstance.save(pParam, 'submit');
                        xJoResult = xUpdateResult;
                        // Next Phase : Approval Matrix & Notification to admin
                        if (xUpdateResult.status_code == '00') {
                            if (xRABDetail != null) {
                                // Add Approval Matrix
                                var xParamAddApprovalMatrix = {
                                    act: 'add',
                                    document_id: xEncId,
                                    document_no: xRABDetail.budget_no,
                                    application_id: config.applicationId,
                                    table_name: config.dbTables.rab,
                                    company_id: xRABDetail.company_id,
                                    department_id: xRABDetail.department_id,
                                    // ecatalogue_fpb_category_item: xRABDetail.category_item == 7 ? xRABDetail.category_item : null,
                                    logged_company_id: pParam.logged_company_id
                                };

                                var xApprovalMatrixResult = null
                                // xApprovalMatrixResult = await _oAuthService.addApprovalMatrix(
                                // 	pParam.method,
                                // 	pParam.token,
                                // 	xParamAddApprovalMatrix
                                // );
                                xJoResult.approval_matrix_result = xApprovalMatrixResult;

                                // if (xApprovalMatrixResult.status_code == '00') {
                                // 	if (xApprovalMatrixResult.approvers.length > 0) {
                                // 		let xApproverSeq1 = xApprovalMatrixResult.approvers.find((el) => el.sequence === 1);
                                // 		if (xApproverSeq1 != null) {
                                // 			for (var i in xApproverSeq1.approver_user) {
                                // 				// In App notification
                                // 				let xInAppNotificationResult = await _notificationService.inAppNotification({
                                // 					document_code: xRABDetail.budget_no,
                                // 					document_id: xEncId,
                                // 					document_status: xRABDetail.status,
                                // 					mode: 'request_approval_rab',
                                // 					method: pParam.method,
                                // 					token: pParam.token,
                                // 					employee_id: await _utilInstance.encrypt(
                                // 						xApproverSeq1.approver_user[i].employee_id.toString(),
                                // 						config.cryptoKey.hashKey
                                // 					)
                                // 				});

                                // 				_utilInstance.writeLog(
                                // 					`${_xClassName}.submitRAB`,
                                // 					`xInAppNotificationResult: ${JSON.stringify(xInAppNotificationResult)}`,
                                // 					'info'
                                // 				);

                                // 				console.log(
                                // 					`>>> xInAppNotificationResult: ${JSON.stringify(xInAppNotificationResult)}`
                                // 				);

                                // 				// Email Notification
                                // 				let xParamEmailNotification,
                                // 					xNotificationResult = {};

                                // 				console.log(
                                // 					`>>> xApproverSeq1.approver_user[i]: ${JSON.stringify(
                                // 						xApproverSeq1.approver_user[i]
                                // 					)}`
                                // 				);

                                // 				if (xApproverSeq1.approver_user[i].notification_via_email) {
                                // 					xParamEmailNotification = {
                                // 						mode: 'request_approval_rab',
                                // 						id: xEncId,
                                // 						request_no: xRABDetail.budget_no,
                                // 						company_name: xRABDetail.company_name,
                                // 						department_name: xRABDetail.department_name,
                                // 						created_by: xRABDetail.employee_name,
                                // 						created_at:
                                // 							xRABDetail.createdAt != null
                                // 								? moment(xRABDetail.createdAt).format('DD MMM YYYY')
                                // 								: '',
                                // 						items: xRABDetail.budget_plan_detail,
                                // 						approver_user: {
                                // 							employee_name: xApproverSeq1.approver_user[i].user_name,
                                // 							email: xApproverSeq1.approver_user[i].email
                                // 						}
                                // 					};
                                // 					console.log(
                                // 						`>>> xParamEmailNotification: ${JSON.stringify(
                                // 							xParamEmailNotification
                                // 						)}`
                                // 					);
                                // 					xNotificationResult = await _notificationService.sendNotificationEmail_RABNeedApproval(
                                // 						xParamEmailNotification,
                                // 						pParam.method,
                                // 						pParam.token
                                // 					);

                                // 					console.log(
                                // 						`>>> xNotificationResult: ${JSON.stringify(xNotificationResult)}`
                                // 					);
                                // 				}
                                // 			}
                                // 		}
                                // 	}
                                // }

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
                } else {
                    xJoResult = {
                        status_code: '-99',
                        status_msg: 'Document not found'
                    };
                }
            }

        } catch (e) {
			xJoResult = {
				status_code: '-99',
				status_msg: `Exception error <${_xClassName}.submitRAB>: ${e.message}`
			};
        }
        
        return xJoResult;
    }
    
	async takeRAB(pParam) {
		var xJoResult = {};
		var xDecId = null;
		var xFlagProcess = false;
		var xEncId = '';
		var xClearId = '';

        try {
			if (pParam.logged_is_admin !== 1) {
				xJoResult = {
					status_msg: "You don't have permission of this access.",
					status_code: '-99'
				};
			} else {
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
					// Check if this request id valid or not
					var xRABDetail = await _repoInstance.getById({ id: xClearId });
					if (xRABDetail != null) {
						if (xRABDetail.status != 2) {
							xJoResult = {
								status_code: '-99',
								status_msg: 'This document can not take since the status is not Pending.'
							};
						} else {
                            pParam.receivedAt = await _utilInstance.getCurrDateTime();
                            pParam.status = 3;
							// var xParamUpdatePR = {
							// 	id: pParam.document_id,
							// 	status: 3,
							// 	user_id: pParam.user_id,
                            //     user_name: pParam.user_name,
                            //     rece
							// };
							var xUpdateResult = await _repoInstance.save(pParam, 'take');

							if (xUpdateResult.status_code == '00') {
								xJoResult = {
									status_code: '00',
									status_msg: 'RAB successfully received'
								};
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
			}
		} catch (e) {
			xJoResult = {
				status_code: '-99',
				status_msg: `Exception error <${_xClassName}.takeRAB>: ${e.message}`
			};
		}

		return xJoResult;
    }
    
	async doneRAB(pParam) {
		var xJoResult = {};
		var xDecId = null;
		var xFlagProcess = false;
		var xEncId = '';
		var xClearId = '';

        try {
			// if (pParam.logged_is_admin !== 1) {
			// 	xJoResult = {
			// 		status_msg: "You don't have permission of this access.",
			// 		status_code: '-99'
			// 	};
			// } else {
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
                // Check if this request id valid or not
                var xRABDetail = await _repoInstance.getById({ id: xClearId });
                if (xRABDetail != null) {
                    if (xRABDetail.status != 3) {
                        xJoResult = {
                            status_code: '-99',
                            status_msg: 'You cannot change this document to done since its status not In Progress'
                        };
                    } else {
                        pParam.doneAt = await _utilInstance.getCurrDateTime();
                        pParam.status = 4;
                        var xUpdateResult = await _repoInstance.save(pParam, 'done');

                        if (xUpdateResult.status_code == '00') {
                            xJoResult = {
                                status_code: '00',
                                status_msg: 'RAB successfully change to done'
                            };
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
			// }
		} catch (e) {
			xJoResult = {
				status_code: '-99',
				status_msg: `Exception error <${_xClassName}.doneRAB>: ${e.message}`
			};
		}

		return xJoResult;
    }
    
	async cancelRAB(pParam) {
		var xJoResult = {};
		var xDecId = null;
		var xFlagProcess = false;
		var xEncId = '';
		var xClearId = '';

        try {
			// if (pParam.logged_is_admin !== 1) {
			// 	xJoResult = {
			// 		status_msg: "You don't have permission of this access.",
			// 		status_code: '-99'
			// 	};
			// } else {
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
                // Check if this request id valid or not
                var xRABDetail = await _repoInstance.getById({ id: xClearId });
                if (xRABDetail != null) {
                    if (xRABDetail.status == 1 || xRABDetail.status == 4 ||  xRABDetail.status == 5 || xRABDetail.status == 6 ) {
                        xJoResult = {
                            status_code: '-99',
                            status_msg: 'You cannot cancel this document now'
                        };
                    } else {
                        pParam.cancelAt = await _utilInstance.getCurrDateTime();
                        pParam.status = 5;
                        var xUpdateResult = await _repoInstance.save(pParam, 'cancel');

                        if (xUpdateResult.status_code == '00') {
                            xJoResult = {
                                status_code: '00',
                                status_msg: 'RAB cancel successfully'
                            };
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
			// }
		} catch (e) {
			xJoResult = {
				status_code: '-99',
				status_msg: `Exception error <${_xClassName}.cancelRAB>: ${e.message}`
			};
		}

		return xJoResult;
    }
    
	async setToDraftRAB(pParam) {
		var xJoResult = {};
		var xDecId = null;
		var xFlagProcess = false;
		var xEncId = '';
		var xClearId = '';

        try {
			// if (pParam.logged_is_admin !== 1) {
			// 	xJoResult = {
			// 		status_msg: "You don't have permission of this access.",
			// 		status_code: '-99'
			// 	};
			// } else {
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
                // Check if this request id valid or not
                var xRABDetail = await _repoInstance.getById({ id: xClearId });
                if (xRABDetail != null) {
                    if (xRABDetail.status >= 0 &&  xRABDetail.status < 5) {
                        xJoResult = {
                            status_code: '-99',
                            status_msg: 'You cannot set to draft while this docment already in process'
                        };
                    } else {
                        pParam.set_to_draftAt = await _utilInstance.getCurrDateTime();
                        pParam.status = 0;
                        var xUpdateResult = await _repoInstance.save(pParam, 'set_to_draft');

                        if (xUpdateResult.status_code == '00') {
                            xJoResult = {
                                status_code: '00',
                                status_msg: 'Successfully change status to draft'
                            };
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
			// }
		} catch (e) {
			xJoResult = {
				status_code: '-99',
				status_msg: `Exception error <${_xClassName}.setToDraftRAB>: ${e.message}`
			};
		}

		return xJoResult;
    }
    
	async confirmRAB(pParam) {
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
			var xRABDetail = await _repoInstance.getById({ id: pParam.document_id });
			if (xRABDetail != null) {
				if (xRABDetail.status != 1) {
					xJoResult = {
						status_code: '-99',
						status_msg: 'This document already confirmed before.'
					};
				} else {
					// var xParamApprovalMatrixDocument = {
					// 	document_id: xEncId,
					// 	status: 1,
					// 	application_id: config.applicationId,
					// 	table_name: config.dbTables.rab
					// };

					// var xResultApprovalMatrixDocument = await _oAuthService.confirmApprovalMatrix(
					// 	pParam.method,
					// 	pParam.token,
					// 	xParamApprovalMatrixDocument
					// );

					// if (xResultApprovalMatrixDocument != null) {
						// if (xResultApprovalMatrixDocument.status_code == '00') {
							// let xResultApprove = null;
							// if (xResultApprovalMatrixDocument.status_document_approved == true) {
								
                    var xParamUpdatePR = {
                        id: pParam.document_id,
                        status: 2
                    };
                    var xUpdateResult = await _repoInstance.save(xParamUpdatePR, 'update');

                    if (xUpdateResult.status_code == '00') {
                        xJoResult = {
                            status_code: '00',
                            status_msg: 'RAB successfully approved'
                        };
                    } else {
                        xJoResult = xUpdateResult;
                    }
							// } else {
							// 	// Sort first
							// 	xResultApprovalMatrixDocument.approvers = xResultApprovalMatrixDocument.approvers.sort(
							// 		(a, b) => {
							// 			if (a.sequence < b.sequence) {
							// 				return -1;
							// 			}
							// 		}
							// 	);

							// 	// Send to next approver...
							// 	let xNextApprover = xResultApprovalMatrixDocument.approvers[0].approver_user;
							// 	console.log(`>>> xNextApprover : ${JSON.stringify(xNextApprover)}`);
							// 	if (xNextApprover != null) {
							// 		for (var i in xNextApprover) {
							// 			let xInAppNotificationResult = await _notificationService.inAppNotification({
							// 				document_code: xRABDetail.budget_no,
							// 				document_id: xEncId,
							// 				document_status: xRABDetail.status,
							// 				mode: 'request_approval_rab',
							// 				method: pParam.method,
							// 				token: pParam.token,
							// 				employee_id: await _utilInstance.encrypt(
							// 					xNextApprover[i].employee_id.toString(),
							// 					config.cryptoKey.hashKey
							// 				)
							// 			});

							// 			// Email Notification
							// 			let xParamEmailNotification,
							// 				xNotificationResult = {};

							// 			if (xNextApprover[i].notification_via_email) {
							// 				xParamEmailNotification = {
							// 					mode: 'request_approval_fpb',
							// 					id: xEncId,
							// 					request_no: xRABDetail.budget_no,
							// 					company_name: xRABDetail.company_name,
							// 					department_name: xRABDetail.department_name,
							// 					created_by: xRABDetail.employee_name,
							// 					created_at:
							// 						xRABDetail.createdAt != null
							// 							? moment(xRABDetail.createdAt).format('DD MMM YYYY')
							// 							: '',
							// 					items: xRABDetail.purchase_request_detail,
							// 					approver_user: {
							// 						employee_name: xNextApprover[i].user_name,
							// 						email: xNextApprover[i].email
							// 					}
							// 				};
							// 				console.log(
							// 					`>>> xParamEmailNotification: ${JSON.stringify(
							// 						xParamEmailNotification
							// 					)}`
							// 				);
							// 				xNotificationResult = await _notificationService.sendNotificationEmail_FPBNeedApproval(
							// 					xParamEmailNotification,
							// 					pParam.method,
							// 					pParam.token
							// 				);

							// 				console.log(
							// 					`>>> xNotificationResult: ${JSON.stringify(xNotificationResult)}`
							// 				);
							// 			}
							// 		}
							// 	}

							// 	xJoResult = {
							// 		status_code: '00',
							// 		status_msg: 'FPB successfully approved. Document available for next approver',
							// 		result_approval_matrix: xResultApprovalMatrixDocument
							// 	};
							// }
						// } else {
						// 	xJoResult = xResultApprovalMatrixDocument;
						// }
					// } else {
					// 	xJoResult = {
					// 		status_code: '-99',
					// 		status_msg: 'There is problem on approval matrix processing. Please try again'
					// 	};
					// }
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

	async rejectRAB(pParam) {
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
			var xRABDetail = await _repoInstance.getById({ id: pParam.document_id });
			if (xRABDetail != null) {
				if (xRABDetail.status != 1) {
					xJoResult = {
						status_code: '-99',
						status_msg: 'Cannot reject, document already in process'
					};
				} else {
					// var xParamApprovalMatrixDocument = {
					// 	document_id: xEncId,
					// 	status: -1,
					// 	application_id: config.applicationId,
					// 	table_name: config.dbTables.fpb
					// };

					// var xResultApprovalMatrixDocument = await _oAuthService.confirmApprovalMatrix(
					// 	pParam.method,
					// 	pParam.token,
					// 	xParamApprovalMatrixDocument
					// );

					// await _utilInstance.writeLog(
					// 	`${_xClassName}.rejectFPB`,
					// 	`xResultApprovalMatrixDocument: ${xResultApprovalMatrixDocument}`,
					// 	'debug'
					// );

					// if (xResultApprovalMatrixDocument != null) {
					// 	if (xResultApprovalMatrixDocument.status_code == '00') {
							// Update status FPB to be confirmed
                    var xParamUpdatePR = {
                        id: pParam.document_id,
                        status: 6,
                        reject_reason: pParam.reject_reason
                    };
                    var xUpdateResult = await _repoInstance.save(xParamUpdatePR, 'update');

                    if (xUpdateResult.status_code == '00') {
                        xJoResult = {
                            status_code: '00',
                            status_msg: 'RAB successfully rejected'
                        };
                    } else {
                        xJoResult = xUpdateResult;
                    }
					// 	} else {
					// 		xJoResult = xResultApprovalMatrixDocument;
					// 	}
					// } else {
					// 	xJoResult = {
					// 		status_code: '-99',
					// 		status_msg: 'There is problem on approval matrix processing. Please try again'
					// 	};
					// }
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
    
	async dropDown(pParam) {
		var xJoResult = {};
		var xJoArrData = [];

		try {
			var xResultList = await _repoInstance.list(pParam);
            if (xResultList) {
                if (xResultList.status_code == '00') {
                    var xRows = xResultList.data.rows;
                    if (xRows.length > 0) {
                        for (var index in xRows) {
                            xJoArrData.push({
                                id: xRows[index].id,
                                name: xRows[index].name,
                                budget_no: xRows[index].budget_no
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
			xJoResult = {
				status_code: '-99',
				status_msg: `Exception error <${_xClassName}.dropDown>: ${e.message}`
			};
		}

		return xJoResult;
    }
    
	async deleteRAB(pParam) {
		var xJoResult;
		var xFlagProcess = false;
		var xEncId = '';

		let xLevel = pParam.logged_user_level.find(
			(el) => el.application.id === config.applicationId || el.application.id === 1
		);

		if (xLevel.is_admin != 1) {
			xJoResult = {
				status_code: '-99',
				status_msg: 'You not allowed to delete this data'
			};
        } else {
            if (pParam.hasOwnProperty('is_permanent')) {
                
                var xDecId = await _utilInstance.decrypt(pParam.id, config.cryptoKey.hashKey);
                if (xDecId.status_code == '00') {
                    xEncId = pParam.id;
                    pParam.id = xDecId.decrypted;
                    xFlagProcess = true;
                } else {
                    xJoResult = xDecId;
                }

                if (xFlagProcess) {
                    var xRABDetail = await _repoInstance.getById({ id: pParam.id });
                    
                    if (xRABDetail != null) {
                        // Next: Will add delete user first on oauth
                        if (xRABDetail.status != 0) {
                            xJoResult = {
                                status_code: '-99',
                                status_msg: 'You cannot delete this document now'
                            };
                        } else {
                            xJoResult = await _repoInstance.delete(pParam);
                        }
                        
                    } else {
                        xJoResult = {
                            status_code: '-99',
                            status_msg: 'Data not found'
                        };
                    }
                }
            
            } else {
                xJoResult = {
                    status_code: '-99',
                    status_msg: 'Parameter is_permanent can not be empty'
                };
            }
		}

		return xJoResult;
	}
}

module.exports = BudgetPlanService;
