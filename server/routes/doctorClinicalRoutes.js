import express from "express";
import { protect, restrictTo } from "../middleware/authMiddleware.js";
import {
  getDoctorDashboard,
  getConsultationBundle,
  concludeConsultation,
  getDoctorPatientProfile,
  getDoctorOrders,
  createDoctorOrder,
  getReferrals,
  createReferral,
  updateReferralStatus,
  getCriticalLabResults,
  acknowledgeCriticalLabResult,
  getFollowUpsDue,
  getSpecialistDirectory,
  getMyTeleconsults,
  startTeleconsult,
  endTeleconsult,
} from "../controllers/doctorClinicalController.js";

const router = express.Router();

// Protect all routes - available to doctors and administrators
router.use(protect);
router.use(restrictTo("doctor", "admin"));

// Dashboard & Clinical KPIs
router.get(["/dashboard", "/worklist", "/telemetry"], getDoctorDashboard);

// Consultation Workspace Bundle & Conclusion
router.get("/consultation-bundle/:appointmentId", getConsultationBundle);
router.post("/conclude-consultation", concludeConsultation);

// 360-degree Patient Profile
router.get("/patient-profile/:patientId", getDoctorPatientProfile);

// Clinical Orders
router.get("/orders", getDoctorOrders);
router.post("/orders", createDoctorOrder);

// Specialist Referrals
router.get("/referrals", getReferrals);
router.post("/referrals", createReferral);
router.patch("/referrals/:id/status", updateReferralStatus);

// Critical Lab Results & Acknowledgment
router.get(["/critical-labs", "/critical-lab-alerts"], getCriticalLabResults);
router.post("/acknowledge-lab/:reportId", acknowledgeCriticalLabResult);

// Follow-ups due
router.get("/follow-ups", getFollowUpsDue);

// Hospital Specialist Directory
router.get("/specialist-directory", getSpecialistDirectory);

// Telemedicine (Video Consultations)
router.get("/telemedicine", getMyTeleconsults);
router.post("/telemedicine/:id/start", startTeleconsult);
router.post("/telemedicine/:id/end", endTeleconsult);

export default router;
