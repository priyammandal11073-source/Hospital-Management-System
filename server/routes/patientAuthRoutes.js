import express from "express";
import {
  registerPatient,
  loginPatient,
  sendRegistrationOtp,
} from "../controllers/patientAuthController.js";

const router = express.Router();

router.post("/otp/send", sendRegistrationOtp);
router.post("/register", registerPatient);
router.post("/login", loginPatient);

export default router;