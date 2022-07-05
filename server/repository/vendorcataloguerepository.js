var env = process.env.NODE_ENV || 'localhost';
var config = require(__dirname + '/../config/config.json')[env];
var Sequelize = require('sequelize');
var sequelize = new Sequelize(config.database, config.username, config.password, config);
const { hash } = require('bcryptjs');
const Op = sequelize.Op;

// Model
const _modelDb = require('../models').ms_vendorcatalogues;
const _modelProduct = require('../models').ms_products;
const _modelProductCategory = require('../models').ms_productcategories;
const _modelVendor = require('../models').ms_vendors;
const _modelCurrency = require('../models').ms_currencies;
const _modelProvince = require('../models').ms_provinces;
const _modelCity = require('../models').ms_cities;

const Utility = require('peters-globallib-v2');
const _utilInstance = new Utility();

class VendorCatalogueRepository {
	constructor() {}

	async getByVendorCodeAndProductCode(pParam) {
		var xInclude = [];

		xInclude = [
			{
				attributes: [ 'id', 'name', 'code' ],
				model: _modelProduct,
				as: 'product'
			},
			{
				attributes: [ 'id', 'code', 'name' ],
				model: _modelVendor,
				as: 'vendor'
			},
			{
				attributes: [ 'id', 'code', 'name', 'symbol' ],
				model: _modelCurrency,
				as: 'currency'
			}
		];

		var xData = await _modelDb.findOne({
			where: {
				'$vendor.code$': pParam.vendor_code,
				'$product.code$': pParam.product_code,
				is_delete: 0
			},
			include: xInclude
		});

		return xData;
	}

	async getById(pParam) {
		var xInclude = [];
		xInclude = [
			{
				attributes: [ 'id', 'name' ],
				model: _modelProduct,
				as: 'product',
				include: [
					{
						attributes: [ 'id', 'name' ],
						model: _modelProductCategory,
						as: 'category'
					}
				]
			},
			{
				attributes: [ 'id', 'code', 'name', 'location_lat', 'location_long' ],
				model: _modelVendor,
				as: 'vendor'
			},
			{
				attributes: [ 'id', 'code', 'name', 'symbol' ],
				model: _modelCurrency,
				as: 'currency'
			}
		];

		var xData = await _modelDb.findOne({
			where: {
				id: pParam.id,
				is_delete: 0
			},
			include: xInclude
		});

		return xData;
	}

	async getTotalByVendorId(pVendorId) {
		var xData = await _modelDb.count({
			where: {
				vendor_id: pVendorId,
				is_delete: 0
			}
		});

		return xData;
	}

	async list(pParam) {
		var xOrder = [ 'product_name', 'ASC' ];
		var xWhereVendorId = {};
		var xWhereCategoryId = {};
		var xWhereProductId = {};
		var xInclude = [];

		if (pParam.order_by != '' && pParam.hasOwnProperty('order_by')) {
			xOrder = [ pParam.order_by, pParam.order_type == 'desc' ? 'DESC' : 'ASC' ];
		}

		if (pParam.hasOwnProperty('vendor_id')) {
			if (pParam.vendor_id != '') {
				xWhereVendorId = {
					vendor_id: pParam.vendor_id
				};
			}
		}

		if (pParam.hasOwnProperty('category_id')) {
			if (pParam.category_id != '') {
				xWhereCategoryId = {
					'$product.category_id$': pParam.category_id
				};
			}
		}

		if (pParam.hasOwnProperty('product_id') && pParam.hasOwnProperty('vendor_id')) {
			if (pParam.product_id != '' && pParam.vendor_id != '') {
				xWhereProductId = {
					product_id: pParam.product_id
				};

				xWhereVendorId = {
					vendor_id: {
						[Op.ne]: pParam.vendor_id
					}
				};
			}
		}

		xInclude = [
			{
				attributes: [ 'id', 'name', 'code', 'photo_1', 'photo_2', 'photo_3', 'photo_4', 'photo_5' ],
				model: _modelProduct,
				as: 'product',
				include: [
					{
						attributes: [ 'id', 'name' ],
						model: _modelProductCategory,
						as: 'category'
					}
				]
			},
			{
				attributes: [ 'id', 'code', 'name', 'avg_rate' ],
				model: _modelVendor,
				as: 'vendor'
			},
			{
				attributes: [ 'id', 'code', 'name', 'symbol' ],
				model: _modelCurrency,
				as: 'currency'
			}
		];

		var xParamQuery = {
			where: {
				[Op.and]: [
					{
						is_delete: 0
					},
					xWhereProductId,
					xWhereVendorId,
					xWhereCategoryId
				],
				[Op.or]: [
					{
						'$product.code$': {
							[Op.iLike]: '%' + pParam.keyword + '%'
						}
					},
					{
						'$product.name$': {
							[Op.iLike]: '%' + pParam.keyword + '%'
						}
					},
					{
						'$product.category.name$': {
							[Op.iLike]: '%' + pParam.keyword + '%'
						}
					},
					{
						merk: {
							[Op.iLike]: '%' + pParam.keyword + '%'
						}
					},
					{
						'$vendor.name$': {
							[Op.iLike]: '%' + pParam.keyword + '%'
						}
					},
					{
						'$vendor.code$': {
							[Op.iLike]: '%' + pParam.keyword + '%'
						}
					}
				]
			},
			include: xInclude,
			order: [ xOrder ]
		};

		if (pParam.hasOwnProperty('offset') && pParam.hasOwnProperty('limit')) {
			if (pParam.offset != '' && pParam.limit != '') {
				if (pParam.limit != 'all') {
					xParamQuery.offset = pParam.offset;
					xParamQuery.limit = pParam.limit;
				}
			}
		}

		var xData = await _modelDb.findAndCountAll(xParamQuery);

		return xData;
	}

