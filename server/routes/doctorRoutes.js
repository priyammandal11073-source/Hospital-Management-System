import express from "express";
import {
  createDoctor,
  deleteDoctor,
  getAllDoctors,
  getDoctorById,
  getCurrentDoctorProfile,
  updateDoctor,
  updateDoctorSchedule,
  addDoctorLeave,
  removeDoctorLeave,
} from "../controllers/doctorController.js";
import { protect, restrictTo, optionalProtect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Current doctor's own dedicated profile and metrics
router.get("/me", protect, restrictTo("doctor"), getCurrentDoctorProfile);

router
  .route("/")
  .post(protect, restrictTo("admin"), createDoctor)
  .get(optionalProtect, getAllDoctors);

router
  .route("/:id")
  .get(optionalProtect, getDoctorById)
  .put(protect, restrictTo("admin", "doctor"), updateDoctor)
  .delete(protect, restrictTo("admin"), deleteDoctor);

router
  .route("/:id/schedule")
  .put(protect, restrictTo("admin", "doctor"), updateDoctorSchedule);

router
  .route("/:id/leaves")
  .post(protect, restrictTo("admin", "doctor"), addDoctorLeave);

router
  .route("/:id/leaves/:leaveIndex")
  .delete(protect, restrictTo("admin", "doctor"), removeDoctorLeave);

export default router;
