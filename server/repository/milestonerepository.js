var env = process.env.NODE_ENV || 'localhost';
var config = require(__dirname + '/../config/config.json')[env];
var Sequelize = require('sequelize');
var sequelize = new Sequelize(config.database, config.username, config.password, config);
const Op = sequelize.Op;

// Models
const _milestoneModel = require('../models').tr_milestones;
const _linkModel = require('../models').tr_fpb_item_milestones;
const _prdModel = require('../models').tr_purchaserequestdetails;
const _prModel = require('../models').tr_purchaserequests;

const Utility = require('peters-globallib-v2');
const _utilInstance = new Utility();

class MilestoneRepository {
    constructor() {}

    async getMilestoneById(pParam) {
        return await _milestoneModel.findOne({
            where: { id: pParam.id, is_delete: 0 }
        });
    }

    async listMilestones(pParam) {
        var xOrder = ['sort_order', 'ASC'];
        if (pParam.order_by != null && pParam.order_by != '') {
            xOrder = [pParam.order_by, pParam.order_type == 'desc' ? 'DESC' : 'ASC'];
        }

        var xWhere = { is_delete: 0 };
        if (pParam.keyword != null && pParam.keyword != '') {
            xWhere.name = { [Op.iLike]: '%' + pParam.keyword + '%' };
        }

        var xQuery = { where: xWhere, order: [xOrder] };

        if (
            pParam.offset != null && pParam.offset != '' &&
            pParam.limit != null && pParam.limit != '' && pParam.limit != 'all'
        ) {
            xQuery.offset = pParam.offset;
            xQuery.limit = pParam.limit;
        }

        return await _milestoneModel.findAndCountAll(xQuery);
    }

    async saveMilestone(pParam, pAct) {
        let xTransaction;
        var xJoResult = {};

        try {
            var xSaved = null;
            xTransaction = await sequelize.transaction();

            if (pAct == 'add') {
                pParam.status = 0;
                pParam.is_delete = 0;
                xSaved = await _milestoneModel.create(pParam, { transaction: xTransaction });

                if (xSaved != null) {
                    await xTransaction.commit();
                    xJoResult = {
                        status_code: '00',
                        status_msg: 'Data has been successfully saved',
                        created_id: await _utilInstance.encrypt((xSaved.id).toString(), config.cryptoKey.hashKey),
                        clear_id: xSaved.id
                    };
                } else {
                    if (xTransaction) await xTransaction.rollback();
                    xJoResult = { status_code: '-99', status_msg: 'Failed save to database' };
                }
            } else if (pAct == 'update') {
                pParam.updatedAt = await _utilInstance.getCurrDateTime();
                var xId = pParam.id;
                delete pParam.id;
                xSaved = await _milestoneModel.update(pParam, { where: { id: xId } }, { transaction: xTransaction });
                await xTransaction.commit();
                xJoResult = { status_code: '00', status_msg: 'Data has been successfully updated' };
            }
        } catch (e) {
            if (xTransaction) await xTransaction.rollback();
            xJoResult = { status_code: '-99', status_msg: 'Failed save or update data. Error : ' + e, err_msg: e };
        }

        return xJoResult;
    }

    async deleteMilestone(pParam) {
        let xTransaction;
        var xJoResult = {};

        try {
            xTransaction = await sequelize.transaction();

            var xNow = await _utilInstance.getCurrDateTime();

            await _milestoneModel.update(
                { is_delete: 1, deleted_by: pParam.deleted_by, deleted_by_name: pParam.deleted_by_name, deleted_at: xNow },
                { where: { id: pParam.id } },
                { transaction: xTransaction }
            );

            // Also soft-delete the links pointing to this milestone
            await _linkModel.update(
                { is_delete: 1, deleted_by: pParam.deleted_by, deleted_by_name: pParam.deleted_by_name, deleted_at: xNow },
                { where: { milestone_id: pParam.id } },
                { transaction: xTransaction }
            );

            await xTransaction.commit();
            xJoResult = { status_code: '00', status_msg: 'Data has been successfully deleted' };
        } catch (e) {
            if (xTransaction) await xTransaction.rollback();
            xJoResult = { status_code: '-99', status_msg: 'Failed delete data', err_msg: e };
        }

        return xJoResult;
    }

