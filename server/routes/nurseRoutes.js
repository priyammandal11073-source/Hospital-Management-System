import express from "express";
import {
  getNurseDashboardMetrics,
  getInpatientsWithCare,
  getClinicalPatientProfile,
  getNursingTasks,
  createNursingTask,
  updateNursingTaskStatus,
  getNursingNotes,
  createNursingNote,
  getDoctorOrders,
  updateDoctorOrderStatus,
  getIntakeOutputRecords,
  createIntakeOutputRecord,
  getPatientTransfers,
  createPatientTransfer,
  updatePatientTransferStatus,
  getMyShiftInfo,
  getHandovers,
  createHandover,
  acknowledgeHandover,
} from "../controllers/nurseController.js";
import { protect, restrictTo } from "../middleware/authMiddleware.js";

const router = express.Router();

// All nurse routes require staff authentication
router.use(protect);
// Accessible by nurse, doctor, and admin
router.use(restrictTo("nurse", "doctor", "admin"));

// Dashboard metrics & overview
router.get(["/dashboard-metrics", "/telemetry", "/dashboard"], getNurseDashboardMetrics);

// Inpatient list with clinical care summary
router.get(["/inpatients", "/patients"], getInpatientsWithCare);

// Detailed Clinical Patient Profile
router.get("/patient-profile/:id", getClinicalPatientProfile);

// Tasks
router.route("/tasks").get(getNursingTasks).post(createNursingTask);
router.patch("/tasks/:id/status", updateNursingTaskStatus);

// Nursing Notes
router.route("/notes").get(getNursingNotes).post(createNursingNote);

// Doctor Orders
router.route("/doctor-orders").get(getDoctorOrders);
router.patch("/doctor-orders/:id/status", updateDoctorOrderStatus);

// Intake & Output
router.route("/intake-output").get(getIntakeOutputRecords).post(createIntakeOutputRecord);

// Transfers
router.route("/transfers").get(getPatientTransfers).post(createPatientTransfer);
router.patch("/transfers/:id/status", updatePatientTransferStatus);

// Shift Information
router.get("/shift", getMyShiftInfo);

// Handovers
router.route("/handovers").get(getHandovers).post(createHandover);
router.patch("/handovers/:id/acknowledge", acknowledgeHandover);

export default router;
