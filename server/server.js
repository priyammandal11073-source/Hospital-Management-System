import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import connectDB from "./config/db.js";
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
import { notFoundHandler, errorHandler } from "./middleware/errorMiddleware.js";
import mongoose from "mongoose";

import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env"), override: true });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware that applies to every incoming request.
app.use(cors());
app.use(express.json());

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

// Diagnostic health check reporting connectivity and portal readiness across all 6 portals
app.get("/api/health", (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const dbStatusMap = {
    0: "Disconnected",
    1: "Connected",
    2: "Connecting",
    3: "Disconnecting",
  };

  res.status(200).json({
    success: true,
    message: "Nivora Care Hospital Management System API is healthy",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || "development",
    database: {
      status: dbStatusMap[dbStatus] || "Unknown",
      readyState: dbStatus,
      isOfflineDemoFallbackActive: dbStatus !== 1,
    },
    portals: {
      adminPortal: { status: "Operational", baseRoute: "/api/admin" },
      doctorPortal: { status: "Operational", baseRoute: "/api/doctor-workspace" },
      nursePortal: { status: "Operational", baseRoute: "/api/nurse" },
      receptionistPortal: { status: "Operational", baseRoute: "/api/receptionist" },
      patientPortal: { status: "Operational", baseRoute: "/api/patient-portal" },
      pharmacyPortal: { status: "Operational", baseRoute: "/api/pharmacy" },
    },
    systemMetrics: {
      memoryUsageMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      nodeVersion: process.version,
      pid: process.pid,
    },
  });
});

// 404 handler for undefined endpoints
app.use(notFoundHandler);

// Global exception and error handler
app.use(errorHandler);

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();