const bcrypt = require("bcryptjs");
const User = require("../models/user");

function getActorId(user) {
  return user?._id || user?.id || user?.userId || user?.sub || null;
}

function createdBySummary(user) {
  if (!user?.createdBy) return null;

  return {
    id: user.createdBy._id,
    name: user.createdBy.name,
    email: user.createdBy.email,
    role: user.createdBy.role,
  };
}

// POST create user and record who created the account.
exports.createUser = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();

    const password = req.body.password;
    const role = String(req.body.role || "")
      .trim()
      .toLowerCase();

    const creatorId = getActorId(req.user);

    if (
      !name ||
      !email ||
      typeof password !== "string" ||
      !password ||
      !role
    ) {
      return res.status(400).json({
        message: "Name, email, password and role are required.",
      });
    }

    if (!creatorId) {
      return res.status(401).json({
        message: "Cannot identify the logged-in user.",
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        message: "Please provide a valid email address.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters.",
      });
    }

    if (!["admin", "storekeeper"].includes(role)) {
      return res.status(400).json({
        message: "Role must be admin or storekeeper.",
      });
    }

    // Bosses can create storekeepers only.
    if (req.user.role === "admin" && role !== "storekeeper") {
      return res.status(403).json({
        message: "Bosses can create storekeepers only.",
      });
    }

    if (!["superadmin", "admin"].includes(req.user.role)) {
      return res.status(403).json({
        message: "You cannot create users.",
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      canAddProduct: false,
      createdBy: creatorId,
    });

    await user.populate("createdBy", "name email role");

    return res.status(201).json({
      message: `${role} account created successfully.`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        canAddProduct: user.canAddProduct,
        createdBy: createdBySummary(user),
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message,
      });
    }

    console.error("Create user error:", error.message);

    return res.status(500).json({
      message: "Unable to create this user.",
    });
  }
};

// GET users with the creator's details.
exports.listUsers = async (req, res) => {
  try {
    const filter =
      req.user.role === "admin"
        ? { role: "storekeeper" }
        : {};

    const users = await User.find(filter)
      .select("name email role canAddProduct createdAt createdBy")
      .populate("createdBy", "name email role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("List users error:", error.message);

    return res.status(500).json({
      message: "Unable to retrieve users.",
    });
  }
};

// Grant or revoke permission to add products.
exports.setProductPermission = async (req, res) => {
  try {
    const { canAddProduct } = req.body;

    if (typeof canAddProduct !== "boolean") {
      return res.status(400).json({
        message: "canAddProduct must be true or false.",
      });
    }

    if (!/^[a-fA-F0-9]{24}$/.test(req.params.id)) {
      return res.status(400).json({
        message: "Invalid user ID.",
      });
    }

    const targetUser = await User.findById(req.params.id);

    if (!targetUser) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    if (targetUser.role === "superadmin") {
      return res.status(403).json({
        message: "Owner permissions cannot be changed here.",
      });
    }

    if (
      req.user.role === "admin" &&
      targetUser.role !== "storekeeper"
    ) {
      return res.status(403).json({
        message: "Bosses can manage storekeeper permissions only.",
      });
    }

    if (!["superadmin", "admin"].includes(req.user.role)) {
      return res.status(403).json({
        message: "You cannot manage product permissions.",
      });
    }

    targetUser.canAddProduct = canAddProduct;
    await targetUser.save();

    return res.status(200).json({
      message: canAddProduct
        ? "Product permission granted."
        : "Product permission revoked.",
      user: {
        id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        canAddProduct: targetUser.canAddProduct,
      },
    });
  } catch (error) {
    console.error("Permission error:", error.message);

    return res.status(500).json({
      message: "Unable to update product permission.",
    });
  }
};

// DELETE user.
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^[a-fA-F0-9]{24}$/.test(id)) {
      return res.status(400).json({
        message: "Invalid user ID.",
      });
    }

    if (!["superadmin", "admin"].includes(req.user.role)) {
      return res.status(403).json({
        message: "You are not allowed to delete users.",
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    if (user.role === "superadmin") {
      return res.status(403).json({
        message: "The Owner account cannot be deleted here.",
      });
    }

    const currentUserId = String(getActorId(req.user) || "");

    if (currentUserId && currentUserId === user._id.toString()) {
      return res.status(403).json({
        message: "You cannot delete your own account.",
      });
    }

    if (
      req.user.role === "admin" &&
      user.role !== "storekeeper"
    ) {
      return res.status(403).json({
        message: "Bosses can delete storekeepers only.",
      });
    }

    await User.findByIdAndDelete(id);

    return res.status(200).json({
      message: "User deleted successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdBy: user.createdBy || null,
      },
    });
  } catch (error) {
    console.error("Delete user error:", error.message);

    return res.status(500).json({
      message: "Unable to delete user.",
    });
  }
};