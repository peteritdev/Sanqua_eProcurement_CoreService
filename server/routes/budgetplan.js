// const budgetPlanController = require('../controllers').budgetPlan;

// const { check, validationResult } = require('express-validator');

// var rootAPIPath = '/api/procurement/v1/rab/';

// module.exports = (app) => {
// 	app.get(rootAPIPath, (req, res) =>
// 		res.status(200).send({
// 			message: 'Welcome to the Todos API!'
// 		})
// 	);

// 	app.use(function(req, res, next) {
// 		res.header('Access-Control-Allow-Origin', '*'); // update to match the domain you will make the request from
// 		res.header(
// 			'Access-Control-Allow-Headers',
// 			'Origin, X-Requested-With, Content-Type, Accept, x-method, x-token, x-application-id, x-device, x-device-id'
// 		);
// 		next();
// 	});

// 	var arrValidate = [];

// 	// *** BUDGET PLAN ***
// 	// List RAB
// 	arrValidate = [];
// 	arrValidate = [
// 		check('offset', 'Parameter offset must be integer and cannot be empty').not().isEmpty().isInt(),
// 		check('limit').not().isEmpty().withMessage('Parameter limit cannot be empty')
// 	];
// 	app.get(rootAPIPath + 'list', arrValidate, budgetPlanController.budgetPlan_List);

// 	// Detail RAB
// 	arrValidate = [];
// 	arrValidate = [ check('id').not().isEmpty().withMessage('Parameter id cannot be empty') ];
// 	app.get(rootAPIPath + 'detail/:id', arrValidate, budgetPlanController.budgetPlan_Detail);
	
// 	// Save & Update RAB
// 	arrValidate = [];
// 	arrValidate = [
// 		check('act').not().isEmpty().withMessage('Parameter act cannot be empty'),
// 		check('name').not().isEmpty().withMessage('Parameter name cannot be empty'),
// 		// check('company_id').not().isEmpty().withMessage('Parameter company_id cannot be empty'),
// 		// check('project_id').not().isEmpty().withMessage('Parameter project_id cannot be empty'),
// 		check('pic_employee_id').not().isEmpty().withMessage('Parameter pic_employee_id cannot be empty'),
// 	];
// 	app.post(rootAPIPath + 'save', arrValidate, budgetPlanController.budgetPlan_Save);

// 	// // SUBMIT RAB
// 	arrValidate = [];
// 	arrValidate = [ check('id').not().isEmpty().withMessage('Parameter id cannot be empty') ];
// 	app.post(rootAPIPath + 'submit', arrValidate, budgetPlanController.budgetPlan_Submit);

// 	// // TAKE RAB
// 	arrValidate = [];
// 	arrValidate = [ check('id').not().isEmpty().withMessage('Parameter id cannot be empty') ];
// 	app.post(rootAPIPath + 'take', arrValidate, budgetPlanController.budgetPlan_Take);

// 	// // DONE RAB
// 	arrValidate = [];
// 	arrValidate = [ check('id').not().isEmpty().withMessage('Parameter id cannot be empty') ];
// 	app.post(rootAPIPath + 'done', arrValidate, budgetPlanController.budgetPlan_Done);

// 	// // CANCEL RAB
// 	arrValidate = [];
// 	arrValidate = [
// 		check('id').not().isEmpty().withMessage('Parameter id cannot be empty'),
// 		check('cancel_reason').not().isEmpty().withMessage('Parameter cancel_reason cannot be empty')
// 	];
// 	app.post(rootAPIPath + 'cancel', arrValidate, budgetPlanController.budgetPlan_Cancel);

// 	// // SET TO DRAFT RAB
// 	arrValidate = [];
// 	arrValidate = [ check('id').not().isEmpty().withMessage('Parameter id cannot be empty') ];
// 	app.post(rootAPIPath + 'set_to_draft', arrValidate, budgetPlanController.budgetPlan_SetToDraft);

// 	// Confirm RAB
// 	arrValidate = [];
// 	arrValidate = [ check('id').not().isEmpty().withMessage('Parameter id cannot be empty') ];
// 	app.post(rootAPIPath + 'confirm', arrValidate, budgetPlanController.budgetPlan_Confirm);

// 	// Reject RAB
// 	arrValidate = [];
// 	arrValidate = [
// 		check('id').not().isEmpty().withMessage('Parameter id cannot be empty'),
// 		check('reject_reason').not().isEmpty().withMessage('Parameter reject_reason cannot be empty')
// 	];
// 	app.post(rootAPIPath + 'reject', arrValidate, budgetPlanController.budgetPlan_Reject);

// 	// Delete RAB
// 	arrValidate = [];
// 	arrValidate = [ check('id').not().isEmpty().withMessage('Parameter id cannot be empty') ];
// 	arrValidate = [ check('is_permanent').not().isEmpty().withMessage('Parameter is_permanent cannot be empty') ];
// 	app.delete(rootAPIPath + 'delete/:id', arrValidate, budgetPlanController.budgetPlan_Delete);

// 	// Dropdown RAB
// 	arrValidate = [];
// 	app.get(rootAPIPath + 'dropdown', arrValidate, budgetPlanController.budgetPlan_DropDown);

// 	// List Detail RAB
// 	arrValidate = [];
// 	arrValidate = [
// 		check('offset', 'Parameter offset must be integer and cannot be empty').not().isEmpty().isInt(),
// 		check('limit').not().isEmpty().withMessage('Parameter limit cannot be empty'),
// 		check('request_id').not().isEmpty().withMessage('Parameter request_id cannot be empty'),
// 	];
// 	app.get(rootAPIPath + 'detail_list', arrValidate, budgetPlanController.budgetPlanDetail_List);

// 	// Save Detail
// 	arrValidate = [];
// 	arrValidate = [
// 		check('act').not().isEmpty().withMessage('Parameter act cannot be empty'),
// 		check('request_id').not().isEmpty().withMessage('Parameter request_id cannot be empty'),
// 		check('uom_id', 'Parameter uom_id must be integer and cannot be empty').not().isEmpty().isInt(),
// 		check('qty', 'Parameter qty must be decimal and cannot be empty').not().isEmpty().isDecimal(),
// 		check('budget_price_per_unit', 'Parameter budget_price_per_unit must be decimal and cannot be empty')
// 			.not()
// 			.isEmpty()
// 			.isDecimal()
// 	];
// 	app.post(rootAPIPath + 'save_detail', arrValidate, budgetPlanController.budgetPlanDetail_Save);

// 	// Save Batch Detail
// 	arrValidate = [];
// 	arrValidate = [
// 		check('act').not().isEmpty().withMessage('Parameter act cannot be empty'),
// 		check('request_id').not().isEmpty().withMessage('Parameter request_id cannot be empty'),
// 		check('items', 'Parameter items must be array and cannot be empty').not().isEmpty().isArray()
// 	];
// 	app.post(rootAPIPath + 'save_batch_detail', arrValidate, budgetPlanController.budgetPlanDetail_Save);

// 	// Delete Detail
// 	arrValidate = [];
// 	arrValidate = [ check('id').not().isEmpty().withMessage('Parameter id cannot be empty') ];
// 	app.delete(rootAPIPath + 'delete_detail/:id', arrValidate, budgetPlanController.budgetPlanDetail_Delete);


// };
