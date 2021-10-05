const jwt = require('jsonwebtoken');
const md5 = require('md5');
const crypto = require('crypto');
const moment = require('moment');
const sequelize = require('sequelize');
const dateFormat = require('dateformat');
const Op = sequelize.Op;
const bcrypt = require('bcrypt');
const fs = require('fs');

//test 123  123

const env = process.env.NODE_ENV || 'localhost';
const config = require(__dirname + '/../config/config.json')[env];

// Utility
const Utility = require('peters-globallib-v2');
const _utilInstance = new Utility();

const GlobalUtility = require('../utils/globalutility.js');
const _globalUtilInstance = new GlobalUtility();

// Repository
const ProcurementRepository = require('../repository/procurementrepository.js');
const _repoInstance = new ProcurementRepository();

// OAuth Service
const OAuthService = require('../services/oauthservice.js');
const _oAuthService = new OAuthService();

// Procurement Item Service
const ProcurementItemRepo = require('../repository/procurementitemrepository.js');
const _procItemRepoInstance = new ProcurementItemRepo();

// Notification Service
const NotificationService = require('../services/notificationservice.js');
const _notificationServiceInstance = new NotificationService();

// Procurement Service
const ProcurementVendorService = require('../services/procurementvendorservice.js');
const _procurementVendorServiceInstance = new ProcurementVendorService();

// Procurement Quotation Item Service
// const ProcurementQuotationItemService = require('../services/procurementquotationitemservice.js');
// const _procurementQuotationItemServiceInstance = new ProcurementQuotationItemService();

class ProcurementService {
    constructor() { }

    async list(pParam) {
        var xJoResult = {};
        var xJoArrData = [];
        var xFlagProcess = true;

        var xResultList = await _repoInstance.list(pParam);

        if (xResultList.count > 0) {
            var xRows = xResultList.rows;
            for (var index in xRows) {
                xJoArrData.push({
                    id: await _utilInstance.encrypt((xRows[index].id).toString(), config.cryptoKey.hashKey),
                    procurement_no: xRows[index].procurement_no,
                    name: xRows[index].name,
                    year: xRows[index].year,
                    total_hps: xRows[index].total_hps,
                    file: xRows[index].file,
                    price_on_market: xRows[index].price_on_market,
                    period_start: xRows[index].period_start,
                    period_end: xRows[index].period_end,
                    total_working_days: xRows[index].total_working_days,
                    validity_period_offer: xRows[index].validity_period_offer,
                    sub_total: xRows[index].sub_total,
                    ppn: xRows[index].ppn,
                    grand_total: xRows[index].grand_total,
                    status: {
                        id: xRows[index].status,
                        name: (xRows[index].status == 1 ? 'Active' : (xRows[index].status == 0 ? 'Inactive' : (xRows[index].status == -1 ? 'Cancel' : '')))
                    },
                    status_approval: {
                        id: xRows[index].status_approval,
                        name: (xRows[index].status_approval == 1 ? 'To Approve' : (xRows[index].status_approval == 0 ? 'Draft' : (xRows[index].status_approval == 2 ? 'Approved' : 'Reject')))
                    },

                    company: {
                        id: xRows[index].company_id,
                        name: xRows[index].company_name,
                    },

                    department: {
                        id: xRows[index].department_id,
                        name: xRows[index].department_name,
                    },

                    created_at: moment(xRows[index].createdAt).format('YYYY-mm-dd H:i:s'),
                    created_by_name: xRows[index].created_by_name,
                });
            }
            xJoResult = {
                status_code: '00',
                status_msg: 'OK',
                total_record: xResultList.count,
                data: xJoArrData,
            }
        } else {
            xJoResult = {
                status_code: "-99",
                status_msg: "Data not found",
            };
        }

        return xJoResult;
    }

