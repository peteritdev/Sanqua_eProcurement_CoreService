const { check, validationResult } = require('express-validator');

class VendorValidation{
    constructor(){}

    // Vendor Validation 
    async saveProfile( req ){
        req.check("name").not().isEmpty().withMessage("Name cannot be empty");
        req.check("province_id").not().isEmpty().withMessage("Province ID cannot be empty");
        req.check("city_id").not().isEmpty().withMessage("City ID cannot be empty");
        req.check("address").not().isEmpty().withMessage("Address cannot be empty");
        req.check("zip_code").not().isEmpty().withMessage("Zip Code cannot be empty");
        req.check("phone1", "Phone number must be a number").not().isNumber();
        req.check("about").not().isEmpty().withMessage("About cannot be empty");
        req.check("company_scale","Company Scale must be a number").not().isEmpty().isInt(); 
        req.check("created_by").not().isEmpty().withMessage();

        var errors = req.validationErrors();
        return errors;
    }
}

module.exports = VendorValidation;