import mongoose from "mongoose";
import env from "./env.js";

// Disable Mongoose command buffering so queries fail immediately or switch to fallback
// instead of hanging incoming Express requests for 10 seconds.
mongoose.set("bufferCommands", false);

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
 * The connection URI is read from the centralized `env` config module,
 * which validates the `MONGO_URI` variable at startup.
 */
const connectDB = async () => {
  try {
    const connection = await mongoose.connect(env.mongo.uri, mongoClientOptions);
    console.log(`MongoDB connected: ${connection.connection.host}`);
  } catch (error) {
    console.error(`\n[!] MongoDB initial connection warning: ${error.message}`);
    console.error("The server will remain running on port " + env.port + " and retry connecting in the background.");
    console.error("Tip: Whitelist your IP in MongoDB Atlas Network Access: https://www.mongodb.com/docs/atlas/security-whitelist/\n");

    // Retry in background every 8 seconds
    const retryInterval = setInterval(async () => {
      try {
        if (mongoose.connection.readyState === 1) {
          clearInterval(retryInterval);
          return;
        }
        console.log("[MongoDB] Attempting reconnection...");
        const conn = await mongoose.connect(env.mongo.uri, mongoClientOptions);
        console.log(`[MongoDB] Reconnection successful: ${conn.connection.host}`);
        clearInterval(retryInterval);
      } catch {
        // Keep retrying quietly
      }
    }, 8000);
  }
};

export default connectDB;