    async getById(pParam) {
        var xJoResult = {};
        var xJoData = {};
        var xFlagProcess = true;
        var xEncId = '';

        if (pParam.hasOwnProperty('id')) {
            if (pParam.id != '') {
                xEncId = pParam.id;
                var xDecId = await _utilInstance.decrypt(pParam.id, config.cryptoKey.hashKey);
                if (xDecId.status_code == '00') {
                    pParam.id = xDecId.decrypted;
                } else {
                    xFlagProcess = false;
                    xJoResult = xDecId;
                }
            }
        }

        if (xFlagProcess) {

            var xResult = await _repoInstance.getById(pParam);

            if (xResult != null) {

                // Get Approval matrix
                var xParamApprovalMatrix = {
                    application_id: config.applicationId,
                    table_name: config.dbTables.procurement,
                    document_id: xEncId,
                };
                var xResultApprovalMatrix = await _oAuthService.getApprovalMatrix(pParam.method, pParam.token, xParamApprovalMatrix);
                console.log(">>> xResultApprovalMatrix : " + JSON.stringify(xResultApprovalMatrix));

                xJoData = {
                    id: await _utilInstance.encrypt((xResult.id).toString(), config.cryptoKey.hashKey),
                    procurement_no: xResult.procurement_no,
                    name: xResult.name,
                    year: xResult.year,
                    total_hps: xResult.total_hps,
                    file: xResult.file,
                    price_on_market: xResult.price_on_market,
                    period_start: xResult.period_start,
                    period_end: xResult.period_end,
                    total_working_days: xResult.total_working_days,
                    validity_period_offer: xResult.validity_period_offer,
                    sub_total: xResult.sub_total,
                    ppn: xResult.ppn,
                    grand_total: xResult.grand_total,
                    business_fields: xResult.business_fields,
                    qualification_requirements: xResult.qualification_requirements,
                    status: {
                        id: xResult.status,
                        name: (xResult.status == 1 ? 'Active' : (xResult.status == 0 ? 'Inactive' : (xResult.status == -1 ? 'Cancel' : '')))
                    },
                    status_approval: {
                        id: xResult.status_approval,
                        name: (xResult.status_approval == 1 ? 'To Approve' : (xResult.status_approval == 0 ? 'Draft' : (xResult.status_approval == 2 ? 'Approved' : 'Rejected')))
                    },

                    company: {
                        id: xResult.company_id,
                        name: xResult.company_name,
                    },

                    department: {
                        id: xResult.department_id,
                        name: xResult.department_name,
                    },

                    item: xResult.procurement_item,
                    schedule: xResult.procurement_schedule,
                    term: xResult.procurement_term,

                    approval_matrix: ((xResultApprovalMatrix.status_code == '00' && xResultApprovalMatrix.token_data.status_code == '00') ? xResultApprovalMatrix.token_data.data : null),

                    created_at: moment(xResult.createdAt).format('YYYY-mm-dd H:i:s'),
                    created_by_name: xResult.created_by_name,
                };

                xJoResult = {
                    status_code: '00',
                    status_msg: 'OK',
                    data: xJoData,
                }
            } else {
                xJoResult = {
                    status_code: "-99",
                    status_msg: "Data not found",
                };
            }

        }

        return xJoResult;
    }

    async save(pParam) {
        var xJoResult;
        var xAct = pParam.act;
        var xFlagProcess = true;

        delete pParam.act;

        if (xFlagProcess) {

            if (xAct == "add") {

                // User Id
                var xDecId = await _utilInstance.decrypt(pParam.user_id, config.cryptoKey.hashKey);
                pParam.created_by = xDecId.decrypted;
                pParam.created_by_name = pParam.user_name;

                var xAddResult = await _repoInstance.save(pParam, xAct);

                if (xAddResult.created_id != null && xAddResult.created_id != '') {
                    // Generate Procurement No
                    var xProcNo = await _globalUtilInstance.generateProcurementNo(xAddResult.clear_id, pParam.company_code);
                    var xParamUpdate = {
                        procurement_no: xProcNo,
                        id: xAddResult.clear_id,
                    };
                    var xUpdate = await _repoInstance.save(xParamUpdate, 'update');
                    delete xAddResult.clear_id;
                    xJoResult = xAddResult;

                    // Add approval matrix
                    var xParamAddApprovalMatrix = {
                        act: 'add',
                        document_id: xAddResult.created_id,
                        document_no: xProcNo,
                        application_id: config.applicationId,
                        table_name: config.dbTables.procurement,
                        company_id: pParam.company_id,
                        company_name: pParam.company_name,
                        department_id: pParam.department_id,
                        department_name: pParam.department_name,
                    };
                    // console.log(">>> Param Approval Matrix : " + JSON.stringify(xParamAddApprovalMatrix));
                    var xApprovalMatrixResult = await _oAuthService.addApprovalMatrix(pParam.method, pParam.token, xParamAddApprovalMatrix);
                    xJoResult.approval_matrix_result = xApprovalMatrixResult;

                }

            } else if (xAct == "update") {

                var xDecId = await _utilInstance.decrypt(pParam.id, config.cryptoKey.hashKey);
                if (xDecId.status_code == "00") {
                    pParam.id = xDecId.decrypted;
                    xDecId = await _utilInstance.decrypt(pParam.user_id, config.cryptoKey.hashKey);
                    if (xDecId.status_code == "00") {
                        pParam.updated_by = xDecId.decrypted;
                        pParam.updated_by_name = pParam.user_name;
                    } else {
                        xFlagProcess = false;
                        xJoResult = xDecId;
                    }
                } else {
                    xFlagProcess = false;
                    xJoResult = xDecId;
                }

                if (xFlagProcess) {
                    var xAddResult = await _repoInstance.save(pParam, xAct);
                    xJoResult = xAddResult;
                }

            }

        }

        return xJoResult;
    }

