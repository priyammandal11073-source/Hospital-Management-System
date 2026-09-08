import express from "express";
import {
  getMyProfile,
  updateMyProfile,
  getPatientDashboardSummary,
  getMyAppointments,
  bookMyAppointment,
  cancelMyAppointment,
  rescheduleMyAppointment,
  getMyDoctors,
  getMyDoctorById,
  getMyMedicalRecords,
  getMyTimeline,
  getMyActiveMedicines,
  getMyConsultationHistory,
  getMyConsultationSummary,
  getMyFollowUps,
  getMyReferrals,
  getMyAdmissions,
  getMyDocuments,
  getMyBillings,
  payMyBillingUpi,
  getMyPrescriptions,
  getMyBedStay,
  getMyVitals,
  recordMyVitals,
  getMyLabReports,
  getMyLabReportById,
  getMyPatientNotifications,
  markMyNotificationRead,
  markAllMyNotificationsRead,
  submitFeedback,
  getMyFeedback,
} from "../controllers/patientPortalController.js";
import { protectPatient } from "../middleware/authMiddleware.js";

const router = express.Router();

// 1. Dashboard & Profile
router.get("/dashboard", protectPatient, getPatientDashboardSummary);
router.get("/me", protectPatient, getMyProfile);
router.patch("/me", protectPatient, updateMyProfile);

// 2. Appointments & Scheduling
router.get("/appointments", protectPatient, getMyAppointments);
router.post("/appointments", protectPatient, bookMyAppointment);
router.patch("/appointments/:id/cancel", protectPatient, cancelMyAppointment);
router.patch("/appointments/:id/reschedule", protectPatient, rescheduleMyAppointment);

// 3. Doctors Directory
router.get("/doctors", protectPatient, getMyDoctors);
router.get("/doctors/:id", protectPatient, getMyDoctorById);

// 4. Clinical Health Records & Timeline
router.get("/records", protectPatient, getMyMedicalRecords);
router.get("/timeline", protectPatient, getMyTimeline);
router.get("/medicines", protectPatient, getMyActiveMedicines);
router.get("/consultations", protectPatient, getMyConsultationHistory);
router.get("/consultations/:id", protectPatient, getMyConsultationSummary);
router.get("/follow-ups", protectPatient, getMyFollowUps);
router.get("/referrals", protectPatient, getMyReferrals);
router.get("/admissions", protectPatient, getMyAdmissions);
router.get("/documents", protectPatient, getMyDocuments);

// 5. Prescriptions & Inpatient Bed
router.get("/prescriptions", protectPatient, getMyPrescriptions);
router.get("/bed", protectPatient, getMyBedStay);

// 6. Vitals
router.get("/vitals", protectPatient, getMyVitals);
router.post("/vitals", protectPatient, recordMyVitals);

// 7. Lab Reports
router.get("/lab-reports", protectPatient, getMyLabReports);
router.get("/lab-reports/:id", protectPatient, getMyLabReportById);

// 8. Billing & Payments
router.get("/billings", protectPatient, getMyBillings);
router.patch("/billings/:id/pay-upi", protectPatient, payMyBillingUpi);

// 9. Notifications
router.get("/notifications", protectPatient, getMyPatientNotifications);
router.patch("/notifications/read-all", protectPatient, markAllMyNotificationsRead);
router.patch("/notifications/:id/read", protectPatient, markMyNotificationRead);

// 10. Patient Feedback
router.post("/feedback", protectPatient, submitFeedback);
router.get("/feedback", protectPatient, getMyFeedback);

export default router;