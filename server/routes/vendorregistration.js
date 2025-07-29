const vendorRegistrationController = require('../controllers').vendorRegistration;
const { check } = require('express-validator');

const rootAPIPath = '/api/procurement/v1/vendor/registration/';

module.exports = (app) => {
	app.get(rootAPIPath, (req, res) =>
		res.status(200).send({
			message: 'Welcome to the Vendor Registration API!'
		})
	);

	app.use(function (req, res, next) {
		res.header('Access-Control-Allow-Origin', '*');
		res.header(
			'Access-Control-Allow-Headers',
			'Origin, X-Requested-With, Content-Type, Accept, x-method, x-token, x-application-id, x-device, x-device-id'
		);
		next();
	});

	let arrValidate = [];

	// List Vendor Registrations
	arrValidate = [
		check('offset', 'Parameter offset must be integer and cannot be empty').not().isEmpty().isInt(),
		check('limit', 'Parameter limit must be integer and cannot be empty').not().isEmpty().isInt(),
	];
	app.get(rootAPIPath + 'list', arrValidate, vendorRegistrationController.vendorRegistration_List);

	// Detail Vendor Registration
	arrValidate = [
		check('id').not().isEmpty().withMessage('Parameter id cannot be empty')
	];
	app.get(rootAPIPath + 'detail/:id', arrValidate, vendorRegistrationController.vendorRegistration_Detail);

	// Save Vendor Registration
	arrValidate = [
		check('act').not().isEmpty().withMessage('Parameter act cannot be empty'),
		check('name').not().isEmpty().withMessage('Parameter vendor_name cannot be empty'),
		check('email').not().isEmpty().withMessage('Parameter email cannot be empty'),
		check('phone_number').not().isEmpty().withMessage('Parameter phone_number cannot be empty'),
		check('address').not().isEmpty().withMessage('Parameter address cannot be empty'),
		check('business_entity').not().isEmpty().withMessage('Parameter business_entity cannot be empty')
	];
	app.post(rootAPIPath + 'save', arrValidate, vendorRegistrationController.vendorRegistration_Save);

	// Submit Vendor Registration
	arrValidate = [
		check('id').not().isEmpty().withMessage('Parameter id cannot be empty')
	];
	app.post(rootAPIPath + 'submit', arrValidate, vendorRegistrationController.vendorRegistration_Submit);

	// Take Vendor Registration
	arrValidate = [
		check('id').not().isEmpty().withMessage('Parameter id cannot be empty')
	];
	app.post(rootAPIPath + 'take', arrValidate, vendorRegistrationController.vendorRegistration_Take);

	// Done Vendor Registration
	arrValidate = [
		check('id').not().isEmpty().withMessage('Parameter id cannot be empty')
	];
	app.post(rootAPIPath + 'done', arrValidate, vendorRegistrationController.vendorRegistration_Done);

	// Cancel Vendor Registration
	arrValidate = [
		check('id').not().isEmpty().withMessage('Parameter id cannot be empty'),
		check('cancel_reason').not().isEmpty().withMessage('Parameter cancel_reason cannot be empty')
	];
	app.post(rootAPIPath + 'cancel', arrValidate, vendorRegistrationController.vendorRegistration_Cancel);

	// Set to Draft Vendor Registration
	arrValidate = [
		check('id').not().isEmpty().withMessage('Parameter id cannot be empty')
	];
	app.post(rootAPIPath + 'set_to_draft', arrValidate, vendorRegistrationController.vendorRegistration_SetToDraft);

	// Delete Vendor Registration
	arrValidate = [
		check('id').not().isEmpty().withMessage('Parameter id cannot be empty')
	];
	app.delete(rootAPIPath + 'delete/:id', arrValidate, vendorRegistrationController.vendorRegistration_Delete);
};
