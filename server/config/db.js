import mongoose from "mongoose";
import env from "./env.js";

// Disable Mongoose command buffering so operations fail fast or fall back to offline demo
// instead of hanging incoming Express requests.
mongoose.set("bufferCommands", false);

/**
 * Mongoose connection options configured for high reliability on cloud platforms (Render / Atlas).
 * - serverSelectionTimeoutMS: 10000
 * - connectTimeoutMS: 10000
 * - maxPoolSize: 10
 * - minPoolSize: 1
 * - maxIdleTimeMS: 60000
 */
export const mongoConnectionOptions = Object.freeze({
  serverSelectionTimeoutMS: 10000,
  connectTimeoutMS: 10000,
  maxPoolSize: 10,
  minPoolSize: 1,
  maxIdleTimeMS: 60000,
});

// ── Secret-Free Logging Helpers ───────────────────────────────────────────────

/**
 * Strips user credentials and passwords from MongoDB connection strings.
 * Guarantees secrets are never exposed in console or log streams.
 */
export const sanitizeMongoUri = (uri) => {
  if (!uri || typeof uri !== "string") return "[empty-uri]";
  try {
    return uri.replace(/(mongodb(?:\+srv)?:\/\/[^:]+:)(.*)(@[^/@?]+)/i, "$1****$3");
  } catch {
    return "[redacted-uri]";
  }
};

/**
 * Strips credentials, auth tokens, or passwords if embedded within error messages.
 */
export const sanitizeErrorMessage = (error) => {
  if (!error) return "Unknown error";
  const rawMsg = typeof error === "string" ? error : error.message || String(error);
  return rawMsg
    .replace(/(mongodb(?:\+srv)?:\/\/[^:]+:)(.*?)(@[^/@?\s]+)/gi, "$1****$3")
    .replace(/(password|secret|pwd)=[^\s&;]+/gi, "$1=****");
};

/**
 * Emits structured, secret-free log records.
 */
export const logStructured = (level, event, details = {}) => {
  const timestamp = new Date().toISOString();
  const payload = {
    timestamp,
    level,
    event,
    ...details,
  };
  const line = `[${timestamp}] [MongoDB] [${event}] ${JSON.stringify(payload)}`;
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
};

// ── Connection State & Reconnect Engine ───────────────────────────────────────

let isConnecting = false;
let reconnectAttempt = 0;
let reconnectTimer = null;
let listenersAttached = false;

export const BASE_RECONNECT_DELAY_MS = 1000;
export const MAX_RECONNECT_DELAY_MS = 30000;

/**
 * Computes exponential backoff delay with randomized jitter to prevent thundering herds.
 * min(1000 * 2^attempt + jitter, 30000)
 */
export const calculateBackoffDelay = (attempt) => {
  const safeAttempt = Math.max(0, Math.min(attempt, 10)); // cap exponent to prevent overflow
  const exponential = BASE_RECONNECT_DELAY_MS * Math.pow(2, safeAttempt);
  const jitter = Math.floor(Math.random() * 1000);
  return Math.min(exponential + jitter, MAX_RECONNECT_DELAY_MS);
};

/**
 * Schedules a single reconnect attempt with exponential backoff if not already connecting.
 * Prevents concurrent timer scheduling.
 */
export const scheduleReconnect = (reason = "connection_lost") => {
  // If already connected, no need to reconnect
  if (mongoose.connection.readyState === 1) {
    return;
  }

  // If a reconnect timer is already pending, let it proceed
  if (reconnectTimer) {
    return;
  }

  const delayMs = calculateBackoffDelay(reconnectAttempt);
  reconnectAttempt += 1;

  logStructured("warn", "RECONNECT_SCHEDULED", {
    reason,
    attempt: reconnectAttempt,
    delayMs,
  });

  reconnectTimer = setTimeout(async () => {
    reconnectTimer = null;
    await executeConnect("reconnect_timer");
  }, delayMs);
};

