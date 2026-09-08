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

// Temporary route to confirm that the API is running.
app.get("/api/health", (req, res) => {
  res.status(200).json({ message: "Hospital Management API is running" });
});

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();