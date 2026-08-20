const mongoose = require("mongoose");

/**
 * Connect to MongoDB instance using mongoose
 */
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ecocampus";
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`[MongoDB] Error connecting to database: ${error.message}`);
    console.warn("MongoDB not connected. Operating in mock/fallback mode.");
  }
};

module.exports = connectDB;
