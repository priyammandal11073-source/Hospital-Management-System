import express from "express";
import {
  createAppointment,
  deleteAppointment,
  getAllAppointments,
  getAppointmentById,
  updateAppointmentStatus,
} from "../controllers/appointmentController.js";
import { protect, restrictTo } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/").post(protect, createAppointment).get(protect, getAllAppointments);

router.patch("/:id/status", protect, updateAppointmentStatus);

router
  .route("/:id")
  .get(protect, getAppointmentById)
  .delete(protect, restrictTo("admin", "receptionist", "nurse"), deleteAppointment);

export default router;