	async list_new(pParam) {
		var xData,
			xTotalRecord = [];
		var xSql = '';
		var xObjJsonWhere = {};
		var xSqlWhere = ' (1=1) AND vc.is_delete = 0 AND pc.is_investment = 0 ';
		var xSqlOrderBy = '';
		var xSqlLimit = '';

		if (pParam.hasOwnProperty('order_by')) {
			if (pParam.order_by != '') {
				xSqlOrderBy = ` ORDER BY ${pParam.order_by} ${pParam.order_type != '' ? pParam.order_type : 'ASC'}`;
			} else {
				xSqlOrderBy = ` ORDER BY vc.updated_at DESC`;
			}
		} else {
			xSqlOrderBy = ` ORDER BY vc.updated_at DESC`;
		}

		if (pParam.hasOwnProperty('offset') && pParam.hasOwnProperty('limit')) {
			if (pParam.offset != '' && pParam.limit != '') {
				xSqlLimit = ` OFFSET ${pParam.offset} LIMIT ${pParam.limit} `;
			}
		}

		if (pParam.hasOwnProperty('vendor_id')) {
			if (pParam.vendor_id != '') {
				xSqlWhere += ' AND vc.vendor_id = :vendorId ';
				xObjJsonWhere.vendorId = pParam.vendor_id;
			}
		}

		if (pParam.hasOwnProperty('category_id')) {
			if (pParam.category_id != '') {
				xSqlWhere += ' AND p.category_id = :categoryId ';
				xObjJsonWhere.categoryId = pParam.category_id;
			}
		}

		if (pParam.hasOwnProperty('product_id') && pParam.hasOwnProperty('vendor_id')) {
			if (pParam.product_id != '' && pParam.vendor_id != '') {
				xSqlWhere += ' AND vc.product_id = :productId ';
				xObjJsonWhere.productId = pParam.product_id;

				xSqlWhere += ' AND vc.vendor_id <> :vendorId ';
				xObjJsonWhere.vendorId = pParam.vendor_id;
			}
		}

		if (pParam.hasOwnProperty('keyword')) {
			if (pParam.keyword != '') {
				xSqlWhere +=
					' AND ( ' +
					` to_tsvector(p.name) @@ websearch_to_tsquery('${pParam.keyword}') = TRUE ` +
					` OR to_tsvector(v.name) @@ websearch_to_tsquery('${pParam.keyword}') = TRUE ` +
					` OR to_tsvector(vc.merk) @@ websearch_to_tsquery('${pParam.keyword}') = TRUE ` +
					// ` OR to_tsvector(pc.name) @@ websearch_to_tsquery('${pParam.keyword}') = TRUE ` +
					// ` OR v.name LIKE '%${pParam.keyword}%' ` +
					` OR pc.name LIKE '%${pParam.keyword}%' ` +
					` OR p.code LIKE '%${pParam.keyword}%' ` +
					')';
			}
		}

		xSql =
			' SELECT p.id AS "product_id", p.name AS "product_name", p.code AS "product_code", p.photo_1 AS "product_photo_1", p.photo_2 AS "product_photo_2", p.photo_3 AS "product_photo_3", p.photo_4 AS "product_photo_4", p.photo_5 AS "product_photo_5", ' +
			' pc.id AS "category_id", pc.name AS "category_name", ' +
			' v.id AS "vendor_id", v.code AS "vendor_code", v.name AS "vendor_name", v.avg_rate AS "vendor_avg_rate", ' +
			' c.id AS "currency_id", c.code AS "currency_code", c.name AS "currency_name", c.symbol AS "currency_symbol", ' +
			' vc.id, vc.last_price, vc.last_ordered, vc.last_purchase_plant, vc.description, vc.uom_id, vc.uom_name, vc. purchase_uom_id, vc.purchase_uom_name, vc.catalogue_type, vc.merk, vc.file_brochure ' +
			' FROM ms_vendorcatalogues vc INNER JOIN ms_products p ' +
			'    ON vc.product_id = p.id ' +
			'        INNER JOIN ms_productcategories pc ON pc.id = p.category_id ' +
			'            INNER JOIN ms_vendors v ON v.id = vc.vendor_id ' +
			'               INNER JOIN ms_currencies c ON c.id = vc.currency_id ' +
			' WHERE ' +
			xSqlWhere +
			xSqlLimit +
			xSqlOrderBy;

		let xSqlCount =
			' SELECT COUNT(0) AS total_record ' +
			' FROM ms_vendorcatalogues vc INNER JOIN ms_products p ' +
			'    ON vc.product_id = p.id ' +
			'        INNER JOIN ms_productcategories pc ON pc.id = p.category_id ' +
			'            INNER JOIN ms_vendors v ON v.id = vc.vendor_id ' +
			'               INNER JOIN ms_currencies c ON c.id = vc.currency_id ' +
			' WHERE ' +
			xSqlWhere;

		xData = await sequelize.query(xSql, {
			replacements: xObjJsonWhere,
			type: sequelize.QueryTypes.SELECT
		});

		xTotalRecord = await sequelize.query(xSqlCount, {
			replacements: xObjJsonWhere,
			type: sequelize.QueryTypes.SELECT
		});

		console.log(`>>> Data : ${JSON.stringify(xData)}`);

		return {
			data: xData,
			total_record: xTotalRecord
		};
	}

