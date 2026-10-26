require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const connectDB = require("../config/db");
const User = require("../models/user");

async function createOwner() {
  const name = String(process.env.OWNER_NAME || "").trim();

  const email = String(process.env.OWNER_EMAIL || "")
    .trim()
    .toLowerCase();

  const password = process.env.OWNER_PASSWORD;

  if (!name || !email || !password) {
    throw new Error(
      "Set OWNER_NAME, OWNER_EMAIL and OWNER_PASSWORD in .env."
    );
  }

  if (password.length < 6) {
    throw new Error(
      "OWNER_PASSWORD must contain at least 6 characters."
    );
  }

  await connectDB();

  const existingOwner = await User.findOne({
    role: "superadmin",
  }).select("email");

  if (existingOwner) {
    console.log(
      `A super admin already exists: ${existingOwner.email}`
    );
    return;
  }

  const existingEmail = await User.findOne({ email }).select("_id");

  if (existingEmail) {
    throw new Error(
      "OWNER_EMAIL already belongs to another account."
    );
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const owner = await User.create({
    name,
    email,
    password: hashedPassword,
    role: "superadmin",
  });

  console.log("Owner account created successfully.");
  console.log("Name:", owner.name);
  console.log("Email:", owner.email);
  console.log("Role:", owner.role);
}

createOwner()
  .catch((error) => {
    console.error("Could not create owner:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => {});
  });