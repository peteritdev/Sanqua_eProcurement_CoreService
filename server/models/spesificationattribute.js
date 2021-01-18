'use strict'

const sequelize = require("sequelize")

module.exports = ( sequelize, DataTypes ) => {
    const SpesificationAttribute = sequelize.define( 'ms_spesificationattributes', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        spesification_category_id: DataTypes.INTEGER,
        name: DataTypes.STRING,
        status: DataTypes.INTEGER,

        // attribute_type: DataTypes.INTEGER, //1: Bahan Baku, 2: Non Bahan Baku      

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

    SpesificationAttribute.associate = function(models){
        SpesificationAttribute.belongsTo( models.ms_spesificationcategories, {
            foreignKey: 'spesification_category_id',
            as: 'spesification_category',
            onDelete: 'CASCADE'
        } );
    };

    return SpesificationAttribute;
}