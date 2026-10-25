import mongoose from "mongoose";
import AppError from "./AppError.js";

/**
 * Ensures MongoDB is connected before proceeding with a database operation.
 * Throws AppError(503) with a consistent message when the database is unavailable.
 * This replaces all inline `mongoose.connection.readyState !== 1` checks that
 * previously returned mock database records.
 *
 * Usage in controllers:
 *   import { requireDb } from "../utils/requireDb.js";
 *   await requireDb(); // throws if DB unavailable
 */
export const requireDb = () => {
  if (mongoose.connection.readyState !== 1) {
    throw new AppError("Database service unavailable. Please try again shortly.", 503);
  }
};

export default requireDb;