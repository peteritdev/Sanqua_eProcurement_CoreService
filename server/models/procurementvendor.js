'use strict'

const sequelize = require("sequelize")

module.exports = ( sequelize, DataTypes ) => {
    const ProcurementVendor = sequelize.define( 'tr_procurementvendors', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        procurement_id: DataTypes.INTEGER,
        vendor_id: DataTypes.INTEGER,
        invited_at: DataTypes.DATE,
        confirmation_status: DataTypes.INTEGER, // 0 => pending, 1 => join, -1 => not join
        confirmation_at: DataTypes.INTEGER,
        confirmation_via: DataTypes.STRING, // 1 => link on email, 2 => vendor area, 3 => admin ecatalogue
        invited_by: DataTypes.INTEGER,
        invited_by_name: DataTypes.STRING,
        invited_counter: DataTypes.INTEGER,

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

    ProcurementVendor.associate = function( models ){
        ProcurementVendor.belongsTo( models.ms_vendors, {
            foreignKey: 'vendor_id',
            as: 'vendor',
            onDelete: 'CASCADE',
        } );

        ProcurementVendor.belongsTo( models.tr_procurements, {
            foreignKey: 'procurement_id',
            as: 'procurement',
            onDelete: 'CASCADE',
        } );
    }

    return ProcurementVendor;
    
}