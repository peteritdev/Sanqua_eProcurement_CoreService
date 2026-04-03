const jwt = require('jsonwebtoken');
const md5 = require('md5');
const crypto = require('crypto');
const moment = require('moment');
const sequelize = require('sequelize');
const dateFormat = require('dateformat');
const Op = sequelize.Op;
const bcrypt = require('bcrypt');

const env         = process.env.NODE_ENV || 'localhost';
const config      = require(__dirname + '/../config/config.json')[env];

// Utility
const Utility = require('peters-globallib-v2');
const _utilInstance = new Utility();


// Repository
const CurrencyRepository = require('../repository/currencyrepository.js');
const _repoInstance = new CurrencyRepository();

class CurrencyService {
    constructor(){}

    async getById( pParam ){
        var xJoResult = {};
        var xFlagProcess = true;

        var xDecId = await _utilInstance.decrypt( pParam.id, config.cryptoKey.hashKey );
        if( xDecId.status_code == '00' ){
            pParam.id = xDecId.decrypted;
        }else{
            xFlagProcess = false;
            xJoResult = xDecId;
        }

        if( xFlagProcess ){
            var xResultList = await _repoInstance.getById( pParam );
            if( xResultList != null ){
                xJoResult = {
                    status_code: '00',
                    status_message: 'OK',
                    data: {
                        id: await _utilInstance.encrypt( xResultList.id, config.cryptoKey.hashKey ),
                        name: xResultList.name,
                        code: xResultList.code,
                        symbol: xResultList.symbol,
                        createdAt: moment( xResultList.createdAt ).format('DD-MM-YYYY HH:mm:ss'),
                        updatedAt: moment( xResultList.updatedAt ).format('DD-MM-YYYY HH:mm:ss'),
                    }
                }
            }else{
                xJoResult = {
                    status_code: '-99',
                    status_message: 'Data not found',
                }
            }
        }

        return xJoResult;
    } 

    async list( pParam  ){
        var xJoResult = {};
        var xJoArrData = [];
        var xFlagProcess = true;
        
        var xResultList = await _repoInstance.list(pParam);

            if( xResultList.count > 0 ){
                var xRows = xResultList.rows;
                for( var index in xRows ){
                    xJoArrData.push({
                        id: await _utilInstance.encrypt( (xRows[index].id).toString(), config.cryptoKey.hashKey ),
                        name: xRows[index].name,
                        code: xRows[index].code,
                        symbol: xRows[index].symbol,
                        createdAt: moment( xRows[index].createdAt ).format('DD-MM-YYYY HH:mm:ss'),
                        updatedAt: moment( xRows[index].updatedAt ).format('DD-MM-YYYY HH:mm:ss'),
                    });
                }
                xJoResult = {
                    status_code: "00",
                    status_msg: "OK",
                    total_record: xResultList.count,
                    data: xJoArrData,
                }
            }else{
                xJoResult = {
                    status_code: "-99",
                    status_msg: "Data not found",
                };
            }

        return xJoResult;
    }

    async save( pParam ){
        var xJoResult;
        var xAct = pParam.act;
        var xFlagProcess = true;

        delete pParam.act;

        if( xAct == "add" ){            

            // User Id
            var xDecId = await _utilInstance.decrypt(pParam.user_id,config.cryptoKey.hashKey);
            pParam.created_by = xDecId.decrypted;
            pParam.created_by_name = pParam.user_name;

            // Add to Vendor Rate history table
            var xAddResult = await _repoInstance.save( pParam, xAct );

            xJoResult = xAddResult;
        }else if( xAct == "update" ){

            var xDecId = await _utilInstance.decrypt(pParam.id,config.cryptoKey.hashKey);
            if( xDecId.status_code == "00" ){
                pParam.id = xDecId.decrypted;                    
                xDecId = await _utilInstance.decrypt(pParam.user_id,config.cryptoKey.hashKey);
                if( xDecId.status_code == "00" ){
                    pParam.updated_by = xDecId.decrypted;
                    pParam.updated_by_name = pParam.user_name;
                }else{
                    xFlagProcess = false;
                    xJoResult = xDecId;
                }
            }else{
                xFlagProcess = false;
                xJoResult = xDecId;
            }

            if( xFlagProcess ){
                var xAddResult = await _repoInstance.save( pParam, xAct );
                xJoResult = xAddResult;
            }
            
        }          

        return xJoResult;
    }

