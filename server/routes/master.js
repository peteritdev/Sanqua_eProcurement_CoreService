const masterController = require('../controllers').master;
const productCategoryController = require('../controllers').productCategory;
const productController = require('../controllers').product;
const unitController = require('../controllers').unit;
const spesificationCategoryController = require('../controllers').spesificationCategory;
const spesificationAttributeController = require('../controllers').spesificationAttribute;

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

    // Document Type
    app.post( rootAPIPath + 'master/document_type/save', masterController.documentType_Save );
    app.get( rootAPIPath + 'master/document_type/list', masterController.documentType_List );
    app.get( rootAPIPath + 'master/document_type/drop_down', masterController.documentType_DropDown );
    app.delete( rootAPIPath + 'master/document_type/delete/:id', masterController.documentType_Delete );

    // Product Category
    arrValidate = [];
    arrValidate = [
        check("name").not().isEmpty().withMessage("Parameter name can not be empty"),
    ];
    app.post( rootAPIPath + 'master/product_category/save', arrValidate, productCategoryController.productCategory_Save );

    arrValidate = [];
    arrValidate = [
        check("limit","Parameter unit_id can not be empty and must be integer").not().isEmpty().isInt(),
        check("offset","Parameter offset can not be empty and must be integer").not().isEmpty().isInt(),
    ];
    app.get( rootAPIPath + 'master/product_category/list', arrValidate, productCategoryController.productCategory_List );

    arrValidate = [];
    app.get( rootAPIPath + 'master/product_category/drop_down', arrValidate, productCategoryController.productCategory_DropDown );

    arrValidate = [];
    arrValidate = [
        check("id").not().isEmpty().withMessage("Parameter id can not be empty"),
    ];
    app.delete( rootAPIPath + 'master/product_category/delete/:id', productCategoryController.productCategory_Delete );
    app.post( rootAPIPath + 'master/product_category/upload', productCategoryController.productCategory_Upload );
    app.post( rootAPIPath + 'master/product_category/batch_save', productCategoryController.productCategory_BatchSave );

    // Product
    var xArrValidateProduct = [
        check("category_id","Parameter category_id can not be empty and must be integer").not().isEmpty().isInt(),
        check("name").not().isEmpty().withMessage("Parameter name can not be empty"),
        check("unit_id","Parameter unit_id can not be empty and must be integer").not().isEmpty().isInt(),
        // check("merk").not().isEmpty().withMessage("Merk cannot be empty"),
        // check("spesification").not().isEmpty().withMessage("Spesification cannot be empty"),
    ];
    app.post( rootAPIPath + 'master/product/save', xArrValidateProduct, productController.product_Save );
    
    xArrValidateProduct = [];
    xArrValidateProduct = [
        check("limit","Parameter unit_id can not be empty and must be integer").not().isEmpty().isInt(),
        check("offset","Parameter offset can not be empty and must be integer").not().isEmpty().isInt(),
    ];
    app.get( rootAPIPath + 'master/product/list', xArrValidateProduct, productController.product_List );

    xArrValidateProduct = [];
    xArrValidateProduct = [
        check("id").not().isEmpty().withMessage("Parameter id cannot be empty"),
    ];
    app.get( rootAPIPath + 'master/product/detail/:id', xArrValidateProduct, productController.product_GetById );

    xArrValidateProduct = [];
    xArrValidateProduct = [
        check("id").not().isEmpty().withMessage("Parameter id cannot be empty"),
    ];
    app.delete( rootAPIPath + 'master/product/delete/:id', productController.product_Delete );
    app.post( rootAPIPath + 'master/product/upload', productController.product_Upload );
    app.post( rootAPIPath + 'master/product/batch_save', productController.product_BatchSave );
    app.get( rootAPIPath + 'master/product/drop_down', productController.product_DropDown );

    // Unit   
    // Save
    arrValidate = [];
    arrValidate = [
        check("name").not().isEmpty().withMessage("Parameter name cannot be empty"),
    ];
    app.post( rootAPIPath + 'master/unit/save', arrValidate, unitController.unit_Save );

    // List
    arrValidate = [];
    arrValidate = [
        check("offset","Parameter offset must be integer and cannot be empty").not().isEmpty().isInt(),
        check("limit","Parameter limit must be integer and cannot be empty").not().isEmpty().isInt(),
    ];
    app.get( rootAPIPath + 'master/unit/list', arrValidate, unitController.unit_List );

    arrValidate = [];
    app.get( rootAPIPath + 'master/unit/drop_down', arrValidate, unitController.unit_DropDown );

    // Delete
    arrValidate = [];
    arrValidate = [
        check("id").not().isEmpty().withMessage("Parameter id cannot be empty"),
    ];
    app.delete( rootAPIPath + 'master/unit/delete/:id', unitController.unit_Delete );

    //Business Entity
    app.get( rootAPIPath + 'master/business_entity/drop_down', masterController.businessEntity_DropDown );
    app.get( rootAPIPath + 'master/business_entity/list', masterController.businessEntity_List );
    app.post( rootAPIPath + 'master/business_entity/save', masterController.businessEntity_Save );
    app.delete( rootAPIPath + 'master/business_entity/delete/:id', masterController.businessEntity_Delete );

    //Classification
    app.get( rootAPIPath + 'master/classification/drop_down', masterController.classification_DropDown );
    app.get( rootAPIPath + 'master/classification/list', masterController.classification_List );
    app.post( rootAPIPath + 'master/classification/save', masterController.classification_Save );
    app.delete( rootAPIPath + 'master/classification/delete/:id', masterController.classification_Delete );

    //Province
    app.get( rootAPIPath + 'master/province/drop_down', masterController.province_DropDown );

    // SPESIFICATION CATEGORY
    // Save
    arrValidate = [];
    arrValidate = [
        check("name").not().isEmpty().withMessage("Parameter name cannot be empty"),
    ];
    app.post( rootAPIPath + 'master/spesification_category/save', arrValidate, spesificationCategoryController.spesificationCategory_Save );

    // List
    arrValidate = [];
    arrValidate = [
        check("offset","Parameter offset must be integer and cannot be empty").not().isEmpty().isInt(),
        check("limit","Parameter limit must be integer and cannot be empty").not().isEmpty().isInt(),
    ];
    app.get( rootAPIPath + 'master/spesification_category/list', arrValidate, spesificationCategoryController.spesificationCategory_List );

    arrValidate = [];
    arrValidate = [
        check("id").not().isEmpty().withMessage("Parameter id cannot be empty")
    ];
    app.get( rootAPIPath + 'master/spesification_category/detail/:id', arrValidate, spesificationCategoryController.spesificationCategory_GetById );

    arrValidate = [];
    app.get( rootAPIPath + 'master/spesification_category/drop_down', arrValidate, spesificationCategoryController.spesificationCategory_DropDown );

    // Delete
    arrValidate = [];
    arrValidate = [
        check("id").not().isEmpty().withMessage("Parameter id cannot be empty"),
    ];
    app.delete( rootAPIPath + 'master/spesification_category/delete/:id', spesificationCategoryController.spesificationCategory_Delete );


    // SPESIFICATION ATTRIBUTE
    // Save
    arrValidate = [];
    arrValidate = [
        check("name").not().isEmpty().withMessage("Parameter name cannot be empty"),
    ];
    app.post( rootAPIPath + 'master/spesification_attribute/save', arrValidate, spesificationAttributeController.spesificationAttribute_Save );

    // List
    arrValidate = [];
    arrValidate = [
        check("offset","Parameter offset must be integer and cannot be empty").not().isEmpty().isInt(),
        check("limit","Parameter limit must be integer and cannot be empty").not().isEmpty().isInt(),
    ];
    app.get( rootAPIPath + 'master/spesification_attribute/list', arrValidate, spesificationAttributeController.spesificationAttribute_List );

    arrValidate = [];
    arrValidate = [
        check("id").not().isEmpty().withMessage("Parameter id cannot be empty")
    ];
    app.get( rootAPIPath + 'master/spesification_attribute/detail/:id', arrValidate, spesificationAttributeController.spesificationAttribute_GetById );

    arrValidate = [];
    app.get( rootAPIPath + 'master/spesification_attribute/drop_down', arrValidate, spesificationAttributeController.spesificationAttribute_DropDown );

    // Delete
    arrValidate = [];
    arrValidate = [
        check("id").not().isEmpty().withMessage("Parameter id cannot be empty"),
    ];
    app.delete( rootAPIPath + 'master/spesification_attribute/delete/:id', spesificationAttributeController.spesificationAttribute_Delete );
}