import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mongoose from "mongoose";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env"), override: true });

const mongoClientOptions = {
  serverSelectionTimeoutMS: 5000,
  // Keep a small pool of warm connections. For remote MongoDB (e.g. Atlas
  // free tier) re-establishing connections adds significant per-request
  // latency, so a pre-warmed pool makes dashboards feel snappier.
  minPoolSize: 2,
  maxPoolSize: 10,
};

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
    const connection = await mongoose.connect(mongoUri, mongoClientOptions);
    console.log(`MongoDB connected: ${connection.connection.host}`);
  } catch (error) {
    console.error(`\n[!] MongoDB initial connection warning: ${error.message}`);
    console.error("The server will remain running on port " + (process.env.PORT || 5000) + " and retry connecting in the background.");
    console.error("Tip: Whitelist your IP in MongoDB Atlas Network Access: https://www.mongodb.com/docs/atlas/security-whitelist/\n");

    // Retry in background every 8 seconds
    const retryInterval = setInterval(async () => {
      try {
        if (mongoose.connection.readyState === 1) {
          clearInterval(retryInterval);
          return;
        }
        console.log("[MongoDB] Attempting reconnection...");
        const conn = await mongoose.connect(mongoUri, mongoClientOptions);
        console.log(`[MongoDB] Reconnection successful: ${conn.connection.host}`);
        clearInterval(retryInterval);
      } catch (err) {
        // Keep retrying quietly
      }
    }, 8000);
  }
};

export default connectDB;

