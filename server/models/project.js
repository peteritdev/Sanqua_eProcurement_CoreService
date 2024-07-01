'use strict';

module.exports = (sequelize, DataTypes) => {
	const Project = sequelize.define('ms_projects', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		name: DataTypes.STRING,
		code: DataTypes.STRING,
		odoo_project_code: DataTypes.STRING,
		company_id: DataTypes.INTEGER,
		company_name: DataTypes.STRING,
		employee_id: DataTypes.INTEGER,
		employee_name: DataTypes.STRING,
		description: DataTypes.STRING,

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

	// Project.associate = function(models) {
	// 	Project.hasMany(models.tr_budgets, {
	// 		foreignKey: 'project_id',
	// 		as: 'budget'
	// 	});
	// };

	return Project;
};
