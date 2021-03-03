const vendorCatalogueController = require('../controllers').vendorCatalogue;
const vendorCatalogueQuotationController = require('../controllers').vendorCatalogueQuotation;
const vendorCatalogueSpesificationController = require('../controllers').vendorCatalogueSpesification;
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

    // VENDOR CATALOGUE
    // Save
    arrValidate = [];
    arrValidate = [

        check("act").not().isEmpty().withMessage("Parameter act cannot be empty"),
        check("vendor_id").not().isEmpty().withMessage("Parameter vendor_id cannot be empty"),
        check("product_id","Parameter product_id must be integer and cannot be empty").not().isEmpty().isInt(),
        check("merk").not().isEmpty().withMessage("Parameter merk cannot be empty"),
        check("uom_id","Parameter uom_id must be integer and cannot be empty").not().isEmpty().isInt(),
        check("purchase_uom_id","Parameter purchase_uom_id must be integer and cannot be empty").not().isEmpty().isInt(),
    ];
    app.post( rootAPIPath + 'vendor/catalogue/save', arrValidate, vendorCatalogueController.save);

    // List
    arrValidate = [];
    arrValidate = [
        check("offset","Parameter offset must be integer and cannot be empty").not().isEmpty().isInt(),
        check("limit","Parameter limit must be integer and cannot be empty").not().isEmpty().isInt(),
        // check("vendor_id").not().isEmpty().withMessage("Parameter vendor_id cannot be empty"),
    ];
    app.get( rootAPIPath + 'vendor/catalogue/list', arrValidate, vendorCatalogueController.list);

    // Get By Id
    arrValidate = [];
    arrValidate = [
        check("id").not().isEmpty().withMessage("Parameter id cannot be empty"),
    ];
    app.get( rootAPIPath + 'vendor/catalogue/detail/:id', arrValidate, vendorCatalogueController.getById);

    // Delete
    arrValidate = [];
    arrValidate = [
        check("id").not().isEmpty().withMessage("Parameter id can not be empty"),
    ];
    app.delete( rootAPIPath + 'vendor/catalogue/delete/:id', vendorCatalogueController.deleteVendorCatalogue );

    // Import
    arrValidate = [];
    app.post( rootAPIPath + 'vendor/catalogue/upload', arrValidate, vendorCatalogueController.vendorCatalogue_UploadFromExcel );
    app.post( rootAPIPath + 'vendor/catalogue/batch_save', arrValidate, vendorCatalogueController.vendorCatalogue_BatchSave );

    // VENDOR CATALOGUE QUOTATION
    // Save
    arrValidate = [];
    arrValidate = [
        check("act").not().isEmpty().withMessage("Parameter act cannot be empty"),
        check("vendor_catalogue_id").not().isEmpty().withMessage("Parameter vendor_catalogue_id cannot be empty"),
        check("period_start").not().isEmpty().withMessage("Parameter period_start cannot be empty"),
        check("period_end").not().isEmpty().withMessage("Parameter period_end cannot be empty"),
        check("uom_id","Parameter uom_id must be integer and cannot be empty").not().isEmpty().isInt(),
        check("price_per_unit","Parameter price_per_unit must be numeric(double) and cannot be empty").not().isEmpty().isFloat(),
        check("file_quotation").not().isEmpty().withMessage("Parameter file_quotation cannot be empty"),
    ];
    app.post( rootAPIPath + 'vendor/catalogue_quotation/save', arrValidate, vendorCatalogueQuotationController.vendorCatalogueQuotation_Save);

    // List
    arrValidate = [];
    arrValidate = [
        check("offset","Parameter offset must be integer and cannot be empty").not().isEmpty().isInt(),
        check("limit","Parameter limit must be integer and cannot be empty").not().isEmpty().isInt(),
        check("vendor_catalogue_id").not().isEmpty().withMessage("Parameter vendor_catalogue_id cannot be empty"),
    ];
    app.get( rootAPIPath + 'vendor/catalogue_quotation/list', arrValidate, vendorCatalogueQuotationController.vendorCatalogueQuotation_List);

    // Get By Id
    arrValidate = [];
    arrValidate = [
        check("id").not().isEmpty().withMessage("Parameter id cannot be empty"),
    ];
    app.get( rootAPIPath + 'vendor/catalogue_quotation/detail/:id', arrValidate, vendorCatalogueQuotationController.vendorCatalogueQuotation_GetById);

    // Delete
    arrValidate = [];
    arrValidate = [
        check("id").not().isEmpty().withMessage("Parameter id can not be empty"),
    ];
    app.delete( rootAPIPath + 'vendor/catalogue_quotation/delete/:id', vendorCatalogueQuotationController.vendorCatalogueQuotation_Delete );

    // Import
    arrValidate = [];
    app.post( rootAPIPath + 'vendor/catalogue_quotation/upload', arrValidate, vendorCatalogueQuotationController.vendorCatalogueQuotation_UploadFromExcel );
    app.post( rootAPIPath + 'vendor/catalogue_quotation/batch_save', arrValidate, vendorCatalogueQuotationController.vendorCatalogueQuotation_BatchSave );


    // VENDOR CATALOGUE SPESIFICATION
    // Save
    arrValidate = [];
    arrValidate = [
        check("act").not().isEmpty().withMessage("Parameter act cannot be empty"),
        check("vendor_catalogue_id").not().isEmpty().withMessage("Parameter vendor_catalogue_id cannot be empty"),
        check("spesification_category_id","Parameter spesification_category_id must be integer and cannot be empty").not().isEmpty().isInt(),
        check("spesification_attribute_id","Parameter spesification_attribute_id must be integer and cannot be empty").not().isEmpty().isInt(),
        check("spesification_type","Parameter spesification_type must be integer and cannot be empty").not().isEmpty().isInt(),
    ];
    app.post( rootAPIPath + 'vendor/catalogue_spesification/save', arrValidate, vendorCatalogueSpesificationController.vendorCatalogueSpesification_Save);

    // List
    arrValidate = [];
    arrValidate = [
        check("offset","Parameter offset must be integer and cannot be empty").not().isEmpty().isInt(),
        check("limit","Parameter limit must be integer and cannot be empty").not().isEmpty().isInt(),
        check("vendor_catalogue_id").not().isEmpty().withMessage("Parameter vendor_catalogue_id cannot be empty"),
    ];
    app.get( rootAPIPath + 'vendor/catalogue_spesification/list', arrValidate, vendorCatalogueSpesificationController.vendorCatalogueSpesification_List);

    // Get By Id
    arrValidate = [];
    arrValidate = [
        check("id").not().isEmpty().withMessage("Parameter id cannot be empty"),
    ];
    app.get( rootAPIPath + 'vendor/catalogue_spesification/detail/:id', arrValidate, vendorCatalogueSpesificationController.vendorCatalogueSpesification_GetById);

    // Delete
    arrValidate = [];
    arrValidate = [
        check("id").not().isEmpty().withMessage("Parameter id can not be empty"),
    ];
    app.delete( rootAPIPath + 'vendor/catalogue_spesification/delete/:id', vendorCatalogueSpesificationController.vendorCatalogueSpesification_Delete );

    // Import
    arrValidate = [];
    app.post( rootAPIPath + 'vendor/catalogue_spesification/upload', arrValidate, vendorCatalogueSpesificationController.vendorCatalogueSpesification_UploadFromExcel );
    app.post( rootAPIPath + 'vendor/catalogue_spesification/batch_save', arrValidate, vendorCatalogueSpesificationController.vendorCatalogueSpesification_BatchSave );
    

}