const moment = require('moment');
const sequelize = require('sequelize');
const Op = sequelize.Op;
const env         = process.env.NODE_ENV || 'localhost';
const config      = require(__dirname + '/../config/config.json')[env];
const promise = require('promise');
const dateFormat = require('dateformat');

const modelSetting = require('../models').settings;
const libUtil = require('../libraries/utility.js');

function Setting(){

    this.getSettingByCode = function( code ){
        return new Promise( (resolve, reject) => {
            modelSetting.findOne( {
                where: {
                    code: code
                }
            } )
            .then( setting => {
                if( setting == null ){
                    var jsonResult = { status_code: '-99', status_msg: 'Setting tidak ditemukan' }
                    resolve(jsonResult);
                }else{
                    var jsonResult = { status_code: '00', status_msg: 'OK', value: setting.value }
                    resolve(jsonResult);
                }
            } )
            .catch( error => {
                libUtil.writeLog("Error 1 [setting.getSettingByCode]: " + error);
                var jsonResult = { status_code: '-99', status_msg: "Error 1 [setting.getSettingByCode] : " + error };
                resolve(jsonResult);
            } );
        } );
    }

}

module.exports = new Setting();