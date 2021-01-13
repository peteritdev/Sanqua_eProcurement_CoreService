const vendorCatalogueController = require('../controllers').vendorCatalogue;
const { check, validationResult } = require('express-validator');

var rootAPIPath = '/api/procurement/v1/';

module.exports = (app) => {
    app.get(rootAPIPath, (req, res) => res.status(200).send({
        message: 'Welcome to the Todos API!',
    }));

    app.use(function(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, x-method, x-token");
        next();
    });

    var arrValidate = [];

    // List
    arrValidate = [];
    arrValidate = [

        check("vendor_id").not().isEmpty().withMessage("Parameter vendor_id cannot be empty"),
        check("product_id","Parameter product_id must be integer and cannot be empty").not().isEmpty().isInt(),
        check("merk").not().isEmpty().withMessage("Parameter merk cannot be empty"),
        check("uom_id","Parameter uom_id must be integer and cannot be empty").not().isEmpty().isInt(),
        check("purchase_uom_id","Parameter purchase_uom_id must be integer and cannot be empty").not().isEmpty().isInt(),
    ];
    app.get( rootAPIPath + 'vendor/catalogue/save', arrValidate, vendorCatalogueController.list);

    // Save
    arrValidate = [];
    arrValidate = [
        check("offset","Parameter offset must be integer and cannot be empty").not().isEmpty().isInt(),
        check("limit","Parameter limit must be integer and cannot be empty").not().isEmpty().isInt(),
    ];
    app.get( rootAPIPath + 'vendor/catalogue/list', arrValidate, vendorCatalogueController.list);

}