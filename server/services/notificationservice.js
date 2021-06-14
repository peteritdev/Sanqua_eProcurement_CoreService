const env         = process.env.NODE_ENV || 'localhost';
const config      = require(__dirname + '/../config/config.json')[env];

const moment = require('moment');

// Services
const OAuthService = require('../services/oauthservice.js');
const _oAuthService = new OAuthService();

//Util
const Utility = require('peters-globallib-v2');
const _utilInstance = new Utility();

class NotificationService {
    constructor() {}

    async eProcurement_AnnouncementNewProcurement_ReplaceWithVariable( pMsg, pParam ){

        console.log(">>> Proc Detail : " + JSON.stringify(pParam));
        
        // Display Procurement Info
        pMsg = pMsg.toString();

        pMsg = pMsg.replace( "#SUPPLIER_NAME#", pParam.vendor.name );
        pMsg = pMsg.replace( "#PROCUREMENT_NAME#", pParam.name );
        pMsg = pMsg.replace( "#PROCUREMENT_YEAR#", pParam.year );
        pMsg = pMsg.replace( "#TOTAL_HPS#", pParam.total_hps );
        pMsg = pMsg.replace( "#PROCUREMENT_PERIOD#", `${pParam.period_start} s/d ${pParam.period_end}` );
        pMsg = pMsg.replace( "#TOTAL_WORK_DAYS#", pParam.total_working_days );

        // Display Procurement Display
        if( pParam.procurement_item != null && pParam.procurement_item.length > 0 ){
            var xTable_Item = '<table style="border-collapse: collapse; width: 100%;" border="1">';
            xTable_Item += '<tr>';
            xTable_Item += '<td text-align: center;"><strong>No.</strong></td>';
            xTable_Item += '<td text-align: center;"><strong>Item</strong></td>';
            xTable_Item += '<td text-align: center;"><strong>Deskripsi</strong></td>';
            xTable_Item += '<td text-align: center;"><strong>Qty</strong></td>';
            xTable_Item += '<td text-align: center;"><strong>Unit</strong></td>';
            xTable_Item += '</tr>'
            for( var i in pParam.procurement_item ){
                var xUnitName = (pParam.procurement_item[i].unit == null ? '' : pParam.procurement_item[i].unit.name);
                xTable_Item += '<tr>';
                xTable_Item += `<td text-align: right;>${i+1}</td>`;
                xTable_Item += `<td text-align: left;>${pParam.procurement_item[i].product.name}</td>`;
                xTable_Item += `<td text-align: left;>${pParam.procurement_item[i].description}</td>`;
                xTable_Item += `<td text-align: left;>${pParam.procurement_item[i].qty}</td>`;
                xTable_Item += `<td text-align: left;>${xUnitName}</td>`;
                xTable_Item += '</tr>';
            }
            xTable_Item += '</table>';
        }
        pMsg = pMsg.replace( "#PROCUREMENT_SCHEDULE#", xTable_Item );

        // Display Procurement Schedule
        if( pParam.procurement_schedule != null && pParam.procurement_schedule.length > 0 ){
            var xTable_Schedule = '<table style="border-collapse: collapse; width: 100%;" border="1">';
            xTable_Schedule += '<tr>';
            xTable_Schedule += '<td text-align: center;"><strong>No.</strong></td>';
            xTable_Schedule += '<td text-align: center;"><strong>Kegiatan</strong></td>';
            xTable_Schedule += '<td text-align: center;"><strong>Jadwal</strong></td>';
            xTable_Schedule += '</tr>';
            for( var i in pParam.procurement_schedule ){
                xTable_Schedule += '<tr>';
                xTable_Schedule += `<td tex-align: right;>${i+1}</td>`;
                xTable_Schedule += `<td tex-align: left;>${pParam.procurement_schedule[i].schedule_attribute.name}</td>`;
                xTable_Schedule += `<td tex-align: left;>${pParam.procurement_schedule[i].start_date} s/d ${pParam.procurement_schedule[i].end_date}</td>`;
                xTable_Schedule += '</tr>';
            }
        }
        pMsg = pMsg.replace( "#PROCUREMENT_TERMS#", xTable_Schedule );

        // Display link confirmation

        // Display link registration at eSanQua

        return pMsg;
    }

    async sendNotification_AnnouncementNewProcurement( pMethod, pToken, pParam ){
        var xJoResult = {};
        var xNotifTemplate = await _oAuthService.getNotificationTemplate( pMethod, pToken, 'EPROC_SPL_INVITATION' );

        console.log(">>> Template : " + JSON.stringify(xNotifTemplate));

        if( xNotifTemplate != null ){
            var xSubject = await this.eProcurement_AnnouncementNewProcurement_ReplaceWithVariable( xNotifTemplate.token_data.data.subject, pParam );
            var xBody = await this.eProcurement_AnnouncementNewProcurement_ReplaceWithVariable( xNotifTemplate.token_data.data.body, pParam );

            // Kafka send notification
            var xStringifyBody = xBody.replace(/\"/g,"\\\"");
            var xParamKafkaProducer = {
                mode: 'eProc-Procurement-Announcement',
                broker_host: '10.10.20.8',
                broker_port: 9092,
                client_id: 'eProcurement',
                key: 'K002',
                message: (`{"subject": "${xSubject}","body": "${xStringifyBody}","recipients": {"to": "${pParam.vendor.email}"}}`),
            }

            var xSendToKafka = await _utilInstance.sendNotification( xParamKafkaProducer );

        }

    }
}

module.exports = NotificationService;