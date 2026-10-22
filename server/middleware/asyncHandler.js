/**
 * Wraps an async Express route handler so that any rejected promise is
 * automatically forwarded to the Express error-handling middleware.
 *
 * **Before (repetitive try/catch in every handler):**
 * ```js
 * export const getItems = async (req, res) => {
 *   try { ... }
 *   catch (err) { res.status(500).json({ message: err.message }); }
 * };
 * ```
 *
 * **After (clean, one-liner):**
 * ```js
 * import asyncHandler from "../middleware/asyncHandler.js";
 * export const getItems = asyncHandler(async (req, res) => { ... });
 * ```
 *
 * Any thrown error is caught and passed to `next(err)`, which hits the
 * centralized `errorHandler` middleware in `errorMiddleware.js`.
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export default asyncHandler;
