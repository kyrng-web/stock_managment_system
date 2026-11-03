const Product = require("../models/Product");

const PRODUCT_FIELDS = [
  "name",
  "sku",
  "category",
  "quantity",
  "price",
  "minStockLevel",
  "supplier",
];

function getActorId(user) {
  return user?._id || user?.id || user?.userId || user?.sub || null;
}

function pickProductFields(body = {}) {
  const fields = {};

  for (const field of PRODUCT_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      fields[field] = body[field];
    }
  }

  return fields;
}

function populateAuditFields(query) {
  return query
    .populate("createdBy", "name email role")
    .populate("updatedBy", "name email role");
}

function productResponse(product) {
  const data = product.toObject();

  data.createdBy = data.createdBy?.name || null;
  data.updatedBy = data.updatedBy?.name || null;

  return data;
}

function populateAuditFields(query) {
  return query
    .populate("createdBy", "name -_id")
    .populate("updatedBy", "name -_id");
}

// GET all products with creator and last updater.
exports.getProducts = async (req, res) => {
  try {
    const products = await populateAuditFields(
      Product.find().sort({ createdAt: -1 }).maxTimeMS(5000)
    ).exec();

   return res.status(200).json({
  count: products.length,
  products: products.map(productResponse),
});
  } catch (error) {
    console.error("Get products error:", error.message);

    return res.status(500).json({
      message: "Could not retrieve products.",
    });
  }
};

// POST create product and record who created it.
exports.createProduct = async (req, res) => {
  try {
    const actorId = getActorId(req.user);

    if (!actorId) {
      return res.status(401).json({
        message: "Cannot identify the logged-in user.",
      });
    }

    const product = await Product.create({
      ...pickProductFields(req.body),
      createdBy: actorId,
      updatedBy: null,
    });

    const populatedProduct = await populateAuditFields(
      Product.findById(product._id)
    );

    return res.status(201).json({
      message: "Product added successfully.",
        product: populatedProduct,
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

// PUT update product and record who updated it.
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const actorId = getActorId(req.user);

    if (!/^[a-fA-F0-9]{24}$/.test(id)) {
      return res.status(400).json({
        message: "Invalid product ID.",
      });
    }

    if (!actorId) {
      return res.status(401).json({
        message: "Cannot identify the logged-in user.",
      });
    }

    const updateFields = pickProductFields(req.body);

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({
        message: "Provide at least one valid product field to update.",
      });
    }

    // Clients cannot choose or overwrite audit fields.
    updateFields.updatedBy = actorId;

    const product = await populateAuditFields(
      Product.findByIdAndUpdate(
        id,
        { $set: updateFields },
        {
          new: true,
          runValidators: true,
        }
      )
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

// DELETE product.
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^[a-fA-F0-9]{24}$/.test(id)) {
      return res.status(400).json({
        message: "Invalid product ID.",
      });
    }

    const product = await populateAuditFields(
      Product.findByIdAndDelete(id)
    );

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