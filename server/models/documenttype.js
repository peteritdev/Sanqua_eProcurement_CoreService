'use strict'

module.exports = (sequelize, DataTypes) => {
    const DocumentType = sequelize.define( 'ms_documenttypes', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: DataTypes.STRING,
        is_mandatory: DataTypes.INTEGER,
        is_delete: DataTypes.INTEGER,
        deleted_by: DataTypes.INTEGER,
        deleted_at: DataTypes.DATE,
        createdAt:{
            type: DataTypes.DATE,
            defaultValue: sequelize.literal('NOW()'),
            field: 'created_at'
        },
        created_by: DataTypes.INTEGER,
        updatedAt:{
            type: DataTypes.DATE,
            field: 'updated_at'
        },
        updated_by: DataTypes.INTEGER,
    } );

    return DocumentType;
}