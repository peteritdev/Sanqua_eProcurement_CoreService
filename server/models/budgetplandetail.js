'use strict';

module.exports = (sequelize, DataTypes) => {
	const BudgetPlanDetail = sequelize.define('tr_budgetplandetails', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		request_id: DataTypes.INTEGER,
		product_id: DataTypes.INTEGER,
		product_code: DataTypes.STRING,
		product_name: DataTypes.STRING,
		category_id: DataTypes.INTEGER,
		category_name: DataTypes.STRING,
		dimension: DataTypes.STRING,
		merk: DataTypes.STRING,
		type: DataTypes.STRING,
		material: DataTypes.STRING,
		photo: DataTypes.STRING,
		description: DataTypes.STRING,
		qty: DataTypes.DOUBLE,
		qty_remain: DataTypes.DOUBLE,
		budget_price_per_unit: DataTypes.DOUBLE,
		budget_price_total: DataTypes.DOUBLE,
		uom_id: DataTypes.INTEGER,
		uom_name: DataTypes.STRING,
		estimate_date_use: DataTypes.INTEGER,
		vendor_id: DataTypes.INTEGER,
		vendor_code: DataTypes.STRING,
		vendor_name: DataTypes.STRING,
		vendor_recomendation: DataTypes.STRING,
		vendor_catalogue_id: DataTypes.BIGINT,
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
		updated_by_name: DataTypes.STRING
	});

	BudgetPlanDetail.associate = function(models) {
		BudgetPlanDetail.belongsTo(models.ms_products, {
			foreignKey: 'product_id',
			as: 'product',
			onDelete: 'CASCADE'
		});

		BudgetPlanDetail.belongsTo(models.ms_vendors, {
			foreignKey: 'vendor_id',
			as: 'vendor',
			onDelete: 'CASCADE'
		});

		BudgetPlanDetail.belongsTo(models.tr_budgetplans, {
			foreignKey: 'request_id',
			as: 'budget_plan',
			onDelete: 'CASCADE'
		});

		BudgetPlanDetail.belongsTo(models.ms_vendorcatalogues, {
			foreignKey: 'vendor_catalogue_id',
			as: 'vendor_catalogue',
			onDelete: 'CASCADE'
		});
	};

	return BudgetPlanDetail;
};
