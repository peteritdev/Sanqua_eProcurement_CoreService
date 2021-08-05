'use strict'

const sequelize = require("sequelize")

module.exports = ( sequelize, DataTypes ) => {
    const EvaluationAttribute = sequelize.define( 'ms_evaluationattributes', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: DataTypes.STRING,
        category_id: DataTypes.INTEGER,
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

    EvaluationAttribute.associate = function( models ){
        EvaluationAttribute.belongsTo( models.ms_evaluationcategories, {
            foreignKey: 'category_id',
            as: 'evaluation_category',
            onDelete: 'CASCADE',
        } );
    }

    return EvaluationAttribute;
}