const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    category: {
      type: String,
      required: true,
      trim: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    minStockLevel: {
      type: Number,
      default: 5,
      min: 0,
    },

    supplier: {
      type: String,
      default: "Not specified",
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);