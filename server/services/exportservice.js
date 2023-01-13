let ejs = require('ejs');
let pdf = require('html-pdf');
let path = require('path');

const jwt = require('jsonwebtoken');
const md5 = require('md5');
const crypto = require('crypto');
const moment = require('moment');
const sequelize = require('sequelize');
const dateFormat = require('dateformat');
const Op = sequelize.Op;
const fs = require('fs');

var _qrCode = require('qrcode');
var _imageDataURI = require('image-data-uri');

const env = process.env.NODE_ENV || 'localhost';
const config = require(__dirname + '/../config/config.json')[env];

// Service
const PurchaseRequestHeader = require('../services/purchaserequestservice.js');
const _purchaseRequestServiceInstance = new PurchaseRequestHeader();

const OAuthService = require('../services/oauthservice.js');
const _oAuthService = new OAuthService();

// Utility
const Utility = require('peters-globallib-v2');
const _utilInstance = new Utility();

class ExportService {
	constructor() {}

	async generateFPB(pId, pMethod, pToken, pRes) {
		var xParam = {
			id: pId,
			method: pMethod,
			token: pToken
		};
		var xCompanyData = {};

		var xJoResultFPB = await _purchaseRequestServiceInstance.getById(xParam);

		console.log(`>>> xJoResultFPB : ${JSON.stringify(xJoResultFPB)}`);

		if (xJoResultFPB != null && xJoResultFPB.status_code == '00') {
			// Get Company Detail

			var xEncCompanyId = await _utilInstance.encrypt(
				xJoResultFPB.data.company.id.toString(),
				config.cryptoKey.hashKey
			);
			var xCompanyDetail = await _oAuthService.getCompanyDetail(pToken, pMethod, xEncCompanyId);
			if (xCompanyDetail != null) {
				// console.log(`>>> Token : ${pToken}`);
				// console.log(`>>> Token : ${pMethod}`);
				// console.log(`>>> Company : ${JSON.stringify(xCompanyDetail)}`);
				if (xCompanyDetail.status_code == '00') {
					xCompanyData = {
						logo: config.imagePathESanQua + '/esanqua/company_logo/' + xCompanyDetail.token_data.data.logo,
						iso_purchase_request_no: xCompanyDetail.token_data.data.iso_purchase_request_no
					};
				}
			}

			let xApprover1 = null;
			let xApprover2 = null;
			let xStringQRCodeApprover1 = '';
			let xStringQRCodeApprover2 = '';
			let xApprovalFinanceAccounting = null;
			let xFilePathQRCodeApproval = `${config.uploadBasePath}/digital_sign_qrcode/`;
			let xQRCodeFileName1,
				xQRCodeFileName2 = '';

			xApprover1 =
				xJoResultFPB.data.approval_matrix != null
					? xJoResultFPB.data.approval_matrix.find((el) => el.sequence === 1)
					: null;
			xApprover2 =
				xJoResultFPB.data.approval_matrix != null
					? xJoResultFPB.data.approval_matrix.find((el) => el.sequence === 2)
					: null;

			// Generate QRCode Digital Sign
			if (xApprover1 != null) {
				xStringQRCodeApprover1 =
					`VALIDATE_SIGNATURE|FPB|` +
					(await _utilInstance.encrypt(
						`${xJoResultFPB.data.id}|${xApprover1.approver_user[0].user.id}`,
						config.cryptoKey.hashKey
					));
				let xQRCodeApproval1 = await _qrCode.toDataURL(xStringQRCodeApprover1);
				xQRCodeFileName1 = `approval_${xJoResultFPB.data.id}${xApprover1.approver_user[0].user.id}.png`;
				_imageDataURI.outputFile(xQRCodeApproval1, xFilePathQRCodeApproval + xQRCodeFileName1);
			}

			if (xApprover2 != null) {
				xStringQRCodeApprover2 =
					`VALIDATE_SIGNATURE|FPB|` +
					(await _utilInstance.encrypt(
						`${xJoResultFPB.data.id}|${xApprover2.approver_user[0].user.id}`,
						config.cryptoKey.hashKey
					));
				let xQRCodeApproval2 = await _qrCode.toDataURL(xStringQRCodeApprover2);
				xQRCodeFileName2 = `approval_${xJoResultFPB.data.id}${xApprover2.approver_user[0].user.id}.png`;
				_imageDataURI.outputFile(xQRCodeApproval2, xFilePathQRCodeApproval + xQRCodeFileName2);
			}

			// console.log(`>>> xApprovalHeadDepartment: ${JSON.stringify(xApprovalHeadDepartment)}`);
			// console.log(`>>> xApprovalPM: ${JSON.stringify(xApprovalPM)}`);

			// console.log(`>>> Approver 1 : ${xApprovalHeadDepartment.approver_user[0].user.name}`);
			// console.log(`>>> Approver 2 : ${xApprovalPM.approver_user[0].user.name}`);

			console.log(`>>> url 1 : ` + `${config.imagePathESanQua_dev}/digital_sign_qrcode/${xQRCodeFileName1}`);
			console.log(`>>> url 2 : ` + `${config.imagePathESanQua_dev}/digital_sign_qrcode/${xQRCodeFileName2}`);
			ejs.renderFile(
				path.join(__dirname, '../views/', 'fpb-pdf.ejs'),
				{
					data: xJoResultFPB,
					companyData: xCompanyData,
					imagePath: config.imagePath,
					approver1: xApprover1.approver_user[0].user.name,
					approver2: xApprover2.approver_user[0].user.name,
					qrCode: {
						approval1: `${config.imagePathESanQua_dev}/digital_sign_qrcode/${xQRCodeFileName1}`,
						approval2: `${config.imagePathESanQua_dev}/digital_sign_qrcode/${xQRCodeFileName2}`
					}
				},
				(err, data) => {
					var xOptions = {};

					xOptions = {
						width: '210mm',
						height: '148.5mm',
						borders: '0.3cm'
					};

					var xFPBNo = xJoResultFPB.data.request_no.replace(/\//g, '-');
					var xFileName = `fpb-${xFPBNo}.pdf`;
					var xPathFile = `./generated_files/fpb/${xFileName}`;

					pdf.create(data, xOptions).toFile(xPathFile, function(err, data) {
						if (err) {
							pRes.send(err);
						} else {
							var xDirectoryPath = path.resolve(xPathFile);
							pRes.download(xDirectoryPath, xFileName, (err) => {
								if (err) {
									res.status(500).send({
										message: `Could not download the file. ${err}`
									});
								}
							});
						}
					});
				}
			);
		}
	}
}

module.exports = ExportService;
