'use strict';

module.exports = (sequelize, DataTypes) => {
	const PurchaseRequestDetail = sequelize.define('tr_purchaserequestdetails', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		request_id: DataTypes.INTEGER,
		product_id: DataTypes.INTEGER,
		product_code: DataTypes.STRING,
		product_name: DataTypes.STRING,
		qty: DataTypes.DOUBLE,
		qty_left: DataTypes.DOUBLE,
		qty_done: DataTypes.DOUBLE,
		current_stock: DataTypes.DOUBLE,
		budget_price_per_unit: DataTypes.DOUBLE,
		budget_price_total: DataTypes.DOUBLE,
		quotation_price_per_unit: DataTypes.DOUBLE,
		quotation_price_total: DataTypes.DOUBLE,
		vendor_id: DataTypes.INTEGER,
		has_budget: DataTypes.INTEGER,
		estimate_date_use: DataTypes.INTEGER,
		description: DataTypes.STRING,
		vendor_code: DataTypes.STRING,
		vendor_name: DataTypes.STRING,

		pr_no: DataTypes.STRING,
		vendor_catalogue_id: DataTypes.BIGINT,
		last_price: DataTypes.DOUBLE,

		uom_id: DataTypes.INTEGER,
		uom_name: DataTypes.STRING,

		estimate_fulfillment: DataTypes.DATE,

		status: DataTypes.INTEGER,
		is_delete: DataTypes.INTEGER,
		deleted_at: DataTypes.DATE,
		deleted_by: DataTypes.INTEGER,
		deleted_by_name: DataTypes.STRING,

		settodraft_at: DataTypes.DATE,
		settodraft_by: DataTypes.INTEGER,
		settodraft_by_name: DataTypes.STRING,
		settodraft_reason: DataTypes.STRING,
		cancel_reason: DataTypes.STRING,
		is_po_created: DataTypes.BOOLEAN,

		create_pr_at: DataTypes.DATE,
		create_pr_by: DataTypes.INTEGER,
		create_pr_by_name: DataTypes.STRING,
		cancel_pr_at: DataTypes.DATE,
		cancel_pr_by: DataTypes.INTEGER,
		cancel_pr_by_name: DataTypes.STRING,

		create_po_at: DataTypes.DATE,
		create_po_by_name: DataTypes.STRING,
		cancel_po_at: DataTypes.DATE,
		cancel_po_by_name: DataTypes.STRING,

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
		is_item_match_with_odoo: DataTypes.INTEGER,
		realization: DataTypes.DOUBLE,
		fulfillment_status: DataTypes.INTEGER,
	});

	PurchaseRequestDetail.associate = function(models) {
		PurchaseRequestDetail.belongsTo(models.ms_products, {
			foreignKey: 'product_id',
			as: 'product',
			onDelete: 'CASCADE'
		});

		PurchaseRequestDetail.belongsTo(models.ms_vendors, {
			foreignKey: 'vendor_id',
			as: 'vendor',
			onDelete: 'CASCADE'
		});

		PurchaseRequestDetail.belongsTo(models.tr_purchaserequests, {
			foreignKey: 'request_id',
			as: 'purchase_request',
			onDelete: 'CASCADE'
		});

		PurchaseRequestDetail.belongsTo(models.ms_vendorcatalogues, {
			foreignKey: 'vendor_catalogue_id',
			as: 'vendor_catalogue',
			onDelete: 'CASCADE'
		});
	};

	return PurchaseRequestDetail;
};
