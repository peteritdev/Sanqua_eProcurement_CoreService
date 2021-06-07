'use strict'

module.exports = ( sequelize, DataTypes ) => {
    const ProcurementItem = sequelize.define( 'tr_procurementitems', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        procurement_id: DataTypes.INTEGER,
        product_id: DataTypes.INTEGER,
        unit_id: DataTypes.INTEGER,
        unit_price: DataTypes.DOUBLE,
        currency_id: DataTypes.INTEGER,
        qty: DataTypes.INTEGER,
        total: DataTypes.DOUBLE,
        
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

    ProcurementItem.associate = function(models){
        ProcurementItem.belongsTo(models.tr_procurements, {
            foreignKey: 'procurement_id',
            as: 'procurement',
            onDelete: 'CASCADE',
        });

        ProcurementItem.belongsTo( models.ms_products, {
            foreignKey: 'product_id',
            as: 'product',
            onDelete: 'CASCADE',
        } );

        ProcurementItem.belongsTo( models.ms_units, {
            foreignKey: 'unit_id',
            as: 'unit',
            onDelete: 'CASCADE',
        } );

        ProcurementItem.belongsTo( models.ms_currencies, {
            foreignKey: 'currency_id',
            as: 'currency',
            onDelete: 'CASCADE',
        } );
    }

    return ProcurementItem;
}