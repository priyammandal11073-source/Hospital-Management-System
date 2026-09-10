import express from "express";
import {
  protect,
  restrictTo,
  protectStaffOrPatient,
} from "../middleware/authMiddleware.js";
import { uploadMiddleware } from "../services/storageService.js";
import {
  getDiagnosticDashboard,
  getDiagnosticTests,
  createDiagnosticTest,
  getDiagnosticTestById,
  getDiagnosticRequests,
  createDiagnosticRequest,
  updateRequestStatus,
  getDiagnosticSamples,
  collectDiagnosticSample,
  updateSampleStatus,
  enterDiagnosticResults,
  getDiagnosticReports,
  getDiagnosticReportById,
  reviewAndApproveReport,
  getCriticalResults,
  acknowledgeCriticalResult,
  getDiagnosticEquipment,
  getDiagnosticInventory,
  uploadMedicalFile,
  streamMedicalFile,
  downloadMedicalFile,
  deleteMedicalFile,
  getDiagnosticAuditLogs,
  downloadDiagnosticReportPdf,
  generateRadiologyFilmPdf,
  logPrintAction,
  getPrintHistory,
  reprintReport,
  amendDiagnosticReport,
  publishDiagnosticReport,
  getRadiologyStudyDetails,
  getPathologyRecordDetails,
} from "../controllers/diagnosticController.js";

const router = express.Router();

// -------------------------------------------------------------
// SECURE OBJECT STORAGE STREAMING & DOWNLOADS (STAFF & PATIENTS)
// -------------------------------------------------------------
router.get("/files/:fileId/stream", protectStaffOrPatient, streamMedicalFile);
router.get("/files/:fileId/download", protectStaffOrPatient, downloadMedicalFile);

// High-Fidelity Vector PDF Report Download (Staff & Patients)
router.get("/reports/:id/pdf", protectStaffOrPatient, downloadDiagnosticReportPdf);

// Multi-Image Radiology Film Sheet PDF (Staff & Patients)
router.post("/films/generate-pdf", protectStaffOrPatient, generateRadiologyFilmPdf);

// -------------------------------------------------------------
// STAFF & SPECIALIST OPERATIONAL ENDPOINTS (PROTECTED BY JWT)
// -------------------------------------------------------------
router.use(protect);

// 1. Telemetry & Analytics
router.get("/dashboard", getDiagnosticDashboard);

// 2. Centralized Test Catalog
router.get("/tests", getDiagnosticTests);
router.post(
  "/tests",
  restrictTo("admin", "super_admin", "diagnostic_admin", "pathologist", "radiologist"),
  createDiagnosticTest
);
router.get("/tests/:id", getDiagnosticTestById);

// 3. Diagnostic Investigation Requests & Scheduling
router.get("/requests", getDiagnosticRequests);
router.post(
  "/requests",
  restrictTo("admin", "doctor", "receptionist", "diagnostic_admin", "nurse"),
  createDiagnosticRequest
);
router.patch("/requests/:id/status", updateRequestStatus);

// 4. Phlebotomy & Specimen Collection
router.get("/samples", getDiagnosticSamples);
router.post(
  "/samples/collect",
  restrictTo("admin", "diagnostic_admin", "lab_technician", "nurse"),
  collectDiagnosticSample
);
router.patch(
  "/samples/:id/status",
  restrictTo("admin", "diagnostic_admin", "lab_technician", "nurse"),
  updateSampleStatus
);

// 5. Results Entry (Technician Workspace)
router.post(
  "/results",
  restrictTo("admin", "diagnostic_admin", "lab_technician", "radiology_technician", "pathologist", "radiologist"),
  enterDiagnosticResults
);

// 6. Reports & Specialist Verification
router.get("/reports", getDiagnosticReports);
router.get("/reports/:id", getDiagnosticReportById);
router.patch(
  "/reports/:id/review",
  restrictTo("admin", "diagnostic_admin", "pathologist", "radiologist"),
  reviewAndApproveReport
);
router.post(
  "/reports/:id/amend",
  restrictTo("admin", "diagnostic_admin", "pathologist", "radiologist"),
  amendDiagnosticReport
);
router.patch(
  "/reports/:id/publish",
  restrictTo("admin", "diagnostic_admin", "pathologist", "radiologist"),
  publishDiagnosticReport
);
router.post("/reports/:id/reprint", reprintReport);

// 7. Print Center & Audit Trail (Sections 46, 47, 48, 49)
router.post("/prints/log", logPrintAction);
router.get("/prints/history", getPrintHistory);

// 8. Dedicated Pathology & Radiology Study Workspaces (Sections 55, 56)
router.get("/radiology/studies/:studyId", getRadiologyStudyDetails);
router.get("/pathology/records/:recordId", getPathologyRecordDetails);

// 9. Critical Results Desk
router.get("/critical-results", getCriticalResults);
router.post("/critical-results/:id/acknowledge", acknowledgeCriticalResult);

// 10. Equipment & Consumables
router.get("/equipment", getDiagnosticEquipment);
router.get("/inventory", getDiagnosticInventory);

// 11. File Upload & Deletion (External Storage)
router.post(
  "/files/upload",
  restrictTo("admin", "diagnostic_admin", "lab_technician", "radiology_technician", "pathologist", "radiologist"),
  uploadMiddleware.single("file"),
  uploadMedicalFile
);
router.delete(
  "/files/:fileId",
  restrictTo("admin", "diagnostic_admin", "pathologist", "radiologist"),
  deleteMedicalFile
);

// 12. Audit Logs
router.get(
  "/audit-logs",
  restrictTo("admin", "super_admin", "diagnostic_admin"),
  getDiagnosticAuditLogs
);

export default router;
