'use strict';

module.exports = (sequelize, DataTypes) => {
	const CashAdvanceResponsibility = sequelize.define('tr_cashadvanceresponsibilities', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		payment_request_id: DataTypes.INTEGER,
		document_no: DataTypes.STRING,
		employee_id: DataTypes.INTEGER,
		employee_name: DataTypes.STRING,
		company_id: DataTypes.INTEGER,
		company_code: DataTypes.STRING,
		company_name: DataTypes.STRING,
		department_id: DataTypes.INTEGER,
		department_name: DataTypes.STRING,
		to_department_id: DataTypes.INTEGER,
		to_department_name: DataTypes.STRING,
		global_discount: DataTypes.DOUBLE,
		tax: DataTypes.DOUBLE,
		total_qty_released: DataTypes.DOUBLE,
		total_price_released: DataTypes.DOUBLE,
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
		updated_by_name: DataTypes.STRING
	});

	CashAdvanceResponsibility.associate = function(models) {
		CashAdvanceResponsibility.hasMany(models.tr_cashadvanceresponsibilitydetails, {
			foreignKey: 'cash_advance_responsibility_id',
			as: 'cash_advance_responsibility_detail'
		});
	};

	return CashAdvanceResponsibility;
};
