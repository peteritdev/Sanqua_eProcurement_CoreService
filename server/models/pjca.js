'use strict';

module.exports = (sequelize, DataTypes) => {
	const PJCA = sequelize.define('tr_pjcas', {
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
		global_discount_percent: DataTypes.DOUBLE,
		delivery_costs: DataTypes.DOUBLE,
		service_costs: DataTypes.DOUBLE,
		other_costs: DataTypes.DOUBLE,
		tax: DataTypes.DOUBLE,
		total_qty_released: DataTypes.DOUBLE,
		total_price_released: DataTypes.DOUBLE,
		status: DataTypes.INTEGER,
		file: DataTypes.JSON,
		account_name: DataTypes.STRING,
		account_number: DataTypes.STRING,
		bank_name: DataTypes.STRING,
		current_approval_ids: DataTypes.JSON,

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
		canceled_at: DataTypes.DATE,
		canceled_reason: DataTypes.STRING,
		rejected_at: DataTypes.DATE,
		rejected_reason: DataTypes.STRING,
	});

	PJCA.associate = function(models) {
		PJCA.hasMany(models.tr_pjcadetails, {
			foreignKey: 'pjca_id',
			as: 'pjca_detail'
		});
		PJCA.belongsTo(models.tr_paymentrequests, {
			foreignKey: 'payment_request_id',
			as: 'payment_request'
		});
	};

	return PJCA;
};
