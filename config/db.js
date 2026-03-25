const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined in environment variables");
    }

    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // fail fast if DB unreachable
      socketTimeoutMS: 45000,
    });

    console.log("✅ MongoDB Connected");

    // 🔥 Handle connection events (important in production)
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
    });

  } catch (err) {
    console.error("❌ Mongo Error:", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;