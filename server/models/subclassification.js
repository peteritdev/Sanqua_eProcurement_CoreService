'use strict'

module.exports = ( sequelize, DataTypes ) => {
    const SubClassification = sequelize.define( 'ms_subclassifications', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true 
        },
        classification_id: DataTypes.INTEGER,
        parent_id: DataTypes.INTEGER,
        name: DataTypes.STRING,
        status: DataTypes.INTEGER,
        is_delete: DataTypes.INTEGER,
        status: DataTypes.INTEGER,
        is_delete: DataTypes.INTEGER,       

        createdAt:{
            type: DataTypes.DATE,
            defaultValue: sequelize.literal('NOW()'),
            field: 'created_at'
        },
        updatedAt:{
            type: DataTypes.DATE,
            field: 'updated_at'
        },

    } );
    
    SubClassification.associate = function (models){
        SubClassification.belongsTo( models.ms_classifications, {
            foreignKey: 'classification_id',
            as: 'classification',
            onDelete: 'CASCADE',

        } );

        SubClassification.hasMany( models.ms_subclassifications, {
            foreignKey: 'parent_id',
            as: 'sub_classification_2',
        } )
    }

    return SubClassification;
}