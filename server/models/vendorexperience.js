'use strict'

module.exports = (sequelize, DataTypes) => {
    const VendorExperience = sequelize.define( 'ms_vendorexperiences', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true 
        },
        vendor_id: DataTypes.INTEGER,
        name: DataTypes.STRING,
        type: DataTypes.STRING,
        location: DataTypes.STRING,
        month: DataTypes.INTEGER,
        year: DataTypes.INTEGER,
        is_delete: DataTypes.INTEGER,

        deleted_at: DataTypes.DATE,
        deleted_by: DataTypes.INTEGER,
        deleted_by_name: DataTypes.INTEGER,

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

    return VendorExperience;
}