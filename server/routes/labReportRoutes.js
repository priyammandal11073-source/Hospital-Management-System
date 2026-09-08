import express from "express";
import {
  getAllLabReports,
  getLabReportById,
  createLabReport,
  updateLabReport,
  deleteLabReport,
} from "../controllers/labReportController.js";
import { protect, restrictTo } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router
  .route("/")
  .get(getAllLabReports)
  .post(restrictTo("admin", "doctor", "nurse", "receptionist"), createLabReport);

router
  .route("/:id")
  .get(getLabReportById)
  .put(restrictTo("admin", "doctor", "nurse", "receptionist"), updateLabReport)
  .delete(restrictTo("admin", "doctor"), deleteLabReport);

export default router;
