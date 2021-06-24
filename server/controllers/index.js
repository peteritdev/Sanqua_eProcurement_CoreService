const vendor = require('./vendor');
const vendorRateHistory = require('./vendorratehistory');
const vendorExperience = require('./vendorexperience');
const vendorCatalogue = require('./vendorcatalogue');

const master = require('./master');
const productCategory = require('./productcategory');
const product = require('./product');
const unit = require('./unit');
const currency = require('./currency');

const spesificationCategory = require( './spesificationcategory' );
const spesificationAttribute = require('./spesificationattribute');
const vendorCatalogueQuotation = require('./vendorcataloguequotation');
const vendorCatalogueSpesification = require('./vendorcataloguespesification');

const globalMaster = require('./globalmaster');
const procurement = require('./procurement');
const procurementItem = require('./procurementitem');
const procurementSchedule = require('./procurementschedule');
const procurementTerm = require('./procurementterm');
const procurementVendor = require('./procurementvendor');
const procurementQuotationItem = require('./procurementquotationitem');
const procurementEvaluation = require('./procurementevaluation');

module.exports = {
	vendor,
	master, productCategory, product, unit, currency,
	vendorExperience, vendorCatalogue,
	spesificationCategory, spesificationAttribute, vendorCatalogueQuotation, vendorCatalogueSpesification,
	vendorRateHistory,
	procurement, procurementItem, globalMaster, procurementSchedule, procurementTerm, procurementVendor, procurementQuotationItem,
	procurementEvaluation,
}