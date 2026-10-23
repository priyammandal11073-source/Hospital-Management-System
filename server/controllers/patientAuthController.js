import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import env from "../config/env.js";
import Patient from "../models/Patient.js";
import { generateOtp, normalizeContact, verifyOtp } from "../services/otpService.js";
import { sendSms } from "../services/smsService.js";

const createToken = (patient) => {
  if (!env.jwtSecret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign({ id: patient._id, type: "patient" }, env.jwtSecret, {
    expiresIn: "7d",
  });
};

const OTP_RESET_SUBJECT = "Nivora Care password reset";

// POST /api/patient-auth/forgot-password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const patient = await Patient.findOne({ email: normalizedEmail }).select(
      "+password"
    );

    // Avoid leaking which emails have accounts by responding the same either way.
    if (!patient) {
      return res.status(200).json({
        message: "If a patient account exists for this email, a reset OTP has been sent.",
      });
    }

    const otpKey = patient.contactNumber
      ? normalizeContact(patient.contactNumber)
      : normalizedEmail;
    const otp = generateOtp(otpKey);

    const message =
      `Your Nivora Care Hospital password reset OTP is ${otp}. It expires in 5 minutes. ` +
      `Do not share this code with anyone. -Nivora Care`;

    let smsResult = { sent: true, method: "simulated" };
    if (patient.contactNumber) {
      try {
        smsResult = await sendSms(normalizeContact(patient.contactNumber), message);
      } catch {
        // SMS delivery is best-effort
      }
    } else {
      console.log(`[SMS Simulation] ${normalizedEmail} (${OTP_RESET_SUBJECT})\n[SMS Simulation] Message: ${message}`);
    }

    return res.status(200).json({
      message: "If a patient account exists for this email, a reset OTP has been sent.",
      sent: true,
      preview: smsResult.preview || null,
      method: smsResult.method || "simulated",
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// POST /api/patient-auth/reset-password
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        message: "Email, OTP, and new password are required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const patient = await Patient.findOne({ email: normalizedEmail }).select(
      "+password"
    );

    if (!patient) {
      return res.status(404).json({ message: "No patient account found with this email" });
    }

    const otpKey = patient.contactNumber
      ? normalizeContact(patient.contactNumber)
      : normalizedEmail;
    const otpCheck = verifyOtp(otpKey, otp);
    if (!otpCheck.valid) {
      return res.status(400).json({ message: otpCheck.message });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    patient.password = newPassword;
    await patient.save();

    return res.status(200).json({
      message: "Password reset successfully. You can now sign in with your new password.",
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// POST /api/patient-auth/otp/send
export const sendRegistrationOtp = async (req, res) => {
  try {
    const { contactNumber, email } = req.body;

    if (!contactNumber) {
      return res.status(400).json({ message: "Contact number is required" });
    }

    const normalizedContact = normalizeContact(contactNumber);
    if (normalizedContact.length !== 10 || !/^[6-9]\d{9}$/.test(normalizedContact)) {
      return res.status(400).json({
        message: "Please enter a valid 10-digit Indian mobile number",
      });
    }

    if (mongoose.connection.readyState === 1) {
      if (email) {
        const existingByEmail = await Patient.findOne({ email: email.toLowerCase().trim() });
        if (existingByEmail) {
          return res.status(409).json({ message: "Email is already registered" });
        }
      }

      const existingByContact = await Patient.findOne({ contactNumber: normalizedContact });
      if (existingByContact) {
        return res.status(409).json({ message: "This mobile number is already registered" });
      }
    }

    const otp = generateOtp(normalizedContact);
    const message =
      `Your Nivora Care Hospital verification OTP is ${otp}. It expires in 5 minutes. ` +
      `Do not share this code with anyone. -Nivora Care`;

    let smsResult = { sent: true, method: "simulated" };
    try {
      smsResult = await sendSms(normalizedContact, message);
    } catch {
      // SMS delivery is best-effort; the OTP store still lets the flow continue.
    }

    return res.status(200).json({
      message: "OTP sent successfully",
      sent: true,
      preview: smsResult.preview || null,
      method: smsResult.method || "simulated",
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// POST /api/patient-auth/register
export const registerPatient = async (req, res) => {
  try {
    const { name, email, password, age, gender, contactNumber, abhaId, otp } = req.body;

    if (!name || !email || !password || !age || !gender || !contactNumber) {
      return res.status(400).json({
        message:
          "Name, email, password, age, gender, and contact number are required",
      });
    }

    const normalizedContact = normalizeContact(contactNumber);
    if (normalizedContact.length !== 10 || !/^[6-9]\d{9}$/.test(normalizedContact)) {
      return res.status(400).json({
        message: "Please enter a valid 10-digit Indian mobile number",
      });
    }

    const otpCheck = verifyOtp(normalizedContact, otp);
    if (!otpCheck.valid) {
      return res.status(400).json({ message: otpCheck.message });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: "Database service unavailable. Unable to register patient at this time.",
      });
    }

    const existingPatient = await Patient.findOne({ email: email.toLowerCase() });

    if (existingPatient) {
      return res.status(409).json({ message: "Email is already registered" });
    }

    const patient = await Patient.create({
      name,
      email: email.toLowerCase(),
      password,
      age,
      gender,
      contactNumber: normalizedContact,
      abhaId: abhaId?.trim() || undefined,
    });

    return res.status(201).json({
      message:
        "Patient registered successfully. Please log in to continue.",
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Email is already registered" });
    }

    return res.status(400).json({ message: error.message });
  }
};

// POST /api/patient-auth/login
export const loginPatient = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: "Database service unavailable. Please try again shortly.",
      });
    }

    const patient = await Patient.findOne({ email: normalizedEmail }).select(
      "+password"
    );

    if (!patient || !(await patient.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = createToken(patient);

    const patientInfo = patient.toObject();
    delete patientInfo.password;

    return res.status(200).json({
      token,
      patient: patientInfo,
    });
  } catch (error) {
    console.error("Login error:", error.message);
    if (error.name === "MongooseServerSelectionError" || error.name === "MongoNetworkError") {
      return res.status(503).json({
        success: false,
        message: "Database connection failed. Please try again shortly.",
      });
    }
    return res.status(500).json({ message: "Unable to log in: " + (error.message || "Internal server error") });
  }
};