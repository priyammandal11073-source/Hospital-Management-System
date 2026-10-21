import express from "express";
import {
  getReceptionistTelemetry,
  getFrontDeskWorkQueue,
  checkDuplicatePatient,
  checkInPatient,
  createWalkInAppointment,
  createWalkInDiagnostic,
  getWaitingRoomQueue,
  updateWaitingRoomStatus,
  getDoctorAvailability,
  getOnlineBookings,
  confirmOnlineBooking,
  getDischargeQueue,
  getDailyFrontDeskSummary,
  getDeskHandovers,
  createDeskHandover,
  acknowledgeDeskHandover,
  processBillingRefund,
  sendAdministrativeNotification,
  getAppointmentReminders,
  sendAppointmentReminder,
} from "../controllers/receptionistController.js";
import { protect, restrictTo } from "../middleware/authMiddleware.js";

const router = express.Router();

// Strict RBAC: All routes protected and restricted to receptionist, admin, and super_admin
router.use(protect);
router.use(restrictTo("receptionist", "admin", "super_admin"));

// Telemetry & Operations Queue
router.get("/telemetry", getReceptionistTelemetry);
router.get("/work-queue", getFrontDeskWorkQueue);

// Patient Registration Support
router.get("/duplicate-check", checkDuplicatePatient);

// Check-in & Walk-in
router.post("/check-in/:id", checkInPatient);
router.post("/walk-in", createWalkInAppointment);
router.post("/walk-in-diagnostic", createWalkInDiagnostic);

// Waiting Room & Queue Management
router.get("/waiting-room", getWaitingRoomQueue);
router.patch("/waiting-room/:id/status", updateWaitingRoomStatus);

// Doctor Availability
router.get("/doctor-availability", getDoctorAvailability);

// Online Bookings
router.get("/online-bookings", getOnlineBookings);
router.patch("/online-bookings/:id/confirm", confirmOnlineBooking);

// Discharge Coordination
router.get("/discharges", getDischargeQueue);

// Daily Summary & Reporting
router.get("/daily-summary", getDailyFrontDeskSummary);

// Shift Handover
router.route("/handover")
  .get(getDeskHandovers)
  .post(createDeskHandover);
router.patch("/handover/:id/acknowledge", acknowledgeDeskHandover);

// Cashier & Refunds
router.post("/refund/:id", processBillingRefund);

// Administrative Notifications & Reminders
router.post("/notification", sendAdministrativeNotification);
router.get("/reminders", getAppointmentReminders);
router.post("/reminders/:appointmentId/send", sendAppointmentReminder);

export default router;
