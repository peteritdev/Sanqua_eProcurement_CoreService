const _controller = require('../controllers').syncFromOdoo;

const { check, validationResult } = require('express-validator');

var rootAPIPath = '/api/procurement/v1/sync_from_odoo/';

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
		check('pr_no').not().isEmpty().withMessage('Parameter id cannot be empty'),
		check('status', 'Parameter status must be integer and cannot be empty').not().isEmpty().isInt()
	];
	app.post(rootAPIPath + 'update_status_pr', arrValidate, _controller.updateStatusPR);
};
