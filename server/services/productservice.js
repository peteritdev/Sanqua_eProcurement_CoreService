const jwt = require('jsonwebtoken');
const md5 = require('md5');
const crypto = require('crypto');
const moment = require('moment');
const sequelize = require('sequelize');
const dateFormat = require('dateformat');
const Op = sequelize.Op;
const bcrypt = require('bcrypt');
const fs = require('fs');

const env = process.env.NODE_ENV || 'localhost';
const config = require(__dirname + '/../config/config.json')[env];

// Model
const _modelUser = require('../models').ms_products;

//Repository
const ProductRepository = require('../repository/productrepository.js');
const _productRepoInstance = new ProductRepository();

//Util
const Utility = require('peters-globallib-v2');
const _utilInstance = new Utility();

const _multer = require('multer');
const _xlsToJson = require('xls-to-json-lc');
const _xlsxToJson = require('xlsx-to-json-lc');

// Service
const ProductCategoryService = require('../services/productcategoryservice.js');
const _productCategoryServiceInstance = new ProductCategoryService();

// Setup multer storage
var _storage = _multer.diskStorage({
	destination: function(req, file, cb) {
		cb(null, './uploads/');
	},
	filename: function(req, file, cb) {
		var dateTimeStamp = Date.now();
		cb(
			null,
			file.fieldname +
				'-' +
				dateTimeStamp +
				'.' +
				file.originalname.split('.')[file.originalname.split('.').length - 1]
		);
	}
});

var _upload = _multer({
	storage: _storage,
	fileFilter: function(req, file, callback) {
		if ([ 'xls', 'xlsx' ].indexOf(file.originalname.split('.')[file.originalname.split('.').length - 1]) === -1) {
			return callback(new Error('Wrong extension type'));
		}
		callback(null, true);
	}
}).single('file');

var _upload = _multer({
	storage: _storage
}).single('file');

class ProductService {
	constructor() {}

	async getByParameter(pParam) {
		return await _productRepoInstance.getByParameter(pParam);
	}

	async getById(pParam) {
		var xJoResult;
		var xFlag = true;
		var xProductPhotoPath = config.frontParam.photoPath.product;

		if (pParam.id != '' && pParam.id.length == 65) {
			var xDecId = await _utilInstance.decrypt(pParam.id, config.cryptoKey.hashKey);
			if (xDecId.status_code == '00') {
				pParam.id = xDecId.decrypted;
			} else {
				xFlag = false;
				xJoResult = xDecId;
			}
		}

		if (xFlag) {
			var xData = await _productRepoInstance.getProductById(pParam);
			if (xData != null) {
				xJoResult = {
					status_code: '00',
					status_msg: 'OK',
					data: {
						id: await _utilInstance.encrypt(xData.id, config.cryptoKey.hashKey),
						code: xData.code,
						category: xData.category,
						name: xData.name,
						unit: xData.unit,
						merk: xData.merk,
						spesification: xData.spesification,
						is_asset: xData.is_asset,
						photo_1: xData.photo_1 == '' ? null : xProductPhotoPath.product1 + xData.photo_1,
						photo_2: xData.photo_2 == '' ? null : xProductPhotoPath.product2 + xData.photo_2,
						photo_3: xData.photo_3 == '' ? null : xProductPhotoPath.product3 + xData.photo_3,
						photo_4: xData.photo_4 == '' ? null : xProductPhotoPath.product4 + xData.photo_4,
						photo_5: xData.photo_5 == '' ? null : xProductPhotoPath.product5 + xData.photo_5
					}
				};
			}
		}

		return xJoResult;
	}

