import express from "express";
import {
  createAppointment,
  deleteAppointment,
  getAllAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  updateAppointmentChecklist,
} from "../controllers/appointmentController.js";
import { protect, restrictTo } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
import {
  createAppointmentSchema,
  updateAppointmentStatusSchema,
  updateAppointmentChecklistSchema,
} from "../validators/appointmentValidators.js";

const router = express.Router();

router
  .route("/")
  .post(
    protect,
    restrictTo("admin", "receptionist", "doctor"),
    validate(createAppointmentSchema),
    createAppointment
  )
  .get(protect, getAllAppointments);

router.patch(
  "/:id/status",
  protect,
  validate(updateAppointmentStatusSchema),
  updateAppointmentStatus
);

router.patch(
  "/:id/checklist",
  protect,
  validate(updateAppointmentChecklistSchema),
  updateAppointmentChecklist
);

router
  .route("/:id")
  .get(protect, getAppointmentById)
  .delete(protect, restrictTo("admin", "receptionist", "nurse", "doctor"), deleteAppointment);

export default router;
