'use strict';

module.exports = (sequelize, DataTypes) => {
	const GoodsReceiptDetail = sequelize.define('tr_goodsreceiptdetails', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		goods_receipt_id: DataTypes.INTEGER,
		product_id: DataTypes.INTEGER,
		product_code: DataTypes.STRING,
		product_name: DataTypes.STRING,
		uom_id: DataTypes.INTEGER,
		uom_name: DataTypes.STRING,
		// qty_demand: DataTypes.DOUBLE,
		// qty_request: DataTypes.DOUBLE,
		qty_done: DataTypes.DOUBLE,
		qty_return: DataTypes.DOUBLE,
		description: DataTypes.STRING,
		// payment_request_detail_id: DataTypes.INTEGER,
		payment_request_id: DataTypes.INTEGER,
		prd_id: DataTypes.INTEGER,
		status: DataTypes.INTEGER,
		is_delete: DataTypes.INTEGER,
		deleted_at: DataTypes.DATE,
		deleted_by: DataTypes.INTEGER,
		deleted_by_name: DataTypes.STRING,

		createdAt: {
			type: DataTypes.DATE,
			defaultValue: sequelize.literal('NOW()'),
			field: 'created_at'
		},
		created_by: DataTypes.INTEGER,
		created_by_name: DataTypes.STRING,
		updatedAt: {
			type: DataTypes.DATE,
			field: 'updated_at'
		},
		updated_by: DataTypes.INTEGER,
		updated_by_name: DataTypes.STRING,
	});

	GoodsReceiptDetail.associate = function(models) {
		GoodsReceiptDetail.belongsTo(models.ms_products, {
			foreignKey: 'product_id',
			as: 'product',
			onDelete: 'CASCADE'
		});

		GoodsReceiptDetail.belongsTo(models.tr_goodsreceipts, {
			foreignKey: 'goods_receipt_id',
			as: 'goods_receipt',
			onDelete: 'CASCADE'
		});

		// GoodsReceiptDetail.belongsTo(models.tr_paymentrequestdetails, {
		// 	foreignKey: 'pyrd_id',
		// 	as: 'payment_request_detail',
		// 	onDelete: 'CASCADE'
		// });
		GoodsReceiptDetail.belongsTo(models.tr_paymentrequests, {
			foreignKey: 'payment_request_id',
			as: 'payment_request',
			onDelete: 'CASCADE'
		});
		GoodsReceiptDetail.belongsTo(models.tr_purchaserequestdetails, {
			foreignKey: 'prd_id',
			as: 'purchase_request_detail',
			onDelete: 'CASCADE'
		});
	};

	return GoodsReceiptDetail;
};
