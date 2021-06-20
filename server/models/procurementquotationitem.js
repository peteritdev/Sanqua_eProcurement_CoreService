'use strict'

module.exports = (sequelize, DataTypes) => {
    const ProcurementQuotationItem = sequelize.define('tr_procurementquotationitems', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },

        procurement_vendor_id: DataTypes.INTEGER,
        product_id: DataTypes.INTEGER,
        unit_id: DataTypes.INTEGER,
        unit_price: DataTypes.DOUBLE,
        currency_id: DataTypes.INTEGER,
        qty: DataTypes.INTEGER,
        total: DataTypes.DOUBLE,
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
    });

    ProcurementQuotationItem.associate = function( models ){
        ProcurementQuotationItem.belongsTo( models.tr_procurementvendors, {
            foreignKey: 'procurement_vendor_id',
            as: 'procurement_vendor',
            onDelete: 'CASCADE',
        } );

        ProcurementQuotationItem.belongsTo( models.ms_products, {
            foreignKey: 'product_id',
            as: 'product',
            onDelete: 'CASCADE',
        } );

        ProcurementQuotationItem.belongsTo( models.ms_units, {
            foreignKey: 'unit_id',
            as: 'unit',
            onDelete: 'CASCADE',
        } );
    }

    return ProcurementQuotationItem;
}