	async save(pParam, pAct) {
		let xTransaction;
		var xJoResult = {};

		try {
			var xSaved = null;
			xTransaction = await sequelize.transaction();

			if (pAct == 'add') {
				pParam.status = 1;
				pParam.is_delete = 0;

				xSaved = await _modelDb.create(pParam, { xTransaction });

				if (xSaved.id != null) {
					await xTransaction.commit();

					xJoResult = {
						status_code: '00',
						status_msg: 'Data has been successfully saved',
						created_id: await _utilInstance.encrypt(xSaved.id, config.cryptoKey.hashKey)
					};
				} else {
					if (xTransaction) await xTransaction.rollback();

					xJoResult = {
						status_code: '-99',
						status_msg: 'Failed save to database'
					};
				}
			} else if (pAct == 'update') {
				pParam.updatedAt = await _utilInstance.getCurrDateTime();
				var xId = pParam.id;
				delete pParam.id;
				var xWhere = {
					where: {
						id: xId
					}
				};
				xSaved = await _modelDb.update(pParam, xWhere, { xTransaction });

				await xTransaction.commit();

				xJoResult = {
					status_code: '00',
					status_msg: 'Data has been successfully updated'
				};
			} else if (pAct == 'update_by_vendor_id_product_id') {
				pParam.updatedAt = await _utilInstance.getCurrDateTime();
				var xVendorId = pParam.vendor_id;
				var xProductId = pParam.product_id;
				delete pParam.vendor_id;
				delete pParam.product_id;
				var xWhere = {
					where: {
						product_id: xProductId,
						vendor_id: xVendorId
					}
				};
				xSaved = await _modelDb.update(pParam, xWhere, { xTransaction });

				await xTransaction.commit();

				xJoResult = {
					status_code: '00',
					status_msg: 'Data has been successfully updated'
				};
			}
		} catch (e) {
			if (xTransaction) await xTransaction.rollback();
			xJoResult = {
				status_code: '-99',
				status_msg: 'Failed save or update data. Error : ' + e,
				err_msg: e
			};
		}

		return xJoResult;
	}

	async delete(pParam) {
		let xTransaction;
		var xJoResult = {};

		try {
			var xSaved = null;
			xTransaction = await sequelize.transaction();

			xSaved = await _modelDb.update(
				{
					is_delete: 1,
					deleted_by: pParam.deleted_by,
					deleted_by_name: pParam.deleted_by_name,
					deleted_at: await _utilInstance.getCurrDateTime()
				},
				{
					where: {
						id: pParam.id
					}
				},
				{ xTransaction }
			);

			await xTransaction.commit();

			xJoResult = {
				status_code: '00',
				status_msg: 'Data has been successfully deleted'
			};

			return xJoResult;
		} catch (e) {
			if (xTransaction) await xTransaction.rollback();
			xJoResult = {
				status_code: '-99',
				status_msg: 'Failed save or update data',
				err_msg: e
			};

			return xJoResult;
		}
	}

