const env = process.env.NODE_ENV || 'localhost';
const config = require(__dirname + '/../config/config.json')[env];

const moment = require('moment');

// Services
const OAuthService = require('../services/oauthservice.js');
const _oAuthService = new OAuthService();

//Util
const Utility = require('peters-globallib-v2');
const _utilInstance = new Utility();

const _xClassName = 'NotificationService';

class NotificationService {
	constructor() {}

	async eProcurement_AnnouncementNewProcurement_ReplaceWithVariable(pMsg, pParam) {
		console.log('>>> Proc Detail : ' + JSON.stringify(pParam));

		// Display Procurement Info
		pMsg = pMsg.toString();

		pMsg = pMsg.replace('#SUPPLIER_NAME#', pParam.vendor.name);
		pMsg = pMsg.replace('#PROCUREMENT_NAME#', pParam.name);
		pMsg = pMsg.replace('#PROCUREMENT_YEAR#', pParam.year);

		var xObjNumber = new Intl.NumberFormat('en-US');
		pMsg = pMsg.replace('#TOTAL_HPS#', xObjNumber.format(pParam.total_hps));

		var xStartDate = moment(pParam.period_start).format('DD MMM YYYY');
		var xEndDate = moment(pParam.period_end).format('DD MMM YYYY');
		pMsg = pMsg.replace('#PROCUREMENT_PERIOD#', `${xStartDate} s/d ${xEndDate}`);

		pMsg = pMsg.replace('#TOTAL_WORK_DAYS#', `${pParam.total_working_days} hari`);

		// Display Procurement Display
		if (pParam.procurement_item != null && pParam.procurement_item.length > 0) {
			var xTable_Item = '<table style="border-collapse: collapse; width: 100%;" border="1">';
			xTable_Item += '<tr>';
			xTable_Item += '<td text-align: center;"><strong>No.</strong></td>';
			xTable_Item += '<td text-align: center;"><strong>Item</strong></td>';
			xTable_Item += '<td text-align: center;"><strong>Deskripsi</strong></td>';
			xTable_Item += '<td text-align: center;"><strong>Qty</strong></td>';
			xTable_Item += '<td text-align: center;"><strong>Unit</strong></td>';
			xTable_Item += '</tr>';
			for (var i in pParam.procurement_item) {
				var xUnitName = pParam.procurement_item[i].unit == null ? '' : pParam.procurement_item[i].unit.name;
				xTable_Item += '<tr>';
				xTable_Item += `<td text-align: right;>${i + 1}</td>`;
				xTable_Item += `<td text-align: left;>${pParam.procurement_item[i].product.name}</td>`;
				xTable_Item += `<td text-align: left;>${pParam.procurement_item[i].description}</td>`;
				xTable_Item += `<td text-align: left;>${pParam.procurement_item[i].qty}</td>`;
				xTable_Item += `<td text-align: left;>${xUnitName}</td>`;
				xTable_Item += '</tr>';
			}
			xTable_Item += '</table>';
		}
		pMsg = pMsg.replace('#PROCUREMENT_ITEMS#', xTable_Item);

		// Display Procurement Schedule
		if (pParam.procurement_schedule != null && pParam.procurement_schedule.length > 0) {
			var xTable_Schedule = '<table style="border-collapse: collapse; width: 100%;" border="1">';
			xTable_Schedule += '<tr>';
			xTable_Schedule += '<td text-align: center;"><strong>No.</strong></td>';
			xTable_Schedule += '<td text-align: center;"><strong>Kegiatan</strong></td>';
			xTable_Schedule += '<td text-align: center;"><strong>Jadwal</strong></td>';
			xTable_Schedule += '</tr>';
			for (var i in pParam.procurement_schedule) {
				var xStartDateSchedule = moment(pParam.procurement_schedule[i].start_date).format('DD MMM YYYY');
				var xEndDateSchedule = moment(pParam.procurement_schedule[i].end_date).format('DD MMM YYYY');

				xTable_Schedule += '<tr>';
				xTable_Schedule += `<td tex-align: right;>${i + 1}</td>`;
				xTable_Schedule += `<td tex-align: left;>${pParam.procurement_schedule[i].schedule_attribute
					.name}</td>`;
				xTable_Schedule += `<td tex-align: left;>${xStartDateSchedule} s/d ${xEndDateSchedule}</td>`;
				xTable_Schedule += '</tr>';
			}
		}
		pMsg = pMsg.replace('#PROCUREMENT_SCHEDULE#', xTable_Schedule);

		// Display Procurement Terms
		if (pParam.procurement_term != null && pParam.procurement_term.length > 0) {
			var xTable_Schedule = '<table style="border-collapse: collapse; width: 100%;" border="1">';
			xTable_Schedule += '<tr>';
			xTable_Schedule += '<td text-align: center;"><strong>No.</strong></td>';
			xTable_Schedule += '<td text-align: center;"><strong>Syarat</strong></td>';
			xTable_Schedule += '<td text-align: center;"><strong>Deskripsi</strong></td>';
			xTable_Schedule += '</tr>';
			for (var i in pParam.procurement_term) {
				xTable_Schedule += '<tr>';
				xTable_Schedule += `<td tex-align: right;>${i + 1}</td>`;
				xTable_Schedule += `<td tex-align: left;>${pParam.procurement_term[i].term}</td>`;
				xTable_Schedule += `<td tex-align: left;>${pParam.procurement_term[i].description}</td>`;
				xTable_Schedule += '</tr>';
			}
		}
		pMsg = pMsg.replace('#PROCUREMENT_TERMS#', xTable_Schedule);

		// Display link confirmation
		// pMsg = pMsg.replace( "#LINK_CONFIRM_PROCUREMENT#", "" );

		// Display link registration at eSanQua
		// pMsg = pMsg.replace( "#LINK_REGISTRATION_ESANQUA#", "" );

		return pMsg;
	}

