'use strict';

module.exports = (sequelize, DataTypes) => {
	const PaymentRequest = sequelize.define('tr_paymentrequests', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		purchase_request_id: DataTypes.INTEGER,
		document_no: DataTypes.STRING,
		employee_id: DataTypes.INTEGER,
		employee_name: DataTypes.STRING,
		company_id: DataTypes.INTEGER,
		company_code: DataTypes.STRING,
		company_name: DataTypes.STRING,
		department_id: DataTypes.INTEGER,
		department_name: DataTypes.STRING,
		payment_type: DataTypes.INTEGER,
		account_name: DataTypes.STRING,
		account_number: DataTypes.STRING,
		payreq_type: DataTypes.INTEGER,
		source_of_funds: DataTypes.STRING,
		vendor_id: DataTypes.INTEGER,
		vendor_name: DataTypes.STRING,
		ppn: DataTypes.DOUBLE,
		pph: DataTypes.DOUBLE,
		global_discount: DataTypes.DOUBLE,
		bank_name: DataTypes.STRING,
		total_qty: DataTypes.DOUBLE,
		total_price: DataTypes.DOUBLE,
		status: DataTypes.INTEGER,
		payment_desc: DataTypes.STRING,

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
		requested_at: DataTypes.DATE,
		canceled_at: DataTypes.DATE,
		set_to_draft_at: DataTypes.DATE,
		canceled_reason: DataTypes.STRING,
	});

	PaymentRequest.associate = function(models) {
		PaymentRequest.hasMany(models.tr_paymentrequestdetails, {
			foreignKey: 'payment_request_id',
			as: 'payment_request_detail'
		});
		PaymentRequest.belongsTo(models.tr_purchaserequests, {
			foreignKey: 'purchase_request_id',
			as: 'purchase_request'
		});
	};

	return PaymentRequest;
};
