import express from "express";
import {
  createPrescription,
  getAllPrescriptions,
  getPrescriptionById,
  updatePrescription,
  deletePrescription,
  sendPrescriptionEmail,
} from "../controllers/prescriptionController.js";
import { protect, restrictTo } from "../middleware/authMiddleware.js";

const router = express.Router();

router
  .route("/")
  .post(protect, createPrescription)
  .get(protect, getAllPrescriptions);

router
  .route("/:id")
  .get(protect, getPrescriptionById)
  .put(protect, updatePrescription)
  .delete(protect, restrictTo("admin", "doctor"), deletePrescription);

router.post("/:id/send-email", protect, sendPrescriptionEmail);

export default router;
