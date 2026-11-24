import mongoose from "mongoose";

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is missing from .env");
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      bufferCommands: false,
    });
    console.log("MongoDB connected successfully.");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    throw error;
  }
};

export default connectDB;
