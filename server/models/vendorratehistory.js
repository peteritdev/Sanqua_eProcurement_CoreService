'use strict'

module.exports = ( sequelize, DataTypes ) => {
    const VendorRateHistory = sequelize.define('tr_vendorratehistories', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        vendor_id: DataTypes.INTEGER,
        rate_date: DataTypes.DATEONLY,
        pic: DataTypes.STRING,
        harga: DataTypes.INTEGER,
        kualitas: DataTypes.INTEGER,
        pengiriman: DataTypes.INTEGER,
        kesesuaian_penawaran: DataTypes.INTEGER,
        komunikatif: DataTypes.INTEGER,
        avg_rate: DataTypes.DOUBLE,

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
    });

    return VendorRateHistory;
}