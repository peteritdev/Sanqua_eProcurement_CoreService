'use strict'

module.exports = ( sequelize, DataTypes ) => {
    const Vendor = sequelize.define( 'ms_vendors', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true 
        },

        code: DataTypes.STRING,
        name: DataTypes.STRING,
        logo: DataTypes.STRING,

        npwp: DataTypes.STRING,
        business_entity_id: DataTypes.INTEGER,
        classification_id: DataTypes.INTEGER,
        sub_classification_id: DataTypes.INTEGER,
        
        province_id: DataTypes.INTEGER,
        city_id: DataTypes.INTEGER,
        address: DataTypes.STRING,
        zip_code: DataTypes.STRING,

        phone1: DataTypes.STRING,
        phone2: DataTypes.STRING,
        email: DataTypes.STRING,
        website: DataTypes.STRING,
        about: DataTypes.STRING,
        location_lat: DataTypes.STRING,
        location_long: DataTypes.STRING,

        currency_id: DataTypes.INTEGER,
        
        status: DataTypes.INTEGER,

        inactive_at: DataTypes.INTEGER,
        inactive_reason: DataTypes.STRING,
        inactive_by: DataTypes.INTEGER,
        inactive_by_name: DataTypes.STRING,

        unblock_at: DataTypes.INTEGER,
        unblock_reason: DataTypes.STRING,
        unblock_by: DataTypes.INTEGER,
        unblock_by_name: DataTypes.STRING,

        register_via: DataTypes.INTEGER, // 1=> Backoffice, 2=>Public Portal
        tags: DataTypes.STRING,
        company_scale: DataTypes.INTEGER, // 1=> Kecil, 2=> Menengah, 3=>Besar

        avg_rate: DataTypes.DOUBLE,

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

    Vendor.associate = function(models){
        Vendor.belongsTo( models.ms_businessentities, {
            foreignKey: 'business_entity_id',
            as: 'business_entity',
            onDelete: 'CASCADE',
        } );

        Vendor.belongsTo( models.ms_classifications, {
            foreignKey: 'classification_id',
            as: 'classification',
            onDelete: 'CASCADE',
        } );

        Vendor.belongsTo( models.ms_subclassifications, {
            foreignKey: 'sub_classification_id',
            as: 'sub_classification',
            onDelete: 'CASCADE',
        } );

        Vendor.belongsTo( models.ms_provinces, {
            foreignKey: 'province_id',
            as: 'province',
            onDelete: 'CASCADE',
        } );

        Vendor.belongsTo( models.ms_cities, {
            foreignKey: 'city_id',
            as: 'city',
            onDelete: 'CASCADE',
        } );

        Vendor.belongsTo( models.ms_currencies, {
            foreignKey: 'currency_id',
            as: 'currency',
            onDelete: 'CASCADE',
        } );
    }

    return Vendor;
}   