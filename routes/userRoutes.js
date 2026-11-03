const express = require("express");

const {
  createUser,
  listUsers,
  setProductPermission,
  deleteUser,
} = require("../controllers/userController");

const { protect } = require("../middleware/auth");

const {
  authorizeRoles,
} = require("../middleware/roles");

const router = express.Router();

router.use(protect);

router.get(
  "/",
  authorizeRoles("superadmin", "admin"),
  listUsers
);

router.post(
  "/",
  protect,
  authorizeRoles("superadmin", "admin"),
  createUser
);

router.patch(
  "/:id/product-permission",
  authorizeRoles("superadmin", "admin"),
  setProductPermission
);

router.delete(
  "/:id",
  authorizeRoles("superadmin", "admin"),
  deleteUser
);

module.exports = router;