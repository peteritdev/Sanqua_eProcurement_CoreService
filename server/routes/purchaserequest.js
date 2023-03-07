const purchaseRequestController = require('../controllers').purchaseRequest;

const { check, validationResult } = require('express-validator');

var rootAPIPath = '/api/procurement/v1/fpb/';

module.exports = (app) => {
	app.get(rootAPIPath, (req, res) =>
		res.status(200).send({
			message: 'Welcome to the Todos API!'
		})
	);

	app.use(function(req, res, next) {
		res.header('Access-Control-Allow-Origin', '*'); // update to match the domain you will make the request from
		res.header(
			'Access-Control-Allow-Headers',
			'Origin, X-Requested-With, Content-Type, Accept, x-method, x-token, x-application-id, x-device, x-device-id'
		);
		next();
	});

	var arrValidate = [];

	// *** PURCHASE REQUEST ***
	// Save
	arrValidate = [];
	arrValidate = [
		check('act').not().isEmpty().withMessage('Parameter act cannot be empty'),
		// check('employee_id').not().isEmpty().withMessage('Parameter employee_id cannot be empty'),
		// check('employee_name').not().isEmpty().withMessage('Parameter employee_name cannot be empty'),
		// check('department_id', 'Parameter department_id must be integer and cannot be empty').not().isEmpty().isInt(),
		// check('department_name').not().isEmpty().withMessage('Parameter department_name cannot be empty'),
		check('reference_from_ecommerce', 'Parameter reference_from_ecommerce must be integer and cannot be empty')
			.not()
			.isEmpty()
			.isInt(),
		check('budget_is_approved', 'Parameter budget_is_approved must be integer and cannot be empty')
			.not()
			.isEmpty()
			.isInt(),
		check('memo_special_request', 'Parameter memo_special_request must be integer and cannot be empty')
			.not()
			.isEmpty()
			.isInt(),

		check('company_id').not().isEmpty().withMessage('Parameter company_id cannot be empty'),
		check('company_code').not().isEmpty().withMessage('Parameter company_code cannot be empty'),
		check('company_name').not().isEmpty().withMessage('Parameter company_name cannot be empty')
	];
	app.post(rootAPIPath + 'save', arrValidate, purchaseRequestController.purchaseRequest_Save);

	arrValidate = [];
	arrValidate = [
		check('act').not().isEmpty().withMessage('Parameter act cannot be empty'),
		check('id').not().isEmpty().withMessage('Parameter id cannot be empty')
	];
	app.post(rootAPIPath + 'update', arrValidate, purchaseRequestController.purchaseRequest_Save);

	// Confirm FPB
	arrValidate = [];
	arrValidate = [ check('document_id').not().isEmpty().withMessage('Parameter document_id cannot be empty') ];
	app.post(rootAPIPath + 'confirm', arrValidate, purchaseRequestController.purchaseRequest_Confirm);

	// Reject FPB
	arrValidate = [];
	arrValidate = [
		check('document_id').not().isEmpty().withMessage('Parameter document_id cannot be empty'),
		check('reject_reason').not().isEmpty().withMessage('Parameter reject_reason cannot be empty')
	];
	app.post(rootAPIPath + 'reject', arrValidate, purchaseRequestController.purchaseRequest_Reject);

	// Close FPB
	arrValidate = [];
	arrValidate = [
		check('document_id').not().isEmpty().withMessage('Parameter document_id cannot be empty'),
		check('closed_reason').not().isEmpty().withMessage('Parameter closed_reason cannot be empty')
	];
	app.post(rootAPIPath + 'close', arrValidate, purchaseRequestController.purchaseRequest_Close);

	// List FPB
	arrValidate = [];
	arrValidate = [
		check('offset', 'Parameter offset must be integer and cannot be empty').not().isEmpty().isInt(),
		check('limit').not().isEmpty().withMessage('Parameter limit cannot be empty')
	];
	app.get(rootAPIPath + 'list', arrValidate, purchaseRequestController.purchaseRequest_List);

	// Detail FPB
	arrValidate = [];
	arrValidate = [ check('id').not().isEmpty().withMessage('Parameter id cannot be empty') ];
	app.get(rootAPIPath + 'detail/:id', arrValidate, purchaseRequestController.purchaseRequest_Detail);

	// Save Detail
	arrValidate = [];
	arrValidate = [
		check('act').not().isEmpty().withMessage('Parameter act cannot be empty'),
		check('request_id').not().isEmpty().withMessage('Parameter request_id cannot be empty'),
		check('product_id', 'Parameter product_id must be integer and cannot be empty').not().isEmpty().isInt(),
		check('qty', 'Parameter qty must be decimal and cannot be empty').not().isEmpty().isDecimal(),
		check('budget_price_per_unit', 'Parameter budget_price_per_unit must be decimal and cannot be empty')
			.not()
			.isEmpty()
			.isDecimal(),
		check('has_budget', 'Parameter has_budget must be integer and cannot be empty').not().isEmpty().isInt()
	];
	app.post(rootAPIPath + 'save_detail', arrValidate, purchaseRequestController.purchaseRequestDetail_Save);

	// Save Batch Detail
	arrValidate = [];
	arrValidate = [
		check('act').not().isEmpty().withMessage('Parameter act cannot be empty'),
		check('request_id').not().isEmpty().withMessage('Parameter request_id cannot be empty'),
		check('items', 'Parameter items must be array and cannot be empty').not().isEmpty().isArray()
	];
	app.post(rootAPIPath + 'save_batch_detail', arrValidate, purchaseRequestController.purchaseRequestDetail_Save);

	arrValidate = [];
	arrValidate = [ check('id').not().isEmpty().withMessage('Parameter id cannot be empty') ];
	app.delete(rootAPIPath + 'delete_detail/:id', arrValidate, purchaseRequestController.purchaseRequestDetail_Delete);

	arrValidate = [];
	arrValidate = [ check('id').not().isEmpty().withMessage('Parameter id cannot be empty') ];
	app.post(rootAPIPath + 'submit', arrValidate, purchaseRequestController.purchaseRequest_Submit);

	arrValidate = [];
	arrValidate = [ check('id').not().isEmpty().withMessage('Parameter id cannot be empty') ];
	app.post(rootAPIPath + 'cancel', arrValidate, purchaseRequestController.purchaseRequest_Cancel);

	arrValidate = [];
	arrValidate = [ check('id').not().isEmpty().withMessage('Parameter id cannot be empty') ];
	app.post(rootAPIPath + 'set_to_draft', arrValidate, purchaseRequestController.purchaseRequest_SetToDraft);

	// Create PR from selected item
	arrValidate = [];
	arrValidate = [
		check('id').not().isEmpty().withMessage('Parameter id cannot be empty'),
		check('items', 'Parameter items must be array and cannot be empty').not().isEmpty().isArray()
	];
	app.post(rootAPIPath + 'odoo/create_pr', arrValidate, purchaseRequestController.purchaseRequest_CreatePR);
};
