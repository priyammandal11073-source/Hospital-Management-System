import rateLimit from "express-rate-limit";

/**
 * Application rate limiters.
 *
 * Authentication and OTP endpoints are brute-force targets, so they get
 * tighter windows than regular API traffic. All limiters are disabled in
 * the test environment so CI does not trip over rapid-fire requests.
 */

const responseMessage = (windowMinutes) => ({
  success: false,
  message: `Too many requests from this IP. Please try again in ${windowMinutes} minute(s).`,
});

const isTestEnv = () => process.env.NODE_ENV === "test";

// POST /api/auth/login and /api/auth/register (15 requests / 15 minutes / IP)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: responseMessage(15),
  skip: isTestEnv,
});

// POST /api/patient-auth/* e.g. OTP send, register, login (20 requests / 15 minutes / IP)
export const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: responseMessage(15),
  skip: isTestEnv,
});

// Catch-all guard for the whole /api surface (600 requests / 15 minutes / IP)
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: responseMessage(15),
  skip: isTestEnv,
});