// Centralized Error Handling Middleware for Nivora Care HMS

export const notFoundHandler = (req, res, next) => {
  const error = new Error(`Resource not found on Nivora Care HMS: ${req.method} ${req.originalUrl}`);
  res.status(404);
  next(error);
};

export const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || "Internal Server Error";

  // Mongoose bad ObjectId CastError
  if (err.name === "CastError") {
    message = `Resource not found with invalid identifier: ${err.value}`;
    statusCode = 404;
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    message = `Duplicate entry detected: ${field} '${err.keyValue ? err.keyValue[field] : ""}' already exists.`;
    statusCode = 409;
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ");
    statusCode = 400;
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    message = "Invalid authentication token. Please re-authenticate.";
    statusCode = 401;
  }

  if (err.name === "TokenExpiredError") {
    message = "Authentication token has expired. Please sign in again.";
    statusCode = 401;
  }

  res.status(statusCode).json({
    success: false,
    message,
    statusCode,
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