	async getVendorByProductId(pParam) {
		var xOrder = [ 'product_name', 'ASC' ];
		var xWhereProductId = {};
		var xInclude = [];

		if (pParam.order_by != '' && pParam.hasOwnProperty('order_by')) {
			xOrder = [ pParam.order_by, pParam.order_type == 'desc' ? 'DESC' : 'ASC' ];
		}

		if (pParam.hasOwnProperty('product_id')) {
			if (pParam.product_id != '') {
				xWhereProductId = {
					product_id: {
						[Op.in]: JSON.parse(pParam.product_id)
					}
				};
			}
		}

		xInclude = [
			{
				attributes: [
					'id',
					'name',
					'code',
					'logo',
					'address',
					'zip_code',
					'phone1',
					'phone2',
					'email',
					'website',
					'location_lat',
					'location_long',
					'avg_rate'
				],
				model: _modelVendor,
				as: 'vendor',
				include: [
					{
						attributes: [ 'id', 'name' ],
						model: _modelProvince,
						as: 'province'
					},
					{
						attributes: [ 'id', 'name' ],
						model: _modelCity,
						as: 'city'
					}
				]
			},
			{
				attributes: [ 'id', 'code', 'name', 'symbol' ],
				model: _modelCurrency,
				as: 'currency'
			}
		];

		var xParamQuery = {
			where: {
				[Op.and]: [
					{
						is_delete: 0
					},
					xWhereProductId
				],
				[Op.or]: [
					{
						'$vendor.name$': {
							[Op.iLike]: '%' + pParam.keyword + '%'
						}
					},
					{
						'$vendor.province.name$': {
							[Op.iLike]: '%' + pParam.keyword + '%'
						}
					},
					{
						'$vendor.city.name$': {
							[Op.iLike]: '%' + pParam.keyword + '%'
						}
					},
					{
						'$vendor.address$': {
							[Op.iLike]: '%' + pParam.keyword + '%'
						}
					}
				]
			},
			include: xInclude,
			order: [ xOrder ]
		};

		if (pParam.hasOwnProperty('offset') && pParam.hasOwnProperty('limit')) {
			if (pParam.offset != '' && pParam.limit != '') {
				if (pParam.limit != 'all') {
					xParamQuery.offset = pParam.offset;
					xParamQuery.limit = pParam.limit;
				}
			}
		}

		var xData = await _modelDb.findAndCountAll(xParamQuery);

		return xData;
	}

	async getProductList(pParam) {
		var xJoResult = {};
		var xSql = '';
		var xObjJsonWhere = {};
		var xSqlWhere = ' (1=1) ';
		var xJsonWhere = {};

		try {
			if (pParam.hasOwnProperty('keyword')) {
				if (pParam.keyword != '') {
					pParam.keyword = '%' + pParam.keyword + '%';
					xSqlWhere +=
						' AND ( p.code iLIKE :productCode ' +
						' OR p.name iLIKE :productName ' +
						' OR v.code iLIKE :vendorCode ' +
						' OR v.name iLIKE :vendorName )';
					xJsonWhere.productCode = pParam.keyword;
					xJsonWhere.productName = pParam.keyword;
					xJsonWhere.vendorCode = pParam.keyword;
					xJsonWhere.vendorName = pParam.keyword;
				}
			}

			xSql =
				'select p.id as "product_id", \
                           p.code as "product_code", \
                           p.name as "product_name", \
                           v.id as "vendor_id", \
                           v.code as "vendor_code", \
                           v.name as "vendor_name" \
                    from ms_products p left join ms_vendorcatalogues vc \
                        on p.id = vc.product_id \
                            left join ms_vendors v on v.id = vc.vendor_id \
                    where ' +
				xSqlWhere +
				' order by p.name';

			var xDtQuery = await sequelize.query(xSql, {
				replacements: xJsonWhere,
				type: sequelize.QueryTypes.SELECT
			});

			xJoResult = {
				status_code: '00',
				status_msg: 'OK',
				data: xDtQuery
			};
		} catch (e) {
			xJoResult = {
				status_code: '-99',
				status_msg: 'Error get product list',
				err_msg: e
			};
		}

		return xJoResult;
	}
}

module.exports = VendorCatalogueRepository;
