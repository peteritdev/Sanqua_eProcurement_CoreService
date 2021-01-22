'use strict'

module.exports = ( sequelize, DataTypes ) => {
    const VendorCatalogueSpesification = sequelize.define( 'ms_vendorcataloguespesifications', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        vendor_catalogue_id: DataTypes.INTEGER,
        spesification_category_id: DataTypes.INTEGER,
        spesification_attribute_id: DataTypes.INTEGER,
        description: DataTypes.STRING,
        status: DataTypes.INTEGER,

        spesification_type: DataTypes.INTEGER, // 1: Bahan Baku, 2: Umum
        standard: DataTypes.STRING,
        unit_id: DataTypes.INTEGER,
        criteria: DataTypes.INTEGER, //1: Mayor, 2: Critical
        analysis_method: DataTypes.STRING,
        min_frequency_supplier: DataTypes.STRING,
        min_frequency_sanqua: DataTypes.STRING,
        
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

    VendorCatalogueSpesification.associate = function( models ){
        VendorCatalogueSpesification.belongsTo( models.ms_spesificationcategories, {
            foreignKey: 'spesification_category_id',
            as: 'spesification_category',
        } );

        VendorCatalogueSpesification.belongsTo( models.ms_spesificationattributes, {
            foreignKey: 'spesification_attribute_id',
            as: 'spesification_attribute',
        } );

        VendorCatalogueSpesification.belongsTo( models.ms_units, {
            foreignKey: 'unit_id',
            as: 'unit',
        } );
    }

    return VendorCatalogueSpesification;
}