const jwt = require('jsonwebtoken');
const md5 = require('md5');
const crypto = require('crypto');
const moment = require('moment');
const Sequelize = require('sequelize');
const dateFormat = require('dateformat');
const Op = Sequelize.Op;
const bcrypt = require('bcrypt');
const fs = require('fs');

const env = process.env.NODE_ENV || 'localhost';
const config = require(__dirname + '/../config/config.json')[env];

// Utility
const Utility = require('peters-globallib-v2');
const _utilInstance = new Utility();

// Repository
const PurchaseRequestDetailRepository = require('../repository/purchaserequestdetailrepository.js');
const _prDetailInstance = new PurchaseRequestDetailRepository();

// Repository
const PurchaseRequestRepository = require('../repository/purchaserequestrepository.js');
const _prInstance = new PurchaseRequestRepository();

const _xClassName = 'SyncFromOdooService';

class SyncFromOdooService {
	constructor() {}

	// Status: -1: Reject, 2: PR (Approved)
	async updateStatusPR(pParam) {
		var xJoResult = {};
		try {
			if (pParam.hasOwnProperty('pr_no')) {
				if (pParam.pr_no != '') {
					let xReqDetail = await _prDetailInstance.getByParam({
						pr_no: pParam.pr_no
					});
					if (xReqDetail.status_code == '00') {
						let xParamUpdate = {
							pr_no: pParam.pr_no,
							status: pParam.status
						};
						xJoResult = await _prDetailInstance.save(xParamUpdate, 'update_by_pr_no');
					} else {
						xJoResult = xReqDetail;
					}
				}
			}
		} catch (e) {
			xJoResult = {
				status_code: '-99',
				status_msg: `Exception error <${_xClassName}.updateStatusPR>: ${e.message}`
			};
		}

		return xJoResult;
	}
}

module.exports = SyncFromOdooService;
