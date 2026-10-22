import express from "express";
import {
  createPatient,
  deletePatient,
  getAllPatients,
  getPatientById,
  updatePatient,
} from "../controllers/patientController.js";
import { protect, restrictTo } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
import {
  createPatientSchema,
  updatePatientSchema,
} from "../validators/patientValidators.js";

const router = express.Router();

router
  .route("/")
  .post(protect, validate(createPatientSchema), createPatient)
  .get(protect, getAllPatients);

router
  .route("/:id")
  .get(protect, getPatientById)
  .put(protect, validate(updatePatientSchema), updatePatient)
  .delete(protect, restrictTo("admin", "receptionist"), deletePatient);

export default router;
