const _projectController = require('../controllers').project;

const { check, validationResult } = require('express-validator');

var rootAPIPath = '/api/procurement/v1/project/';

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

	arrValidate = [];
	arrValidate = [
		check('offset', 'Parameter offset must be integer and cannot be empty').not().isEmpty().isInt(),
		check('limit').not().isEmpty().withMessage('Parameter limit cannot be empty')
	];
	app.get(rootAPIPath + 'list', arrValidate, _projectController.list);

	arrValidate = [];
	arrValidate = [ check('id').not().isEmpty().withMessage('Parameter id cannot be empty') ];
	app.get(rootAPIPath + 'detail/:id', arrValidate, _projectController.detail);

	arrValidate = [];
	arrValidate = [
		check('act').not().isEmpty().withMessage('Parameter act cannot be empty'),
		// check('code').not().isEmpty().withMessage('Parameter code cannot be empty'),
		check('name').not().isEmpty().withMessage('Parameter name cannot be empty'),
		check('odoo_project_code').not().isEmpty().withMessage('Parameter odoo_project_code cannot be empty')
	];
	app.post(rootAPIPath + 'save', arrValidate, _projectController.save);

	arrValidate = [];
	arrValidate = [ check('id').not().isEmpty().withMessage('Parameter id cannot be empty') ];
	app.delete(rootAPIPath + 'delete/:id', arrValidate, _projectController.deletePermanent);
};
