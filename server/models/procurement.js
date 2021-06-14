'use strict'

module.exports = ( sequelize, DataTypes ) => {
    const Procurement = sequelize.define( 'tr_procurements', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        procurement_no: DataTypes.STRING,
        name: DataTypes.STRING,
        year: DataTypes.INTEGER,
        total_hps: DataTypes.DOUBLE,
        file: DataTypes.STRING,
        price_on_market: DataTypes.DOUBLE,
        period_start: DataTypes.DATEONLY,
        period_end: DataTypes.DATEONLY,
        total_working_days: DataTypes.INTEGER,
        validity_period_offer: DataTypes.INTEGER,
        qualification: DataTypes.STRING,

        business_fields: DataTypes.STRING,
        qualification_requirements: DataTypes.STRING,

        sub_total: DataTypes.DOUBLE,
        ppn: DataTypes.DOUBLE,
        grand_total: DataTypes.DOUBLE,

        cancel_at: DataTypes.DATE,
        cancel_by: DataTypes.INTEGER,
        cancel_by_name: DataTypes.STRING,

        set_to_draft_at: DataTypes.DATE,
        set_to_draft_by: DataTypes.INTEGER,
        set_to_draft_by_name: DataTypes.STRING,

        status: DataTypes.INTEGER, // 1=> Active, 0=> inactive, -1=> cancel
        status_approval: DataTypes.INTEGER, // 0=> Pending, 1=> approved by head department, -1 => rejected by head department, -2 => cancel by user

        company_id: DataTypes.INTEGER,
        company_name: DataTypes.STRING,
        department_id: DataTypes.INTEGER,
        department_name: DataTypes.STRING,

        submit_at: DataTypes.DATE,
        submit_by: DataTypes.INTEGER,
        submit_by_name: DataTypes.STRING,

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

    Procurement.associate = function( models ){
        Procurement.hasMany( models.tr_procurementitems, {
            foreignKey: 'procurement_id',
            as: 'procurement_item',
        } );

        Procurement.hasMany( models.tr_procurementschedules, {
            foreignKey: 'procurement_id',
            as: 'procurement_schedule',
        } );

        Procurement.hasMany( models.tr_procurementterms, {
            foreignKey: 'procurement_id',
            as: 'procurement_term',
        } );
    }

    return Procurement;
}