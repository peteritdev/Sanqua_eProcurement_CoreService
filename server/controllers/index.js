const vendor = require('./vendor');
const vendorExperience = require('./vendorexperience');
const vendorCatalogue = require('./vendorcatalogue');

const master = require('./master');
const productCategory = require('./productcategory');
const product = require('./product');
const unit = require('./unit');

module.exports = {
	vendor,
	master, productCategory, product, unit,
	vendorExperience, vendorCatalogue,
}