    async archive(pParam) {
        var xJoResult;
        var xFlagProcess = true;

        var xDecId = await _utilInstance.decrypt(pParam.id, config.cryptoKey.hashKey);
        if (xDecId.status_code == "00") {
            pParam.id = xDecId.decrypted;
            xDecId = await _utilInstance.decrypt(pParam.user_id, config.cryptoKey.hashKey);
            if (xDecId.status_code == "00") {
                pParam.is_delete = 1;
                pParam.deleted_by = xDecId.decrypted;
                pParam.deleted_by_name = pParam.user_name;
            } else {
                xFlagProcess = false;
                xJoResult = xDecId;
            }
        } else {
            xFlagProcess = false;
            xJoResult = xDecId;
        }

        if (xFlagProcess) {

            var xDeleteResult = await _repoInstance.archive(pParam);
            xJoResult = xDeleteResult;

        }

        return xJoResult;
    }

    async unarchive(pParam) {
        var xJoResult;
        var xFlagProcess = true;

        var xDecId = await _utilInstance.decrypt(pParam.id, config.cryptoKey.hashKey);
        if (xDecId.status_code == "00") {
            pParam.id = xDecId.decrypted;
            xDecId = await _utilInstance.decrypt(pParam.user_id, config.cryptoKey.hashKey);
            if (xDecId.status_code == "00") {
                pParam.is_delete = 0;
                // pParam.deleted_by = xDecId.decrypted;
                // pParam.deleted_by_name = pParam.user_name;
            } else {
                xFlagProcess = false;
                xJoResult = xDecId;
            }
        } else {
            xFlagProcess = false;
            xJoResult = xDecId;
        }

        if (xFlagProcess) {

            var xDeleteResult = await _repoInstance.archive(pParam);
            xJoResult = xDeleteResult;

        }

        return xJoResult;
    }

    async delete(pParam) {
        var xJoResult;
        var xFlagProcess = true;

        var xDecId = await _utilInstance.decrypt(pParam.id, config.cryptoKey.hashKey);
        if (xDecId.status_code == "00") {
            pParam.id = xDecId.decrypted;
        } else {
            xFlagProcess = false;
            xJoResult = xDecId;
        }

        if (xFlagProcess) {

            // Check first if there are procurement item or not
            var xItem = await _procItemRepoInstance.list({ procurement_id: pParam.id });
            if (xItem == null) {
                var xDeleteResult = await _repoInstance.delete(pParam);
                xJoResult = xDeleteResult;
            } else {
                xJoResult = {
                    status_code: '00',
                    status_msg: 'Sory, you can not delete this data because it is already approved and has items inside'
                }
            }
        }

        return xJoResult;
    }

    async confirmProcurement(pParam) {
        var xJoResult;
        var xFlagProcess = true;
        var xResultUpdate = {};
        var xDecryptedDocumentId = 0;

        if (pParam.document_id != '' && pParam.status_approval != '') {
            var xParamApprovalMatrixDocument = {
                document_id: pParam.document_id,
                status: pParam.status_approval,
            };
            var xResultApprovalMatrixDocument = await _oAuthService.confirmApprovalMatrix(pParam.method, pParam.token, xParamApprovalMatrixDocument);

            if (xResultApprovalMatrixDocument != null) {
                if (xResultApprovalMatrixDocument.status_code == '00') {

                    var xDecId = await _utilInstance.decrypt(pParam.document_id, config.cryptoKey.hashKey);
                    if (xDecId.status_code == '00') {
                        pParam.id = xDecId.decrypted;
                        xDecryptedDocumentId = pParam.id;
                        delete pParam.document_id;
                    } else {
                        xFlagProcess = false;
                        xJoResult = xDecId;
                    }

                    if (xFlagProcess) {

                        if (xResultApprovalMatrixDocument.status_document_approved == true) {

                            delete pParam.user_id;
                            pParam.status_approval = 2;
                            xResultUpdate = await _repoInstance.save(pParam, 'update');
                            xJoResult = xResultApprovalMatrixDocument;

                        } else {

                            if (pParam.status_approval == -1) {
                                xResultUpdate = await _repoInstance.save(pParam, 'update');
                                xJoResult = xResultApprovalMatrixDocument;
                            } else {
                                xJoResult = xResultApprovalMatrixDocument;
                            }

                        }

                    } else {
                        xJoResult = xDecId;
                    }
                } else {
                    xJoResult = xResultApprovalMatrixDocument;
                }
            } else {
                xJoResult = {
                    status_code: '-99',
                    status_msg: 'There is problem on approval matrix processing. Please try again'
                }
            }
        }

        return xJoResult;
    }

