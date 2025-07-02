'use strict'

const sequelize = require("sequelize")

module.exports = ( sequelize, DataTypes ) => {
    const Subtitute = sequelize.define( 'log_fpbitemsubtitutes', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },

        pr_item_id: DataTypes.INTEGER,
        rab_item_id: DataTypes.INTEGER,
        reason: DataTypes.STRING,
        before: DataTypes.JSON,
        after: DataTypes.JSON,
        createdAt:{
            type: DataTypes.DATE,
            defaultValue: sequelize.literal('NOW()'),
            field: 'created_at'
        },
        created_by: DataTypes.INTEGER,
        created_by_name: DataTypes.STRING
    },{timestamps: false} );

    return Subtitute;
}