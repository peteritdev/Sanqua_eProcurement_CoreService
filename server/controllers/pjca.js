// OAuth Service
const OAuthService = require('../services/oauthservice.js');
const _oAuthServiceInstance = new OAuthService();

// Service
const PJCAService = require('../services/pjcaservice.js');
const _serviceInstance = new PJCAService();

const PJCADetailService = require('../services/pjcadetailservice.js');
const _serviceDetailInstance = new PJCADetailService();

const env = process.env.NODE_ENV || 'localhost';
const config = require(__dirname + '/../config/config.json')[env];

const { check, validationResult } = require('express-validator');

module.exports = {
	PJCA_List,
	PJCA_Detail,
	PJCA_Save,
	PJCA_Submit,
	PJCA_SetToDraft,
	PJCA_Cancel,
	PJCA_Confirm,
	PJCA_Reject,
	// PJCA_Done,
	PJCA_FetchMatrix,

	PJCADetail_Save,
	PJCADetail_Delete,
	PJCA_UpdateFileUpload
};

async function PJCA_Detail(req, res) {
	var joResult;
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
				req.params.token = req.headers['x-token'];
				req.params.method = req.headers['x-method'];
				joResult = await _serviceInstance.detail(req.params);
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

async function PJCA_List(req, res) {
	var joResult;
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

async function PJCA_Save(req, res) {
	var joResult;
	var oAuthResult = await _oAuthServiceInstance.verifyToken(req.headers['x-token'], req.headers['x-method']);

	if (oAuthResult.status_code == '00') {
		if (oAuthResult.token_data.status_code == '00') {
			// Validate first
			var errors = validationResult(req).array();

			if (errors.length != 0 && req.body.act == 'add') {
				joResult = JSON.stringify({
					status_code: '-99',
					status_msg: 'Parameter value has problem',
					error_msg: errors
				});
			} else {
				req.body.user_id = oAuthResult.token_data.result_verify.id;
				req.body.user_name = oAuthResult.token_data.result_verify.name;

				// req.body.logged_company_code = oAuthResult.token_data.result_verify.company.alias;
				// req.body.logged_company_id = oAuthResult.token_data.result_verify.company.id;
				// req.body.logged_company_name = oAuthResult.token_data.result_verify.company.name;

				req.body.employee_id = oAuthResult.token_data.result_verify.employee_info.id;
				req.body.employee_name = oAuthResult.token_data.result_verify.employee_info.name;
				if (oAuthResult.token_data.result_verify.employee_info.department.hasOwnProperty('unit')) {
					if (oAuthResult.token_data.result_verify.employee_info.department.unit != null) {
						req.body.department_id = oAuthResult.token_data.result_verify.employee_info.department.unit.id;
						req.body.department_name =
							oAuthResult.token_data.result_verify.employee_info.department.unit.name;
					} else {
						if (oAuthResult.token_data.result_verify.employee_info.department.section != null) {
							req.body.department_id =
								oAuthResult.token_data.result_verify.employee_info.department.section.id;
							req.body.department_name =
								oAuthResult.token_data.result_verify.employee_info.department.section.name;
						}
					}
				} else {
					if (oAuthResult.token_data.result_verify.employee_info.department.section != null) {
						req.body.department_id =
							oAuthResult.token_data.result_verify.employee_info.department.section.id;
						req.body.department_name =
							oAuthResult.token_data.result_verify.employee_info.department.section.name;
					} else {
						req.body.department_id = oAuthResult.token_data.result_verify.employee_info.department.id;
						req.body.department_name = oAuthResult.token_data.result_verify.employee_info.department.name;
					}
				}

				req.body.token = req.headers['x-token'];
				req.body.method = req.headers['x-method'];
				joResult = await _serviceInstance.save(req.body);
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

async function PJCA_Submit(req, res) {
	var joResult;
	var oAuthResult = await _oAuthServiceInstance.verifyToken(req.headers['x-token'], req.headers['x-method']);

	if (oAuthResult.status_code == '00') {
		if (oAuthResult.token_data.status_code == '00') {
			// Validate first
			var errors = validationResult(req).array();

			if (errors.length != 0 && req.body.act == 'add') {
				joResult = JSON.stringify({
					status_code: '-99',
					status_msg: 'Parameter value has problem',
					error_msg: errors
				});
			} else {
				req.body.user_id = oAuthResult.token_data.result_verify.id;
				req.body.user_name = oAuthResult.token_data.result_verify.name;

				req.body.logged_employee_id = oAuthResult.token_data.result_verify.employee_info.id;
				req.body.logged_employee_name = oAuthResult.token_data.result_verify.employee_info.name;

				req.body.token = req.headers['x-token'];
				req.body.method = req.headers['x-method'];
				joResult = await _serviceInstance.submit(req.body);
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

async function PJCA_SetToDraft(req, res) {
	var joResult;
	var oAuthResult = await _oAuthServiceInstance.verifyToken(req.headers['x-token'], req.headers['x-method']);

	if (oAuthResult.status_code == '00') {
		if (oAuthResult.token_data.status_code == '00') {
			// Validate first
			var errors = validationResult(req).array();

			if (errors.length != 0 && req.body.act == 'add') {
				joResult = JSON.stringify({
					status_code: '-99',
					status_msg: 'Parameter value has problem',
					error_msg: errors
				});
			} else {
				req.body.user_id = oAuthResult.token_data.result_verify.id;
				req.body.user_name = oAuthResult.token_data.result_verify.name;

				req.body.logged_employee_id = oAuthResult.token_data.result_verify.employee_info.id;
				req.body.logged_employee_name = oAuthResult.token_data.result_verify.employee_info.name;

				req.body.token = req.headers['x-token'];
				req.body.method = req.headers['x-method'];
				joResult = await _serviceInstance.setToDraft(req.body);
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

async function PJCA_Cancel(req, res) {
	var joResult;
	var oAuthResult = await _oAuthServiceInstance.verifyToken(req.headers['x-token'], req.headers['x-method']);

	if (oAuthResult.status_code == '00') {
		if (oAuthResult.token_data.status_code == '00') {
			// Validate first
			var errors = validationResult(req).array();

			if (errors.length != 0 && req.body.act == 'add') {
				joResult = JSON.stringify({
					status_code: '-99',
					status_msg: 'Parameter value has problem',
					error_msg: errors
				});
			} else {
				req.body.user_id = oAuthResult.token_data.result_verify.id;
				req.body.user_name = oAuthResult.token_data.result_verify.name;

				req.body.logged_employee_id = oAuthResult.token_data.result_verify.employee_info.id;
				req.body.logged_employee_name = oAuthResult.token_data.result_verify.employee_info.name;

				req.body.token = req.headers['x-token'];
				req.body.method = req.headers['x-method'];
				joResult = await _serviceInstance.cancel(req.body);
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

async function PJCA_Confirm(req, res) {
	var joResult;
	var oAuthResult = await _oAuthServiceInstance.verifyToken(req.headers['x-token'], req.headers['x-method']);

	if (oAuthResult.status_code == '00') {
		if (oAuthResult.token_data.status_code == '00') {
			// Validate first
			var errors = validationResult(req).array();

			if (errors.length != 0 && req.body.act == 'add') {
				joResult = JSON.stringify({
					status_code: '-99',
					status_msg: 'Parameter value has problem',
					error_msg: errors
				});
			} else {
				req.body.user_id = oAuthResult.token_data.result_verify.id;
				req.body.user_name = oAuthResult.token_data.result_verify.name;

				req.body.logged_employee_id = oAuthResult.token_data.result_verify.employee_info.id;
				req.body.logged_employee_name = oAuthResult.token_data.result_verify.employee_info.name;

				req.body.token = req.headers['x-token'];
				req.body.method = req.headers['x-method'];
				joResult = await _serviceInstance.confirm(req.body);
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

async function PJCA_Reject(req, res) {
	var joResult;
	var oAuthResult = await _oAuthServiceInstance.verifyToken(req.headers['x-token'], req.headers['x-method']);

	if (oAuthResult.status_code == '00') {
		if (oAuthResult.token_data.status_code == '00') {
			// Validate first
			var errors = validationResult(req).array();

			if (errors.length != 0 && req.body.act == 'add') {
				joResult = JSON.stringify({
					status_code: '-99',
					status_msg: 'Parameter value has problem',
					error_msg: errors
				});
			} else {
				req.body.user_id = oAuthResult.token_data.result_verify.id;
				req.body.user_name = oAuthResult.token_data.result_verify.name;

				req.body.logged_employee_id = oAuthResult.token_data.result_verify.employee_info.id;
				req.body.logged_employee_name = oAuthResult.token_data.result_verify.employee_info.name;

				req.body.token = req.headers['x-token'];
				req.body.method = req.headers['x-method'];
				joResult = await _serviceInstance.reject(req.body);
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
// async function PJCA_Done(req, res) {
// 	var joResult;
// 	var oAuthResult = await _oAuthServiceInstance.verifyToken(req.headers['x-token'], req.headers['x-method']);

// 	if (oAuthResult.status_code == '00') {
// 		if (oAuthResult.token_data.status_code == '00') {
// 			// Validate first
// 			var errors = validationResult(req).array();

// 			if (errors.length != 0 && req.body.act == 'add') {
// 				joResult = JSON.stringify({
// 					status_code: '-99',
// 					status_msg: 'Parameter value has problem',
// 					error_msg: errors
// 				});
// 			} else {
// 				req.body.user_id = oAuthResult.token_data.result_verify.id;
// 				req.body.user_name = oAuthResult.token_data.result_verify.name;

// 				req.body.logged_employee_id = oAuthResult.token_data.result_verify.employee_info.id;
// 				req.body.logged_employee_name = oAuthResult.token_data.result_verify.employee_info.name;

// 				req.body.token = req.headers['x-token'];
// 				req.body.method = req.headers['x-method'];
// 				joResult = await _serviceInstance.done(req.body);
// 				joResult = JSON.stringify(joResult);
// 			}
// 		} else {
// 			joResult = JSON.stringify(oAuthResult);
// 		}
// 	} else {
// 		joResult = JSON.stringify(oAuthResult);
// 	}

// 	res.setHeader('Content-Type', 'application/json');
// 	res.status(200).send(joResult);
// }

async function PJCADetail_Save(req, res) {
	var joResult;
	var oAuthResult = await _oAuthServiceInstance.verifyToken(req.headers['x-token'], req.headers['x-method']);

	if (oAuthResult.status_code == '00') {
		if (oAuthResult.token_data.status_code == '00') {
			// Validate first
			var errors = validationResult(req).array();

			if (errors.length != 0 && req.body.act == 'add') {
				joResult = JSON.stringify({
					status_code: '-99',
					status_msg: 'Parameter value has problem',
					error_msg: errors
				});
			} else {
				req.body.user_id = oAuthResult.token_data.result_verify.id;
				req.body.user_name = oAuthResult.token_data.result_verify.name;
				req.body.employee_id = oAuthResult.token_data.result_verify.employee_info.id;
				req.body.employee_name = oAuthResult.token_data.result_verify.employee_info.name;
				req.body.token = req.headers['x-token'];
				req.body.method = req.headers['x-method'];
				joResult = await _serviceDetailInstance.save(req.body);
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

async function PJCADetail_Delete(req, res) {
	var joResult;
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
				req.params.token = req.headers['x-token'];
				req.params.method = req.headers['x-method'];
				joResult = await _serviceDetailInstance.delete(req.params);
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
async function PJCA_FetchMatrix(req, res) {
	var joResult;
	var oAuthResult = await _oAuthServiceInstance.verifyToken(req.headers['x-token'], req.headers['x-method']);

	if (oAuthResult.status_code == '00') {
		if (oAuthResult.token_data.status_code == '00') {
			// Validate first
			var errors = validationResult(req).array();

			if (errors.length != 0 && req.body.act == 'add') {
				joResult = JSON.stringify({
					status_code: '-99',
					status_msg: 'Parameter value has problem',
					error_msg: errors
				});
			} else {
				req.body.user_id = oAuthResult.token_data.result_verify.id;
				req.body.user_name = oAuthResult.token_data.result_verify.name;
				req.body.logged_company_id = oAuthResult.token_data.result_verify.employee_info.company.id;
				req.body.logged_company_name = oAuthResult.token_data.result_verify.employee_info.company.name;

				req.body.logged_department_id =
					oAuthResult.token_data.result_verify.employee_info.department.section.id;
				req.body.logged_department_name =
					oAuthResult.token_data.result_verify.employee_info.department.section.name;
				req.body.token = req.headers['x-token'];
				req.body.method = req.headers['x-method'];

				req.body.notification_via_fcm = oAuthResult.token_data.result_verify.notification_via_fcm;
				req.body.notification_via_email = oAuthResult.token_data.result_verify.notification_via_email;
				req.body.notification_via_wa = oAuthResult.token_data.result_verify.notification_via_wa;
				req.body.notification_via_telegram = oAuthResult.token_data.result_verify.notification_via_telegram;
				joResult = await _serviceInstance.fetchMatrixPjca(req.body);
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

async function PJCA_UpdateFileUpload(req, res) {
	var joResult;
	var oAuthResult = await _oAuthServiceInstance.verifyToken(req.headers['x-token'], req.headers['x-method']);

	if (oAuthResult.status_code == '00') {
		if (oAuthResult.token_data.status_code == '00') {
			// Validate first
			var errors = validationResult(req).array();

			if (errors.length != 0 && req.body.act == 'add') {
				joResult = JSON.stringify({
					status_code: '-99',
					status_msg: 'Parameter value has problem',
					error_msg: errors
				});
			} else {
				req.body.user_id = oAuthResult.token_data.result_verify.id;
				req.body.user_name = oAuthResult.token_data.result_verify.name;

				req.body.token = req.headers['x-token'];
				req.body.method = req.headers['x-method'];
				req.body.act = 'update';
				joResult = await _serviceInstance.save(req.body);
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