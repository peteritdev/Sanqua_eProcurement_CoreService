'use strict';

module.exports = (sequelize, DataTypes) => {
	const CashAdvanceResponsibilityDetail = sequelize.define('tr_cashadvanceresponsibilitydetails', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		cash_advance_responsibility_id: DataTypes.INTEGER,
		product_id: DataTypes.INTEGER,
		product_code: DataTypes.STRING,
		product_name: DataTypes.STRING,
		uom_id: DataTypes.INTEGER,
		uom_name: DataTypes.STRING,
		qty_request: DataTypes.DOUBLE,
		qty_done: DataTypes.DOUBLE,
		price_request: DataTypes.DOUBLE,
		price_done: DataTypes.DOUBLE,
		discount: DataTypes.DOUBLE,
		discount_percent: DataTypes.DOUBLE,
		tax: DataTypes.DOUBLE,
		total: DataTypes.DOUBLE,
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

	CashAdvanceResponsibilityDetail.associate = function(models) {
		CashAdvanceResponsibilityDetail.belongsTo(models.ms_products, {
			foreignKey: 'product_id',
			as: 'product',
			onDelete: 'CASCADE'
		});

		CashAdvanceResponsibilityDetail.belongsTo(models.tr_CashAdvanceResponsibilitys, {
			foreignKey: 'cash_advance_responsibility_id',
			as: 'cash_advance_responsibility',
			onDelete: 'CASCADE'
		});
	};

	return CashAdvanceResponsibilityDetail;
};
