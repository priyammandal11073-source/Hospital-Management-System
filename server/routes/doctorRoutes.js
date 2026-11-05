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
import { getAllPatients } from "../controllers/patientController.js";
import { protect, restrictTo, optionalProtect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
import {
  createDoctorSchema,
  updateDoctorSchema,
  addDoctorLeaveSchema,
} from "../validators/doctorValidators.js";

const router = express.Router();

// Current doctor's own dedicated profile and metrics
router.get("/me", protect, restrictTo("doctor"), getCurrentDoctorProfile);

// Doctor assigned patient directory
router.get("/patients", protect, restrictTo("doctor", "admin", "super_admin", "clinical_admin"), getAllPatients);

router
  .route("/")
  .post(protect, restrictTo("admin"), validate(createDoctorSchema), createDoctor)
  .get(optionalProtect, getAllDoctors);

router
  .route("/:id")
  .get(optionalProtect, getDoctorById)
  .put(protect, restrictTo("admin", "doctor"), validate(updateDoctorSchema), updateDoctor)
  .delete(protect, restrictTo("admin"), deleteDoctor);

router
  .route("/:id/schedule")
  .put(protect, restrictTo("admin", "doctor"), updateDoctorSchedule);

router
  .route("/:id/leaves")
  .post(protect, restrictTo("admin", "doctor"), validate(addDoctorLeaveSchema), addDoctorLeave);

router
  .route("/:id/leaves/:leaveIndex")
  .delete(protect, restrictTo("admin", "doctor"), removeDoctorLeave);

export default router;
