import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// ── Load .env before anything else ──────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env"), override: true });

// ── Helpers ─────────────────────────────────────────────────────────────────
const requireVar = (name) => {
  const value = process.env[name];
  if (!value) {
    console.error(`\n[!] Missing required environment variable: ${name}`);
    console.error(`    Please add ${name} to your server/.env file.`);
    console.error(`    See server/.env.example for reference.\n`);
    process.exit(1);
  }
  return value;
};

const optionalVar = (name, fallback = "") => process.env[name] || fallback;
const optionalInt = (name, fallback) => {
  const raw = process.env[name];
  return raw ? parseInt(raw, 10) : fallback;
};
const optionalBool = (name, fallback = false) => {
  const raw = process.env[name];
  return raw ? raw === "true" : fallback;
};

// ── Validated Config Object ─────────────────────────────────────────────────
/**
 * Centralised environment configuration for the HMS server.
 *
 * **Usage:**
 * ```js
 * import env from "../config/env.js";   // adjust relative path
 * const { port, jwtSecret, mongo } = env;
 * ```
 *
 * Required variables (`MONGO_URI`, `JWT_SECRET`) are validated at import time.
 * Missing any of them will immediately halt the process with a helpful message.
 */
const env = Object.freeze({
  /** `"development"` | `"production"` | `"test"` */
  nodeEnv: optionalVar("NODE_ENV", "development"),

  /** HTTP port the Express server listens on. */
  port: optionalInt("PORT", 5000),

  // ── Database ────────────────────────────────────────────────────────────
  mongo: Object.freeze({
    uri: requireVar("MONGO_URI"),
  }),

  // ── Authentication ──────────────────────────────────────────────────────
  jwtSecret: requireVar("JWT_SECRET"),

  // ── Client ──────────────────────────────────────────────────────────────
  clientUrl: optionalVar(
    "CLIENT_URL",
    optionalVar(
      "CLIENT_SERVICE_URL",
      process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "https://hospital-management-system-nine-gilt.vercel.app"
    )
  ),

  // ── Appointments ────────────────────────────────────────────────────────
  opdFee: optionalInt("OPD_FEE", 500),

  // ── OTP ─────────────────────────────────────────────────────────────────
  otpTtlMs: optionalInt("OTP_TTL_MS", 5 * 60 * 1000),

  // ── SMTP (e-mail) ───────────────────────────────────────────────────────
  smtp: Object.freeze({
    host: optionalVar("SMTP_HOST", ""),
    port: optionalInt("SMTP_PORT", 587),
    secure: optionalBool("SMTP_SECURE"),
    user: optionalVar("SMTP_USER", ""),
    pass: optionalVar("SMTP_PASS", ""),
    from: optionalVar("SMTP_FROM", "Hospital Management <no-reply@example.com>"),
    /** Returns `true` when sufficient SMTP config exists to send real e-mails. */
    get isConfigured() {
      return Boolean(this.host && this.user && this.pass);
    },
  }),

  // ── SMS ─────────────────────────────────────────────────────────────────
  smsGatewayDomain: optionalVar("SMS_GATEWAY_DOMAIN", ""),

  // ── Razorpay (payments) ─────────────────────────────────────────────────
  razorpay: Object.freeze({
    keyId: optionalVar("RAZORPAY_KEY_ID", ""),
    keySecret: optionalVar("RAZORPAY_KEY_SECRET", ""),
    webhookSecret: optionalVar(
      "RAZORPAY_WEBHOOK_SECRET",
      optionalVar("RAZORPAY_KEY_SECRET", "")
    ),
    /** Returns `true` when Razorpay credentials are configured. */
    get isConfigured() {
      return Boolean(this.keyId && this.keySecret);
    },
  }),

  // ── Feature flags / helpers ─────────────────────────────────────────────
  get isDevelopment() {
    return this.nodeEnv === "development";
  },
  get isProduction() {
    return this.nodeEnv === "production";
  },
  get isTest() {
    return this.nodeEnv === "test";
  },
});

export default env;
