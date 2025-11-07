// OAuth Service
const OAuthService = require('../services/oauthservice.js');
const _oAuthServiceInstance = new OAuthService();

// Service
const VendorRegistrationService = require('../services/vendorregistrationservice.js');
const _serviceInstance = new VendorRegistrationService();

const env = process.env.NODE_ENV || 'localhost';
const config = require(__dirname + '/../config/config.json')[env];

const { check, validationResult } = require('express-validator');

module.exports = {
	vendorRegistration_Save,
	vendorRegistration_List,
	vendorRegistration_Detail,
	vendorRegistration_Submit,
	vendorRegistration_Take,
	vendorRegistration_Done,
	vendorRegistration_Cancel,
	vendorRegistration_SetToDraft,
	vendorRegistration_Delete,
};

async function vendorRegistration_List(req, res) {
	let joResult;
	const oAuthResult = await _oAuthServiceInstance.verifyToken(req.headers['x-token'], req.headers['x-method']);

	if (oAuthResult.status_code === '00' && oAuthResult.token_data.status_code === '00') {
		let xLevel = oAuthResult.token_data.result_verify.user_level.find(
			(el) => el.application.id === config.applicationId || el.application.id === 1
		);

		req.query.logged_is_admin = xLevel.is_admin;
		req.query.user_id = oAuthResult.token_data.result_verify.id;
		req.query.logged_company_id = oAuthResult.token_data.result_verify.employee_info.company.id;
		req.query.logged_company_name = oAuthResult.token_data.result_verify.employee_info.company.name;
		req.query.method = req.headers['x-method'];
		req.query.token = req.headers['x-token'];

		joResult = await _serviceInstance.list(req.query);
	} else {
		joResult = oAuthResult;
	}

	res.setHeader('Content-Type', 'application/json');
	res.status(200).send(JSON.stringify(joResult));
}

async function vendorRegistration_Save(req, res) {
	let joResult;
	const oAuthResult = await _oAuthServiceInstance.verifyToken(req.headers['x-token'], req.headers['x-method']);

	if (oAuthResult.status_code === '00' && oAuthResult.token_data.status_code === '00') {
		let xLevel = oAuthResult.token_data.result_verify.user_level.find(
			(el) => el.application.id === config.applicationId || el.application.id === 1
		);

		req.body.logged_is_admin = xLevel.is_admin;
		req.body.user_id = oAuthResult.token_data.result_verify.id;
		req.body.user_name = oAuthResult.token_data.result_verify.name;

		req.body.logged_company_id = oAuthResult.token_data.result_verify.employee_info.company.id;
		req.body.logged_company_name = oAuthResult.token_data.result_verify.employee_info.company.name;
		req.body.logged_company_alias = oAuthResult.token_data.result_verify.employee_info.company.alias;

		req.body.token = req.headers['x-token'];
		req.body.method = req.headers['x-method'];

		joResult = await _serviceInstance.save(req.body);
	} else {
		joResult = oAuthResult;
	}

	res.setHeader('Content-Type', 'application/json');
	res.status(200).send(JSON.stringify(joResult));
}

async function vendorRegistration_Detail(req, res) {
	let joResult;
	const oAuthResult = await _oAuthServiceInstance.verifyToken(req.headers['x-token'], req.headers['x-method']);

	if (oAuthResult.status_code === '00' && oAuthResult.token_data.status_code === '00') {
		req.params.token = req.headers['x-token'];
		req.params.method = req.headers['x-method'];

		joResult = await _serviceInstance.detail(req.params);
	} else {
		joResult = oAuthResult;
	}

	res.setHeader('Content-Type', 'application/json');
	res.status(200).send(JSON.stringify(joResult));
}

async function vendorRegistration_Submit(req, res) {
	let joResult;
	const oAuthResult = await _oAuthServiceInstance.verifyToken(req.headers['x-token'], req.headers['x-method']);

	if (oAuthResult.status_code === '00' && oAuthResult.token_data.status_code === '00') {
		let xLevel = oAuthResult.token_data.result_verify.user_level.find(
			(el) => el.application.id === config.applicationId || el.application.id === 1
		);
		req.body.logged_is_admin = xLevel.is_admin;
		
		req.body.user_id = oAuthResult.token_data.result_verify.id;
		req.body.user_name = oAuthResult.token_data.result_verify.name;
		req.body.token = req.headers['x-token'];
		req.body.method = req.headers['x-method'];

		joResult = await _serviceInstance.submit(req.body);
	} else {
		joResult = oAuthResult;
	}

	res.setHeader('Content-Type', 'application/json');
	res.status(200).send(JSON.stringify(joResult));
}

