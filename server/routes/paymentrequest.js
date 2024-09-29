const paymentRequestController = require('../controllers').paymentRequest;

const { check, validationResult } = require('express-validator');

var rootAPIPath = '/api/procurement/v1/payreq/';

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

	// *** PAYMENT REQUEST ***
	// Save
	arrValidate = [];
	arrValidate = [
		check('act').not().isEmpty().withMessage('Parameter act cannot be empty'),
		check('purchase_request_id').not().isEmpty().withMessage('Parameter purchase_request_id cannot be empty')
	];
	app.post(rootAPIPath + 'save', arrValidate, paymentRequestController.paymentRequest_Save);

	arrValidate = [];
	arrValidate = [ check('id').not().isEmpty().withMessage('Parameter id cannot be empty') ];
	app.post(rootAPIPath + 'submit', arrValidate, paymentRequestController.paymentRequest_Submit);

	arrValidate = [];
	arrValidate = [ check('id').not().isEmpty().withMessage('Parameter id cannot be empty') ];
	app.post(rootAPIPath + 'set_to_draft', arrValidate, paymentRequestController.paymentRequest_SetToDraft);

	arrValidate = [];
	arrValidate = [ check('id').not().isEmpty().withMessage('Parameter id cannot be empty') ];
	arrValidate = [ check('cancel_reason').not().isEmpty().withMessage('Parameter cancel_reason cannot be empty') ];
	app.post(rootAPIPath + 'cancel', arrValidate, paymentRequestController.paymentRequest_Cancel);

	arrValidate = [];
	arrValidate = [
		check('offset', 'Parameter offset must be integer and cannot be empty').not().isEmpty().isInt(),
		check('limit').not().isEmpty().withMessage('Parameter limit cannot be empty')
	];
	app.get(rootAPIPath + 'list', arrValidate, paymentRequestController.paymentRequest_List);

	arrValidate = [];
	arrValidate = [ check('id').not().isEmpty().withMessage('Parameter id cannot be empty') ];
	app.get(rootAPIPath + 'detail/:id', arrValidate, paymentRequestController.paymentRequest_Detail);

	// PAYREQ DETAIL
	arrValidate = [];
	arrValidate = [
		check('act').not().isEmpty().withMessage('Parameter act cannot be empty'),
		check('qty_request', 'Parameter qty_request must be decimal and cannot be empty').not().isEmpty().isDecimal(),
		check('price_request', 'Parameter price_request must be decimal and cannot be empty')
			.not()
			.isEmpty()
			.isDecimal()	
	];
	app.post(rootAPIPath + 'detail/save', arrValidate, paymentRequestController.paymentRequestDetail_Save);

	arrValidate = [];
	arrValidate = [ check('document_id').not().isEmpty().withMessage('Parameter document_id cannot be empty') ];
	app.post(rootAPIPath + 'confirm', arrValidate, paymentRequestController.paymentRequest_Confirm);

	arrValidate = [];
	arrValidate = [ check('document_id').not().isEmpty().withMessage('Parameter document_id cannot be empty') ];
	app.post(rootAPIPath + 'reject', arrValidate, paymentRequestController.paymentRequest_Reject);
	
	arrValidate = [];
	arrValidate = [ check('id').not().isEmpty().withMessage('Parameter id cannot be empty') ];
	app.post(rootAPIPath + 'paid', arrValidate, paymentRequestController.paymentRequest_Paid);

	arrValidate = [];
	arrValidate = [ check('id').not().isEmpty().withMessage('Parameter id cannot be empty') ];
	app.post(rootAPIPath + 'done', arrValidate, paymentRequestController.paymentRequest_Done);

	arrValidate = [];
	app.get(rootAPIPath + 'dropdown', arrValidate, paymentRequestController.paymentRequest_Dropdown);

	arrValidate = [];
	app.get(rootAPIPath + 'dropdown_detail', arrValidate, paymentRequestController.paymentRequestDetail_Dropdown);

	arrValidate = [];
	arrValidate = [ check('id').not().isEmpty().withMessage('Parameter id cannot be empty') ];
	app.delete(rootAPIPath + 'delete_detail/:id', arrValidate, paymentRequestController.paymentRequestDetail_Delete);

	// Fetch Matrix payreq
	arrValidate = [];
	arrValidate = [ check('id').not().isEmpty().withMessage('Parameter id cannot be empty') ];
	app.post(rootAPIPath + 'fetch_matrix', arrValidate, paymentRequestController.paymentRequest_FetchMatrix);
};
