'use strict'

module.exports = ( sequelize, DataTypes ) => {
    const Province = sequelize.define( 'ms_provinces', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: false, 
        },
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

    Province.associate = function(models){
        Province.hasMany( models.ms_cities, {
            foreignKey: 'province_id',
            as: 'city',
        } );
    }

    return Province;
}