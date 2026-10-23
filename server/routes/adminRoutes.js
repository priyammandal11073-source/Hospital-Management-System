import express from "express";
import { protect, restrictTo } from "../middleware/authMiddleware.js";
import {
  getAdminTelemetry,
  getGlobalAdminSearch,
  getStaffList,
  createStaffMember,
  updateStaffMember,
  getDepartments,
  createDepartment,
  getHospitalCalendarEvents,
  getRevenueAnalytics,
  getInventory,
  createInventoryItem,
  updateInventoryStock,
  getEquipment,
  getMaintenanceOrders,
  createMaintenanceOrder,
  updateMaintenanceOrderStatus,
  getStaffAttendance,
  getStaffLeaves,
  reviewStaffLeave,
  getEmergencyOperations,
  getOperatingTheatreSchedule,
  createProcedureSchedule,
  getAuditLogs,
  getHospitalSettings,
  updateHospitalSettings,
  getInsuranceClaims,
  decideInsuranceClaim,
  getFeedbackReview,
  reviewFeedback,
  logPreventiveMaintenance,
} from "../controllers/adminController.js";

const router = express.Router();

// Strict RBAC: All admin routes require valid auth and admin or super_admin role
router.use(protect, restrictTo("admin", "super_admin"));

// 1. Executive Telemetry & Global Search
router.get(["/telemetry", "/executive-analytics", "/dashboard"], getAdminTelemetry);
router.get("/search", getGlobalAdminSearch);

// 2. Staff Directory & HR
router.route("/staff")
  .get(getStaffList)
  .post(createStaffMember);
router.patch("/staff/:id", updateStaffMember);

// 3. Departments
router.route("/departments")
  .get(getDepartments)
  .post(createDepartment);

// 4. Central Calendar
router.get("/calendar", getHospitalCalendarEvents);

// 5. Revenue & Finance
router.get("/revenue", getRevenueAnalytics);

// 6. Inventory & Pharmacy
router.route("/inventory")
  .get(getInventory)
  .post(createInventoryItem);
router.patch("/inventory/:id/stock", updateInventoryStock);

// 7. Equipment & Maintenance
router.get("/equipment", getEquipment);
router.route("/maintenance")
  .get(getMaintenanceOrders)
  .post(createMaintenanceOrder);
router.patch("/maintenance/:id/status", updateMaintenanceOrderStatus);

// 8. Staff Attendance & Leaves
router.get("/attendance", getStaffAttendance);
router.get("/leaves", getStaffLeaves);
router.patch("/leaves/:id/review", reviewStaffLeave);

// 9. Emergency Operations
router.get("/emergency", getEmergencyOperations);

// 10. Operating Theatre
router.route("/operating-theatre")
  .get(getOperatingTheatreSchedule)
  .post(createProcedureSchedule);

// 11. Audit Logs
router.get("/audit-logs", getAuditLogs);

// 11b. Insurance Claims Desk
router.get("/insurance-claims", getInsuranceClaims);
router.patch("/insurance-claims/:billingId/decision", decideInsuranceClaim);

// 11c. Patient Feedback Quality Desk
router.get("/feedback", getFeedbackReview);
router.patch("/feedback/:id/review", reviewFeedback);

// 11d. Preventive Maintenance (PM)
router.post("/equipment/:id/service", logPreventiveMaintenance);

// 12. Institutional Settings
router.route("/settings")
  .get(getHospitalSettings)
  .patch(updateHospitalSettings);

export default router;
