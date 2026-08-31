import jwt from "jsonwebtoken";
import Patient from "../models/Patient.js";

const createToken = (patient) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign({ id: patient._id, type: "patient" }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// POST /api/patient-auth/register
export const registerPatient = async (req, res) => {
  try {
    const { name, email, password, age, gender, contactNumber } = req.body;

    if (!name || !email || !password || !age || !gender || !contactNumber) {
      return res.status(400).json({
        message:
          "Name, email, password, age, gender, and contact number are required",
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
      contactNumber,
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

    const patient = await Patient.findOne({ email: email.toLowerCase() }).select(
      "+password"
    );

    if (!patient || !(await patient.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = createToken(patient);

    const { password: pwd, ...patientInfo } = patient._doc;

    return res.status(200).json({
      token,
      patient: patientInfo,
    });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({ message: "Unable to log in" });
  }
};