	async sendNotification_AnnouncementNewProcurement(pMethod, pToken, pParam) {
		var xJoResult = {};
		var xNotifTemplate = await _oAuthService.getNotificationTemplate(pMethod, pToken, 'EPROC_SPL_INVITATION');

		console.log('>>> Template : ' + JSON.stringify(xNotifTemplate));

		if (xNotifTemplate != null) {
			var xSubject = await this.eProcurement_AnnouncementNewProcurement_ReplaceWithVariable(
				xNotifTemplate.token_data.data.subject,
				pParam
			);
			var xBody = await this.eProcurement_AnnouncementNewProcurement_ReplaceWithVariable(
				xNotifTemplate.token_data.data.body,
				pParam
			);

			// Kafka send notification
			var xStringifyBody = xBody.replace(/\"/g, '\\"');
			var xParamKafkaProducer = {
				mode: 'eProc-Procurement-Announcement',
				broker_host: '10.10.20.8',
				broker_port: 9092,
				client_id: 'eProcurement',
				key: 'K002',
				message: `{"subject": "${xSubject}","body": "${xStringifyBody}","recipients": {"to": "${pParam.vendor
					.email}"}}`
			};

			xJoResult = await _utilInstance.sendNotification(xParamKafkaProducer);
		} else {
			xJoResult = {
				status_code: '-99',
				status_msg: "Template doesn't exists! "
			};
		}

		return xJoResult;
	}

	async inAppNotification(pParam) {
		var xJoResult = {};
		var xParam = {};

		try {
			if (pParam.mode == 'request_approval_fpb') {
				xParam = {
					act: 'add',
					subject: `Permohonan Approval FPB`,
					body: `Permohonan approval FPB ${pParam.document_code}`,
					module: 'eCatalogue',
					document_id: pParam.document_id,
					document_status: pParam.document_status,
					document_code: pParam.document_code,
					status: 0,
					application_id: config.applicationId,
					application_code: config.applicationCode,
					channel: 1,
					employee_id: pParam.employee_id
				};

				let xAddNotifResult = await _oAuthService.eSanQuaNotification(
					pParam.method,
					pParam.token,
					xParam,
					'/notification/save'
				);

				xJoResult = {
					status_code: '00',
					status_msg: 'OK',
					notification_result: xAddNotifResult
				};
			}
		} catch (e) {
			xJoResult = {
				status_code: '-99',
				status_msg: `Exception error ${_xClassName}: ${e.message}`
			};
		}

		return xJoResult;
	}

	async sendNotification_FPBNeedApproval(pParam, pMethod, pToken) {
		var xJoResult = {};

		try {
			if (pParam.mode == 'request_approval_fpb') {
				let xAddNotifResult = await _oAuthService.eSanQuaNotification(
					pMethod,
					pToken,
					pParam,
					'/notification/email/fpb_approval'
				);

				xJoResult = {
					status_code: '00',
					status_msg: 'OK',
					notification_result: xAddNotifResult
				};
			}
		} catch (e) {
			xJoResult = {
				status_code: '-99',
				status_msg: `Exception error ${_xClassName}.sendNotification_FPBNeedApproval: ${e.message}`
			};
		}

		return xJoResult;
	}
}

module.exports = NotificationService;
