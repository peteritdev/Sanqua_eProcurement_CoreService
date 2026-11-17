'use strict';

module.exports = (sequelize, DataTypes) => {
	const Milestone = sequelize.define('tr_milestones', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		name: DataTypes.STRING,
		sort_order: DataTypes.INTEGER,
		status: DataTypes.INTEGER, // 0 => pending, 1 => in-progress, 2 => completed, 3 => blocked
		started_at: DataTypes.DATE,
		completed_at: DataTypes.DATE,
		note: DataTypes.TEXT,

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

	Milestone.associate = function (models) {
		Milestone.hasMany(models.tr_fpb_item_milestones, {
			foreignKey: 'milestone_id',
			as: 'fpb_item_milestones'
		});
	};

	return Milestone;
};