	async uploadFromExcel(pReq, pRes) {
		var xExcelToJSON;
		_upload(pReq, pRes, function(pErr) {
			if (pErr) {
				var joResult = {
					status_code: '-99',
					status_msg: '',
					err_msg: pErr
				};

				try {
					fs.unlinkSync(pReq.file.path);
				} catch (e) {
					//error deleting the file
					console.log(e);
				}

				pRes.setHeader('Content-Type', 'application/json');
				pRes.status(200).send(joResult);
			}

			console.log(pReq.file);

			if (!pReq.file) {
				var joResult = {
					status_code: '-99',
					status_msg: '',
					err_msg: 'No file passed'
				};

				try {
					fs.unlinkSync(pReq.file.path);
				} catch (e) {
					//error deleting the file
					console.log(e);
				}

				pRes.setHeader('Content-Type', 'application/json');
				pRes.status(200).send(joResult);
			}

			//start convert process
			/** Check the extension of the incoming file and
             *  use the appropriate module
             */
			if (pReq.file.originalname.split('.')[pReq.file.originalname.split('.').length - 1] === 'xlsx') {
				console.log('>>> XLSX');
				xExcelToJSON = _xlsxToJson;
			} else {
				console.log('>>> XLS');
				xExcelToJSON = _xlsToJson;
			}

			try {
				console.log('>>> Path : ' + pReq.file.path);

				xExcelToJSON(
					{
						input: pReq.file.path, //the same path where we uploaded our file
						output: null, //since we don't need output.json
						lowerCaseHeaders: true
					},
					function(err, result) {
						if (err) {
							var joResult = {
								status_code: '-99',
								status_msg: '',
								err_msg: err
							};

							try {
								fs.unlinkSync(pReq.file.path);
							} catch (e) {
								//error deleting the file
								console.log(e);
							}

							pRes.setHeader('Content-Type', 'application/json');
							pRes.status(200).send(joResult);
						}
						var joResult = {
							status_code: '00',
							status_msg: 'OK',
							data: result,
							err_msg: null
						};

						try {
							fs.unlinkSync(pReq.file.path);
						} catch (e) {
							//error deleting the file
							console.log(e);
						}

						console.log(joResult);

						pRes.setHeader('Content-Type', 'application/json');
						pRes.status(200).send(joResult);
					}
				);
			} catch (e) {
				var joResult = {
					status_code: '-99',
					status_msg: '',
					err_msg: 'Corupted excel file'
				};

				try {
					fs.unlinkSync(pReq.file.path);
				} catch (e) {
					//error deleting the file
					console.log(e);
				}

				pRes.setHeader('Content-Type', 'application/json');
				pRes.status(200).send(joResult);
			}
		});
	}

	async batchSaveOdoo(pParam) {
		var joResult;
		var jaResult = [];
		var xFlagProcess = true;

		if (pParam.user_id != '') {
			var xDecId = await _utilInstance.decrypt(pParam.user_id, config.cryptoKey.hashKey);
			if (xDecId.status_code == '00') {
				pParam.user_id = xDecId.decrypted;
			} else {
				joResult = xDecId;
				xFlagProcess = false;
			}
		}

		if (xFlagProcess) {
			for (var i = 0; i < pParam.data.length; i++) {
				var xAddResult = {};
				var xCheckData = await _productRepoInstance.getProductByERPId(pParam.data[i]);

				// Get Product Category Id by ERP Category Id
				var xCategory = await _productCategoryServiceInstance.getProductCategoryByERPId({
					erp_id: pParam.data[i].erp_category_id
				});
				if (xCategory != null) {
					pParam.data[i].category_id = xCategory.id;
				}

				// console.log(">>> productservice:");
				// console.log(">>> xCheckData : " + JSON.stringify(xCheckData));
				// console.log(">>> xCategory : " + JSON.stringify(xCategory));
				// console.log(">>> pParam : " + JSON.stringify( pParam.data[i]));

				if (xCheckData != null) {
					// console.log(">>> Start : Update By ERP ID");
					pParam.data[i].updated_by = pParam.user_id;
					pParam.data[i].updated_by_name = pParam.user_name;
					pParam.data[i].is_delete = 0;
					xAddResult = await _productRepoInstance.save(pParam.data[i], 'update_by_erpid');
					// console.log(">>> End : Update By ERP ID");
				} else {
					pParam.data[i].created_by = pParam.user_id;
					pParam.data[i].created_by_name = pParam.user_name;
					pParam.data[i].is_delete = 0;
					xAddResult = await _productRepoInstance.save(pParam.data[i], 'add');
				}
				jaResult.push(xAddResult);
			}

			await _utilInstance.changeSequenceTable(pParam.data.length + 1, 'ms_products', 'id');

			joResult = {
				status_code: '00',
				status_msg: 'Finish save to database',
				line_saved: jaResult
			};
		}

		return joResult;
	}

