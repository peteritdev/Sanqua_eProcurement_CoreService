"use strict";

module.exports = (sequelize, DataTypes) => {
  const GoodsReceipt = sequelize.define("tr_goodsreceipts", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    purchase_request_id: DataTypes.INTEGER,
    document_no: DataTypes.STRING,
    employee_id: DataTypes.INTEGER,
    employee_name: DataTypes.STRING,
    company_id: DataTypes.INTEGER,
    company_code: DataTypes.STRING,
    company_name: DataTypes.STRING,
    department_id: DataTypes.INTEGER,
    department_name: DataTypes.STRING,
    // payreq_no: DataTypes.STRING,
    po_no: DataTypes.STRING,
    sj_no: DataTypes.STRING,
    received_no: DataTypes.STRING,
    form_no: DataTypes.STRING,
    received_from_vendor_name: DataTypes.STRING,
    submitted_by_name: DataTypes.STRING,
    received_by_name: DataTypes.STRING,
    received_date: DataTypes.DATE,
    receipt_type: DataTypes.INTEGER, //1:receive, 2:return
    description: DataTypes.STRING,
    status: DataTypes.INTEGER,

    is_delete: DataTypes.INTEGER,
    deleted_at: DataTypes.DATE,
    deleted_by: DataTypes.INTEGER,
    deleted_by_name: DataTypes.STRING,
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: sequelize.literal("NOW()"),
      field: "created_at",
    },
    created_by: DataTypes.INTEGER,
    created_by_name: DataTypes.STRING,
    updatedAt: {
      type: DataTypes.DATE,
      field: "updated_at",
    },
    updated_by: DataTypes.INTEGER,
    updated_by_name: DataTypes.STRING,
  });

  GoodsReceipt.associate = function (models) {
    GoodsReceipt.hasMany(models.tr_goodsreceiptdetails, {
      foreignKey: "goods_receipt_id",
      as: "goods_receipt_detail",
    });
    GoodsReceipt.belongsTo(models.tr_purchaserequests, {
      foreignKey: "purchase_request_id",
      as: "purchase_request",
    });
  };

  return GoodsReceipt;
};
