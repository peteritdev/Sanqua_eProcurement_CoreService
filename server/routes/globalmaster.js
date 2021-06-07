const masterController = require('../controllers').globalMaster;

const { check, validationResult } = require('express-validator');
var rootAPIPath = '/api/procurement/v1/globalmaster';

module.exports = (app) => {
    app.get(rootAPIPath, (req, res) => res.status(200).send({
        message: 'Welcome to the Todos API!',
    }));

    app.use(function(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, x-method, x-token, x-application-id");
        next();
    });

    var arrValidate = [];

    arrValidate = [];
    arrValidate = [
        check("limit","Parameter limit can not be empty and must be integer").not().isEmpty().isInt(),
        check("offset","Parameter offset can not be empty and must be integer").not().isEmpty().isInt(),
    ];
    app.get( rootAPIPath + '/:model/list', arrValidate, masterController.master_List );

    arrValidate = [];
    app.get( rootAPIPath + '/:model/dropdown', arrValidate, masterController.master_Dropdown );

    arrValidate = [];
    arrValidate = [
        check("name").not().isEmpty().withMessage("Parameter name can not be empty"),
    ];
    app.post( rootAPIPath + '/:model/save', arrValidate, masterController.master_Save );

    arrValidate = [];
    arrValidate = [
        check("id").not().isEmpty().withMessage("Parameter id can not be empty"),
    ];
    app.delete( rootAPIPath + '/:model/delete/:id', masterController.master_Delete );
    app.put( rootAPIPath + '/:model/archive/:id', masterController.master_Archive );
    app.put( rootAPIPath + '/:model/unarchive/:id', masterController.master_Unarchive );

}