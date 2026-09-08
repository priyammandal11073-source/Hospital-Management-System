import express from "express";
import {
  getMyProfile,
  getMyAppointments,
  bookMyAppointment,
  getMyBillings,
  payMyBillingUpi,
  cancelMyAppointment,
  getMyPrescriptions,
  getMyBedStay,
  getMyVitals,
  recordMyVitals,
  getMyLabReports,
  getMyLabReportById,
  getMyPatientNotifications,
  markMyNotificationRead,
  markAllMyNotificationsRead,
} from "../controllers/patientPortalController.js";
import { protectPatient } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/me", protectPatient, getMyProfile);
router.get("/appointments", protectPatient, getMyAppointments);
router.post("/appointments", protectPatient, bookMyAppointment);
router.patch(
  "/appointments/:id/cancel",
  protectPatient,
  cancelMyAppointment
);
router.get("/billings", protectPatient, getMyBillings);
router.patch("/billings/:id/pay-upi", protectPatient, payMyBillingUpi);
router.get("/prescriptions", protectPatient, getMyPrescriptions);
router.get("/bed", protectPatient, getMyBedStay);

// Vitals
router.get("/vitals", protectPatient, getMyVitals);
router.post("/vitals", protectPatient, recordMyVitals);

// Lab Reports
router.get("/lab-reports", protectPatient, getMyLabReports);
router.get("/lab-reports/:id", protectPatient, getMyLabReportById);

// Notifications
router.get("/notifications", protectPatient, getMyPatientNotifications);
router.patch("/notifications/read-all", protectPatient, markAllMyNotificationsRead);
router.patch("/notifications/:id/read", protectPatient, markMyNotificationRead);

export default router;