/**
 * Core connect logic enforcing the single connection invariant and mutex guard.
 * Prevents concurrent reconnect attempts.
 */
export const executeConnect = async (trigger = "initial") => {
  // Guard 1: Mutex lock to prevent overlapping connection requests
  if (isConnecting) {
    logStructured("log", "CONNECT_SKIPPED", {
      reason: "Connection attempt already in progress",
      trigger,
      readyState: mongoose.connection.readyState,
    });
    return;
  }

  // Guard 2: Already connected
  if (mongoose.connection.readyState === 1) {
    reconnectAttempt = 0;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    logStructured("log", "CONNECT_SKIPPED", {
      reason: "Already connected to MongoDB",
      trigger,
      host: mongoose.connection.host,
    });
    return;
  }

  isConnecting = true;

  try {
    logStructured("log", "CONNECT_ATTEMPT", {
      trigger,
      attempt: reconnectAttempt,
      target: sanitizeMongoUri(env.mongo.uri),
    });

    const conn = await mongoose.connect(env.mongo.uri, mongoConnectionOptions);
    reconnectAttempt = 0;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    logStructured("log", "CONNECTED", {
      host: conn.connection.host,
      port: conn.connection.port,
      database: conn.connection.name,
      readyState: conn.connection.readyState,
    });
  } catch (error) {
    const sanitizedMsg = sanitizeErrorMessage(error);
    logStructured("error", "CONNECT_FAILED", {
      trigger,
      attempt: reconnectAttempt,
      errorMessage: sanitizedMsg,
      errorName: error.name || "Error",
    });

    // CRITICAL: NEVER invoke process.exit() or shutdown server on MongoDB connection error.
    // The server continues serving health checks and requests (with offline fallback)
    // while exponential backoff reconnection runs in the background.
    scheduleReconnect(`connect_failure: ${sanitizedMsg}`);
  } finally {
    isConnecting = false;
  }
};

/**
 * Attaches persistent event listeners to the single shared Mongoose connection.
 * Guaranteed to attach exactly once per process.
 */
export const attachConnectionListeners = () => {
  if (listenersAttached) return;
  listenersAttached = true;

  mongoose.connection.on("connected", () => {
    reconnectAttempt = 0;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    logStructured("log", "EVENT_CONNECTED", {
      host: mongoose.connection.host,
      readyState: mongoose.connection.readyState,
    });
  });

  mongoose.connection.on("disconnected", () => {
    logStructured("warn", "EVENT_DISCONNECTED", {
      message: "MongoDB connection disconnected",
      readyState: mongoose.connection.readyState,
    });
    // Trigger exponential backoff reconnect
    scheduleReconnect("mongoose_event_disconnected");
  });

  mongoose.connection.on("reconnected", () => {
    reconnectAttempt = 0;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    logStructured("log", "EVENT_RECONNECTED", {
      host: mongoose.connection.host,
      readyState: mongoose.connection.readyState,
    });
  });

  mongoose.connection.on("error", (error) => {
    logStructured("error", "EVENT_ERROR", {
      errorMessage: sanitizeErrorMessage(error),
      errorName: error.name || "Error",
      readyState: mongoose.connection.readyState,
    });
    if (mongoose.connection.readyState !== 1 && mongoose.connection.readyState !== 2) {
      scheduleReconnect("mongoose_event_error");
    }
  });

  mongoose.connection.on("close", () => {
    logStructured("log", "EVENT_CLOSED", {
      message: "MongoDB connection closed",
      readyState: mongoose.connection.readyState,
    });
  });
};

/**
 * Initializes the shared MongoDB connection for the Express process.
 * Never calls process.exit() on connection failure, allowing the process to
 * start immediately and serve /health while retrying connection in background.
 */
const connectDB = async () => {
  attachConnectionListeners();
  await executeConnect("initial_startup");
};

export default connectDB;
