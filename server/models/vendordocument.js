'use strict'

module.exports = ( sequelize, DataTypes ) => {
    const VendorDocument = sequelize.define( 'ms_vendordocuments', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true 
        },
        document_type_id: DataTypes.INTEGER,
        vendor_id: DataTypes.INTEGER,
        document_no: DataTypes.STRING,
        date: DataTypes.DATEONLY,
        expire_date: DataTypes.DATEONLY,
        file: DataTypes.STRING,
        description: DataTypes.STRING,
        is_delete: DataTypes.INTEGER,

        instance: DataTypes.STRING,
        siup_qualification: DataTypes.INTEGER, //1: Kecil, 2: Menengah, 3: Besar, 4: Mikro
        address: DataTypes.STRING,

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

    }  );

    return VendorDocument;
}