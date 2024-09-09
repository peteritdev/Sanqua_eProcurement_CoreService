const goodsReceiptController = require('../controllers').goodsReceipt;

const { check, validationResult } = require('express-validator');

var rootAPIPath = '/api/procurement/v1/gr/';

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
	app.post(rootAPIPath + 'save', arrValidate, goodsReceiptController.goodsReceipt_Save);

	arrValidate = [];
	arrValidate = [ check('id').not().isEmpty().withMessage('Parameter id cannot be empty') ];
	app.post(rootAPIPath + 'submit', arrValidate, goodsReceiptController.goodsReceipt_Submit);

	arrValidate = [];
	arrValidate = [ check('id').not().isEmpty().withMessage('Parameter id cannot be empty') ];
	app.post(rootAPIPath + 'set_to_draft', arrValidate, goodsReceiptController.goodsReceipt_SetToDraft);

	arrValidate = [];
	arrValidate = [ check('id').not().isEmpty().withMessage('Parameter id cannot be empty') ];
	arrValidate = [ check('cancel_reason').not().isEmpty().withMessage('Parameter cancel_reason cannot be empty') ];
	app.post(rootAPIPath + 'cancel', arrValidate, goodsReceiptController.goodsReceipt_Cancel);

	arrValidate = [];
	arrValidate = [
		check('offset', 'Parameter offset must be integer and cannot be empty').not().isEmpty().isInt(),
		check('limit').not().isEmpty().withMessage('Parameter limit cannot be empty')
	];
	app.get(rootAPIPath + 'list', arrValidate, goodsReceiptController.goodsReceipt_List);

	arrValidate = [];
	arrValidate = [ check('id').not().isEmpty().withMessage('Parameter id cannot be empty') ];
	app.get(rootAPIPath + 'detail/:id', arrValidate, goodsReceiptController.goodsReceipt_Detail);

	// GR DETAIL
	arrValidate = [];
	arrValidate = [
		check('act').not().isEmpty().withMessage('Parameter act cannot be empty'),
		check('qty_done', 'Parameter qty_done must be decimal and cannot be empty').not().isEmpty().isDecimal()
	];
	app.post(rootAPIPath + 'detail/save', arrValidate, goodsReceiptController.goodsReceiptDetail_Save);

};
