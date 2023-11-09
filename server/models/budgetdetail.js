'use strict';

module.exports = (sequelize, DataTypes) => {
	const BudgetDetail = sequelize.define('tr_budgetdetails', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		budget_id: DataTypes.INTEGER,
		vendor_catalogue_id: DataTypes.INTEGER,
		product_id: DataTypes.INTEGER,
		product_name: DataTypes.STRING,
		product_code: DataTypes.STRING,

		category_id: DataTypes.STRING,
		dimension: DataTypes.STRING,
		merk: DataTypes.STRING,
		type: DataTypes.STRING,
		material: DataTypes.STRING,
		photo: DataTypes.STRING,
		description: DataTypes.STRING,

		photo: DataTypes.STRING,
		purpose: DataTypes.STRING,
		qty: DataTypes.DOUBLE,
		uom_id: DataTypes.INTEGER,
		uom_name: DataTypes.STRING,
		unit_price: DataTypes.DOUBLE,
		total_price: DataTypes.DOUBLE,
		estimate_date_use: DataTypes.DATEONLY,
		vendor_recommendation: DataTypes.STRING,

		status: DataTypes.INTEGER,
		is_delete: DataTypes.INTEGER,

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

	BudgetDetail.associate = function(models) {
		BudgetDetail.belongsTo(models.ms_productcategories, {
			foreignKey: 'category_id',
			as: 'category',
			onDelete: 'CASCADE'
		});

		BudgetDetail.belongsTo(models.tr_budgets, {
			foreignKey: 'budget_id',
			as: 'budget',
			onDelete: 'CASCADE'
		});

		BudgetDetail.belongsTo(models.ms_vendorcatalogues, {
			foreignKey: 'vendor_catalogue_id',
			as: 'vendor_catalogue',
			onDelete: 'CASCADE'
		});
	};

	return BudgetDetail;
};
