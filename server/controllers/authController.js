import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import env from "../config/env.js";
import Patient from "../models/Patient.js";
import User from "../models/User.js";
import Doctor from "../models/Doctor.js";

const createToken = (user, doctorId = null) => {
  if (!env.jwtSecret) {
    throw new Error("JWT_SECRET is not configured");
  }

  const payload = {
    id: user._id,
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    type: user.role === "patient" ? "patient" : "staff",
  };

  if (doctorId) {
    payload.doctorId = doctorId;
  }

  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: "7d",
  });
};

// POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        message: "Name, email, password, and role are required",
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      return res.status(409).json({ message: "Email is already registered" });
    }

    let doctorRef = null;
    if (role === "doctor") {
      const doc = await Doctor.findOne({ email: email.toLowerCase() });
      if (doc) doctorRef = doc._id;
    }

    await User.create({ name, email, password, role, doctor: doctorRef });

    return res.status(201).json({
      message: "User registered successfully. Please log in to continue.",
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Email is already registered" });
    }

    return res.status(400).json({ message: error.message });
  }
};

const DEMO_ACCOUNTS = {
  "admin@hospital.com": { id: "000000000000000000000001", name: "Nivora Care Admin", role: "admin", email: "admin@hospital.com", defaultPassword: "admin123" },
  "receptionist@hospital.com": { id: "000000000000000000000002", name: "Sunita Desk Officer", role: "receptionist", email: "receptionist@hospital.com", defaultPassword: "receptionist123" },
  "doctor@hospital.com": { id: "000000000000000000000003", name: "Dr. Rajesh Sharma", role: "doctor", email: "doctor@hospital.com", doctorId: "000000000000000000000003", defaultPassword: "doctor123" },
  "nurse@hospital.com": { id: "000000000000000000000004", name: "Nurse Priya Singh", role: "nurse", email: "nurse@hospital.com", defaultPassword: "nurse123" },
  "pharmacist@hospital.com": { id: "000000000000000000000006", name: "Ananya Deshmukh", role: "pharmacist", email: "pharmacist@hospital.com", designation: "Chief Pharmacist", department: "Pharmacy & Medication Services", defaultPassword: "pharmacist123" },
  "john@example.com": { id: "000000000000000000000005", name: "John Doe", role: "patient", email: "john@example.com", defaultPassword: "patient123" },
  "emergency@hospital.com": { id: "000000000000000000000007", name: "Dr. Emergency Coordinator", role: "emergency", email: "emergency@hospital.com", designation: "Emergency Department Coordinator", department: "Emergency & Trauma", defaultPassword: "emergency123" },
  "diagnostics@hospital.com": { id: "000000000000000000000008", name: "Diagnostic Admin", role: "diagnostic_admin", email: "diagnostics@hospital.com", defaultPassword: "diagnostic123" },
  "pathologist@hospital.com": { id: "000000000000000000000009", name: "Dr. Pathologist", role: "pathologist", email: "pathologist@hospital.com", defaultPassword: "pathologist123" },
  "radiologist@hospital.com": { id: "000000000000000000000010", name: "Dr. Radiologist", role: "radiologist", email: "radiologist@hospital.com", defaultPassword: "radiologist123" },
  "labtech@hospital.com": { id: "000000000000000000000011", name: "Lab Technician", role: "lab_technician", email: "labtech@hospital.com", defaultPassword: "labtech123" },
  "radtech@hospital.com": { id: "000000000000000000000012", name: "Radiology Technician", role: "radiology_technician", email: "radtech@hospital.com", defaultPassword: "radtech123" },
};

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if database is offline / blocked by MongoDB Atlas IP whitelist
    if (mongoose.connection.readyState !== 1) {
      const demoUser = DEMO_ACCOUNTS[normalizedEmail];
      if (demoUser && password === (demoUser.defaultPassword || "password123")) {
        const token = jwt.sign(
          { id: demoUser.id, role: demoUser.role, type: demoUser.role === "patient" ? "patient" : "staff", doctorId: demoUser.doctorId },
          env.jwtSecret,
          { expiresIn: "7d" }
        );
        return res.status(200).json({
          token,
          user: demoUser,
          isOfflineDemo: true,
        });
      }
      return res.status(401).json({ message: "Invalid email or password" });
    }

    let user = await User.findOne({ email: normalizedEmail });

    // Self-healing fallback: If standard demo account was not yet seeded in MongoDB Atlas
    if (!user && DEMO_ACCOUNTS[normalizedEmail]) {
      const demo = DEMO_ACCOUNTS[normalizedEmail];
      if (password === demo.defaultPassword || password === "password123") {
        try {
          user = await User.create({
            name: demo.name,
            email: demo.email,
            password: password,
            role: demo.role,
            designation: demo.designation || "Hospital Staff",
            department: demo.department || "General Administration",
            status: "active",
          });
        } catch (seedErr) {
          user = await User.findOne({ email: normalizedEmail });
        }
      }
    }

    if (user) {
      if (!(await user.comparePassword(password))) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      let doctorId = user.doctor || null;
      if (user.role === "doctor") {
        if (!doctorId) {
          const doc = await Doctor.findOne({ email: user.email.toLowerCase() }) ||
            await Doctor.findOne({
              name: { $regex: new RegExp(`^${user.name.replace(/^Dr\.\s*/i, "").trim()}$`, "i") },
            });
          if (doc) {
            doctorId = doc._id;
            user.doctor = doc._id;
            await user.save().catch(() => {});
          }
        }
      }

      const token = createToken(user, doctorId);

      return res.status(200).json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          doctorId: doctorId || undefined,
        },
      });
    }

    // Fallback: Check if the email belongs to a registered patient
    const patient = await Patient.findOne({ email: email.toLowerCase() }).select("+password");

    if (patient && (await patient.comparePassword(password))) {
      const token = jwt.sign(
        { id: patient._id, role: "patient", type: "patient" },
        env.jwtSecret,
        { expiresIn: "7d" }
      );

      return res.status(200).json({
        token,
        user: {
          id: patient._id,
          name: patient.name,
          email: patient.email,
          role: "patient",
        },
      });
    }

    return res.status(401).json({ message: "Invalid email or password" });
  } catch (error) {
    console.error("Login error:", error.message);
    if (error.name === "MongooseServerSelectionError" || error.message?.includes("SSL alert number 80") || error.message?.includes("whitelisted")) {
      return res.status(503).json({
        message: "Database connection failed: MongoDB Atlas blocked connection from this IP. Please add 0.0.0.0/0 to your MongoDB Atlas Network Access IP whitelist.",
      });
    }
    return res.status(500).json({ message: "Unable to log in: " + (error.message || "Internal server error") });
  }
};
