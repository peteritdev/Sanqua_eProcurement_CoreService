//Service
const MilestoneService = require('../services/milestoneservice.js');
const _milestoneServiceInstance = new MilestoneService();

// OAuth Service
const OAuthService = require('../services/oauthservice.js');
const _oAuthServiceInstance = new OAuthService();

//Validation
const { check, validationResult } = require('express-validator');

module.exports = {
	milestone_Save,
	milestone_List,
	milestone_Delete,
	milestone_DropDown,
	item_MilestoneLink,
	item_MilestoneUnlink,
	item_MilestoneUpdateStatus,
	item_MilestoneList
};

function _injectAuth(req, oAuthResult) {
	req.body.user_id = oAuthResult.token_data.result_verify.id;
	req.body.user_name = oAuthResult.token_data.result_verify.name;
	if (oAuthResult.token_data.result_verify.employee_info != null) {
		req.body.employee_id = oAuthResult.token_data.result_verify.employee_info.id;
	}
}

async function milestone_Save(req, res) {
	var joResult;
	var oAuthResult = await _oAuthServiceInstance.verifyToken(req.headers['x-token'], req.headers['x-method']);

	if (oAuthResult.status_code == '00') {
		if (oAuthResult.token_data.status_code == '00') {
			var errors = validationResult(req).array();
			if (errors.length != 0) {
				joResult = JSON.stringify({ status_code: '-99', status_msg: 'Parameter value has problem', error_msg: errors });
			} else {
				_injectAuth(req, oAuthResult);
				joResult = await _milestoneServiceInstance.save(req.body);
				joResult.token_data = oAuthResult.token_data;
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

async function milestone_List(req, res) {
	var joResult;
	var oAuthResult = await _oAuthServiceInstance.verifyToken(req.headers['x-token'], req.headers['x-method']);

	if (oAuthResult.status_code == '00') {
		if (oAuthResult.token_data.status_code == '00') {
			var errors = validationResult(req).array();
			if (errors.length != 0) {
				joResult = JSON.stringify({ status_code: '-99', status_msg: 'Parameter value has problem', error_msg: errors });
			} else {
				joResult = await _milestoneServiceInstance.list(req.query);
				joResult.token_data = oAuthResult.token_data;
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

async function milestone_DropDown(req, res) {
	var joResult;
	var oAuthResult = await _oAuthServiceInstance.verifyToken(req.headers['x-token'], req.headers['x-method']);

	if (oAuthResult.status_code == '00') {
		if (oAuthResult.token_data.status_code == '00') {
			var errors = validationResult(req).array();
			if (errors.length != 0) {
				joResult = JSON.stringify({ status_code: '-99', status_msg: 'Parameter value has problem', error_msg: errors });
			} else {
				joResult = await _milestoneServiceInstance.dropDown(req.query);
				joResult.token_data = oAuthResult.token_data;
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

async function milestone_Delete(req, res) {
	var joResult;
	var oAuthResult = await _oAuthServiceInstance.verifyToken(req.headers['x-token'], req.headers['x-method']);

	if (oAuthResult.status_code == '00') {
		if (oAuthResult.token_data.status_code == '00') {
			var errors = validationResult(req).array();
			if (errors.length != 0) {
				joResult = JSON.stringify({ status_code: '-99', status_msg: 'Parameter value has problem', error_msg: errors });
			} else {
				req.params.user_id = oAuthResult.token_data.result_verify.id;
				req.params.user_name = oAuthResult.token_data.result_verify.name;
				joResult = await _milestoneServiceInstance.delete(req.params);
				joResult.token_data = oAuthResult.token_data;
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

async function _itemWriteHandler(req, res, serviceMethod) {
	var joResult;
	var oAuthResult = await _oAuthServiceInstance.verifyToken(req.headers['x-token'], req.headers['x-method']);

	if (oAuthResult.status_code == '00') {
		if (oAuthResult.token_data.status_code == '00') {
			var errors = validationResult(req).array();
			if (errors.length != 0) {
				joResult = JSON.stringify({ status_code: '-99', status_msg: 'Parameter value has problem', error_msg: errors });
			} else {
				_injectAuth(req, oAuthResult);
				joResult = await _milestoneServiceInstance[serviceMethod](req.body);
				joResult.token_data = oAuthResult.token_data;
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

async function item_MilestoneLink(req, res) {
	await _itemWriteHandler(req, res, 'linkItem');
}

async function item_MilestoneUnlink(req, res) {
	await _itemWriteHandler(req, res, 'unlinkItem');
}

async function item_MilestoneUpdateStatus(req, res) {
	await _itemWriteHandler(req, res, 'updateStatus');
}

async function item_MilestoneList(req, res) {
	var joResult;
	var oAuthResult = await _oAuthServiceInstance.verifyToken(req.headers['x-token'], req.headers['x-method']);

	if (oAuthResult.status_code == '00') {
		if (oAuthResult.token_data.status_code == '00') {
			var errors = validationResult(req).array();
			if (errors.length != 0) {
				joResult = JSON.stringify({ status_code: '-99', status_msg: 'Parameter value has problem', error_msg: errors });
			} else {
				joResult = await _milestoneServiceInstance.listByItem(req.query);
				joResult.token_data = oAuthResult.token_data;
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