    async submitToApprove(pParam) {
        var xJoResult = {};
        var xFlagProcess = false;

        if (pParam.hasOwnProperty('id')) {
            if (pParam.id != '') {
                var xDecId = await _utilInstance.decrypt(pParam.id, config.cryptoKey.hashKey);
                if (xDecId.status_code == '00') {
                    xFlagProcess = true;
                    pParam.id = xDecId.decrypted;
                    xDecId = await _utilInstance.decrypt(pParam.user_id, config.cryptoKey.hashKey);
                    if (xDecId.status_code == '00') {
                        xFlagProcess = true;
                        pParam.submit_at = await _utilInstance.getCurrDateTime();
                        pParam.submit_by = xDecId.decrypted;
                        pParam.submit_by_name = pParam.user_name;
                        pParam.status_approval = 1;
                    }
                } else {
                    xJoResult = xDecId;
                }
            }
        }

        if (xFlagProcess) {
            var xParamUpdate = pParam;
            var xUpdateResult = await _repoInstance.save(xParamUpdate, 'update');
            if (xUpdateResult.status_code == "00") {
                xJoResult = {
                    status_code: '00',
                    status_msg: 'Data successfully submited'
                }
            } else {
                xJoResult = xUpdateResult;
            }
        }

        return xJoResult;
    }

    async cancel(pParam) {
        var xJoResult = {};
        var xFlagProcess = false;
        var xEncId = '';

        if (pParam.hasOwnProperty('id')) {
            if (pParam.id != '') {
                var xDecId = await _utilInstance.decrypt(pParam.id, config.cryptoKey.hashKey);
                if (xDecId.status_code == '00') {
                    xFlagProcess = true;
                    xEncId = pParam.id;
                    pParam.id = xDecId.decrypted;
                    xDecId = await _utilInstance.decrypt(pParam.user_id, config.cryptoKey.hashKey);
                    if (xDecId.status_code == '00') {
                        xFlagProcess = true;
                        pParam.cancel_at = await _utilInstance.getCurrDateTime();
                        pParam.cancel_by = xDecId.decrypted;
                        pParam.cancel_by_name = pParam.user_name;
                        pParam.status_approval = -2;
                        pParam.status = -1;
                    }
                } else {
                    xJoResult = xDecId;
                }
            }
        }



        if (xFlagProcess) {
            var xParamUpdate = pParam;
            var xUpdateResult = await _repoInstance.save(xParamUpdate, 'update');
            if (xUpdateResult.status_code == "00") {

                // Get detail document                
                var xProcDetail = await _repoInstance.getById({ id: xUpdateResult.id });

                // Trigger fetch matrix
                var xParamFetchMatrix = {
                    act: 'fetch_matrix',
                    document_id: xEncId,
                    document_no: xProcDetail.procurement_no,
                    application_id: config.applicationId,
                    table_name: config.dbTables.procurement,
                };
                var xResultFetchMatrix = await _oAuthService.addApprovalMatrix(pParam.method, pParam.token, xParamFetchMatrix);

                xJoResult = {
                    status_code: '00',
                    status_msg: 'Data successfully canceled',
                    fetch_matrix_result: xResultFetchMatrix,
                }

            } else {
                xJoResult = xUpdateResult;
            }
        }

        return xJoResult;
    }