    async linkItem(pParam) {
        let xTransaction;
        var xJoResult = {};

        var xExist = await _linkModel.findOne({
            where: { fpb_item_id: pParam.fpb_item_id, milestone_id: pParam.milestone_id, is_delete: 0 }
        });
        if (xExist != null) {
            return { status_code: '-99', status_msg: 'Milestone already linked to this item' };
        }

        try {
            xTransaction = await sequelize.transaction();
            await _linkModel.create(
                {
                    fpb_item_id: pParam.fpb_item_id,
                    milestone_id: pParam.milestone_id,
                    created_by: pParam.created_by,
                    created_by_name: pParam.created_by_name,
                    is_delete: 0
                },
                { transaction: xTransaction }
            );
            await xTransaction.commit();
            xJoResult = { status_code: '00', status_msg: 'Milestone linked to item' };
        } catch (e) {
            if (xTransaction) await xTransaction.rollback();
            xJoResult = { status_code: '-99', status_msg: 'Failed link milestone', err_msg: e };
        }

        return xJoResult;
    }

    async unlinkItem(pParam) {
        let xTransaction;
        var xJoResult = {};

        try {
            xTransaction = await sequelize.transaction();
            var xNow = await _utilInstance.getCurrDateTime();
            await _linkModel.update(
                { is_delete: 1, deleted_by: pParam.deleted_by, deleted_by_name: pParam.deleted_by_name, deleted_at: xNow },
                { where: { fpb_item_id: pParam.fpb_item_id, milestone_id: pParam.milestone_id, is_delete: 0 } },
                { transaction: xTransaction }
            );
            await xTransaction.commit();
            xJoResult = { status_code: '00', status_msg: 'Milestone unlinked from item' };
        } catch (e) {
            if (xTransaction) await xTransaction.rollback();
            xJoResult = { status_code: '-99', status_msg: 'Failed unlink milestone', err_msg: e };
        }

        return xJoResult;
    }

    async updateMilestoneStatus(pParam) {
        let xTransaction;
        var xJoResult = {};

        try {
            var xNow = await _utilInstance.getCurrDateTime();
            var xMs = await _milestoneModel.findOne({ where: { id: pParam.milestone_id, is_delete: 0 } });
            if (xMs == null) {
                return { status_code: '-99', status_msg: 'Milestone not found' };
            }

            var xUpdate = {
                status: pParam.status,
                updatedAt: xNow,
                updated_by: pParam.updated_by,
                updated_by_name: pParam.updated_by_name
            };
            if (pParam.note != undefined && pParam.note != null) {
                xUpdate.note = pParam.note;
            }

            if (pParam.status == 1) {
                // in-progress: stamp start time if not set yet
                if (xMs.started_at == null) xUpdate.started_at = xNow;
            } else if (pParam.status == 2) {
                // completed
                if (xMs.started_at == null) xUpdate.started_at = xNow;
                xUpdate.completed_at = xNow;
            } else if (pParam.status == 0) {
                // back to pending: clear dates
                xUpdate.started_at = null;
                xUpdate.completed_at = null;
            }

            xTransaction = await sequelize.transaction();
            await _milestoneModel.update(xUpdate, { where: { id: pParam.milestone_id, is_delete: 0 } }, { transaction: xTransaction });
            await xTransaction.commit();
            xJoResult = { status_code: '00', status_msg: 'Milestone status updated' };
        } catch (e) {
            if (xTransaction) await xTransaction.rollback();
            xJoResult = { status_code: '-99', status_msg: 'Failed update milestone status', err_msg: e };
        }

        return xJoResult;
    }

    async listMilestonesByItem(pParam) {
        return await _linkModel.findAll({
            where: { fpb_item_id: pParam.fpb_item_id, is_delete: 0 },
            include: [{ model: _milestoneModel, as: 'milestone', where: { is_delete: 0 }, required: true }],
            order: [['id', 'ASC']]
        });
    }

    async getFpbOwnerEmployeeId(pParam) {
        var xPrd = await _prdModel.findOne({ where: { id: pParam.fpb_item_id, is_delete: 0 } });
        if (xPrd == null || xPrd.request_id == null) return null;
        var xPr = await _prModel.findOne({ where: { id: xPrd.request_id } });
        if (xPr == null) return null;
        return xPr.employee_id;
    }
}

module.exports = MilestoneRepository;
