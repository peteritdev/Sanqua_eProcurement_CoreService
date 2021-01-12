const masterController = require('../controllers').master;
const productCategoryController = require('../controllers').productCategory;
const productController = require('../controllers').product;
const unitController = require('../controllers').unit;

const { check, validationResult } = require('express-validator');

var rootAPIPath = '/api/procurement/v1/';

module.exports = (app) => {
    app.get(rootAPIPath, (req, res) => res.status(200).send({
        message: 'Welcome to the Todos API!',
    }));

    // Document Type
    app.post( rootAPIPath + 'master/document_type/save', masterController.documentType_Save );
    app.get( rootAPIPath + 'master/document_type/list', masterController.documentType_List );
    app.delete( rootAPIPath + 'master/document_type/delete', masterController.documentType_Delete );

    // Product Category
    app.post( rootAPIPath + 'master/product_category/save', productCategoryController.productCategory_Save );
    app.get( rootAPIPath + 'master/product_category/list', productCategoryController.productCategory_List );
    app.delete( rootAPIPath + 'master/product_category/delete', productCategoryController.productCategory_Delete );
    app.post( rootAPIPath + 'master/product_category/upload', productCategoryController.productCategory_Upload );
    app.post( rootAPIPath + 'master/product_category/batch_save', productCategoryController.productCategory_BatchSave );

    // Product
    var xArrValidateProduct = [
        check("category_id","Parameter category_id can not be empty and must be integer").not().isEmpty().isInt(),
        check("name").not().isEmpty().withMessage("Parameter name can not be empty"),
        check("unit_id","Parameter unit_id can not be empty and must be integer").not().isEmpty().isInt(),
        check("merk").not().isEmpty().withMessage("Merk cannot be empty"),
        check("spesification").not().isEmpty().withMessage("Spesification cannot be empty"),
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
    app.delete( rootAPIPath + 'master/product/delete/:id', productController.product_Delete );
    app.post( rootAPIPath + 'master/product/upload', productController.product_Upload );
    app.post( rootAPIPath + 'master/product/batch_save', productController.product_BatchSave );
    app.get( rootAPIPath + 'master/product/drop_down', productController.product_DropDown );

    // Unit
    app.post( rootAPIPath + 'master/unit/save', unitController.unit_Save );
    app.get( rootAPIPath + 'master/unit/list', unitController.unit_List );
    app.delete( rootAPIPath + 'master/unit/delete', unitController.unit_Delete );

    //Business Entity
    app.get( rootAPIPath + 'master/business_entity/drop_down', masterController.businessEntity_DropDown );

    //Classification
    app.get( rootAPIPath + 'master/classification/drop_down', masterController.classification_DropDown );

    //Province
    app.get( rootAPIPath + 'master/province/drop_down', masterController.province_DropDown );
}