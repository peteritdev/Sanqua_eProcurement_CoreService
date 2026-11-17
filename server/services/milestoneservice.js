const sequelize = require('sequelize');
const fs = require('fs');

const env = process.env.NODE_ENV || 'localhost';
const config = require(__dirname + '/../config/config.json')[env];

// Repository
const MilestoneRepository = require('../repository/milestonerepository.js');
const _milestoneRepoInstance = new MilestoneRepository();

// Util
const Utility = require('peters-globallib-v2');
const _utilInstance = new Utility();

class MilestoneService {
    constructor() {}

    _statusName(status) {
        var desc = config.statusDescription && config.statusDescription.milestone ? config.statusDescription.milestone : {};
        return desc[status] != null ? desc[status] : 'Pending';
    }

    _durationDays(startedAt, completedAt) {
        if (startedAt == null) return null;
        var s = new Date(startedAt).getTime();
        var e = completedAt != null ? new Date(completedAt).getTime() : Date.now();
        if (isNaN(s)) return null;
        return Math.max(0, Math.round((e - s) / (1000 * 60 * 60 * 24)));
    }

    // Master CRUD (admin-managed milestone names)
    async save(pParam) {
        var xJoResult;
        var xAct = pParam.act;
        var xFlagProcess = true;

        delete pParam.act;

        if (xAct == 'add') {
            var xDecId = await _utilInstance.decrypt(pParam.user_id, config.cryptoKey.hashKey);
            if (xDecId.status_code == '00') {
                pParam.created_by = xDecId.decrypted;
                pParam.created_by_name = pParam.user_name;
            } else {
                xFlagProcess = false;
                xJoResult = xDecId;
            }

            if (xFlagProcess) {
                if (pParam.sort_order == null || pParam.sort_order == '') {
                    var xLast = await _milestoneRepoInstance.listMilestones({ order_by: 'sort_order', order_type: 'desc', offset: 0, limit: 1 });
                    pParam.sort_order = xLast.count > 0 ? xLast.rows[0].sort_order + 1 : 0;
                }
                xJoResult = await _milestoneRepoInstance.saveMilestone(pParam, xAct);
            }
        } else if (xAct == 'update') {
            var xDec = await _utilInstance.decrypt(pParam.id, config.cryptoKey.hashKey);
            if (xDec.status_code == '00') {
                pParam.id = xDec.decrypted;
                var xDecUser = await _utilInstance.decrypt(pParam.user_id, config.cryptoKey.hashKey);
                if (xDecUser.status_code == '00') {
                    pParam.updated_by = xDecUser.decrypted;
                    pParam.updated_by_name = pParam.user_name;
                } else {
                    xFlagProcess = false;
                    xJoResult = xDecUser;
                }
            } else {
                xFlagProcess = false;
                xJoResult = xDec;
            }

            if (xFlagProcess) {
                xJoResult = await _milestoneRepoInstance.saveMilestone(pParam, xAct);
            }
        }

        return xJoResult;
    }

    async delete(pParam) {
        var xJoResult;
        var xFlagProcess = true;

        var xDec = await _utilInstance.decrypt(pParam.id, config.cryptoKey.hashKey);
        if (xDec.status_code == '00') {
            pParam.id = xDec.decrypted;
            var xDecUser = await _utilInstance.decrypt(pParam.user_id, config.cryptoKey.hashKey);
            if (xDecUser.status_code == '00') {
                pParam.deleted_by = xDecUser.decrypted;
                pParam.deleted_by_name = pParam.user_name;
            } else {
                xFlagProcess = false;
                xJoResult = xDecUser;
            }
        } else {
            xFlagProcess = false;
            xJoResult = xDec;
        }

        if (xFlagProcess) {
            xJoResult = await _milestoneRepoInstance.deleteMilestone(pParam);
        }

        return xJoResult;
    }

    async list(pParam) {
        var xJoResult;
        var xResult = await _milestoneRepoInstance.listMilestones(pParam);

        if (xResult.count > 0) {
            var xArr = [];
            for (var i in xResult.rows) {
                var xRow = xResult.rows[i];
                xArr.push({
                    id: await _utilInstance.encrypt(xRow.id, config.cryptoKey.hashKey),
                    clear_id: xRow.id,
                    name: xRow.name,
                    sort_order: xRow.sort_order,
                    status: xRow.status,
                    status_name: this._statusName(xRow.status),
                    started_at: xRow.started_at,
                    completed_at: xRow.completed_at,
                    duration_days: this._durationDays(xRow.started_at, xRow.completed_at),
                    note: xRow.note
                });
            }
            xJoResult = { status_code: '00', status_msg: 'OK', data: xArr, total_record: xResult.count };
        } else {
            xJoResult = { status_code: '00', status_msg: 'OK', data: [] };
        }

        return xJoResult;
    }

    async dropDown(pParam) {
        pParam.offset = 0;
        pParam.limit = 'all';
        var xResult = await _milestoneRepoInstance.listMilestones(pParam);
        var xArr = [];
        if (xResult.count > 0) {
            for (var i in xResult.rows) {
                xArr.push({ id: xResult.rows[i].id, name: xResult.rows[i].name });
            }
        }
        return { status_code: '00', status_msg: 'OK', data: xArr };
    }

