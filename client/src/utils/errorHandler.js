/**
 * Centralized Error Handling Utility for Nivora Care HMS
 *
 * Normalizes Axios HTTP errors, Zod validation errors, network failures,
 * and JavaScript exceptions into clean, user-facing error messages.
 */

export function getErrorMessage(error, fallback = "An unexpected error occurred. Please try again.") {
  if (!error) return fallback;

  // Direct string error
  if (typeof error === "string") return error;

  // Axios HTTP response error with backend payload
  if (error.response?.data) {
    const data = error.response.data;

    // Explicit error message from backend
    if (data.message && typeof data.message === "string") {
      return data.message;
    }

    // Array of Zod / validation errors
    if (Array.isArray(data.errors) && data.errors.length > 0) {
      return data.errors.map((e) => e.message || e).join(" • ");
    }

    if (data.error && typeof data.error === "string") {
      return data.error;
    }
  }

  // Network offline / timeout error
  if (error.code === "ECONNABORTED" || error.message?.includes("Network Error")) {
    return "Network connection lost. Please verify your internet connection.";
  }

  // Standard Error instance message
  if (error.message && typeof error.message === "string") {
    return error.message;
  }

  return fallback;
}

export function logError(context, error) {
  if (process.env.NODE_ENV !== "production") {
    console.error(`[Error] [${context}]:`, error);
  }
}

