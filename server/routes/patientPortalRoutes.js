import express from "express";
import {
  getMyProfile,
  getMyAppointments,
  bookMyAppointment,
  getMyBillings,
  cancelMyAppointment,
  getMyPrescriptions,
  getMyBedStay,
} from "../controllers/patientPortalController.js";
import { protectPatient } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/me", protectPatient, getMyProfile);
router.get("/appointments", protectPatient, getMyAppointments);
router.post("/appointments", protectPatient, bookMyAppointment);
router.patch(
  "/appointments/:id/cancel",
  protectPatient,
  cancelMyAppointment
);
router.get("/billings", protectPatient, getMyBillings);
router.get("/prescriptions", protectPatient, getMyPrescriptions);
router.get("/bed", protectPatient, getMyBedStay);

export default router;