'use strict';

module.exports = (sequelize, DataTypes) => {
	const PJCADetail = sequelize.define('tr_pjcadetails', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		pjca_id: DataTypes.INTEGER,
		product_id: DataTypes.INTEGER,
		product_code: DataTypes.STRING,
		product_name: DataTypes.STRING,
		uom_id: DataTypes.INTEGER,
		uom_name: DataTypes.STRING,
		qty_request: DataTypes.DOUBLE,
		qty_done: DataTypes.DOUBLE,
		price_request: DataTypes.DOUBLE,
		price_done: DataTypes.DOUBLE,
		discount_amount: DataTypes.DOUBLE,
		discount_percent: DataTypes.DOUBLE,
		tax: DataTypes.DOUBLE,
		price_total: DataTypes.DOUBLE,
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

	PJCADetail.associate = function(models) {
		PJCADetail.belongsTo(models.ms_products, {
			foreignKey: 'product_id',
			as: 'product',
			onDelete: 'CASCADE'
		});

		PJCADetail.belongsTo(models.tr_pjcas, {
			foreignKey: 'pjca_id',
			as: 'pjca',
			onDelete: 'CASCADE'
		});
	};

	return PJCADetail;
};
