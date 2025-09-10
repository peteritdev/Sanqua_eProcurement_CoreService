const jwt = require('jsonwebtoken');
const md5 = require('md5');
const crypto = require('crypto');
const moment = require('moment');
const dateFormat = require('dateformat');
const bcrypt = require('bcrypt');
const fs = require('fs');
const dateTime = require('node-datetime');
const _ = require('lodash');

// Config
const env = process.env.NODE_ENV || 'localhost';
const config = require(__dirname + '/../config/config.json')[env];

// Util
const Utility = require('peters-globallib-v2');
const _utilInstance = new Utility();

const LocalUtility = require('../utils/globalutility.js');
const _globalUtilInstance = new LocalUtility();

// Repository
const Repository = require('../repository/vendorregistrationrepository.js');
const _repoInstance = new Repository();

// Service
const OAuthService = require('../services/oauthservice.js');
const _oAuthService = new OAuthService();

const VendorService = require('../services/vendorservice.js');
const _vendorServiceInstance = new VendorService();

const NotificationService = require('../services/notificationservice.js');
const _notificationService = new NotificationService();

const _xClassName = 'VendorRegistrationService';

class VendorRegistrationService {
	constructor() {}
    async list(pParam) {
		let xJoResult = {};
		let xJoArrData = [];

		try {
			const xResultList = await _repoInstance.list(pParam);

			if (xResultList.status_code === '00') {
				const xRows = xResultList.data.rows;
				if (xRows.length > 0) {
					for (const row of xRows) {
						xJoArrData.push({
							id: await _utilInstance.encrypt(row.id.toString(), config.cryptoKey.hashKey),
							name: row.name,
							email: row.email,
							phone_number: row.phone_number,
							website: row.website,
							address: row.address,
							province_id: row.province_id,
							province_name: row.province && row.province.name ? row.province.name : null,
							city_id: row.city_id,
							city_name: row.city && row.city.name ? row.city.name : null,
							classification_id: row.classification_id,
							classification_name: row.classification && row.classification.name ? row.classification.name : null,
							sub_classification_id: row.sub_classification_id,
							sub_classification_name: row.sub_classification && row.sub_classification.name ? row.sub_classification.name : null,
							business_entity: row.business_entity,
                            status: {
                                id: row.status,
                                name: config.statusDescription.vendorRegistration[row.status]
                            },
							created_at: moment(row.createdAt).format('DD MMM YYYY HH:mm:ss'),
							updated_at: moment(row.updatedAt).format('DD MMM YYYY HH:mm:ss'),
							created_by_company_id: row.created_by_company_id,
							created_by_company_name: row.created_by_company_name,
							created_by: row.created_by,
							created_by_name: row.created_by_name,
							request_no: row.request_no
						});
					}

					xJoResult = {
						status_code: '00',
						status_msg: 'OK',
						data: xJoArrData,
						total_record: xResultList.total_record
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
		let xJoResult = {};
		let xDecId;
		let xFlagProcess = false;

		try {
			if (pParam.user_id) {
				xDecId = await _utilInstance.decrypt(pParam.user_id, config.cryptoKey.hashKey);
				if (xDecId.status_code === '00') {
					pParam.user_id = xDecId.decrypted;
					xFlagProcess = true;
				} else {
					return (xJoResult = xDecId);
				}
			} else {
				return xJoResult = {
					status_code: '-99',
					status_msg: 'Parameter user_id cannot be empty'
				};
			}

			if (xFlagProcess) {
				if (pParam.act === 'add') {
					const xSave = await _repoInstance.save(pParam, 'add');
					xJoResult = xSave;
					if (xSave.status_code == '00' && xSave.created_id != '' && xSave.clear_id != '') {
						// Generate Document No
						var dt = dateTime.create();
						var xDate = dt.format('ym');
						var xDocNo = `${pParam.logged_company_alias}/VREG/${xDate}/` + xSave.clear_id.padStart(5, '0');
						var xParamUpdate = {
							request_no: xDocNo,
							id: xSave.clear_id
						};

						var xUpdate = await _repoInstance.save(xParamUpdate, 'update');
						if (xUpdate.status_code == '00') {
							xJoResult = xSave;
						} else {
							xJoResult = xUpdate;
						}
					} else {
						xJoResult = xSave;
					}
				} else if (pParam.act === 'update') {
					const xDecId = await _utilInstance.decrypt(pParam.id, config.cryptoKey.hashKey);
					if (xDecId.status_code === '00') {
						pParam.id = xDecId.decrypted;
						pParam.updated_by = pParam.user_id;
						pParam.updated_by_name = pParam.user_name;
						xJoResult = await _repoInstance.save(pParam, 'update');
					} else {
						xJoResult = xDecId;
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

	async detail(pParam) {
		let xJoResult = {};
		let xFlagProcess = false;
		var xDecId = null;
		var xEncId = "";
		var xArrUserCanCancel = [];

		try {
			if (pParam.id) {
				const xDecId = await _utilInstance.decrypt(pParam.id, config.cryptoKey.hashKey);
				if (xDecId.status_code === '00') {
					pParam.id = xDecId.decrypted;
					xFlagProcess = true;
				} else {
					return (xJoResult = xDecId);
				}
			}

			if (xFlagProcess) {
				const xData = await _repoInstance.getById(pParam);

				if (xData.status_code == '00') {
					const xDetail = xData.data;
					// xDetail.id = await _utilInstance.encrypt(xDetail.id.toString(), config.cryptoKey.hashKey)
					xDetail.status = {
						id: xDetail.status,
						name: config.statusDescription.vendorRegistration[xDetail.status]
					};

					const xDocumentFile = xDetail.vendor_document;
					// console.log(`>>> xData 3`);
					if (xDocumentFile != null) {
						for (let i = 0; i < xDocumentFile.length; i++) {
							if (xDocumentFile[i].file != null) {
								// xDetail.vendor_document[i].file = `${config.imagePathESanQua}/eprocurement/vendor_regist/${xDocumentFile[i].file}`
								xDetail.vendor_document[i].file = `${xDocumentFile[i].file}`
								xDetail.vendor_document[i].path = `${config.imagePathESanQua}/eprocurement/vendor_regist/`
							}
						}
					}
					const xProductCategory = xDetail.vendor_product_category;
					// console.log(`>>> xData 3`);
					if (xProductCategory != null) {
						for (let i = 0; i < xProductCategory.length; i++) {
							if (xProductCategory[i].file != null) {
								xDetail.vendor_product_category[i].file = `${xProductCategory[i].file}`
								xDetail.vendor_product_category[i].path = `${config.imagePathESanQua}/eprocurement/vendor_regist/`
							}
						}
					}

					// Get Approval Matrix
					var xParamApprovalMatrix = {
						application_id: config.applicationId,
						table_name: config.dbTables.vendor_registration,
						document_id: xEncId,
					};
					var xResultApprovalMatrix = await _oAuthService.getApprovalMatrix(
						pParam.method,
						pParam.token,
						xParamApprovalMatrix
					);

					if (xResultApprovalMatrix != null) {
						if (
							xResultApprovalMatrix.status_code == "00" &&
							xResultApprovalMatrix.token_data.status_code == "00"
						) {
							let xListApprover = xResultApprovalMatrix.token_data.data;
							for (var i in xListApprover) {
								let xApproverUsers = _.filter(xListApprover[i].approver_user, {
								status: 0,
								}).map((v) => (v.user != null ? v.user.email : v.user));
								// console.log(`>>> xApproverUsers: ${JSON.stringify(xApproverUsers)}`);
								xArrUserCanCancel.push.apply(xArrUserCanCancel, xApproverUsers);
							}
						}
					}

					var xJoData = {
						id: await _utilInstance.encrypt(
							xDetail.id.toString(),
							config.cryptoKey.hashKey
						),
						address: xDetail.address,
						business_entity: xDetail.business_entity,
						cancel_reason: xDetail.cancel_reason,
						city: xDetail.city,
						classification: xDetail.classification,
						code: xDetail.code,
						company_scale: xDetail.company_scale,
						createdAt: xDetail.createdAt,
						created_by: xDetail.created_by,
						created_by_company_id: xDetail.created_by_company_id,
						created_by_company_name: xDetail.created_by_company_name,
						created_by_name: xDetail.created_by_name,
						email: xDetail.email,
						lat: xDetail.lat,
						lng: xDetail.lng,
						name: xDetail.name,
						phone_number: xDetail.phone_number,
						post_code: xDetail.post_code,
						province: xDetail.province,
						request_no: xDetail.request_no,
						status: xDetail.status,
						sub_classification: xDetail.sub_classification,
						takeAt: xDetail.takeAt,
						take_by: xDetail.take_by,
						take_by_name: xDetail.take_by_name,
						updatedAt: xDetail.updatedAt,
						updated_by: xDetail.updated_by,
						updated_by_name: xDetail.updated_by_name,
						vendor_contact: xDetail.vendor_contact,
						vendor_document: xDetail.vendor_document,
						vendor_experience: xDetail.vendor_experience,
						vendor_finance: xDetail.vendor_finance,
						vendor_product_category: xDetail.vendor_product_category,
						website: xDetail.website,
						year_founded: xDetail.year_founded,
						logo: xDetail.logo,
						approver_users: xArrUserCanCancel,
						approval_matrix: xResultApprovalMatrix.status_code == "00" &&
							xResultApprovalMatrix.token_data.status_code == "00"
								? xResultApprovalMatrix.token_data.data
								: null,
					};
					// console.log(`>>> xDetail.approver_users 2: ${JSON.stringify(xDetail.approver_users)}`);

					xJoResult = {
						status_code: '00',
						status_msg: 'OK',
						data: xDetail
					};
				} else {
					xJoResult = {
						status_code: '-99',
						status_msg: 'Data not found'
					};
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

	async delete(pParam) {
		let xJoResult = {};
		try {
			const xDecId = await _utilInstance.decrypt(pParam.id, config.cryptoKey.hashKey);
			if (xDecId.status_code !== '00') return xDecId;
			pParam.id = xDecId.decrypted;

			const xData = await _repoInstance.getById({ id: pParam.id });
			if (!xData) {
				return { status_code: '-99', status_msg: 'Data not found' };
			}

			if (xData.created_by !== pParam.user_id) {
				return { status_code: '-99', status_msg: 'Only creator can delete this data' };
			}
			// delete all foto / file inside this data before delete
			xJoResult = await _repoInstance.deletePermanent(pParam);
		} catch (e) {
			_utilInstance.writeLog(`${_xClassName}.delete`, `Exception error: ${e.message}`, 'error');
			xJoResult = {
				status_code: '-99',
				status_msg: `${_xClassName}.delete: Exception error: ${e.message}`
			};
		}
		return xJoResult;
	}

	async submit(pParam) {
		var xJoResult = {};
		var xDecId = null;
		var xFlagProcess = false;
		var xEncId = "";
		var xClearId = "";
		try {
			if (pParam.id != "" && pParam.user_id != "") {
				xDecId = await _utilInstance.decrypt(
					pParam.id,
					config.cryptoKey.hashKey
				);
				if (xDecId.status_code == "00") {
					xFlagProcess = true;
					xEncId = pParam.id;
					pParam.id = xDecId.decrypted;
					xClearId = xDecId.decrypted;
					xDecId = await _utilInstance.decrypt(
						pParam.user_id,
						config.cryptoKey.hashKey
					);
					if (xDecId.status_code == "00") {
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
				// Get Detail Document
				var xRegistrationDetail = await _repoInstance.getById({ id: xClearId });

				if (
					xRegistrationDetail !== null &&
					xRegistrationDetail.status_code == "00"
				) {
					if (xRegistrationDetail.data.status != 0) {
						//xRegistrationDetail.status != 0) {
						xJoResult = {
							status_code: "-99",
							status_msg:
								"You can not submit this document. Please check again.",
						};
					} else {
						let xParamUpdate = {
							id: xRegistrationDetail.data.id,
							status: 1,
							user_id: pParam.user_id,
							user_name: pParam.user_name,
						};

						var xUpdateResult = await _repoInstance.save(xParamUpdate, "update");
						// console.log(`>>> xUpdateResult: ${JSON.stringify(xUpdateResult)}`);
						xJoResult = xUpdateResult;
						// Next Phase : Approval Matrix & Notification to admin
						if (xUpdateResult.status_code == "00") {
							// if (xRegistrationDetail != null) {
							// Add Approval Matrix
							var xParamAddApprovalMatrix = {
								act: "fetch_matrix",
								document_id: xEncId,
								document_no: xRegistrationDetail.data.request_no,
								application_id: config.applicationId,
								table_name: config.dbTables.vendor_registration,
								company_id: xRegistrationDetail.data.created_by_company_id,
								// department_id: xRegistrationDetail.data.department_id,
								// ecatalogue_fpb_category_item: xRegistrationDetail.category_item == 7 ? xRegistrationDetail.category_item : null,
								// logged_company_id: pParam.logged_company_id,
								approval_matrix_id: pParam.approval_matrix_id,
							};
							// console.log(
							// 	`>>> xParamAddApprovalMatrix: ${JSON.stringify(
							// 	xParamAddApprovalMatrix
							// 	)}`
							// );

							var xApprovalMatrixResult = await _oAuthService.addApprovalMatrix(
								pParam.method,
								pParam.token,
								xParamAddApprovalMatrix
							);
							// console.log(
							// 	`>>> xApprovalMatrixResult: ${JSON.stringify(
							// 	xApprovalMatrixResult
							// 	)}`
							// );
							if (xApprovalMatrixResult.status_code == "00") {
								if (xApprovalMatrixResult.approvers.length > 0) {
									let xApproverSeq1 = xApprovalMatrixResult.approvers.find((el) => el.sequence == 1);
									if (xApproverSeq1 != null) {
										for (var i in xApproverSeq1.approver_user) {
											// Email Notification
											let xParamEmailNotification,
												xNotificationResult = {};

											if (xApproverSeq1.approver_user[i].notification_via_email) {
												const businessEntity = ['UD', 'CV', 'PT', 'Lain-lain']
												const companyScale = ['Kecil', 'Menengah', 'Besar']
												let finance = null
												let profile = null
												let npwp = null
												if (xRegistrationDetail.data.vendor_finance != null && xRegistrationDetail.data.vendor_finance.length > 0) {
													finance = {
														name: xRegistrationDetail.data.vendor_finance[0].name,
														phone: xRegistrationDetail.data.vendor_finance[0].phone,
													}
												}
												if (xRegistrationDetail.data.vendor_contact != null && xRegistrationDetail.data.vendor_contact.length > 0) {
													profile = {
														phone1: xRegistrationDetail.data.vendor_contact[0].phone,
														phone2: null,
													}
													if (xRegistrationDetail.data.vendor_contact.length > 1) {
														profile.phone2 = xRegistrationDetail.data.vendor_contact[1].phone
													}
												}
												if (xRegistrationDetail.data.vendor_document != null && xRegistrationDetail.data.vendor_document.length > 0) {
													const xDoc = xRegistrationDetail.data.vendor_document.find(
														({document_name, is_have, description}) => document_name == 'NPWP' && is_have && description != null && description != ''
													)
													
													if (xDoc != undefined) {
														npwp = {
															doc_no: xDoc.description,
															file: xDoc.file
														}
													}
												}

												xParamEmailNotification = {
													id: xEncId,
													request_no: xRegistrationDetail.data.request_no,
													email: xRegistrationDetail.data.created_by_email,
													company_name: xRegistrationDetail.data.created_by_company_name,
													department_name: xRegistrationDetail.data.created_by_department_name,
													created_by: xRegistrationDetail.data.created_by_name.toUpperCase(),
													created_at:
														xRegistrationDetail.data.createdAt != null
															? moment(xRegistrationDetail.data.createdAt).format('DD MMM YYYY')
															: '',
													vendor_name: xRegistrationDetail.data.name,
													npwp: npwp != null ? npwp.doc_no : null,
													npwp_link: npwp != null ? `${config.imagePathESanQua}/eprocurement/vendor_regist/${npwp.file}` : null,
													vendor_email: xRegistrationDetail.data.email,
													phone1: profile != null ? profile.phone1 : null,
													phone2: profile != null ? profile.phone2 : null,
													business_entity: xRegistrationDetail.data.business_entity != null ? businessEntity[Number(xRegistrationDetail.data.business_entity)-1] : null,
													company_scale: xRegistrationDetail.data.company_scale != null ? companyScale[Number(xRegistrationDetail.data.company_scale)-1] : null,
													address: xRegistrationDetail.data.address,
													province: xRegistrationDetail.data.province != null ? xRegistrationDetail.data.province.name : null,
													city: xRegistrationDetail.data.city != null ? xRegistrationDetail.data.city.name : null,
													post_code: xRegistrationDetail.data.post_code,
													classification: xRegistrationDetail.data.classification != null ? xRegistrationDetail.data.classification.name : null,
													sub_classification: xRegistrationDetail.data.sub_classification != null ? xRegistrationDetail.data.sub_classification.name : null,
													finance_name: finance != null ? finance.name : null,
													finance_phone: finance != null ? finance.phone : null,
													approver_user: {
														employee_name: xApproverSeq1.approver_user[i].user_name,
														email: xApproverSeq1.approver_user[i].email,
														cc: config.notification.vendor_registration.cc
													}
												};
												xNotificationResult = await _notificationService.sendNotificationEmail_VendorRegistration(
													xParamEmailNotification,
													pParam.method,
													pParam.token
												);
											}
										}
									}

									// update approver id to document
									let xArrApprover = [];
									for ( let i = 0; i < xApprovalMatrixResult.approvers.length; i++) {
										for (let j = 0; j < xApprovalMatrixResult.approvers[i].approver_user.length; j++) {
											xArrApprover.push(
												Number(xApprovalMatrixResult.approvers[i].approver_user[j].employee_id)
											);
										}
									}

									let xParamUpdateApproverId = {
										id: xRegistrationDetail.data.id,
										approver_ids: xArrApprover,
									};

									let xResultUpdateApproverId = await _repoInstance.save( xParamUpdateApproverId, "update" );
									if (xResultUpdateApproverId.status_code == "00") {
									//   let xParamDetailUpdate = {
									//     id: pParam.id,
									//     // request_no: xReqNo,
									//     status_request: xStatusDocument,
									//     submitedAt: await _utilInstance.getCurrDateTime(),
									//   };
									//   let xResultDetailUpdate = await _documentDetailRepo.save(
									//     xParamDetailUpdate,
									//     "update_from_header"
									//   );
									}
								}
								xJoResult = xUpdateResult;
								xJoResult.approval_matrix_result = xApprovalMatrixResult;
							} else {
								xParamUpdate.id = xRegistrationDetail.data.id;
								xParamUpdate.status = 0;
								xParamUpdate.submitedAt = null;
								xParamUpdate.submited_by = null;
								xParamUpdate.submited_by_name = null;

								await _repoInstance.save(xParamUpdate, "update");
								xJoResult = xApprovalMatrixResult;
							}
						} else {
							xJoResult = xUpdateResult;
						}
					}
				} else {
					xJoResult = {
						status_code: "-99",
						status_msg: "Document not found",
					};
				}
			}
		} catch (e) {
			xJoResult = {
				status_code: "-99",
				status_msg: `Exception error <${_xClassName}.submit>: ${e.message}`,
			};
		}

		return xJoResult;
	}

	async take(pParam) {
		return this._changeStatus(pParam, 2, 'take', {
			from: [1]
		});
	}

	async done(pParam) {
		
		var xJoResult = {};
		var xDecId = null;
		var xFlagProcess = false;
		var xEncId = "";
		var xClearId = "";
		try {
			if (pParam.id != "" && pParam.user_id != "") {
				xDecId = await _utilInstance.decrypt(
					pParam.id,
					config.cryptoKey.hashKey
				);
				if (xDecId.status_code == "00") {
					xFlagProcess = true;
					xEncId = pParam.id;
					pParam.id = xDecId.decrypted;
					xClearId = xDecId.decrypted;
					xDecId = await _utilInstance.decrypt(
						pParam.user_id,
						config.cryptoKey.hashKey
					);
					if (xDecId.status_code == "00") {
						xEncId = pParam.user_id;
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
				// Get Detail Document
				var xRegistrationDetail = await _repoInstance.getById({ id: xClearId });

				if (
					xRegistrationDetail !== null &&
					xRegistrationDetail.status_code == "00"
				) {
					if (xRegistrationDetail.data.status != 2) {
						//xRegistrationDetail.status != 0) {
						xJoResult = {
							status_code: "-99",
							status_msg:
								"You can not take this document. Please check again.",
						};
					} else {
						let xParamUpdate = {
							id: xRegistrationDetail.data.id,
							status: 3,
							user_id: pParam.user_id,
							user_name: pParam.user_name,
							code: pParam.code,
						};

						var xUpdateResult = await _repoInstance.save(xParamUpdate, "update");
					
						if (xUpdateResult.status_code == "00") {
							let xAddPayload = {
								act: 'add',
								user_id: xEncId,
								user_name: pParam.user_name,
								name: xRegistrationDetail.data.name.toUpperCase(),
								code: pParam.code.toUpperCase(),
								logo: xRegistrationDetail.data.logo,
								npwp: null,
								business_entity_id:  xRegistrationDetail.data.business_entity,
								classification_id:  xRegistrationDetail.data.classification_id,
								sub_classification_id:  xRegistrationDetail.data.sub_classification_id,
								province_id:  xRegistrationDetail.data.province_id,
								city_id:  xRegistrationDetail.data.city_id,
								address:  xRegistrationDetail.data.address,
								zip_code:  xRegistrationDetail.data.zip_code,
								phone1:  null,
								phone2: null,
								email: xRegistrationDetail.data.email,
								website: xRegistrationDetail.data.website,
								about: xRegistrationDetail.data.about,
								location_lat: xRegistrationDetail.data.lat,
								location_long: xRegistrationDetail.data.lng,
								company_scale: xRegistrationDetail.data.company_scale,
								register_via: 1
							}
							if (xRegistrationDetail.data.vendor_contact != null && xRegistrationDetail.data.vendor_contact.length > 0) {
								for (let i = 0; i < xRegistrationDetail.data.vendor_contact.length; i++) {
									if (xRegistrationDetail.data.vendor_contact[i].phone != null && xRegistrationDetail.data.vendor_contact[i].phone != '') {
										if (i == 0) {
											xAddPayload.phone1 = xRegistrationDetail.data.vendor_contact[i].phone
										} else if (i == 1) {
											xAddPayload.phone2 = xRegistrationDetail.data.vendor_contact[i].phone
										}
									}	
								}
							}
							let npwp = null 
							if (xRegistrationDetail.data.vendor_document != null && xRegistrationDetail.data.vendor_document.length > 0) {
								const xDoc = xRegistrationDetail.data.vendor_document.find(
									({document_name, is_have, description}) => document_name == 'NPWP' && is_have && description != null && description != ''
								)
								
								if (xDoc != undefined) {
									npwp = {
										doc_no: xDoc.description,
										file: xDoc.file
									}
									xAddPayload.npwp = xDoc.description
								}
							}
							
							let xAddVendorResult = await _vendorServiceInstance.save(xAddPayload)
							if (xAddVendorResult.status_code == "00") {
								let xParamUpdateVendorDoc = {
									vendor_id: xAddVendorResult.created_id,
									user_id: xEncId,
									user_name: pParam.user_name,
									document_no: npwp != null ? npwp.doc_no : null,
									file: npwp != null ? npwp.file : null,
									document_type_id: 2,

								}
								let xUpdateVendorDoc = await _vendorServiceInstance.saveVendorDocument(xParamUpdateVendorDoc)
								xJoResult = xUpdateVendorDoc
								
								// Email Notification To Bu Ipah
								let xParamEmailNotification,
									xNotificationResult = {};
								const businessEntity = ['UD', 'CV', 'PT', 'Lain-lain']
								const companyScale = ['Kecil', 'Menengah', 'Besar']
								let finance = null
								let profile = null
								if (xRegistrationDetail.data.vendor_finance != null && xRegistrationDetail.data.vendor_finance.length > 0) {
									finance = {
										name: xRegistrationDetail.data.vendor_finance[0].name,
										phone: xRegistrationDetail.data.vendor_finance[0].phone,
									}
								}
								if (xRegistrationDetail.data.vendor_contact != null && xRegistrationDetail.data.vendor_contact.length > 0) {
									profile = {
										phone1: xRegistrationDetail.data.vendor_contact[0].phone,
										phone2: null,
									}
									if (xRegistrationDetail.data.vendor_contact.length > 1) {
										profile.phone2 = xRegistrationDetail.data.vendor_contact[1].phone
									}
								}

								xParamEmailNotification = {
									id: xEncId,
									request_no: xRegistrationDetail.data.request_no,
									email: xRegistrationDetail.data.created_by_email,
									company_name: xRegistrationDetail.data.created_by_company_name,
									department_name: xRegistrationDetail.data.created_by_department_name,
									created_by: xRegistrationDetail.data.created_by_name.toUpperCase(),
									created_at:
										xRegistrationDetail.data.createdAt != null
											? moment(xRegistrationDetail.data.createdAt).format('DD MMM YYYY')
											: '',
									vendor_name: xRegistrationDetail.data.name,
									vendor_code: xRegistrationDetail.data.code,
									npwp: npwp != null ? npwp.doc_no : null,
									npwp_link: npwp != null ? `${config.imagePathESanQua}/eprocurement/vendor_regist/${npwp.file}` : null,
									vendor_email: xRegistrationDetail.data.email,
									phone1: profile != null ? profile.phone1 : null,
									phone2: profile != null ? profile.phone2 : null,
									business_entity: xRegistrationDetail.data.business_entity != null ? businessEntity[Number(xRegistrationDetail.data.business_entity)-1] : null,
									company_scale: xRegistrationDetail.data.company_scale != null ? companyScale[Number(xRegistrationDetail.data.company_scale)-1] : null,
									address: xRegistrationDetail.data.address,
									province: xRegistrationDetail.data.province != null ? xRegistrationDetail.data.province.name : null,
									city: xRegistrationDetail.data.city != null ? xRegistrationDetail.data.city.name : null,
									post_code: xRegistrationDetail.data.post_code,
									classification: xRegistrationDetail.data.classification != null ? xRegistrationDetail.data.classification.name : null,
									sub_classification: xRegistrationDetail.data.sub_classification != null ? xRegistrationDetail.data.sub_classification.name : null,
									finance_name: finance != null ? finance.name : null,
									finance_phone: finance != null ? finance.phone : null,
									approver_user: {
										employee_name: config.notification.vendor_registration.to_name,
										email: config.notification.vendor_registration.to,
										cc: config.notification.vendor_registration.cc
									}
								};
								xNotificationResult = await _notificationService.sendNotificationEmail_VendorRegistration(
									xParamEmailNotification,
									pParam.method,
									pParam.token
								);
							} else {
								let xParamUpdate = {
									id: xRegistrationDetail.data.id,
									status: 2,
									user_id: pParam.user_id,
									user_name: pParam.user_name,
									code: null,
								};

								var xUpdateResult = await _repoInstance.save(xParamUpdate, "update");
								xJoResult = xAddVendorResult
							}
						} else {
							xJoResult = xUpdateResult;
						}
					}
				} else {
					xJoResult = {
						status_code: "-99",
						status_msg: "Document not found",
					};
				}
			}
		} catch (e) {
			xJoResult = {
				status_code: "-99",
				status_msg: `Exception error <${_xClassName}.done>: ${e.message}`,
			};
		}

		return xJoResult;
	}

	async cancel(pParam) {
		return this._changeStatus(pParam, 4, 'cancel', {
			notFrom: [3]
		});
	}

	async setDraft(pParam) {
		return this._changeStatus(pParam, 0, 'setDraft', {
			from: [4]
		});
	}

	async _changeStatus(pParam, newStatus, actionName, opts = {}) {
		let xJoResult = {};
		try {
			const decId = await _utilInstance.decrypt(pParam.id, config.cryptoKey.hashKey);
			if (decId.status_code !== '00') return decId;
			pParam.id = decId.decrypted;

			const decUser = await _utilInstance.decrypt(pParam.user_id, config.cryptoKey.hashKey);
			if (decUser.status_code !== '00') return decUser;
			pParam.user_id = decUser.decrypted;

			const xData = await _repoInstance.getById({ id: pParam.id });
			if (xData.status_code != '00') {
				return xData
			}

			const currentStatus = xData.data.status;
			if (currentStatus === newStatus) {
				return {
					status_code: '-99',
					status_msg: `Data already in status: ${actionName}`
				};
			}

			if (opts.from && !opts.from.includes(currentStatus)) {
				const status = config.statusDescription.vendorRegistration;
				return {
					status_code: '-99',
					status_msg: `Tidak dapat ${actionName}, statu harus di saat: ${opts.from.join(', ')}`
				};
			}

			if (opts.notFrom && opts.notFrom.includes(currentStatus)) {
				return {
					status_code: '-99',
					status_msg: `Tidak dapat ${actionName} dari status ini`
				};
			}

			// console.log(`>>> pParam.logged_is_admin: ${JSON.stringify(pParam.logged_is_admin)}`);
			if (!pParam.logged_is_admin) {
				if (opts.onlyCreator && xData.created_by !== pParam.user_id) {
					return {
						status_code: '-99',
						status_msg: `Hanya admin / pembuat dokumen yang bisa ${actionName}`
					};
				}
			}

			const upd = {
				status: newStatus,
				updated_by: pParam.user_id,
				updated_by_name: pParam.user_name,
				updatedAt: await _utilInstance.getCurrDateTime()
			};

			await _repoInstance.save({ id: pParam.id, ...upd }, 'update');

			xJoResult = {
				status_code: '00',
				status_msg: `Successfully ${actionName}`
			};
		} catch (e) {
			_utilInstance.writeLog(`${_xClassName}.${actionName}`, `Exception error: ${e.message}`, 'error');
			xJoResult = {
				status_code: '-99',
				status_msg: `${_xClassName}.${actionName}: Exception error: ${e.message}`
			};
		}
		return xJoResult;
	}

	async fetchMatrix(pParam) {
		var xJoResult = {};
		var xDecId = null;
		var xFlagProcess = false;
		var xEncId = "";
		var xClearId = "";

		if (pParam.id != "" && pParam.user_id != "") {
			xDecId = await _utilInstance.decrypt(pParam.id, config.cryptoKey.hashKey);
			if (xDecId.status_code == "00") {
				xFlagProcess = true;
				xEncId = pParam.id;
				pParam.id = xDecId.decrypted;
				xClearId = xDecId.decrypted;
				xDecId = await _utilInstance.decrypt(
				pParam.user_id,
				config.cryptoKey.hashKey
				);
				if (xDecId.status_code == "00") {
				pParam.user_id = xDecId.decrypted;
				xFlagProcess = true;
				} else {
				xJoResult = xDecId;
				}
			} else {
				xJoResult = xDecId;
			}
		} else {
			xJoResult = {
				status_code: "-99",
				status_msg: "Invalid ID / User ID",
			};
		}

		if (xFlagProcess) {
			// Get Detail
			var xDetailDoc = await _repoInstance.getById({ id: xClearId });
			// console.log(`>>> xDetailDoc : ${JSON.stringify(xDetailDoc)}`);
			if (xDetailDoc != null && xDetailDoc.status_code == "00") {
				if (xDetailDoc.data.status != 1) {
					xJoResult = {
						status_code: "-99",
						status_msg: "Fetch matrix cannot be processed, please check again",
					};
				} else {
					pParam.approved_at = null;
					const xUpdateParam = {
						id: xClearId,
						approved_at: null,
						user_id: pParam.user_id,
						user_name: pParam.user_name,
					};
					var xUpdateResult = await _repoInstance.save(xUpdateParam, "update");
					xJoResult = xUpdateResult;
					// Next Phase : Approval Matrix & Notification to admin
					if (xUpdateResult.status_code == "00") {
						// Fetch Approval Matrix
						var xParamAddApprovalMatrix = {
							act: "fetch_matrix",
							document_id: xEncId,
							document_no: xDetailDoc.data.request_no,
							application_id: config.applicationId,
							table_name: config.dbTables.vendor_registration,
							company_id: xDetailDoc.data.created_by_company_id,
							// department_id: xDetailDoc.data.department_id,
							// ecatalogue_fpb_category_item: null,
							// logged_company_id: pParam.logged_company_id,
							approval_matrix_id: pParam.approval_matrix_id,
						};
						// if (xDetailDoc.company_id == 5 && xDetailDoc.company_id == 14) {
						//     xParamAddApprovalMatrix.ecatalogue_fpb_category_item = xDetailDoc.category_item
						// } else {
						//     xParamAddApprovalMatrix.ecatalogue_fpb_category_item = xDetailDoc.category_item >= 7 ? xDetailDoc.category_item : null
						// }
						// console.log(`>>> xParamAddApprovalMatrix : ${JSON.stringify(xParamAddApprovalMatrix)}`);

						var xApprovalMatrixResult = await _oAuthService.addApprovalMatrix(pParam.method, pParam.token, xParamAddApprovalMatrix);
						xJoResult.approval_matrix_result = xApprovalMatrixResult;
						// console.log(
						// 	`>>> xApprovalMatrixResult : ${JSON.stringify(
						// 		xApprovalMatrixResult
						// 	)}`
						// );

						if (xApprovalMatrixResult.status_code == "00") {
							if (xApprovalMatrixResult.approvers.length > 0) {
								let xArrApprover = [];
								for ( let i = 0; i < xApprovalMatrixResult.approvers.length; i++ ) {
									for ( let j = 0; j < xApprovalMatrixResult.approvers[i].approver_user.length; j++ ) {
										xArrApprover.push(
											Number(xApprovalMatrixResult.approvers[i].approver_user[j].employee_id)
										);
									}
								}	

								let xParamUpdateApproverId = {
									id: xDetailDoc.data.id,
									approver_ids: xArrApprover,
								};

								let xResultUpdateApproverId = await _repoInstance.save(xParamUpdateApproverId, "update");

								xJoResult = xUpdateResult;
								xJoResult.approval_matrix_result = xApprovalMatrixResult;
							}
						}
					} else {
						xJoResult = xUpdateResult;
					}
				}
			} else {
				xJoResult = {
				status_code: "-99",
				status_msg: "Data not found. Please supply valid identifier",
				};
			}
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
			var xDetailData = await _repoInstance.getById({ id: pParam.document_id });
			if (xDetailData.data != null) {
				if (xDetailData.data.status != 1) {
					xJoResult = {
						status_code: '-99',
						status_msg: 'This document already confirmed before.'
					};
				} else {
					var xParamApprovalMatrixDocument = {
						document_id: xEncId,
						status: 1,
						application_id: config.applicationId,
						table_name: config.dbTables.vendor_registration,
						note: pParam.note,
					};

					var xResultApprovalMatrixDocument =
					await _oAuthService.confirmApprovalMatrix(
						pParam.method,
						pParam.token,
						xParamApprovalMatrixDocument
					);
					// console.log(`>>> xResultApprovalMatrixDocument : ${JSON.stringify(xResultApprovalMatrixDocument)}`);

					if (xResultApprovalMatrixDocument != null) {
						if (xResultApprovalMatrixDocument.status_code == "00") {
							if ( xResultApprovalMatrixDocument.status_document_approved == true ) {
								var xParamUpdatePR = {
									id: pParam.document_id,
									status: 2
								};
								var xUpdateResult = await _repoInstance.save(xParamUpdatePR, 'update');
			
								if (xUpdateResult.status_code == '00') {
									xJoResult = {
										status_code: '00',
										status_msg: 'Document successfully approved'
									};
								} else {
									xJoResult = xUpdateResult;
								}
							} else {
								// Sort first
								xResultApprovalMatrixDocument.approvers = xResultApprovalMatrixDocument.approvers.sort((a, b) => {
									if (a.sequence < b.sequence) {
										return -1;
									}
								});

								// Send to next approver...
								let xNextApprover = xResultApprovalMatrixDocument.approvers[0].approver_user;
								// console.log(`>>> xNextApprover : ${JSON.stringify(xNextApprover)}`);
								if (xNextApprover != null) {
									for (var i in xNextApprover) {
										// Email Notification
										let xParamEmailNotification,
											xNotificationResult = {};

										if (xNextApprover[i].notification_via_email) {
											xParamEmailNotification = {
												id: xEncId,
												request_no: xDetailData.data.request_no,
												email: xDetailData.data.created_by_email,
												company_name: xDetailData.data.created_by_company_name,
												department_name: xDetailData.data.created_by_department_name,
												created_by: xDetailData.data.created_by_name.toUpperCase(),
												created_at:
													xDetailData.data.createdAt != null
														? moment(xDetailData.data.createdAt).format('DD MMM YYYY')
														: '',
												approver_user: {
													employee_name: xNextApprover[i].user_name,
													email: xNextApprover[i].email,
													cc: config.notification.vendor_registration.cc
													// note: xNextApprover[i].note
												}
											};
											xNotificationResult = await _notificationService.sendNotificationEmail_VendorRegistration(
												xParamEmailNotification,
												pParam.method,
												pParam.token
											);

										}
									}
								}
								
			
								xJoResult = {
									status_code: "00",
									status_msg:
										"Document successfully approved. Document available for next approver",
									result_approval_matrix: xResultApprovalMatrixDocument,
								};
							}
						} else {
							xJoResult = xResultApprovalMatrixDocument;
						}
					} else {
						xJoResult = {
							status_code: "-99",
							status_msg:
							"There is problem on approval matrix processing. Please try again",
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
			var xDetailData = await _repoInstance.getById({ id: pParam.document_id });
			if (xDetailData.data != null) {
				if (xDetailData.data.status != 1) {
					xJoResult = {
						status_code: '-99',
						status_msg: 'Cannot reject, document already in process'
					};
				} else {
					var xParamApprovalMatrixDocument = {
						document_id: xEncId,
						status: -1,
						application_id: config.applicationId,
						table_name: config.dbTables.vendor_registration,
						note: pParam.reject_reason,
					};
					var xResultApprovalMatrixDocument =
					await _oAuthService.confirmApprovalMatrix(
						pParam.method,
						pParam.token,
						xParamApprovalMatrixDocument
					);

					if (xResultApprovalMatrixDocument != null) {
						if (xResultApprovalMatrixDocument.status_code == "00") {
							var xParamUpdatePR = {
								id: pParam.document_id,
								status: 5,
								// reject_reason: pParam.reject_reason
							};
							var xUpdateResult = await _repoInstance.save(xParamUpdatePR, 'update');

							if (xUpdateResult.status_code == '00') {
								xJoResult = {
									status_code: '00',
									status_msg: 'Document successfully rejected'
								};
							} else {
								xJoResult = xUpdateResult;
							}
						} else {
							xJoResult = xResultApprovalMatrixDocument;
						}
					} else {
						xJoResult = {
						status_code: "-99",
						status_msg:
							"There is problem on approval matrix processing. Please try again",
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
}

module.exports = VendorRegistrationService;
