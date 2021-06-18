const procurementController = require('../controllers').procurement;
const procurementItemController = require('../controllers').procurementItem;
const procurementScheduleController = require('../controllers').procurementSchedule;
const procurementTermController = require('../controllers').procurementTerm;
const procurementVendorController = require('../controllers').procurementVendor;

const { check, validationResult } = require('express-validator');

var rootAPIPath = '/api/procurement/v1/';

module.exports = (app) => {
    app.get(rootAPIPath, (req, res) => res.status(200).send({
        message: 'Welcome to the Todos API!',
    }));

    app.use(function(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, x-method, x-token, x-application-id");
        next();
    });

    var arrValidate = [];

    // *** PROCUREMENT ***
    // Save
    arrValidate = [];
    arrValidate = [
        check("act").not().isEmpty().withMessage("Parameter act cannot be empty"),
        check("name").not().isEmpty().withMessage("Parameter name cannot be empty"),
        check("year","Parameter year must be integer and cannot be empty").not().isEmpty().isInt(),
        check("total_hps","Parameter total_hps must be integer and cannot be empty").not().isEmpty().isInt(),
        check("period_start").not().isEmpty().withMessage("Parameter period_start cannot be empty"),
        check("period_end").not().isEmpty().withMessage("Parameter period_end cannot be empty"),
    ];
    app.post( rootAPIPath + 'save', arrValidate, procurementController.procurement_Save);

    // List
    arrValidate = [];
    arrValidate = [
        check("offset","Parameter offset must be integer and cannot be empty").not().isEmpty().isInt(),
        check("limit").not().isEmpty().withMessage("Parameter limit cannot be empty"),
    ];
    app.get( rootAPIPath + 'list', arrValidate, procurementController.procurement_List);

    // Get By Id
    arrValidate = [];
    arrValidate = [
        check("id").not().isEmpty().withMessage("Parameter id cannot be empty"),
    ];
    app.get( rootAPIPath + 'detail/:id', arrValidate, procurementController.procurement_GetById);

    // Delete
    arrValidate = [];
    arrValidate = [
        check("id").not().isEmpty().withMessage("Parameter id cannot be empty"),
    ];
    app.delete( rootAPIPath + 'delete/:id', procurementController.procurement_Delete );

    // Confirm process
    arrValidate = [];
    arrValidate = [
        check("document_id").not().isEmpty().withMessage("Parameter document_id can not be empty"),
        check("status_approval", "Parameter status_approval must be integer and can not be empty").not().isEmpty().isInt(),
        // check("company_id").not().isEmpty().withMessage("Parameter company_id can not be empty"),
        // check("department_id").not().isEmpty().withMessage("Parameter department_id can not be empty"),
    ];
    app.post( rootAPIPath + 'confirm', arrValidate, procurementController.procurement_Confirm );

    // Submit to approve
    arrValidate = [];
    arrValidate = [
        check("id").not().isEmpty().withMessage("Parameter id can not be empty"),
    ];
    app.post( rootAPIPath + 'submit_to_approve', arrValidate, procurementController.procurement_SubmitToApprove );

    // Cancel process
    arrValidate = [];
    arrValidate = [
        check("id").not().isEmpty().withMessage("Parameter id can not be empty"),
    ];
    app.post( rootAPIPath + 'cancel', arrValidate, procurementController.procurement_Cancel );

    // Set to Draft process
    arrValidate = [];
    arrValidate = [
        check("id").not().isEmpty().withMessage("Parameter id can not be empty"),
    ];
    app.post( rootAPIPath + 'set_to_draft', arrValidate, procurementController.procurement_SetToDraft );

    // Invite Vendor
    arrValidate = [];
    arrValidate = [
        check("id").not().isEmpty().withMessage("Parameter id can not be empty"),
        check("vendor_name").not().isEmpty().withMessage("Parameter vendor_name can not be empty"),
        check("email").not().isEmpty().withMessage("Parameter email can not be empty"),
    ];
    app.post( rootAPIPath + 'invite_vendor', arrValidate, procurementController.procurement_InviteVendor );

    // *** PROCUREMENT ITEM ***
    // Save
    arrValidate = [];
    arrValidate = [
        check("act").not().isEmpty().withMessage("Parameter act cannot be empty"),
        check("procurement_id").not().isEmpty().withMessage("Parameter procurement_id cannot be empty"),
        check("product_id","Parameter product_id must be integer and cannot be empty").not().isEmpty().isInt(),
        check("qty","Parameter qty must be integer and cannot be empty").not().isEmpty().isInt(),
        check("currency_id","Parameter currency_id must be integer and cannot be empty").not().isEmpty().isInt(),
    ];
    app.post( rootAPIPath + 'item/save', arrValidate, procurementItemController.procurementItem_Save);

    // List
    arrValidate = [];
    arrValidate = [
        check("offset","Parameter offset must be integer and cannot be empty").not().isEmpty().isInt(),
        check("limit").not().isEmpty().withMessage("Parameter limit cannot be empty"),
        check("procurement_id").not().isEmpty().withMessage("Parameter procurement_id cannot be empty"),
    ];
    app.get( rootAPIPath + 'item/list', arrValidate, procurementItemController.procurementItem_List);

    // Delete
    arrValidate = [];
    arrValidate = [
        check("id").not().isEmpty().withMessage("Parameter id cannot be empty"),
    ];
    app.delete( rootAPIPath + 'item/delete/:id', procurementItemController.procurementItem_Delete );

    // Archive
    arrValidate = [];
    arrValidate = [
        check("id").not().isEmpty().withMessage("Parameter id cannot be empty"),
    ];
    app.put( rootAPIPath + 'item/archive/:id', procurementItemController.procurementItem_Archive );

    // Archive
    arrValidate = [];
    arrValidate = [
        check("id").not().isEmpty().withMessage("Parameter id cannot be empty"),
    ];
    app.put( rootAPIPath + 'item/unarchive/:id', procurementItemController.procurementItem_Unarchive );


    // *** PROCUREMENT SCHEDULE ***
    // Save
    arrValidate = [];
    arrValidate = [
        check("act").not().isEmpty().withMessage("Parameter act cannot be empty"),
        check("procurement_id").not().isEmpty().withMessage("Parameter procurement_id cannot be empty"),
        check("schedule_attribute_id","Parameter schedule_attribute_id must be integer and cannot be empty").not().isEmpty().isInt(),
        check("start_date").not().isEmpty().withMessage("Parameter start_date cannot be empty"),
        check("end_date").not().isEmpty().withMessage("Parameter end_date cannot be empty"),
    ];
    app.post( rootAPIPath + 'schedule/save', arrValidate, procurementScheduleController.procurementSchedule_Save);

    // List
    arrValidate = [];
    arrValidate = [
        check("offset","Parameter offset must be integer and cannot be empty").not().isEmpty().isInt(),
        check("limit").not().isEmpty().withMessage("Parameter limit cannot be empty"),
        check("procurement_id").not().isEmpty().withMessage("Parameter procurement_id cannot be empty"),
    ];
    app.get( rootAPIPath + 'schedule/list', arrValidate, procurementScheduleController.procurementSchedule_List);

    // Delete
    arrValidate = [];
    arrValidate = [
        check("id").not().isEmpty().withMessage("Parameter id cannot be empty"),
    ];
    app.delete( rootAPIPath + 'schedule/delete/:id', procurementScheduleController.procurementSchedule_Delete );

    // Archive
    arrValidate = [];
    arrValidate = [
        check("id").not().isEmpty().withMessage("Parameter id cannot be empty"),
    ];
    app.put( rootAPIPath + 'schedule/archive/:id', procurementScheduleController.procurementSchedule_Archive );

    // Archive
    arrValidate = [];
    arrValidate = [
        check("id").not().isEmpty().withMessage("Parameter id cannot be empty"),
    ];
    app.put( rootAPIPath + 'schedule/unarchive/:id', procurementScheduleController.procurementSchedule_Unarchive );


    // *** PROCUREMENT TERM ***
    // Save
    arrValidate = [];
    arrValidate = [
        check("act").not().isEmpty().withMessage("Parameter act cannot be empty"),
        check("procurement_id").not().isEmpty().withMessage("Parameter procurement_id cannot be empty"),
        check("term").not().isEmpty().withMessage("Parameter term cannot be empty"),
        check("description").not().isEmpty().withMessage("Parameter description cannot be empty"),
    ];
    app.post( rootAPIPath + 'term/save', arrValidate, procurementTermController.procurementTerm_Save);

    // List
    arrValidate = [];
    arrValidate = [
        check("offset","Parameter offset must be integer and cannot be empty").not().isEmpty().isInt(),
        check("limit").not().isEmpty().withMessage("Parameter limit cannot be empty"),
        check("procurement_id").not().isEmpty().withMessage("Parameter procurement_id cannot be empty"),
    ];
    app.get( rootAPIPath + 'term/list', arrValidate, procurementTermController.procurementTerm_List);

    // Delete
    arrValidate = [];
    arrValidate = [
        check("id").not().isEmpty().withMessage("Parameter id cannot be empty"),
    ];
    app.delete( rootAPIPath + 'term/delete/:id', procurementTermController.procurementTerm_Delete );

    // Archive
    arrValidate = [];
    arrValidate = [
        check("id").not().isEmpty().withMessage("Parameter id cannot be empty"),
    ];
    app.put( rootAPIPath + 'term/archive/:id', procurementTermController.procurementTerm_Archive );

    // Archive
    arrValidate = [];
    arrValidate = [
        check("id").not().isEmpty().withMessage("Parameter id cannot be empty"),
    ];
    app.put( rootAPIPath + 'term/unarchive/:id', procurementTermController.procurementTerm_Unarchive );


    // *** PROCUREMENT VENDOR ***
    // Save
    arrValidate = [];
    arrValidate = [
        check("act").not().isEmpty().withMessage("Parameter act cannot be empty"),
        check("procurement_id").not().isEmpty().withMessage("Parameter procurement_id cannot be empty"),
        check("vendor_id","Parameter product_id must be integer and cannot be empty").not().isEmpty().isInt(),
    ];
    app.post( rootAPIPath + 'member/save', arrValidate, procurementVendorController.procurementVendor_Save);

    // List
    arrValidate = [];
    arrValidate = [
        check("offset","Parameter offset must be integer and cannot be empty").not().isEmpty().isInt(),
        check("limit").not().isEmpty().withMessage("Parameter limit cannot be empty"),
        check("procurement_id").not().isEmpty().withMessage("Parameter procurement_id cannot be empty"),
    ];
    app.get( rootAPIPath + 'member/list', arrValidate, procurementVendorController.procurementVendor_List);

    // Delete
    arrValidate = [];
    arrValidate = [
        check("id").not().isEmpty().withMessage("Parameter id cannot be empty"),
    ];
    app.delete( rootAPIPath + 'member/delete/:id', procurementVendorController.procurementVendor_Delete );

    // Archive
    arrValidate = [];
    arrValidate = [
        check("id").not().isEmpty().withMessage("Parameter id cannot be empty"),
    ];
    app.put( rootAPIPath + 'member/archive/:id', procurementVendorController.procurementVendor_Archive );

    // Unarchive
    arrValidate = [];
    arrValidate = [
        check("id").not().isEmpty().withMessage("Parameter id cannot be empty"),
    ];
    app.put( rootAPIPath + 'member/unarchive/:id', procurementVendorController.procurementVendor_Unarchive );
}