	async batchSave(pParam) {
		var joResult;
		var jaResult = [];
		var xFlagProcess = true;

		var xCheckData_ProductByCode,
			xCheckData_ProductByName = null;
		var xStringMsg = '';

		if (pParam.user_id != '') {
			var xDecId = await _utilInstance.decrypt(pParam.user_id, config.cryptoKey.hashKey);
			if (xDecId.status_code == '00') {
				pParam.user_id = xDecId.decrypted;
			} else {
				joResult = xDecId;
				xFlagProcess = false;
			}
		}

		if (xFlagProcess) {
			for (var i = 0; i < pParam.data.length; i++) {
				xCheckData_ProductByCode = null;
				xCheckData_ProductByName = null;

				if (pParam.data[i].code != '') {
					if (pParam.data[i].hasOwnProperty('id')) {
						if (pParam.data[i].id != '') {
							// Decrypt the value first
							var xDecId = await _utilInstance.decrypt(pParam.data[i].id, config.cryptoKey.hashKey);
							if (xDecId.status_code == '00') {
								pParam.data[i].id = xDecId.decrypted;
							} else {
								xFlagProcess = false;
							}

							if (xFlagProcess) {
								// Check product_code is exists
								xCheckData_ProductByCode = await _productRepoInstance.getProductByCode({
									code: pParam.data[i].code,
									id: pParam.data[i].id
								});

								// if( xCheckData_ProductByCode == null ){
								//     pParam.data[i].act = "update";
								//     if( pParam.data[i].unit_id == '' ){
								//         delete pParam.data[i].unit_id;
								//     }
								//     var xAddResult = await _productRepoInstance.save( pParam.data[i], "update" );
								// }else{
								//     xStringMsg += "Row " + (i+1) + " product code " + pParam.data[i].code + " can not duplicate, <br>";
								// }

								pParam.data[i].act = 'update';
								if (pParam.data[i].unit_id == '') {
									delete pParam.data[i].unit_id;
								}
								var xAddResult = await _productRepoInstance.save(pParam.data[i], 'update');
							}
						}
					} else {
						// Check product_code is exists
						xCheckData_ProductByCode = await _productRepoInstance.getProductByCode({
							code: pParam.data[i].code
						});
						xCheckData_ProductByName = await _productRepoInstance.getProductByName({
							code: pParam.data[i].name
						});

						if (xCheckData_ProductByCode == null && xCheckData_ProductByName == null) {
							var xAddResult = await _productRepoInstance.save(pParam.data[i], 'add');
						} else {
							xStringMsg +=
								'Row ' + (i + 1) + ' product code ' + pParam.data[i].code + ' can not duplicate, <br>';
						}
					}
				} else {
					xStringMsg += 'Row ' + (i + 1) + ' product code can not be empty, \n';
				}
			}

			// await _utilInstance.changeSequenceTable((pParam.data.length)+1, 'ms_products','id');

			joResult = {
				status_code: '00',
				status_msg: 'Finish save to database',
				err_msg: xStringMsg
			};
		}

		return joResult;
	}

	async list(pParam) {
		var xJoResult = {};
		var xJoArrData = [];

		var xResultList = await _productRepoInstance.list(pParam);

		try {
			if (xResultList.count > 0) {
				var xRows = xResultList.rows;
				for (var index in xRows) {
					xJoArrData.push({
						id: await _utilInstance.encrypt(xRows[index].id.toString(), config.cryptoKey.hashKey),
						code: xRows[index].code,
						category: xRows[index].category,
						name: xRows[index].name,
						unit: xRows[index].unit,
						merk: xRows[index].merk,
						spesification: xRows[index].spesification,
						photo: {
							photo_1:
								xRows[index].photo_1 != null && xRows[index].photo_1 != ''
									? config.frontParam.photoPath.product.product1 + xRows[index].photo_1
									: null,
							photo_2:
								xRows[index].photo_2 != null && xRows[index].photo_2 != ''
									? config.frontParam.photoPath.product.product2 + xRows[index].photo_2
									: null,
							photo_3:
								xRows[index].photo_3 != null && xRows[index].photo_3 != ''
									? config.frontParam.photoPath.product.product3 + xRows[index].photo_3
									: null,
							photo_4:
								xRows[index].photo_4 != null && xRows[index].photo_4 != ''
									? config.frontParam.photoPath.product.product4 + xRows[index].photo_4
									: null,
							photo_5:
								xRows[index].photo_5 != null && xRows[index].photo_5 != ''
									? config.frontParam.photoPath.product.product5 + xRows[index].photo_5
									: null
						},
						is_asset: xRows[index].is_asset,
						created_at: xRows[index].createdAt,
						created_by_name: xRows[index].created_by_name,
						updated_at: xRows[index].updatedAt,
						updated_by_name: xRows[index].updated_by_name
					});
				}
				xJoResult = {
					status_code: '00',
					status_msg: 'OK',
					data: xJoArrData,
					total_record: xResultList.count
				};
			} else {
				xJoResult = {
					status_code: '-99',
					status_msg: 'Data not found'
				};
			}
		} catch (e) {
			xJoResult = {
				status_code: '-99',
				status_msg: 'Error : ' + e
			};
		}

		return xJoResult;
	}

