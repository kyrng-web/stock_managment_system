
const express = require("express");
const router = express.Router();

const {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

const { protect } = require("../middleware/auth");
const {
  authorizeRoles,
  requireProductPermission,
} = require("../middleware/roles");

router.use(protect);

// All logged-in users can view products.
router.get("/", getProducts);

// Owner or explicitly permitted users can add products.
router.post("/", requireProductPermission, createProduct);

// Only the owner and boss can update products.
router.put(
  "/:id",
  authorizeRoles("superadmin", "admin"),
  updateProduct
);

// Only the owner and boss can delete products.
router.delete(
  "/:id",
  authorizeRoles("superadmin", "admin"),
  deleteProduct
);

module.exports = router;
