const vendorController = require('../controllers').vendor;
const vendorExperienceController = require('../controllers').vendorExperience;
const vendorRateHistoryController = require('../controllers').vendorRateHistory;
const { check, validationResult } = require('express-validator');

var rootAPIPath = '/api/procurement/v1/';

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
			'Origin, X-Requested-With, Content-Type, Accept, x-method, x-token, x-application-id, x-device'
		);
		next();
	});

	var arrValidate = [];

	// VENDOR'S PROFILE
	arrValidate = [
		check('name').not().isEmpty().withMessage('Name cannot be empty'),
		check('business_entity_id', 'Business Entity must be integer and cannot be empty').not().isEmpty().isInt(),
		check('classification_id', 'Classification Id must be integer and cannot be empty').not().isEmpty().isInt(),
		check('sub_classification_id', 'Sub Classification Id must be integer and cannot be empty')
			.not()
			.isEmpty()
			.isInt(),
		check('province_id').not().isEmpty().withMessage('Province ID cannot be empty'),
		check('city_id').not().isEmpty().withMessage('City ID cannot be empty'),
		check('email').isEmail().optional({ checkFalsy: true }),
		// check("address").not().isEmpty().withMessage("Address cannot be empty"),
		// check("zip_code").not().isEmpty().withMessage("Zip Code cannot be empty"),
		check('phone1').isNumeric().withMessage('Phone number 1 must be a number'),
		check('phone2', 'Phone 2 must be numeric').isNumeric().optional({ checkFalsy: true }),
		check('about').not().isEmpty().withMessage('About cannot be empty'),
		check('company_scale', 'Company Scale must be a number').not().isEmpty().isInt(),
		check('register_via', 'Register Via must be integer and cannot be empty').not().isEmpty().isInt()
	];
	app.post(rootAPIPath + 'vendor/save', arrValidate, vendorController.save);

	arrValidate = [
		check('name').not().isEmpty().withMessage('Parameter name cannot be empty'),
		check('code').not().isEmpty().withMessage('Parameter code cannot be empty')
	];
	app.post(rootAPIPath + 'vendor/batch_save', arrValidate, vendorController.vendor_BatchSave);

	arrValidate = [
		// check("id","ID can not be empty and must be integer").not().isEmpty().isInt(),
		check('id').not().isEmpty().withMessage('Id cannot be empty')
	];
	app.get(rootAPIPath + 'vendor/detail/:id', arrValidate, vendorController.getVendorById);

	arrValidate = [];
	app.get(rootAPIPath + 'vendor/list', arrValidate, vendorController.list);

	// Delete
	arrValidate = [];
	arrValidate = [ check('id').not().isEmpty().withMessage('Parameter id cannot be empty') ];
	app.delete(rootAPIPath + 'vendor/delete/:id', vendorController.vendor_Delete);

	// Block
	arrValidate = [];
	arrValidate = [
		check('id').not().isEmpty().withMessage('Parameter id cannot be empty'),
		check('reason').not().isEmpty().withMessage('Parameter reason cannot be empty')
	];
	app.post(rootAPIPath + 'vendor/block', vendorController.blockVendor);

	// Unblock
	arrValidate = [];
	arrValidate = [
		check('id').not().isEmpty().withMessage('Parameter id cannot be empty'),
		check('reason').not().isEmpty().withMessage('Parameter reason cannot be empty')
	];
	app.post(rootAPIPath + 'vendor/unblock', vendorController.unblockVendor);

	// Upload
	app.post(rootAPIPath + 'vendor/upload', vendorController.vendor_UploadExcel);

	// VENDOR'S DOCUMENTS
	arrValidate = [];
	app.post(rootAPIPath + 'vendor/document/save', arrValidate, vendorController.saveVendorDocument);

	arrValidate = [];
	arrValidate = [
		check('offset', 'Parameter offset must be integer and cannot be empty').not().isEmpty().isInt(),
		check('limit', 'Parameter limit must be integer and cannot be empty').not().isEmpty().isInt(),
		check('document_type_id', 'Parameter document_type_id must be integer and cannot be empty')
			.not()
			.isEmpty()
			.isInt(),
		check('vendor_id').not().isEmpty().withMessage('Parameter vendor_id can not be empty')
	];
	app.get(rootAPIPath + 'vendor/document/list', arrValidate, vendorController.vendor_GetVendorDocument);

	// VENDOR's EXPERIENCE
	arrValidate = [];
	arrValidate = [
		check('offset', 'Parameter offset must be integer and cannot be empty').not().isEmpty().isInt(),
		check('limit', 'Parameter limit must be integer and cannot be empty').not().isEmpty().isInt()
	];
	app.get(rootAPIPath + 'vendor/experience/list', arrValidate, vendorExperienceController.list);

	arrValidate = [];
	arrValidate = [
		check('vendor_id').not().isEmpty().withMessage('Parameter vendor_id can not be empty'),
		check('name').not().isEmpty().withMessage('Parameter name can not be empty'),
		check('type').not().isEmpty().withMessage('Parameter type can not be empty'),
		check('location').not().isEmpty().withMessage('Parameter location can not be empty'),
		check('month', 'Parameter month must be integer and cannot be empty').not().isEmpty().isInt(),
		check('year', 'Parameter year must be integer and cannot be empty').not().isEmpty().isInt()
	];
	app.post(rootAPIPath + 'vendor/experience/save', arrValidate, vendorExperienceController.save);

	arrValidate = [];
	arrValidate = [ check('id').not().isEmpty().withMessage('Parameter id can not be empty') ];
	app.delete(
		rootAPIPath + 'vendor/experience/delete/:id',
		arrValidate,
		vendorExperienceController.deleteVendorExperience
	);

	// VENDOR'S RATE HISTORY
	arrValidate = [
		check('vendor_id').not().isEmpty().withMessage('Parameter vendor_id cannot be empty'),
		check('rate_date').not().isEmpty().withMessage('Parameter rate_date cannot be empty'),
		check('pic').not().isEmpty().withMessage('Parameter pic cannot be empty'),
		check('harga', 'Parameter harga must be integer and cannot be empty').not().isEmpty().isInt(),
		check('kualitas', 'Parameter kualitas must be integer and cannot be empty').not().isEmpty().isInt(),
		check('pengiriman', 'Parameter pengiriman must be integer and cannot be empty').not().isEmpty().isInt(),
		check('kesesuaian_penawaran', 'Parameter kesesuaian_penawaran must be integer and cannot be empty')
			.not()
			.isEmpty()
			.isInt(),
		check('komunikatif', 'Parameter komunikatif must be integer and cannot be empty').not().isEmpty().isInt()
	];
	app.post(rootAPIPath + 'vendor/rate/save', arrValidate, vendorRateHistoryController.vendorRateHistory_Save);

	arrValidate = [
		// check("id","ID can not be empty and must be integer").not().isEmpty().isInt(),
		check('id').not().isEmpty().withMessage('Id cannot be empty')
	];
	app.get(rootAPIPath + 'vendor/rate/detail/:id', arrValidate, vendorRateHistoryController.vendorRateHistory_GetById);

	arrValidate = [];
	app.get(rootAPIPath + 'vendor/rate/list', arrValidate, vendorRateHistoryController.vendorRateHistory_List);

	arrValidate = [];
	arrValidate = [ check('id').not().isEmpty().withMessage('Parameter id can not be empty') ];
	app.delete(
		rootAPIPath + 'vendor/rate/delete/:id',
		arrValidate,
		vendorRateHistoryController.vendorRateHistory_Delete
	);
};
