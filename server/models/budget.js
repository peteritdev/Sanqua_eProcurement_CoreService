'use strict';

module.exports = (sequelize, DataTypes) => {
	const Budget = sequelize.define('tr_budgets', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		code: DataTypes.STRING,
		name: DataTypes.STRING,
		project_id: DataTypes.INTEGER,
		company_name: DataTypes.STRING,
		employee_id: DataTypes.INTEGER,
		employee_name: DataTypes.STRING,
		nik: DataTypes.STRING,
		description: DataTypes.STRING,
		total_budget: DataTypes.NUMERIC,
		requested_at: DataTypes.DATE,
		approved_at: DataTypes.DATE,

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

	Budget.associate = function(models) {
		Budget.belongsTo(models.ms_projects, {
			foreignKey: 'project_id',
			as: 'project'
		});

		Budget.hasMany(models.tr_budgetdetails, {
			foreignKey: 'budget_id',
			as: 'budget_detail'
		});
	};

	return Budget;
};
