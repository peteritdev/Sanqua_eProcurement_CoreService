'use strict'

module.exports = ( sequelize, DataTypes ) => {
    const VendorCatalogueQuotation = sequelize.define( 'ms_vendorcataloguequotations', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },

        vendor_catalogue_id: DataTypes.INTEGER,
        period_start: DataTypes.DATE,
        period_end: DataTypes.DATE,
        uom_id: DataTypes.INTEGER,
        uom_name: DataTypes.STRING,
        price_per_unit: DataTypes.DOUBLE,
        file_quotation: DataTypes.STRING,
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

    return VendorCatalogueQuotation;
}