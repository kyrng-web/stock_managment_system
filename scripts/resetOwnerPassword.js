
require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const connectDB = require("../config/db");
const User = require("../models/user");

async function resetOwnerPassword() {
  const password = process.env.OWNER_PASSWORD;

  if (!password || password.length < 6) {
    throw new Error(
      "Set OWNER_PASSWORD to at least 6 characters in .env."
    );
  }

  await connectDB();

  const owner = await User.findOne({ role: "superadmin" });

  if (!owner) {
    throw new Error("No super admin account was found.");
  }

  owner.password = await bcrypt.hash(password, 12);
  await owner.save();

  console.log("Owner password reset successfully!");
  console.log("Email:", owner.email);
}

resetOwnerPassword()
  .catch((error) => {
    console.error("Password reset failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => {});
  });