	async dropDownList(pParam) {
		var xJoResult = {};
		var xJoArrData = [];

		var xResultList = await _productRepoInstance.list(pParam);

		if (xResultList.count > 0) {
			xJoResult.status_code = '00';
			xJoResult.status_msg = 'OK';

			var xRows = xResultList.rows;

			console.log(JSON.stringify(xRows));

			for (var index in xRows) {
				xJoArrData.push({
					id: xRows[index].id,
					code: xRows[index].code,
					name: xRows[index].name,
					unit: xRows[index].unit,
					category: xRows[index].category
				});
			}

			xJoResult.data = xJoArrData;
		} else {
			xJoResult.status_code = '00';
			xJoResult.status_msg = 'OK';
			xJoResult.data = xJoArrData;
		}

		return xJoResult;
	}

	async save(pParam) {
		var xJoResult;
		var xAct = pParam.act;
		var xFlagProcess = true;

		delete pParam.act;

		if (xAct == 'add') {
			// User Id
			var xDecId = await _utilInstance.decrypt(pParam.user_id, config.cryptoKey.hashKey);
			if (xDecId.status_code == '00') {
				pParam.created_by = xDecId.decrypted;
				pParam.created_by_name = pParam.user_name;
			} else {
				xFlagProcess = false;
				xJoResult = xDecId;
			}

			if (xFlagProcess) {
				var xAddResult = await _productRepoInstance.save(pParam, xAct);
				xJoResult = xAddResult;
			}
		} else if (xAct == 'update' || xAct == 'update_by_erpid') {
			var xDecId = await _utilInstance.decrypt(pParam.id, config.cryptoKey.hashKey);
			if (xDecId.status_code == '00') {
				pParam.id = xDecId.decrypted;
				xDecId = await _utilInstance.decrypt(pParam.user_id, config.cryptoKey.hashKey);
				if (xDecId.status_code == '00') {
					pParam.updated_by = xDecId.decrypted;
					pParam.updated_by_name = pParam.user_name;
				} else {
					xFlagProcess = false;
					xJoResult = xDecId;
				}
			} else {
				xFlagProcess = false;
				xJoResult = xDecId;
			}

			if (xFlagProcess) {
				var xAddResult = await _productRepoInstance.save(pParam, xAct);
				xJoResult = xAddResult;
			}
		}

		return xJoResult;
	}

	async delete(pParam) {
		var xJoResult;
		var xFlagProcess = true;

		var xDecId = await _utilInstance.decrypt(pParam.id, config.cryptoKey.hashKey);
		if (xDecId.status_code == '00') {
			pParam.id = xDecId.decrypted;
			xDecId = await _utilInstance.decrypt(pParam.user_id, config.cryptoKey.hashKey);
			if (xDecId.status_code == '00') {
				pParam.deleted_by = xDecId.decrypted;
				pParam.deleted_by_name = pParam.user_name;
			} else {
				xFlagProcess = false;
				xJoResult = xDecId;
			}
		} else {
			xFlagProcess = false;
			xJoResult = xDecId;
		}

		if (xFlagProcess) {
			var xDeleteResult = await _productRepoInstance.delete(pParam);
			xJoResult = xDeleteResult;
		}

		return xJoResult;
	}

	async upload(param) {
		try {
			console.log('>>> Req : ' + param.files);
			if (!req.files) {
				res.send({
					status: false,
					message: 'No file uploaded'
				});
			} else {
				let uploadedPhoto = param.files.attachment;
				uploadedPhoto.mv('../files/product_categories/' + uploadedPhoto.name);

				res.send({
					status: true,
					message: 'File successfully uploaded',
					data: {
						name: uploadedPhoto.name,
						mimetype: uploadedPhoto.mimetype,
						size: uploadedPhoto.size
					}
				});
			}
		} catch (e) {
			res.status(500).send(e);
		}
	}
}

module.exports = ProductService;
