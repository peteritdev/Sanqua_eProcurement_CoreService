'use strict'

module.exports = ( sequelize, DataTypes ) => {
    const City = sequelize.define( 'ms_cities', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: false, 
        },
        province_id: DataTypes.INTEGER,
        name: DataTypes.STRING,
        createdAt:{
            type: DataTypes.DATE,
            defaultValue: sequelize.literal('NOW()'),
            field: 'created_at'
        },
        updatedAt:{
            type: DataTypes.DATE,
            field: 'updated_at'
        },
    } );

    return City;
}