async function vendorRegistration_Take(req, res) {
	let joResult;
	const oAuthResult = await _oAuthServiceInstance.verifyToken(req.headers['x-token'], req.headers['x-method']);

	if (oAuthResult.status_code === '00' && oAuthResult.token_data.status_code === '00') {
		let xLevel = oAuthResult.token_data.result_verify.user_level.find(
			(el) => el.application.id === config.applicationId || el.application.id === 1
		);

		req.body.logged_is_admin = xLevel.is_admin;
		req.body.user_id = oAuthResult.token_data.result_verify.id;
		req.body.user_name = oAuthResult.token_data.result_verify.name;
		req.body.token = req.headers['x-token'];
		req.body.method = req.headers['x-method'];

		joResult = await _serviceInstance.take(req.body);
	} else {
		joResult = oAuthResult;
	}

	res.setHeader('Content-Type', 'application/json');
	res.status(200).send(JSON.stringify(joResult));
}

async function vendorRegistration_Done(req, res) {
	let joResult;
	const oAuthResult = await _oAuthServiceInstance.verifyToken(req.headers['x-token'], req.headers['x-method']);

	if (oAuthResult.status_code === '00' && oAuthResult.token_data.status_code === '00') {
		let xLevel = oAuthResult.token_data.result_verify.user_level.find(
			(el) => el.application.id === config.applicationId || el.application.id === 1
		);

		req.body.logged_is_admin = xLevel.is_admin;
		req.body.user_id = oAuthResult.token_data.result_verify.id;
		req.body.user_name = oAuthResult.token_data.result_verify.name;
		req.body.token = req.headers['x-token'];
		req.body.method = req.headers['x-method'];

		joResult = await _serviceInstance.done(req.body);
	} else {
		joResult = oAuthResult;
	}

	res.setHeader('Content-Type', 'application/json');
	res.status(200).send(JSON.stringify(joResult));
}

async function vendorRegistration_Cancel(req, res) {
	let joResult;
	const oAuthResult = await _oAuthServiceInstance.verifyToken(req.headers['x-token'], req.headers['x-method']);

	if (oAuthResult.status_code === '00' && oAuthResult.token_data.status_code === '00') {
		let xLevel = oAuthResult.token_data.result_verify.user_level.find(
			(el) => el.application.id === config.applicationId || el.application.id === 1
		);

		req.body.logged_is_admin = xLevel.is_admin;
		req.body.user_id = oAuthResult.token_data.result_verify.id;
		req.body.user_name = oAuthResult.token_data.result_verify.name;
		req.body.token = req.headers['x-token'];
		req.body.method = req.headers['x-method'];

		joResult = await _serviceInstance.cancel(req.body);
	} else {
		joResult = oAuthResult;
	}

	res.setHeader('Content-Type', 'application/json');
	res.status(200).send(JSON.stringify(joResult));
}

async function vendorRegistration_SetToDraft(req, res) {
	let joResult;
	const oAuthResult = await _oAuthServiceInstance.verifyToken(req.headers['x-token'], req.headers['x-method']);

	if (oAuthResult.status_code === '00' && oAuthResult.token_data.status_code === '00') {
		let xLevel = oAuthResult.token_data.result_verify.user_level.find(
			(el) => el.application.id === config.applicationId || el.application.id === 1
		);

		req.body.logged_is_admin = xLevel.is_admin;
		req.body.user_id = oAuthResult.token_data.result_verify.id;
		req.body.user_name = oAuthResult.token_data.result_verify.name;
		req.body.token = req.headers['x-token'];
		req.body.method = req.headers['x-method'];

		joResult = await _serviceInstance.setDraft(req.body);
	} else {
		joResult = oAuthResult;
	}

	res.setHeader('Content-Type', 'application/json');
	res.status(200).send(JSON.stringify(joResult));
}

async function vendorRegistration_Delete(req, res) {
	let joResult;
	const oAuthResult = await _oAuthServiceInstance.verifyToken(req.headers['x-token'], req.headers['x-method']);

	if (oAuthResult.status_code === '00' && oAuthResult.token_data.status_code === '00') {
		let xLevel = oAuthResult.token_data.result_verify.user_level.find(
			(el) => el.application.id === config.applicationId || el.application.id === 1
		);

		req.body.logged_is_admin = xLevel.is_admin;
		req.body.user_id = oAuthResult.token_data.result_verify.id;
		req.body.user_name = oAuthResult.token_data.result_verify.name;
		req.body.logged_user_level = oAuthResult.token_data.result_verify.user_level;
		req.body.token = req.headers['x-token'];
		req.body.method = req.headers['x-method'];

		joResult = await _serviceInstance.delete(req.body);
	} else {
		joResult = oAuthResult;
	}

	res.setHeader('Content-Type', 'application/json');
	res.status(200).send(JSON.stringify(joResult));
}
