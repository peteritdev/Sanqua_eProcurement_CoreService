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
    }

    return VendorCatalogueSpesification;
}