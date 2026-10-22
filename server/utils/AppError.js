/**
 * Custom application error class for operational (expected) errors.
 *
 * Throw an `AppError` inside any controller or service to send a predictable
 * JSON error response. The centralized `errorHandler` middleware recognises
 * `AppError` instances and uses their status code and message directly.
 *
 * **Usage:**
 * ```js
 * import AppError from "../utils/AppError.js";
 *
 * if (!patient) throw new AppError("Patient not found", 404);
 * if (!authorized) throw new AppError("Access denied", 403);
 * ```
 */
class AppError extends Error {
  /**
   * @param {string} message  Human-readable error description.
   * @param {number} statusCode  HTTP status code (default 500).
   */
  constructor(message, statusCode = 500) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    /** Operational errors are expected; programming bugs are not. */
    this.isOperational = true;

    // Capture a clean stack trace, excluding this constructor frame.
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
