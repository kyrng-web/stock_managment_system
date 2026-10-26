const Product = require("../models/Product");

exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .sort({ createdAt: -1 })
      .maxTimeMS(5000)
      .exec();

    return res.status(200).json({
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("Get products error:", error.message);

    return res.status(500).json({
      message: "Could not retrieve products.",
      error: error.message,
    });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);

    return res.status(201).json({
      message: "Product added successfully.",
      product,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "This SKU already exists. Use a unique SKU.",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message,
      });
    }

    console.error("Create product error:", error.message);

    return res.status(500).json({
      message: "Could not add product.",
    });
  }
};


exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^[a-fA-F0-9]{24}$/.test(id)) {
      return res.status(400).json({
        message: "Invalid product ID.",
      });
    }

    const product = await Product.findByIdAndUpdate(
      id,
      { $set: req.body },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!product) {
      return res.status(404).json({
        message: "Product not found.",
      });
    }

    return res.status(200).json({
      message: "Product updated successfully.",
      product,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message,
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        message: "A product with this unique value already exists.",
      });
    }

    console.error("Update product error:", error.message);

    return res.status(500).json({
      message: "Could not update product.",
    });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^[a-fA-F0-9]{24}$/.test(id)) {
      return res.status(400).json({
        message: "Invalid product ID.",
      });
    }

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found.",
      });
    }

    return res.status(200).json({
      message: "Product deleted successfully.",
      product,
    });
  } catch (error) {
    console.error("Delete product error:", error.message);

    return res.status(500).json({
      message: "Could not delete product.",
    });
  }
};
