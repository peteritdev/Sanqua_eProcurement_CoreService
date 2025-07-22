'use strict';

module.exports = (sequelize, DataTypes) => {
	const VendorRegistration = sequelize.define('tr_vendorregistrations', {
		id: {
			type: DataTypes.BIGINT,
			primaryKey: true,
			autoIncrement: true // Tidak auto increment karena sudah ditentukan manual
		},
		name: DataTypes.STRING,
		business_entity: DataTypes.SMALLINT, // 1:UD, 2:CV, 3:PT, 4:Lain-lain
		year_founded: DataTypes.STRING(4),
		address: DataTypes.STRING,
		province_id: DataTypes.INTEGER,
		province_name: DataTypes.STRING,
		post_code: DataTypes.STRING(10),
		city_id: DataTypes.INTEGER,
		city_name: DataTypes.STRING,
		lat: DataTypes.STRING(20),
		lng: DataTypes.STRING(20),
		phone_number: DataTypes.STRING(10),
		email: DataTypes.STRING,
		website: DataTypes.STRING,
		company_scale: DataTypes.INTEGER, // 1:Kecil, 2:Menengah, 3:Besar
		classification_id: DataTypes.SMALLINT,
		classification_name: DataTypes.STRING,
		sub_classification_id: DataTypes.SMALLINT,
		sub_classification_name: DataTypes.STRING,
		vendor_contact: DataTypes.JSON,
		vendor_finance: DataTypes.JSON,
		vendor_experience: DataTypes.JSON,
		vendor_product_category: DataTypes.JSON,
		vendor_document: DataTypes.JSON,
		is_delete: {
			type: DataTypes.SMALLINT,
			defaultValue: 0
		},
		deletedAt: {
			type: DataTypes.DATE,
			field: 'deleted_at'
		},
		deleted_by: {
			type: DataTypes.INTEGER,
			defaultValue: 0
		},
		deleted_by_name: DataTypes.STRING,
		createdAt: {
			type: DataTypes.DATE,
			field: 'created_at',
			defaultValue: sequelize.literal('NOW()')
		},
		created_by: {
			type: DataTypes.INTEGER,
			defaultValue: 0
		},
		created_by_name: DataTypes.STRING,
		updatedAt: {
			type: DataTypes.DATE,
			field: 'updated_at'
		},
		updated_by: {
			type: DataTypes.INTEGER,
			defaultValue: 0
		},
		updated_by_name: DataTypes.STRING,
		created_by_company_id: {
			type: DataTypes.INTEGER,
			defaultValue: 0
		},
		created_by_company_name: DataTypes.STRING,
        takeAt: {
			type: DataTypes.DATE,
			field: 'take_at'
		},
		take_by: {
			type: DataTypes.INTEGER,
			defaultValue: 0
		},
		take_by_name: DataTypes.STRING,
		status: DataTypes.INTEGER, // 0: Draft, 1: Waiting, 2: Inprogress, 3: Done, 4: Cancel
	});

	// Jika ingin relasi ditambahkan, bisa diatur di sini
	VendorRegistration.associate = function(models) {
        VendorRegistration.belongsTo(models.ms_provinces, {
			foreignKey: 'province_id',
			as: 'province'
		});

		VendorRegistration.belongsTo(models.ms_cities, {
			foreignKey: 'city_id',
			as: 'city'
		});

		VendorRegistration.belongsTo(models.ms_classifications, {
			foreignKey: 'classification_id',
			as: 'classification'
		});

		VendorRegistration.belongsTo(models.ms_subclassifications, {
			foreignKey: 'sub_classification_id',
			as: 'sub_classification'
		});
	};

	return VendorRegistration;
};
