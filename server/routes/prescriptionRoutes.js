import express from "express";
import {
  createPrescription,
  getAllPrescriptions,
  getPrescriptionById,
  updatePrescription,
  deletePrescription,
  sendPrescriptionEmail,
  recordMedicationAdministration,
} from "../controllers/prescriptionController.js";
import { protect, restrictTo } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
import {
  createPrescriptionSchema,
  updatePrescriptionSchema,
} from "../validators/prescriptionValidators.js";

const router = express.Router();

router
  .route("/")
  .post(protect, restrictTo("doctor", "emergency"), validate(createPrescriptionSchema), createPrescription)
  .get(protect, getAllPrescriptions);

router
  .route("/:id")
  .get(protect, getPrescriptionById)
  .put(protect, restrictTo("doctor", "emergency"), validate(updatePrescriptionSchema), updatePrescription)
  .delete(protect, restrictTo("admin", "doctor"), deletePrescription);

router.post("/:id/send-email", protect, sendPrescriptionEmail);
router.post("/:id/administer", protect, restrictTo("nurse", "doctor", "emergency"), recordMedicationAdministration);

export default router;
