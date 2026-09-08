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
  .post(protect, restrictTo("doctor"), createPrescription)
  .get(protect, getAllPrescriptions);

router
  .route("/:id")
  .get(protect, getPrescriptionById)
  .put(protect, restrictTo("doctor"), updatePrescription)
  .delete(protect, restrictTo("admin", "doctor"), deletePrescription);

router.post("/:id/send-email", protect, sendPrescriptionEmail);
router.post("/:id/administer", protect, restrictTo("nurse", "doctor"), recordMedicationAdministration);

export default router;
