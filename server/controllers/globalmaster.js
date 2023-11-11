//DECLARE SERVICES INSTANCE
// DocumentType
const MasterService = require('../services/masterservice.js');
const _masterServiceInstance = new MasterService();

// OAuth Service
const OAuthService = require('../services/oauthservice.js');
const _oAuthServiceInstance = new OAuthService();

//Validation
const { check, validationResult } = require('express-validator');

module.exports = { master_List, master_Save, master_Delete, master_Archive, master_Unarchive, master_Dropdown };

async function master_List(req, res) {
	var joResult;
	var errors = null;

	var oAuthResult = await _oAuthServiceInstance.verifyToken(req.headers['x-token'], req.headers['x-method']);

	if (oAuthResult.status_code == '00') {
		if (oAuthResult.token_data.status_code == '00') {
			// Validate first
			var errors = validationResult(req).array();

			if (errors.length != 0) {
				joResult = JSON.stringify({
					status_code: '-99',
					status_msg: 'Parameter value has problem',
					error_msg: errors
				});
			} else {
				req.query.model = req.params.model;
				joResult = await _masterServiceInstance.list(req.query);
				// joResult.token_data = oAuthResult.token_data;
				joResult = JSON.stringify(joResult);
			}
		} else {
			joResult = JSON.stringify(oAuthResult);
		}
	} else {
		joResult = JSON.stringify(oAuthResult);
	}

	res.setHeader('Content-Type', 'application/json');
	res.status(200).send(joResult);
}

async function master_Dropdown(req, res) {
	var joResult;
	var errors = null;

	var oAuthResult = await _oAuthServiceInstance.verifyToken(req.headers['x-token'], req.headers['x-method']);

	if (oAuthResult.status_code == '00') {
		if (oAuthResult.token_data.status_code == '00') {
			// Validate first
			var errors = validationResult(req).array();

			if (errors.length != 0) {
				joResult = JSON.stringify({
					status_code: '-99',
					status_msg: 'Parameter value has problem',
					error_msg: errors
				});
			} else {
				req.query.model = req.params.model;
				joResult = await _masterServiceInstance.dropDown(req.query);
				// joResult.token_data = oAuthResult.token_data;
				joResult = JSON.stringify(joResult);
			}
		} else {
			joResult = JSON.stringify(oAuthResult);
		}
	} else {
		joResult = JSON.stringify(oAuthResult);
	}

	res.setHeader('Content-Type', 'application/json');
	res.status(200).send(joResult);
}

async function master_Save(req, res) {
	var joResult;
	var errors = null;

	var oAuthResult = await _oAuthServiceInstance.verifyToken(req.headers['x-token'], req.headers['x-method']);

	if (oAuthResult.status_code == '00') {
		if (oAuthResult.token_data.status_code == '00') {
			// Validate first
			var errors = validationResult(req).array();

			if (errors.length != 0) {
				joResult = JSON.stringify({
					status_code: '-99',
					status_msg: 'Parameter value has problem',
					error_msg: errors
				});
			} else {
				req.body.user_id = oAuthResult.token_data.result_verify.id;
				req.body.user_name = oAuthResult.token_data.result_verify.name;
				req.body.model = req.params.model;
				joResult = await _masterServiceInstance.save(req.body);
				// joResult.token_data = oAuthResult.token_data;
				joResult = JSON.stringify(joResult);
			}
		} else {
			joResult = JSON.stringify(oAuthResult);
		}
	} else {
		joResult = JSON.stringify(oAuthResult);
	}

	res.setHeader('Content-Type', 'application/json');
	res.status(200).send(joResult);
}

async function master_Archive(req, res) {
	var joResult;
	var errors = null;

	var oAuthResult = await _oAuthServiceInstance.verifyToken(req.headers['x-token'], req.headers['x-method']);

	if (oAuthResult.status_code == '00') {
		if (oAuthResult.token_data.status_code == '00') {
			// Validate first
			var errors = validationResult(req).array();

			if (errors.length != 0) {
				joResult = JSON.stringify({
					status_code: '-99',
					status_msg: 'Parameter value has problem',
					error_msg: errors
				});
			} else {
				req.params.user_id = oAuthResult.token_data.result_verify.id;
				req.params.user_name = oAuthResult.token_data.result_verify.name;
				joResult = await _masterServiceInstance.archive(req.params);
				// joResult.token_data = oAuthResult.token_data;
				joResult = JSON.stringify(joResult);
			}
		} else {
			joResult = JSON.stringify(oAuthResult);
		}
	} else {
		joResult = JSON.stringify(oAuthResult);
	}

	res.setHeader('Content-Type', 'application/json');
	res.status(200).send(joResult);
}

async function master_Unarchive(req, res) {
	var joResult;
	var errors = null;

	var oAuthResult = await _oAuthServiceInstance.verifyToken(req.headers['x-token'], req.headers['x-method']);

	if (oAuthResult.status_code == '00') {
		if (oAuthResult.token_data.status_code == '00') {
			// Validate first
			var errors = validationResult(req).array();

			if (errors.length != 0) {
				joResult = JSON.stringify({
					status_code: '-99',
					status_msg: 'Parameter value has problem',
					error_msg: errors
				});
			} else {
				req.params.user_id = oAuthResult.token_data.result_verify.id;
				req.params.user_name = oAuthResult.token_data.result_verify.name;
				joResult = await _masterServiceInstance.unarchive(req.params);
				// joResult.token_data = oAuthResult.token_data;
				joResult = JSON.stringify(joResult);
			}
		} else {
			joResult = JSON.stringify(oAuthResult);
		}
	} else {
		joResult = JSON.stringify(oAuthResult);
	}

	res.setHeader('Content-Type', 'application/json');
	res.status(200).send(joResult);
}

async function master_Delete(req, res) {
	var joResult;
	var errors = null;

	var oAuthResult = await _oAuthServiceInstance.verifyToken(req.headers['x-token'], req.headers['x-method']);

	if (oAuthResult.status_code == '00') {
		if (oAuthResult.token_data.status_code == '00') {
			// Validate first
			var errors = validationResult(req).array();

			if (errors.length != 0) {
				joResult = JSON.stringify({
					status_code: '-99',
					status_msg: 'Parameter value has problem',
					error_msg: errors
				});
			} else {
				req.params.user_id = oAuthResult.token_data.result_verify.id;
				req.params.user_name = oAuthResult.token_data.result_verify.name;
				joResult = await _masterServiceInstance.delete(req.params);
				// joResult.token_data = oAuthResult.token_data;
				joResult = JSON.stringify(joResult);
			}
		} else {
			joResult = JSON.stringify(oAuthResult);
		}
	} else {
		joResult = JSON.stringify(oAuthResult);
	}

	res.setHeader('Content-Type', 'application/json');
	res.status(200).send(joResult);
}
