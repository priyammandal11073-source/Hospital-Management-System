import mongoose from "mongoose";

/**
 * Opens the MongoDB connection used by the Express application.
 * MONGO_URI is kept in .env so connection details are not committed to Git.
 */
const connectDB = async () => {
  try {
    const connection = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${connection.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
