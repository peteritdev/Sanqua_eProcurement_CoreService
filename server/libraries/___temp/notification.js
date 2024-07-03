const moment = require('moment');
const sequelize = require('sequelize');
const Op = Sequelize.Op;
const env = process.env.NODE_ENV || 'localhost';
const config = require(__dirname + '/../config/config.json')[env];
const promise = require('promise');
const dateFormat = require('dateformat');

const modelUserHistoryCuti = require('../models').user_history_cuti;
const modelMessageTemplate = require('../models').db_message_template;
const modelTujuanJabatan = require('../models').db_tujuan_jabatan;
const modelJenisCuti = require('../models').db_jenis_cuti;
const modelNotification = require('../models').notification;

const libUtil = require('../libraries/utility.js');

function Notification() {
	/*this.constructForgotPasswordMessage = function( type, jData, callback ){

        var joResult;

        modelTemplate.findOne({
            where:{
                type: type,
                templateCode: 'FORGOT_PASSWORD'
            }
        })
        .then(function(dtTemplate){
            if( dtTemplate != null ){
                var subject = dtTemplate.subject;
                var body = dtTemplate.body;
                body = body.replace('#username#', jData['username']);
                body = body.replace('#userlogin#', jData['userlogin']);
                body = body.replace('#password#', jData['password']);

                modelNotification.create({
                    type: type,
                    destination: jData['account'],
                    subject: subject,
                    body: body,
                    status: 0,
                    createdUser: jData['user_id']
                })
                .then( dtNotification => {
                    joResult = JSON.stringify({
                        "status_code": "00",
                        "status_msg": "Notification successfully created"
                    });
                    callback(joResult);
                } );

            }else{
                joResult = JSON.stringify({
                    "status_code": "-99",
                    "status_msg": "Template not found"
                });
                callback(joResult);
            }
        });

    }*/

	(this.constructLeaveNotification_Email = function(id) {
		return new Promise((resolve, reject) => {
			//Get User History Cuti Detail
			modelUserHistoryCuti
				.findOne({
					where: {
						id: id
					},
					include: [
						{
							model: modelTujuanJabatan,
							as: 'tujuanJabatan'
						},
						{
							model: modelJenisCuti,
							as: 'jenisCuti'
						}
					]
				})
				.then((data) => {
					if (data == null) {
						jsonResult = { status_code: '-99', status_msg: 'Cuti tidak ditemukan' };
					} else {
						modelMessageTemplate
							.findOne({
								where: {
									code: 'ADD_LEAVE',
									type: 1
								}
							})
							.then((template) => {
								if (template != null) {
									var xSubject = template.subject;
									var xBody = template.body;

									xSubject = xSubject.replace('[#no_referensi#]', data.no_reference);
									xBody = xBody.replace('[#nama_pegawai#]', data.nama_pegawai);
									xBody = xBody.replace('[#nip#]', data.nip);
									xBody = xBody.replace('[#no_referensi#]', data.no_reference);
									xBody = xBody.replace(
										'[#tujuan_pengajuan#]',
										data.tujuanJabatan == null ? '-' : data.tujuanJabatan.name
									);
									xBody = xBody.replace(
										'[#jenis_cuti#]',
										data.jenisCuti == null ? '-' : data.jenisCuti.name
									);
									xBody = xBody.replace('[#alasan_cuti#]', data.alasan_cuti);
									xBody = xBody.replace(
										'[#tgl_mulai#]',
										data.tgl_mulai !== null &&
										data.tgl_mulai !== '' &&
										data.tgl_mulai !== '0000-00-00'
											? dateFormat(data.tgl_mulai, 'dd-mm-yyyy')
											: ''
									);
									xBody = xBody.replace(
										'[#tgl_berakhir#]',
										data.tgl_berakhir !== null &&
										data.tgl_berakhir !== '' &&
										data.tgl_berakhir !== '0000-00-00'
											? dateFormat(data.tgl_berakhir, 'dd-mm-yyyy')
											: ''
									);
									xBody = xBody.replace('[#lama_cuti#]', data.lama_cuti + ' Hari');

									var jsonResult = {
										status_code: '00',
										status_msg: 'OK',
										subject: xSubject,
										body: xBody
									};
									resolve(jsonResult);
								} else {
									var jsonResult = { status_code: '-99', status_msg: 'Template tidak ditemukan' };
									resolve(jsonResult);
								}
							})
							.catch((error) => {
								libUtil.writeLog('Error 1 [notification.constructLeaveNotification_Email] : ' + error);
								var jsonResult = {
									status_code: '-99',
									status_msg: 'Error 1 [notification.constructLeaveNotification_Email] : ' + error
								};
								resolve(jsonResult);
							});
					}
				})
				.catch((error) => {
					libUtil.writeLog('Error 2 [notification.constructLeaveNotification_Email] : ' + error);
					var jsonResult = {
						status_code: '-99',
						status_msg: 'Error 2 [notification.constructLeaveNotification_Email] : ' + error
					};
					resolve(jsonResult);
				});
		});
	}),
		(this.constructForgotPasswordNotification_Email = function(pName, pNewPassword) {
			return new Promise((resolve, reject) => {
				modelMessageTemplate
					.findOne({
						where: {
							code: 'FORGOT_PASSWORD',
							type: 1
						}
					})
					.then((template) => {
						if (template != null) {
							var xSubject = template.subject;
							var xBody = template.body;

							xBody = xBody.replace('[#nama_pegawai#]', pName);
							xBody = xBody.replace('[#new_password#]', pNewPassword);

							var jsonResult = { status_code: '00', status_msg: 'OK', subject: xSubject, body: xBody };
							resolve(jsonResult);
						} else {
							var jsonResult = { status_code: '-99', status_msg: 'Template tidak ditemukan' };
							resolve(jsonResult);
						}
					})
					.catch((error) => {
						libUtil.writeLog('Error 1 [notification.constructForgotPasswordNotification_Email] : ' + error);
						var jsonResult = {
							status_code: '-99',
							status_msg: 'Error 1 [notification.constructForgotPasswordNotification_Email] : ' + error
						};
						resolve(jsonResult);
					});
			});
		}),
		(this.addToQueue = function(pData) {
			return new Promise((resolve, reject) => {
				libUtil.getCurrDateTime(function(currTime) {
					modelNotification
						.create({
							type: pData.type,
							to: pData.to,
							cc: pData.cc,
							subject: pData.subject,
							body: pData.body,
							createdAt: currTime
						})
						.then(() => {
							var jsonResult = { status_code: '00', status_msg: 'OK' };
							resolve(jsonResult);
						})
						.catch((error) => {
							libUtil.writeLog('Error 1 [notification.addToQueue] : ' + error);
							var jsonResult = {
								status_code: '-99',
								status_msg: 'Error 1 [notification.addToQueue] : ' + error
							};
							resolve(jsonResult);
						});
				});
			});
		});
}

module.exports = new Notification();
