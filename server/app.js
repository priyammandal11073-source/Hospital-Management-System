import cors from "cors";
import express from "express";
import compression from "compression";
import mongoose from "mongoose";
import env from "./config/env.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import billingRoutes from "./routes/billingRoutes.js";
import doctorRoutes from "./routes/doctorRoutes.js";
import patientRoutes from "./routes/patientRoutes.js";
import patientAuthRoutes from "./routes/patientAuthRoutes.js";
import patientPortalRoutes from "./routes/patientPortalRoutes.js";
import prescriptionRoutes from "./routes/prescriptionRoutes.js";
import bedRoutes from "./routes/bedRoutes.js";
import razorpayRoutes from "./routes/razorpayRoutes.js";
import vitalsRoutes from "./routes/vitalsRoutes.js";
import labReportRoutes from "./routes/labReportRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import nurseRoutes from "./routes/nurseRoutes.js";
import doctorClinicalRoutes from "./routes/doctorClinicalRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import receptionistRoutes from "./routes/receptionistRoutes.js";
import pharmacyRoutes from "./routes/pharmacyRoutes.js";
import diagnosticRoutes from "./routes/diagnosticRoutes.js";
import emergencyRoutes from "./routes/emergencyRoutes.js";
import { notFoundHandler, errorHandler } from "./middleware/errorMiddleware.js";
import { apiLimiter } from "./middleware/rateLimiters.js";
import { rzpWebhookHandler } from "./controllers/razorpayController.js";

/**
 * Builds the Express application with all routes and error handling wired up.
 * Kept separate from server.js (which is responsible for connecting to the
 * database and listening on a port) so the API can be exercised by tests
 * without opening a connection or a live socket.
 */
const createApp = () => {
  const app = express();

  // Security hardening: Disable fingerprinting
  app.disable("x-powered-by");

  // Security hardening: Standard HTTP response protection headers
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("X-XSS-Protection", "0");
    if (env.isProduction) {
      res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    }
    next();
  });

  // Security hardening: Strict CORS origin validation
  const allowedOrigins = [
    env.clientUrl,
    "https://hospital-management-system-nine-gilt.vercel.app",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ].filter(Boolean);

  const corsOptions = {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or same-origin/supertest)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      // Allow localhost with any port in development
      if (env.isDevelopment && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }
      return callback(new Error("CORS policy: Access denied for this origin."), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  };

  // Register unthrottled health & ready endpoints BEFORE apiLimiter so cloud probes never exhaust rate limits
  const livenessHandler = (req, res) => {
    res.status(200).json({
      status: "ok",
      service: "nivora-care-hospital",
      timestamp: new Date().toISOString(),
    });
  };

  const readinessHandler = (req, res) => {
    const isConnected = mongoose.connection.readyState === 1;
    if (isConnected) {
      return res.status(200).json({
        ready: true,
        status: "ready",
        service: "nivora-care-hospital",
        timestamp: new Date().toISOString(),
      });
    }

    return res.status(503).json({
      ready: false,
      status: "not_ready",
      service: "nivora-care-hospital",
      timestamp: new Date().toISOString(),
      message: "Database connection not ready.",
    });
  };

  app.get("/health", livenessHandler);
  app.get("/ready", readinessHandler);
  app.get("/api/ready", readinessHandler);

  // Razorpay webhook signature verification requires the untouched raw body Buffer.
  // Registered BEFORE global express.json() so the HMAC digest matches Razorpay's signature.
  app.post("/api/razorpay/webhook", express.raw({ type: "application/json" }), rzpWebhookHandler);

  // Middleware that applies to remaining incoming requests.
  app.use(cors(corsOptions));
  app.use(compression());
  app.use(express.json());
  app.use("/api", apiLimiter);

  app.use("/api/auth", authRoutes);
  app.use("/api/appointments", appointmentRoutes);
  app.use("/api/billing", billingRoutes);
  app.use("/api/doctors", doctorRoutes);
  app.use("/api/patients", patientRoutes);
  app.use("/api/patient-auth", patientAuthRoutes);
  app.use("/api/patient-portal", patientPortalRoutes);
  app.use("/api/prescriptions", prescriptionRoutes);
  app.use("/api/beds", bedRoutes);
  app.use("/api/razorpay", razorpayRoutes);
  app.use("/api/vitals", vitalsRoutes);
  app.use("/api/lab-reports", labReportRoutes);
  app.use("/api/notifications", notificationRoutes);
  app.use("/api/nurse", nurseRoutes);
  app.use("/api/doctor-workspace", doctorClinicalRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/receptionist", receptionistRoutes);
  app.use("/api/pharmacy", pharmacyRoutes);
  app.use("/api/diagnostics", diagnosticRoutes);
  app.use("/api/emergency", emergencyRoutes);

  // Liveness probe on /api/health without environmental or internal system disclosure
  app.get("/api/health", livenessHandler);

  // 404 handler for undefined endpoints
  app.use(notFoundHandler);

  // Global exception and error handler
  app.use(errorHandler);

  return app;
};

export default createApp;