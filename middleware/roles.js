const User = require("../models/user");

function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required. Please log in.",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: "You do not have permission to perform this action.",
      });
    }

    next();
  };
}

async function requireProductPermission(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required. Please log in.",
      });
    }

    const userId =
      req.user._id ||
      req.user.id ||
      req.user.userId ||
      req.user.sub;

    if (!userId) {
      return res.status(401).json({
        message: "Could not identify the logged-in user.",
      });
    }

    const user = await User.findById(userId)
      .select("role canAddProduct");

    if (!user) {
      return res.status(401).json({
        message: "User account not found.",
      });
    }

    if (
      user.role !== "superadmin" &&
      user.canAddProduct !== true
    ) {
      return res.status(403).json({
        message: "You do not have permission to add products.",
      });
    }

    next();
  } catch (error) {
    console.error("Product permission error:", error.message);

    return res.status(500).json({
      message: "Unable to verify product permissions.",
    });
  }
}

module.exports = {
  authorizeRoles,
  requireProductPermission,
};