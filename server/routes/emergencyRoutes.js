import express from "express";
import { protect, restrictTo } from "../middleware/authMiddleware.js";
import {
  searchPatientsForEmergency,
  createEmergencyEncounter,
  getEmergencyDashboard,
  getEmergencyQueue,
  getEmergencyById,
  updateTriage,
  addEmergencyVitals,
  addEmergencyNote,
  assignEmergencyDoctor,
  assignEmergencyNurse,
  updateEmergencyStatus,
  createEmergencyDiagnosticOrder,
  createEmergencyPrescription,
  admitEmergencyPatient,
  transferEmergencyPatient,
  dischargeEmergencyPatient,
  updateObservation,
  addEmergencyProcedure,
  getEmergencyReports,
  getEmergencyBeds,
} from "../controllers/emergencyController.js";

const router = express.Router();

// ER is hospital-wide — any authenticated staff may view; write actions enforce stricter checks inside controllers
router.use(protect);

// Dashboard & queue must come before :id
router.get("/dashboard", getEmergencyDashboard);
router.get("/reports/summary", getEmergencyReports);
router.get("/beds", getEmergencyBeds);
router.get("/search-patients", searchPatientsForEmergency);

// Queue + CRUD
router.route("/").get(getEmergencyQueue).post(createEmergencyEncounter);
router.get("/:id", getEmergencyById);
router.patch("/:id/status", updateEmergencyStatus);

// Clinical
router.post("/:id/triage", updateTriage);
router.post("/:id/vitals", addEmergencyVitals);
router.post("/:id/notes", addEmergencyNote);
router.patch("/:id/assign-doctor", assignEmergencyDoctor);
router.patch("/:id/assign-nurse", assignEmergencyNurse);

// Orders
router.post("/:id/orders", createEmergencyDiagnosticOrder);
router.post("/:id/prescription", createEmergencyPrescription);

// Care flow
router.post("/:id/procedures", addEmergencyProcedure);
router.post("/:id/observation", updateObservation);
router.post("/:id/admit", admitEmergencyPatient);
router.post("/:id/transfer", transferEmergencyPatient);
router.post("/:id/discharge", dischargeEmergencyPatient);

export default router;
