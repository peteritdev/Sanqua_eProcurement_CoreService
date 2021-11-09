'use strict'

module.exports = (sequelize, DataTypes) => {
    const VendorCatalogue = sequelize.define('ms_vendorcatalogues', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        vendor_id: DataTypes.INTEGER,
        product_id: DataTypes.INTEGER,
        product_code: DataTypes.STRING,
        product_name: DataTypes.STRING,
        product_category_name: DataTypes.STRING,
        merk: DataTypes.STRING,
        file_brochure: DataTypes.STRING,
        description: DataTypes.STRING,
        uom_id: DataTypes.INTEGER,
        uom_name: DataTypes.STRING,
        purchase_uom_id: DataTypes.INTEGER,
        purchase_uom_name: DataTypes.STRING,

        currency_id: DataTypes.INTEGER,
        purchase_frequency: DataTypes.INTEGER,

        last_price: DataTypes.DOUBLE,
        last_ordered: DataTypes.DATE,
        last_purchase_plant: DataTypes.STRING,
        sync_from_odoo_at: DataTypes.DATE,


        catalogue_type: DataTypes.INTEGER, // 1: Bahan Baku, 2: Umum

        status: DataTypes.INTEGER,

        is_delete: DataTypes.INTEGER,
        deleted_at: DataTypes.DATE,
        deleted_by: DataTypes.INTEGER,
        deleted_by_name: DataTypes.STRING,

        createdAt: {
            type: DataTypes.DATE,
            defaultValue: sequelize.literal('NOW()'),
            field: 'created_at'
        },
        created_by: DataTypes.INTEGER,
        created_by_name: DataTypes.STRING,
        updatedAt: {
            type: DataTypes.DATE,
            field: 'updated_at'
        },
        updated_by: DataTypes.INTEGER,
        updated_by_name: DataTypes.STRING,
    });

    VendorCatalogue.associate = function (models) {
        VendorCatalogue.belongsTo(models.ms_products, {
            foreignKey: 'product_id',
            onDelete: 'CASCADE',
            as: 'product',
        });

        VendorCatalogue.belongsTo(models.ms_vendors, {
            foreignKey: 'vendor_id',
            onDelete: 'CASCADE',
            as: 'vendor',
        });

        VendorCatalogue.belongsTo(models.ms_currencies, {
            foreignKey: 'currency_id',
            onDelete: 'CASCADE',
            as: 'currency',
        });
    }

    return VendorCatalogue;
}