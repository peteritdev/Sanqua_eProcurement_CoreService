'use strict'

module.exports = ( sequelize, DataTypes ) => {
    const ProcurementEvaluation = sequelize.define( 'tr_procurementevaluations', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },

        procurement_id: DataTypes.INTEGER,
        evaluation_attribute_id: DataTypes.INTEGER,
        sequence: DataTypes.INTEGER,
        is_check: DataTypes.INTEGER,
        description: DataTypes.STRING,

        status: DataTypes.INTEGER,
        is_delete: DataTypes.INTEGER,
        deleted_at: DataTypes.DATE,
        deleted_by: DataTypes.INTEGER,
        deleted_by_name: DataTypes.STRING,

        createdAt:{
            type: DataTypes.DATE,
            defaultValue: sequelize.literal('NOW()'),
            field: 'created_at'
        },
        created_by: DataTypes.INTEGER,
        created_by_name: DataTypes.STRING,
        updatedAt:{
            type: DataTypes.DATE,
            field: 'updated_at'
        },
        updated_by: DataTypes.INTEGER,
        updated_by_name: DataTypes.STRING,
    } );

    ProcurementEvaluation.associate = function( models ){
        ProcurementEvaluation.belongsTo( models.tr_procurements, {
            foreignKey: 'procurement_id',
            as: 'procurement',
            onDelete: 'CASCADE',
        } );

        ProcurementEvaluation.belongsTo( models.ms_evaluationattributes, {
            foreignKey: 'evaluation_attribute_id',
            as: 'evaluation_attribute',
            onDelete: 'CASCADE',
        } );
    }

    return ProcurementEvaluation;
}