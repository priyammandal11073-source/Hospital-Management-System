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

const router = express.Router();

router
  .route("/")
  .post(protect, restrictTo("doctor", "emergency"), createPrescription)
  .get(protect, getAllPrescriptions);

router
  .route("/:id")
  .get(protect, getPrescriptionById)
  .put(protect, restrictTo("doctor", "emergency"), updatePrescription)
  .delete(protect, restrictTo("admin", "doctor"), deletePrescription);

router.post("/:id/send-email", protect, sendPrescriptionEmail);
router.post("/:id/administer", protect, restrictTo("nurse", "doctor", "emergency"), recordMedicationAdministration);

export default router;
