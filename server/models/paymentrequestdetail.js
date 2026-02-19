'use strict';

module.exports = (sequelize, DataTypes) => {
	const PaymentRequestDetail = sequelize.define('tr_paymentrequestdetails', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		payment_request_id: DataTypes.INTEGER,
		prd_id: DataTypes.INTEGER,
		product_id: DataTypes.INTEGER,
		product_code: DataTypes.STRING,
		product_name: DataTypes.STRING,
		uom_id: DataTypes.INTEGER,
		uom_name: DataTypes.STRING,
		// qty_demand: DataTypes.DOUBLE,
		// price_demand: DataTypes.DOUBLE,
		qty_request: DataTypes.DOUBLE,
		price_request: DataTypes.DOUBLE,
		price_total: DataTypes.DOUBLE,
		qty_done: DataTypes.DOUBLE,
		tax_type: DataTypes.INTEGER,
		discount_amount: DataTypes.DOUBLE,
		discount_percent: DataTypes.DOUBLE,
		description: DataTypes.STRING,

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

	PaymentRequestDetail.associate = function(models) {
		PaymentRequestDetail.belongsTo(models.ms_products, {
			foreignKey: 'product_id',
			as: 'product',
			onDelete: 'CASCADE'
		});

		PaymentRequestDetail.belongsTo(models.tr_paymentrequests, {
			foreignKey: 'payment_request_id',
			as: 'payment_request',
			onDelete: 'CASCADE'
		});

		PaymentRequestDetail.belongsTo(models.tr_purchaserequestdetails, {
			foreignKey: 'prd_id',
			as: 'purchase_request_detail',
			onDelete: 'CASCADE'
		});
		
		PaymentRequestDetail.belongsTo(models.ms_taxes, {
			foreignKey: 'tax_type',
			as: 'tax',
			onDelete: 'CASCADE'
		});
		// PaymentRequestDetail.belongsTo(models.ms_vendorcatalogues, {
		// 	foreignKey: 'vendor_catalogue_id',
		// 	as: 'vendor_catalogue',
		// 	onDelete: 'CASCADE'
		// });
	};

	return PaymentRequestDetail;
};