    async delete( pParam ){
        var xJoResult;
        var xFlagProcess = true;       

        var xDecId = await _utilInstance.decrypt(pParam.id,config.cryptoKey.hashKey);
        if( xDecId.status_code == "00" ){
            pParam.id = xDecId.decrypted;                    
            xDecId = await _utilInstance.decrypt(pParam.user_id,config.cryptoKey.hashKey);
            if( xDecId.status_code == "00" ){
                pParam.deleted_by = xDecId.decrypted;
                pParam.deleted_by_name = pParam.user_name;
            }else{
                xFlagProcess = false;
                xJoResult = xDecId;
            }
        }else{
            xFlagProcess = false;
            xJoResult = xDecId;
        }

        if( xFlagProcess ){

            var xDeleteResult = await _repoInstance.delete( pParam );
            xJoResult = xDeleteResult;
            
        }

        return xJoResult;

    }

    async dropDownList(pParam){
        var xJoResult = {};
        var xJoArrData = [];  
        var xFlagProcess = true;     

        if( xFlagProcess ){

            var xResultList = await _repoInstance.list(pParam);

            if( xResultList.count > 0 ){
                xJoResult.status_code = "00";
                xJoResult.status_msg = "OK";

                var xRows = xResultList.rows;

                for(var index in xRows){                

                    xJoArrData.push({
                        id: xRows[index].id,
                        code: xRows[index].code,
                        symbol: xRows[index].symbol,
                    });
                }

                xJoResult.data = xJoArrData;
            }else{
                xJoResult.status_code = "00";
                xJoResult.status_msg = "OK";
                xJoResult.data = xJoArrData;
            }

        }        

        return (xJoResult);
    }

    async terbilang(pParam) {
        const bilangan = [
            "", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan",
            "Sepuluh", "Sebelas"
        ];
        const pecahan = ["", "Ribu", "Juta", "Miliar", "Triliun"];

        function convert(number) {
            if (number == 0) return "";
            if (number < 12) return bilangan[number];
            if (number < 20) return bilangan[number - 10] + " Belas";
            if (number < 100) {
                const sisa = number % 10;
                return bilangan[Math.floor(number / 10)] + " Puluh" + (sisa ? " " + convert(sisa) : "");
            }
            if (number < 1000) {
                const sisa = number % 100;
                if (Math.floor(number / 100) === 1) {
                    return "Seratus" + (sisa ? " " + convert(sisa) : "");
                }
                return bilangan[Math.floor(number / 100)] + " Ratus" + (sisa ? " " + convert(sisa) : "");
            }
            for (let i = pecahan.length - 1; i >= 0; i--) {
                const divider = Math.pow(1000, i);
                if (number >= divider) {
                    const sisa = number % divider;
                    if (i === 1 && Math.floor(number / divider) === 1) {
                        // 1000–1999 → Seribu
                        return "Seribu" + (sisa ? " " + convert(sisa) : "");
                    }
                    return convert(Math.floor(number / divider)) + " " + pecahan[i] + " " + (sisa ? " " + convert(sisa) : "");
                }
            }
        }

        function terbilangDesimal(number) {
            let result = '';
            if (number < 1) {
                return '';
            } else {
                // Mengubah desimal menjadi angka terbilang (Sen atau Persepuluhan)
                let strNumber = number.toString();
                let desimal = strNumber.split('.')[1]; // Ambil bagian desimal
                let desimalTerbilang = convert(parseInt(desimal));

                result = desimalTerbilang;
            }
            return result;
        }

        if (pParam == 0) return bilangan[0];
        
        let bagianInteger = Math.floor(pParam);
        let bagianDesimal = pParam % 1;

        let hasilInteger = convert(bagianInteger).trim();
        
        if (bagianDesimal > 0) {
            let hasilDesimal = terbilangDesimal(bagianDesimal);
            return `${hasilInteger} koma ${hasilDesimal} Rupiah`;
        } else {
            return `${hasilInteger} Rupiah`;
        }
    }
}

module.exports = CurrencyService;