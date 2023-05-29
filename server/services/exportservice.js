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
		var xDecId = null;
		var xFlagProcess = false;
		let xFPBId = 0;

		if (xJoResultFPB != null && xJoResultFPB.status_code == '00') {
			// Decrypt ID
			if (xJoResultFPB.data.id.length == 65) {
				xDecId = await _utilInstance.decrypt(xJoResultFPB.data.id, config.cryptoKey.hashKey);
				if (xDecId.status_code == '00') {
					xFPBId = xDecId.decrypted;
					xFlagProcess = true;
				}
			}

			if (xFlagProcess) {
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
							logo: config.basePathESanqua + '/company_logo/' + xCompanyDetail.token_data.data.logo,
							iso_purchase_request_no: xCompanyDetail.token_data.data.iso_purchase_request_no
						};
					}
				}

				let xCreator = null;
				let xApprover1 = null;
				let xApprover2 = null;
				let xApprover3 = null;
				let xApprover4 = null;
				let xApprover5 = null;
				let xApprover6 = null;
				let xStringQRCodeCreator = '';
				let xStringQRCodeApprover1 = '';
				let xStringQRCodeApprover2 = '';
				let xStringQRCodeApprover3 = '';
				let xStringQRCodeApprover4 = '';
				let xStringQRCodeApprover5 = '';
				let xStringQRCodeApprover6 = '';
				let xApprovalFinanceAccounting = null;
				let xFilePathQRCodeApproval = `${config.uploadBasePath}/digital_sign_qrcode/`;
				let xQRCodeFileNameCreator,
					xQRCodeFileName1 = [],
					xQRCodeFileName2 = [],
					xQRCodeFileName3 = [],
					xQRCodeFileName4 = [],
					xQRCodeFileName5 = [],
					xQRCodeFileName6 = [];

				xApprover1 =
					xJoResultFPB.data.approval_matrix != null
						? xJoResultFPB.data.approval_matrix.find((el) => el.sequence === 1)
						: null;
				xApprover2 =
					xJoResultFPB.data.approval_matrix != null
						? xJoResultFPB.data.approval_matrix.find((el) => el.sequence === 2)
						: null;
				xApprover3 =
					xJoResultFPB.data.approval_matrix != null
						? xJoResultFPB.data.approval_matrix.find((el) => el.sequence === 3)
						: null;
				xApprover4 =
					xJoResultFPB.data.approval_matrix != null
						? xJoResultFPB.data.approval_matrix.find((el) => el.sequence === 4)
						: null;
				xApprover5 =
					xJoResultFPB.data.approval_matrix != null
						? xJoResultFPB.data.approval_matrix.find((el) => el.sequence === 5)
						: null;
				// xApprover6 =
				// 	xJoResultFPB.data.approval_matrix != null
				// 		? xJoResultFPB.data.approval_matrix.find((el) => el.sequence === 6)
				// 		: null;

				// Generate QRCode Digital Sign

				let xApprovedUser1 = xApprover1.approver_user.filter((el) => el.status === 1);
				if (xApprover1 != null && xApprovedUser1 != null) {
					for (var i in xApprovedUser1) {
						xStringQRCodeApprover1 =
							`VALIDATE_SIGNATURE|PROC|` +
							(await _utilInstance.encrypt(
								`${xFPBId}|${xApprovedUser1[i].user.id}`,
								config.cryptoKey.hashKey
							));

						let xQRCodeApproval1 = await _qrCode.toDataURL(xStringQRCodeApprover1);
						xQRCodeFileName1.push(`approval_${xFPBId}${xApprovedUser1[i].user.id}.png`);
						_imageDataURI.outputFile(
							xQRCodeApproval1,
							xFilePathQRCodeApproval + `approval_${xFPBId}${xApprovedUser1[i].user.id}.png`
						);
					}
					// xStringQRCodeApprover1 =
					// 	`VALIDATE_SIGNATURE|PROC|` +
					// 	(await _utilInstance.encrypt(
					// 		`${xFPBId}|${xApprover1.approver_user.find((el) => el.status === 1).user.id}`,
					// 		config.cryptoKey.hashKey
					// 	));
					// let xQRCodeApproval1 = await _qrCode.toDataURL(xStringQRCodeApprover1);

					// xQRCodeFileName1 = `approval_${xFPBId}${xApprover1.approver_user.find((el) => el.status === 1).user
					// 	.id}.png`;
					// _imageDataURI.outputFile(xQRCodeApproval1, xFilePathQRCodeApproval + xQRCodeFileName1);

					let xUser = xApprover1.approver_user.filter((el) => el.status === 1);
					console.log(`>>> xUser: ${JSON.stringify(xUser)}`);
				}

				let xApprovedUser2 = xApprover2.approver_user.filter((el) => el.status === 1);
				if (xApprover2 != null && xApprovedUser2 != null) {
					for (var i in xApprovedUser2) {
						xStringQRCodeApprover2 =
							`VALIDATE_SIGNATURE|PROC|` +
							(await _utilInstance.encrypt(
								`${xFPBId}|${xApprovedUser2[i].user.id}`,
								config.cryptoKey.hashKey
							));

						let xQRCodeApproval2 = await _qrCode.toDataURL(xStringQRCodeApprover2);
						xQRCodeFileName2.push(`approval_${xFPBId}${xApprovedUser2[i].user.id}.png`);
						_imageDataURI.outputFile(
							xQRCodeApproval2,
							xFilePathQRCodeApproval + `approval_${xFPBId}${xApprovedUser2[i].user.id}.png`
						);
					}
				}
				// if (xApprover2 != null && xApprover2.approver_user.find((el) => el.status === 1) != null) {
				// 	xStringQRCodeApprover2 =
				// 		`VALIDATE_SIGNATURE|PROC|` +
				// 		(await _utilInstance.encrypt(
				// 			`${xFPBId}|${xApprover2.approver_user.find((el) => el.status === 1).user.id}`,
				// 			config.cryptoKey.hashKey
				// 		));
				// 	let xQRCodeApproval2 = await _qrCode.toDataURL(xStringQRCodeApprover2);
				// 	xQRCodeFileName2 = `approval_${xFPBId}${xApprover2.approver_user.find((el) => el.status === 1).user
				// 		.id}.png`;
				// 	_imageDataURI.outputFile(xQRCodeApproval2, xFilePathQRCodeApproval + xQRCodeFileName2);
				// }

				let xApprovedUser3 = xApprover3.approver_user.filter((el) => el.status === 1);
				if (xApprover3 != null && xApprovedUser3 != null) {
					for (var i in xApprovedUser3) {
						xStringQRCodeApprover3 =
							`VALIDATE_SIGNATURE|PROC|` +
							(await _utilInstance.encrypt(
								`${xFPBId}|${xApprovedUser3[i].user.id}`,
								config.cryptoKey.hashKey
							));

						let xQRCodeApproval3 = await _qrCode.toDataURL(xStringQRCodeApprover3);
						xQRCodeFileName3.push(`approval_${xFPBId}${xApprovedUser3[i].user.id}.png`);
						_imageDataURI.outputFile(
							xQRCodeApproval3,
							xFilePathQRCodeApproval + `approval_${xFPBId}${xApprovedUser3[i].user.id}.png`
						);
					}
				}

				// if (xApprover3 != null && xApprover3.approver_user.find((el) => el.status === 1) != null) {
				// 	xStringQRCodeApprover3 =
				// 		`VALIDATE_SIGNATURE|PROC|` +
				// 		(await _utilInstance.encrypt(
				// 			`${xFPBId}|${xApprover3.approver_user.find((el) => el.status === 1).user.id}`,
				// 			config.cryptoKey.hashKey
				// 		));
				// 	let xQRCodeApproval3 = await _qrCode.toDataURL(xStringQRCodeApprover3);
				// 	xQRCodeFileName3 = `approval_${xFPBId}${xApprover3.approver_user.find((el) => el.status === 1).user
				// 		.id}.png`;
				// 	_imageDataURI.outputFile(xQRCodeApproval3, xFilePathQRCodeApproval + xQRCodeFileName3);
				// }

				let xApprovedUser4 = xApprover2.approver_user.filter((el) => el.status === 1);
				if (xApprover4 != null && xApprovedUser4 != null) {
					for (var i in xApprovedUser4) {
						xStringQRCodeApprover4 =
							`VALIDATE_SIGNATURE|PROC|` +
							(await _utilInstance.encrypt(
								`${xFPBId}|${xApprovedUser4[i].user.id}`,
								config.cryptoKey.hashKey
							));

						let xQRCodeApproval4 = await _qrCode.toDataURL(xStringQRCodeApprover4);
						xQRCodeFileName4.push(`approval_${xFPBId}${xApprovedUser4[i].user.id}.png`);
						_imageDataURI.outputFile(
							xQRCodeApproval4,
							xFilePathQRCodeApproval + `approval_${xFPBId}${xApprovedUser4[i].user.id}.png`
						);
					}
				}

				// if (xApprover4 != null && xApprover4.approver_user.find((el) => el.status === 1) != null) {
				// 	xStringQRCodeApprover4 =
				// 		`VALIDATE_SIGNATURE|PROC|` +
				// 		(await _utilInstance.encrypt(
				// 			`${xFPBId}|${xApprover4.approver_user.find((el) => el.status === 1).user.id}`,
				// 			config.cryptoKey.hashKey
				// 		));
				// 	let xQRCodeApproval4 = await _qrCode.toDataURL(xStringQRCodeApprover4);
				// 	xQRCodeFileName4 = `approval_${xFPBId}${xApprover4.approver_user.find((el) => el.status === 1).user
				// 		.id}.png`;
				// 	_imageDataURI.outputFile(xQRCodeApproval4, xFilePathQRCodeApproval + xQRCodeFileName4);
				// }

				let xApprovedUser5 =
					xApprover5 != null ? xApprover5.approver_user.filter((el) => el.status === 1) : null;
				if (xApprover5 != null && xApprovedUser5 != null) {
					for (var i in xApprovedUser2) {
						xStringQRCodeApprover5 =
							`VALIDATE_SIGNATURE|PROC|` +
							(await _utilInstance.encrypt(
								`${xFPBId}|${xApprovedUser5[i].user.id}`,
								config.cryptoKey.hashKey
							));

						let xQRCodeApproval5 = await _qrCode.toDataURL(xStringQRCodeApprover5);
						xQRCodeFileName5.push(`approval_${xFPBId}${xApprovedUser5[i].user.id}.png`);
						_imageDataURI.outputFile(
							xQRCodeApproval5,
							xFilePathQRCodeApproval + `approval_${xFPBId}${xApprovedUser5[i].user.id}.png`
						);
					}
				}

				// if (xApprover5 != null && xApprover5.approver_user.find((el) => el.status === 1) != null) {
				// 	xStringQRCodeApprover5 =
				// 		`VALIDATE_SIGNATURE|PROC|` +
				// 		(await _utilInstance.encrypt(
				// 			`${xFPBId}|${xApprover5.approver_user.find((el) => el.status === 1).user.id}`,
				// 			config.cryptoKey.hashKey
				// 		));
				// 	let xQRCodeApproval5 = await _qrCode.toDataURL(xStringQRCodeApprover5);
				// 	xQRCodeFileName5 = `approval_${xFPBId}${xApprover5.approver_user.find((el) => el.status === 1).user
				// 		.id}.png`;
				// 	_imageDataURI.outputFile(xQRCodeApproval5, xFilePathQRCodeApproval + xQRCodeFileName5);
				// }

				// if (xApprover6 != null && xApprover6.approver_user.find((el) => el.status === 1) != null) {
				// 	xStringQRCodeApprover6 =
				// 		`VALIDATE_SIGNATURE|PROC|` +
				// 		(await _utilInstance.encrypt(
				// 			`${xFPBId}|${xApprover6.approver_user.find((el) => el.status === 1).user.id}`,
				// 			config.cryptoKey.hashKey
				// 		));
				// 	let xQRCodeApproval6 = await _qrCode.toDataURL(xStringQRCodeApprover6);
				// 	xQRCodeFileName6 = `approval_${xFPBId}${xApprover6.approver_user.find((el) => el.status === 1).user
				// 		.id}.png`;
				// 	_imageDataURI.outputFile(xQRCodeApproval6, xFilePathQRCodeApproval + xQRCodeFileName6);
				// }

				// console.log(`>>> xApprovalHeadDepartment: ${JSON.stringify(xApprovalHeadDepartment)}`);
				// console.log(`>>> xApprovalPM: ${JSON.stringify(xApprovalPM)}`);

				// console.log(`>>> Approver 1 : ${xApprovalHeadDepartment.approver_user[0].user.name}`);
				// console.log(`>>> Approver 2 : ${xApprovalPM.approver_user[0].user.name}`);

				// for (var i in xQRCodeFileName1) {
				// 	console.log(
				// 		`>>> url 1 : ` + `${config.imagePathESanQua_dev}/digital_sign_qrcode/${xQRCodeFileName1[i]}`
				// 	);
				// }

				// console.log(`>>> url 2 : ` + `${config.imagePathESanQua_dev}/digital_sign_qrcode/${xQRCodeFileName2}`);

				// console.log(
				// 	`>>> Approver 1 : ${JSON.stringify(xApprover1.approver_user.find((el) => el.status === 1))}`
				// );
				ejs.renderFile(
					path.join(__dirname, '../views/', 'fpb-pdf.ejs'),
					{
						data: xJoResultFPB,
						companyData: xCompanyData,
						imagePath: config.imagePath,
						// xApprover1 != null
						// 	? xApprover1.approver_user.find((el) => el.status === 1) == null
						// 		? ''
						// 		: xApprover1.approver_user.find((el) => el.status === 1).user.name
						// 	: '',

						approver1: xApprovedUser1,
						approver2: xApprovedUser2,
						approver3: xApprovedUser3,
						approver4: xApprovedUser4,
						approver5: xApprovedUser5,

						// approver6:
						// 	xApprover6 != null
						// 		? xApprover6.approver_user.find((el) => el.status === 1) == null
						// 			? ''
						// 			: xApprover6.approver_user.find((el) => el.status === 1).user.name
						// 		: '',
						qrCode: {
							qrPath: `${config.imagePathESanQua_dev}/digital_sign_qrcode/`,
							approval1: xQRCodeFileName1,
							approval2: xQRCodeFileName2,
							approval3: xQRCodeFileName3,
							approval4: xQRCodeFileName4,
							approval5: xQRCodeFileName5

							// approval2:
							// 	xApprover2 != null && xApprover2.approver_user.find((el) => el.status === 1) != null
							// 		? `${config.imagePathESanQua_dev}/digital_sign_qrcode/${xQRCodeFileName2}`
							// 		: '',

							// approval6:
							// 	xApprover6 != null && xApprover6.approver_user.find((el) => el.status === 1) != null
							// 		? `${config.imagePathESanQua_dev}/digital_sign_qrcode/${xQRCodeFileName6}`
							// 		: ''
						}
					},
					(err, data) => {
						var xOptions = {};

						xOptions = {
							width: '210mm',
							// height: '148.5mm',
							height: '297mm',
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
}

module.exports = ExportService;
