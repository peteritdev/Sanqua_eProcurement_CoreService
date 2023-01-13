'use strict';

module.exports = (sequelize, DataTypes) => {
	const PurchaseRequest = sequelize.define('tr_purchaserequests', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		request_no: DataTypes.STRING,
		employee_id: DataTypes.INTEGER,
		employee_name: DataTypes.STRING,
		department_id: DataTypes.INTEGER,
		department_name: DataTypes.STRING,
		reference_from_ecommerce: DataTypes.INTEGER,
		budget_is_approved: DataTypes.INTEGER,
		memo_special_request: DataTypes.INTEGER,
		status: DataTypes.INTEGER, //0 => draft, 1 => submit FPB, 2 => submit price, quotation and brochure
		requested_at: DataTypes.DATE,
		printed_fpb_at: DataTypes.DATE,
		submit_price_quotation_at: DataTypes.DATE,
		category_item: DataTypes.SMALLINT, // 1: Raw Material, 2: Factory supply, 3: Office Supply, 4: Sparepart, 5: Jasa, 6: Maintenance Repair, 7: Investment / Asset
		category_pr: DataTypes.STRING,

		total_qty: DataTypes.DOUBLE,
		total_price: DataTypes.DOUBLE,
		file: DataTypes.STRING,

		is_delete: DataTypes.INTEGER,
		deleted_at: DataTypes.DATE,
		deleted_by: DataTypes.INTEGER,
		deleted_by_name: DataTypes.STRING,

		cancel_at: DataTypes.DATE,
		cancel_by: DataTypes.INTEGER,
		cancel_by_name: DataTypes.STRING,
		cancel_reason: DataTypes.STRING,

		set_to_draft_at: DataTypes.DATE,
		set_to_draft_by: DataTypes.INTEGER,
		set_to_draft_by_name: DataTypes.STRING,

		closed_at: DataTypes.DATE,
		closed_by: DataTypes.INTEGER,
		closed_by_name: DataTypes.STRING,
		closed_reason: DataTypes.STRING,

		reject_reason: DataTypes.STRING,

		company_id: DataTypes.INTEGER,
		company_code: DataTypes.STRING,
		company_name: DataTypes.STRING,

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

	PurchaseRequest.associate = function(models) {
		PurchaseRequest.hasMany(models.tr_purchaserequestdetails, {
			foreignKey: 'request_id',
			as: 'purchase_request_detail'
		});
	};

	return PurchaseRequest;
};
