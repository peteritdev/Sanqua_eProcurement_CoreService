// OAuth Service
const OAuthService = require('../services/oauthservice.js');
const _oAuthServiceInstance = new OAuthService();

// Service
const Service = require('../services/syncfromodooservice.js');
const _serviceInstance = new Service();

const env = process.env.NODE_ENV || 'localhost';
const config = require(__dirname + '/../config/config.json')[env];

const { check, validationResult } = require('express-validator');

module.exports = {
	updateStatusPR
};

async function updateStatusPR(req, res) {
	var xJoResult;

	var errors = validationResult(req).array();
	if (errors.length != 0 && req.body.act == 'add') {
		xJoResult = JSON.stringify({
			status_code: '-99',
			status_msg: 'Parameter value has problem',
			error_msg: errors
		});
	} else {
		req.body.method = req.headers['x-method'];
		xJoResult = await _serviceInstance.updateStatusPR(req.body);
		xJoResult = JSON.stringify(xJoResult);
	}

	res.setHeader('Content-Type', 'application/json');
	res.status(200).send(xJoResult);
}
