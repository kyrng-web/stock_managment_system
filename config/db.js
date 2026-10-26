const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const mongoURI =
      process.env.MONGO_URI ||
      "mongodb://127.0.0.1:27017/stocks";

    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });

    console.log("MongoDB connected successfully!");
    console.log("Database:", mongoose.connection.name);
    console.log("MongoDB readyState:", mongoose.connection.readyState);
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    throw error;
  }
};

module.exports = connectDB;