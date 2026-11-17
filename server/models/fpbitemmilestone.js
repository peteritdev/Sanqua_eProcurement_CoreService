'use strict';

module.exports = (sequelize, DataTypes) => {
	const FpbItemMilestone = sequelize.define('tr_fpb_item_milestones', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		fpb_item_id: DataTypes.INTEGER, // tr_purchaserequestdetails.id
		milestone_id: DataTypes.INTEGER, // tr_milestones.id

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

	FpbItemMilestone.associate = function (models) {
		FpbItemMilestone.belongsTo(models.tr_milestones, {
			foreignKey: 'milestone_id',
			as: 'milestone'
		});
		FpbItemMilestone.belongsTo(models.tr_purchaserequestdetails, {
			foreignKey: 'fpb_item_id',
			as: 'fpb_item'
		});
	};

	return FpbItemMilestone;
};
