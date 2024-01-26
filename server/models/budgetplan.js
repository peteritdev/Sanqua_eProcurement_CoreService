'use strict';

module.exports = (sequelize, DataTypes) => {
	const BudgetPlan = sequelize.define('tr_budgetplans', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		request_no: DataTypes.STRING,
		name: DataTypes.STRING,
		project_id: DataTypes.INTEGER,
		project_name: DataTypes.STRING,
		project_code: DataTypes.STRING,
		company_id: DataTypes.INTEGER,
		company_name: DataTypes.STRING,
		department_id: DataTypes.INTEGER,
		department_name: DataTypes.STRING,
		employee_id: DataTypes.INTEGER,
		employee_nik: DataTypes.STRING,
		employee_name: DataTypes.STRING,
		pic_employee_id: DataTypes.INTEGER,
		pic_employee_nik: DataTypes.STRING,
		pic_employee_name: DataTypes.STRING,
		total_budget_plan: DataTypes.DOUBLE,
		total_plan_qty: DataTypes.DOUBLE,
		status: DataTypes.INTEGER,
		reject_reason: DataTypes.STRING,

		submitedAt: {
			type: DataTypes.DATE,
			field: 'submited_at'
		},
		submited_by: DataTypes.INTEGER,
		submited_by_name: DataTypes.STRING,

		is_delete: DataTypes.INTEGER,
		deletedAt: {
			type: DataTypes.DATE,
			field: 'deleted_at'
		},
		deleted_by: DataTypes.INTEGER,
		deleted_by_name: DataTypes.STRING,

		cancelAt: {
			type: DataTypes.DATE,
			field: 'cancel_at'
		},
		cancel_by: DataTypes.INTEGER,
		cancel_by_name: DataTypes.STRING,
		cancel_reason: DataTypes.STRING,

		set_to_draftAt: {
			type: DataTypes.DATE,
			field: 'set_to_draft_at'
		},
		set_to_draft_by: DataTypes.INTEGER,
		set_to_draft_by_name: DataTypes.STRING,

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
		receivedAt: {
			type: DataTypes.DATE,
			field: 'received_at'
		},
		received_by: DataTypes.INTEGER,
		received_by_name: DataTypes.STRING,
		doneAt: {
			type: DataTypes.DATE,
			field: 'done_at'
		},
		done_by: DataTypes.INTEGER,
		done_by_name: DataTypes.STRING,
	});

	BudgetPlan.associate = function(models) {
		BudgetPlan.hasMany(models.tr_budgetplandetails, {
			foreignKey: 'request_id',
			as: 'budget_plan_detail'
		});

		BudgetPlan.belongsTo(models.ms_projects, {
			foreignKey: 'project_id',
			as: 'project'
		});
	};

	return BudgetPlan;
};