    async setToDraft(pParam) {
        var xJoResult = {};
        var xFlagProcess = false;

        if (pParam.hasOwnProperty('id')) {
            if (pParam.id != '') {
                var xDecId = await _utilInstance.decrypt(pParam.id, config.cryptoKey.hashKey);
                if (xDecId.status_code == '00') {
                    xFlagProcess = true;
                    pParam.id = xDecId.decrypted;
                    xDecId = await _utilInstance.decrypt(pParam.user_id, config.cryptoKey.hashKey);
                    if (xDecId.status_code == '00') {
                        xFlagProcess = true;
                        pParam.set_to_draft_at = await _utilInstance.getCurrDateTime();
                        pParam.set_to_draft_by = xDecId.decrypted;
                        pParam.set_to_draft_by_name = pParam.user_name;
                        pParam.status_approval = 0;
                        pParam.status = 1;
                    }
                } else {
                    xJoResult = xDecId;
                }
            }
        }

        if (xFlagProcess) {

            // Check whether the data already cancel or not
            var xProcDetail = await _repoInstance.getById({ id: pParam.id });
            if (xProcDetail.status == -1) {
                var xParamUpdate = pParam;
                var xUpdateResult = await _repoInstance.save(xParamUpdate, 'update');
                if (xUpdateResult.status_code == "00") {
                    xJoResult = {
                        status_code: '00',
                        status_msg: 'Data successfully set to draft'
                    }
                } else {
                    xJoResult = xUpdateResult;
                }
            } else {
                xJoResult = {
                    status_code: '-99',
                    status_msg: 'Data must cancel it first before set to draft.'
                }
            }


        }

        return xJoResult;
    }

    async inviteVendor(pParam) {

        var xJoResult = {};
        var xFlagProcess = false;
        var xDecId = null;
        var xParamAddToDB = {};
        var xEncProcurementId = "";

        // Get procurement detail
        if (pParam.hasOwnProperty('id')) {
            if (pParam.id != '') {
                xEncProcurementId = pParam.id;
                xDecId = await _utilInstance.decrypt(pParam.id, config.cryptoKey.hashKey);
                if (xDecId.status_code == '00') {
                    xFlagProcess = true;
                    pParam.id = xDecId.decrypted;
                } else {
                    xJoResult = xDecId;
                }
            } else {
                xJoResult = {
                    status_code: '-99',
                    status_msg: 'You need to supply correct id'
                }
            }
        }

        if (pParam.hasOwnProperty('user_id')) {
            if (pParam.user_id != '') {
                // User Id
                xDecId = await _utilInstance.decrypt(pParam.user_id, config.cryptoKey.hashKey);
                if (xDecId.status_code == '00') {
                    pParam.user_id = xDecId.decrypted;
                } else {
                    xFlagProcess = false;
                    xJoResult = xDecId;
                }
            }
        }

        if (xFlagProcess) {

            // Get Procurement Detail
            var xProcurementDetail = await _repoInstance.getById(pParam);
            xProcurementDetail.vendor = {
                name: pParam.vendor_name,
                email: pParam.email,
            }

            // Send Notification
            // xJoResult = await _notificationServiceInstance.sendNotification_AnnouncementNewProcurement( pParam.method, pParam.token, xProcurementDetail  );

            // Add vendor invited to database
            var xCheckExist = await _procurementVendorServiceInstance.getById({
                procurement_id: xEncProcurementId,
                vendor_id: pParam.vendor_id,
            });
            if (xCheckExist.status_code == '-99') {
                xParamAddToDB = {
                    act: 'add',
                    procurement_id: xEncProcurementId,
                    vendor_id: pParam.vendor_id,
                    invited_at: await _utilInstance.getCurrDateTime(),
                    invited_by: pParam.user_id,
                    invited_by_name: pParam.user_name,
                    invited_counter: 1,
                    created_by: pParam.user_id,
                    created_by_name: pParam.user_name,
                }
            } else {
                xParamAddToDB = {
                    act: 'update',
                    procurement_id: xEncProcurementId,
                    vendor_id: pParam.vendor_id,
                    invited_at: await _utilInstance.getCurrDateTime(),
                    invited_by: pParam.user_id,
                    invited_by_name: pParam.user_name,
                    invited_counter: sequelize.literal('invited_counter + 1'),
                }
            }

            console.log(">>> Param Add : " + JSON.stringify(xParamAddToDB));

            var xResultAddToDB = await _procurementVendorServiceInstance.save(xParamAddToDB);
            xJoResult.result_addto_db = xResultAddToDB;
        }

        return xJoResult;

    }
}

module.exports = ProcurementService;