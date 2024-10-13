const pjcaController = require('../controllers').pjca;

const { check, validationResult } = require('express-validator');

var rootAPIPath = '/api/procurement/v1/pjca/';

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
	app.post(rootAPIPath + 'save', arrValidate, pjcaController.PJCA_Save);

	arrValidate = [];
	arrValidate = [ check('id').not().isEmpty().withMessage('Parameter id cannot be empty') ];
	app.post(rootAPIPath + 'submit', arrValidate, pjcaController.PJCA_Submit);

	arrValidate = [];
	arrValidate = [ check('id').not().isEmpty().withMessage('Parameter id cannot be empty') ];
	app.post(rootAPIPath + 'set_to_draft', arrValidate, pjcaController.PJCA_SetToDraft);

	arrValidate = [];
	arrValidate = [ check('id').not().isEmpty().withMessage('Parameter id cannot be empty') ];
	arrValidate = [ check('cancel_reason').not().isEmpty().withMessage('Parameter cancel_reason cannot be empty') ];
	app.post(rootAPIPath + 'cancel', arrValidate, pjcaController.PJCA_Cancel);

	arrValidate = [];
	arrValidate = [
		check('offset', 'Parameter offset must be integer and cannot be empty').not().isEmpty().isInt(),
		check('limit').not().isEmpty().withMessage('Parameter limit cannot be empty')
	];
	app.get(rootAPIPath + 'list', arrValidate, pjcaController.PJCA_List);

	arrValidate = [];
	arrValidate = [ check('id').not().isEmpty().withMessage('Parameter id cannot be empty') ];
	app.get(rootAPIPath + 'detail/:id', arrValidate, pjcaController.PJCA_Detail);

	arrValidate = [];
	arrValidate = [ check('document_id').not().isEmpty().withMessage('Parameter document_id cannot be empty') ];
	app.post(rootAPIPath + 'confirm', arrValidate, pjcaController.PJCA_Confirm);

	arrValidate = [];
	arrValidate = [ check('document_id').not().isEmpty().withMessage('Parameter document_id cannot be empty') ];
	app.post(rootAPIPath + 'reject', arrValidate, pjcaController.PJCA_Reject);

	arrValidate = [];
	arrValidate = [ check('id').not().isEmpty().withMessage('Parameter id cannot be empty') ];
	app.post(rootAPIPath + 'done', arrValidate, pjcaController.PJCA_Done);

	// pjca DETAIL
	arrValidate = [];
	arrValidate = [
		check('act').not().isEmpty().withMessage('Parameter act cannot be empty'),
		check('qty_done', 'Parameter qty_done must be decimal and cannot be empty').not().isEmpty().isDecimal()
	];
	app.post(rootAPIPath + 'detail/save', arrValidate, pjcaController.PJCADetail_Save);

	arrValidate = [];
	arrValidate = [ check('id').not().isEmpty().withMessage('Parameter id cannot be empty') ];
	app.delete(rootAPIPath + 'delete_detail/:id', arrValidate, pjcaController.PJCADetail_Delete);
	
	// Fetch Matrix payreq
	arrValidate = [];
	arrValidate = [ check('id').not().isEmpty().withMessage('Parameter id cannot be empty') ];
	app.post(rootAPIPath + 'fetch_matrix', arrValidate, pjcaController.PJCA_FetchMatrix);
	
	arrValidate = [];
	arrValidate = [
		check('id').not().isEmpty().withMessage('Parameter id cannot be empty'),
		check('file', 'Parameter photo must be array and cannot be empty').not().isEmpty().isArray()
	];
	app.post(
		rootAPIPath + 'update_file_upload',
		arrValidate,
		pjcaController.PJCA_UpdateFileUpload
	);
};
