let ejs =  require("ejs");
let pdf = require("html-pdf");
let path = require("path");

const jwt = require('jsonwebtoken');
const md5 = require('md5');
const crypto = require('crypto');
const moment = require('moment'); 
const sequelize = require('sequelize');
const dateFormat = require('dateformat');
const Op = sequelize.Op;
const fs = require('fs');

const env         = process.env.NODE_ENV || 'localhost';
const config      = require(__dirname + '/../config/config.json')[env];

// Service
const PurchaseRequestHeader = require('../services/purchaserequestservice.js');
const _purchaseRequestServiceInstance = new PurchaseRequestHeader();

class ExportService {
    constructor(){}

    async generateFPB( pId, pRes ){
        var xParam = {
            id: pId,
        }
        var xJoResultFPB = await _purchaseRequestServiceInstance.getById( xParam );

        if( xJoResultFPB != null && xJoResultFPB.status_code == '00' ){
            ejs.renderFile( path.join(__dirname, '../views/', 'fpb-pdf.ejs'), {
                data: xJoResultFPB,
                imagePath: config.imagePath,
            }, (err,data) => {
                var xOptions = {};

                xOptions = {
                    width: '210mm',
                    height: '148.5mm',
                    borders: '0.3cm',
                };

                var xFPBNo = (xJoResultFPB.data.request_no).replace(/\//g,'-');
                var xFileName = `fpb-${xFPBNo}.pdf`;
                var xPathFile = `./generated_files/fpb/${xFileName}`;

                pdf.create( data, xOptions ).toFile( xPathFile, function(err, data){
                    if( err ){
                        pRes.send(err);
                    }else{
                        var xDirectoryPath = path.resolve(xPathFile);
                        pRes.download( xDirectoryPath, xFileName, (err) => {
                            if (err) {
                                res.status(500).send({
                                message: `Could not download the file. ${err}`,
                                });
                            }
                        } );
                    }
                } );
            } );
        }
    }
}

module.exports = ExportService;

