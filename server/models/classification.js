'use strict'

module.exports = ( sequelize, DataTypes ) => {
    const Classification = sequelize.define( 'ms_classifications', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true 
        },
        name: DataTypes.STRING,
        status: DataTypes.INTEGER,
        is_delete: DataTypes.INTEGER,
        status: DataTypes.INTEGER,
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

    Classification.associate = function(models){
        Classification.hasMany( models.ms_subclassifications, {
            foreignKey: 'classification_id',
            as: 'sub_classification',
        } );
    }

    return Classification;
}