import mongoose from "mongoose";

/**
 * Opens the MongoDB connection used by the Express application.
 * MONGO_URI is kept in .env so connection details are not committed to Git.
 */
const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    console.error("\n[!] MongoDB Configuration Error: MONGO_URI is not set in server/.env");
    console.error("Please add MONGO_URI to your server/.env file, e.g.:");
    console.error("  MONGO_URI=mongodb://127.0.0.1:27017/hospital-db (Local)");
    console.error("  or a MongoDB Atlas connection string (Cloud)\n");
    process.exit(1);
  }

  try {
    const connection = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`MongoDB connected: ${connection.connection.host}`);
  } catch (error) {
    console.error(`\nMongoDB connection error: ${error.message}`);
    console.error("\n[!] MongoDB Troubleshooting Tips:");
    console.error("1. For Local MongoDB: Ensure MongoDB is installed and the service is running (e.g. run 'mongod' or start MongoDB in Windows Services).");
    console.error("2. For MongoDB Atlas (Free Cloud Database):");
    console.error("   - Create a free cluster at https://www.mongodb.com/atlas");
    console.error("   - Copy your connection string and update MONGO_URI in 'server/.env':");
    console.error("     MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/hospital-db?retryWrites=true&w=majority\n");
    process.exit(1);
  }
};

export default connectDB;