    // Decrypt an id, but fall back to the raw value if it's not an encrypted string
    async _decryptOrRaw(val) {
        if (val == null || val === '') {
            return { ok: false, result: { status_code: '-99', status_msg: 'Parameter is empty' } };
        }
        var xDec = await _utilInstance.decrypt(val, config.cryptoKey.hashKey);
        return { ok: true, value: xDec.status_code == '00' ? xDec.decrypted : val };
    }

    // Shared owner-check for a given item + milestone (returns true if allowed)
    async _checkOwner(pParam) {
        var xOwner = await _milestoneRepoInstance.getFpbOwnerEmployeeId(pParam);
        if (xOwner == null) {
            return { ok: false, result: { status_code: '-99', status_msg: 'FPB item not found' } };
        }
        if (String(xOwner) !== String(pParam.employee_id)) {
            return { ok: false, result: { status_code: '-99', status_msg: 'Not allowed to update milestones for this item' } };
        }
        return { ok: true };
    }

    // Owner-gated: link a milestone to an FPB item
    async linkItem(pParam) {
        var xJoResult;
        var xFlagProcess = true;

        var xItem = await this._decryptOrRaw(pParam.fpb_item_id);
        if (!xItem.ok) return xItem.result;
        pParam.fpb_item_id = xItem.value;
        var xMs = await this._decryptOrRaw(pParam.milestone_id);
        if (!xMs.ok) return xMs.result;
        pParam.milestone_id = xMs.value;
        var xOwner = await this._checkOwner(pParam);
        if (!xOwner.ok) return xOwner.result;

        if (xFlagProcess) {
            var xDecUser = await _utilInstance.decrypt(pParam.user_id, config.cryptoKey.hashKey);
            if (xDecUser.status_code == '00') {
                pParam.created_by = xDecUser.decrypted;
                pParam.created_by_name = pParam.user_name;
                xJoResult = await _milestoneRepoInstance.linkItem(pParam);
            } else {
                xJoResult = xDecUser;
            }
        }

        return xJoResult;
    }

    // Owner-gated: unlink a milestone from an FPB item
    async unlinkItem(pParam) {
        var xJoResult;
        var xFlagProcess = true;

        var xItem = await this._decryptOrRaw(pParam.fpb_item_id);
        if (!xItem.ok) return xItem.result;
        pParam.fpb_item_id = xItem.value;
        var xMs = await this._decryptOrRaw(pParam.milestone_id);
        if (!xMs.ok) return xMs.result;
        pParam.milestone_id = xMs.value;
        var xOwner = await this._checkOwner(pParam);
        if (!xOwner.ok) return xOwner.result;

        if (xFlagProcess) {
            var xDecUser = await _utilInstance.decrypt(pParam.user_id, config.cryptoKey.hashKey);
            if (xDecUser.status_code == '00') {
                pParam.deleted_by = xDecUser.decrypted;
                pParam.deleted_by_name = pParam.user_name;
                xJoResult = await _milestoneRepoInstance.unlinkItem(pParam);
            } else {
                xJoResult = xDecUser;
            }
        }

        return xJoResult;
    }

    // Owner-gated: update a milestone's status (shared state)
    async updateStatus(pParam) {
        var xJoResult;
        var xFlagProcess = true;

        var xItem = await this._decryptOrRaw(pParam.fpb_item_id);
        if (!xItem.ok) return xItem.result;
        pParam.fpb_item_id = xItem.value;
        var xMs = await this._decryptOrRaw(pParam.milestone_id);
        if (!xMs.ok) return xMs.result;
        pParam.milestone_id = xMs.value;
        var xOwner = await this._checkOwner(pParam);
        if (!xOwner.ok) return xOwner.result;

        if (xFlagProcess) {
            var xDecUser = await _utilInstance.decrypt(pParam.user_id, config.cryptoKey.hashKey);
            if (xDecUser.status_code == '00') {
                pParam.updated_by = xDecUser.decrypted;
                pParam.updated_by_name = pParam.user_name;
                xJoResult = await _milestoneRepoInstance.updateMilestoneStatus(pParam);
            } else {
                xJoResult = xDecUser;
            }
        }

        return xJoResult;
    }

    // Read (open to all): list milestones linked to a specific FPB item
    async listByItem(pParam) {
        var xDec = await _utilInstance.decrypt(pParam.item_id, config.cryptoKey.hashKey);
        var xItemId = xDec.status_code == '00' ? xDec.decrypted : pParam.item_id;

        var xRows = await _milestoneRepoInstance.listMilestonesByItem({ fpb_item_id: xItemId });

        var xArr = [];
        for (var i in xRows) {
            var xMs = xRows[i].milestone;
            xArr.push({
                id: xMs.id,
                name: xMs.name,
                status: xMs.status,
                status_name: this._statusName(xMs.status),
                started_at: xMs.started_at,
                completed_at: xMs.completed_at,
                duration_days: this._durationDays(xMs.started_at, xMs.completed_at),
                note: xMs.note,
                sort_order: xMs.sort_order
            });
        }
        xArr.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

        return { status_code: '00', status_msg: 'OK', data: xArr };
    }
}

module.exports = MilestoneService;
