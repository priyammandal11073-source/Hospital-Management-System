import express from "express";
import {
  registerPatient,
  loginPatient,
  sendRegistrationOtp,
  forgotPassword,
  resetPassword,
} from "../controllers/patientAuthController.js";
import { otpLimiter } from "../middleware/rateLimiters.js";
import { validate } from "../middleware/validate.js";
import {
  patientLoginSchema,
  patientRegisterSchema,
  otpSendSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../validators/authValidators.js";

const router = express.Router();

router.post("/otp/send", otpLimiter, validate(otpSendSchema), sendRegistrationOtp);
router.post("/register", otpLimiter, validate(patientRegisterSchema), registerPatient);
router.post("/login", otpLimiter, validate(patientLoginSchema), loginPatient);
router.post("/forgot-password", otpLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post("/reset-password", otpLimiter, validate(resetPasswordSchema), resetPassword);

export default router;