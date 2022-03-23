'use strict';

module.exports = (sequelize, DataTypes) => {
	const ProductCategory = sequelize.define('ms_productcategories', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		erp_id: DataTypes.INTEGER,

		name: DataTypes.STRING,
		is_delete: DataTypes.INTEGER,
		photo: DataTypes.STRING,
		is_investment: DataTypes.INTEGER,

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

	return ProductCategory;
};
