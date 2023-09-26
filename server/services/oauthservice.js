const jwt = require('jsonwebtoken');
const md5 = require('md5');
const crypto = require('crypto');
const moment = require('moment');
const sequelize = require('sequelize');
const dateFormat = require('dateformat');
const Op = sequelize.Op;
const bcrypt = require('bcrypt');

const env = process.env.NODE_ENV || 'localhost';
const config = require(__dirname + '/../config/config.json')[env];

// Utility
const Util = require('peters-globallib-v2');
const { default: Axios } = require('axios');
const _utilInstance = new Util();

class OAuthService {
	constructor() {}

	async getCompanyDetail(pToken, pMethod, pId) {
		var xAPIUrl = config.api.eSanqua;
		var xQueryParam = `/master/universal/plant/detail/${pId}`;
		var xHeader = {
			headers: {
				'x-method': pMethod,
				'x-token': pToken
			}
		};
		console.log('>>> API URL : ' + (xAPIUrl + xQueryParam));
		var xResult = await _utilInstance.axiosRequest(xAPIUrl + xQueryParam, xHeader);

		return xResult;
	}

	async verifyToken(pToken, pMethod) {
		var xApiUrl = config.api.oAuth.url.verifyToken + '?token=' + pToken + '&method=' + pMethod;
		var xResultVerify = await _utilInstance.axiosRequest(xApiUrl, {});
		return xResultVerify;
	}

	async addApprovalMatrix(pMethod, pToken, pParam) {
		var xAPIUrl = config.api.oAuth.url.approval_matrix_document.save;
		// console.log(">>> API URL : " + xAPIUrl);
		var xHeader = {
			headers: {
				'x-method': pMethod,
				'x-token': pToken
			}
		};
		var xResultVerify = await _utilInstance.axiosRequestPost(xAPIUrl, 'POST', pParam, xHeader);

		return xResultVerify;
	}

	async getApprovalMatrix(pMethod, pToken, pParam) {
		var xAPIUrl = config.api.oAuth.url.approval_matrix_document.list;
		var xQueryParam = `?offset=0&limit=all&keyword=&application_id=${pParam.application_id}&table_name=${pParam.table_name}&document_id=${pParam.document_id}&${pParam.hasOwnProperty(
			'user_id'
		)
			? `user_id=${pParam.user_id}`
			: ''}`;
		var xHeader = {
			headers: {
				'x-method': pMethod,
				'x-token': pToken
			}
		};
		var xResultVerify = await _utilInstance.axiosRequest(xAPIUrl + xQueryParam, xHeader);

		return xResultVerify;
	}

	async confirmApprovalMatrix(pMethod, pToken, pParam) {
		var xAPIUrl = config.api.oAuth.url.approval_matrix_document.confirm;
		var xHeader = {
			headers: {
				'x-method': pMethod,
				'x-token': pToken
			}
		};
		var xResultVerify = await _utilInstance.axiosRequestPost(xAPIUrl, 'POST', pParam, xHeader);

		return xResultVerify;
	}

	async confirmApprovalMatrixViaEmail(pParam) {
		var xAPIUrl = config.api.oAuth.url.approval_matrix_document.confirm_via_email;
		var xResultVerify = await _utilInstance.axiosRequestPost(xAPIUrl, 'POST', pParam, {});

		return xResultVerify;
	}

	async getNotificationTemplate(pMethod, pToken, pCode) {
		var xAPIUrl = config.api.notification.notificationTemplate;
		var xQueryParam = `/${pCode}`;
		var xHeader = {
			headers: {
				'x-method': pMethod,
				'x-token': pToken
			}
		};
		// console.log(">>> API URL : " + (xAPIUrl+xQueryParam));
		var xResult = await _utilInstance.axiosRequest(xAPIUrl + xQueryParam, xHeader);

		return xResult;
	}

	// Odoo API
	async createPR(pParam) {
		var xAPIUrl = `${config.api.odoo}/create_prs`;
		var xHeader = {};
		var xResultVerify = await _utilInstance.axiosRequestPost(xAPIUrl, 'POST', pParam, xHeader);
		
		return xResultVerify;
	}

	async cancelPR(pParam) {
		var xAPIUrl = `${config.api.odoo}/cancel_prs`;
		var xHeader = {};
		var xResultVerify = await _utilInstance.axiosRequestPost(xAPIUrl, 'POST', pParam, xHeader);

		return xResultVerify;
	}

	async eSanQuaNotification(pMethod, pToken, pParam, pPath) {
		var xAPIUrl = `${config.api.eSanqua}${pPath}`;
		var xHeader = {
			headers: {
				'x-method': pMethod,
				'x-token': pToken
			}
		};
		var xResultVerify = await _utilInstance.axiosRequestPost(xAPIUrl, 'POST', pParam, xHeader);

		return xResultVerify;
	}
}

module.exports = OAuthService;
