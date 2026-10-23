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

const ALLOWED_STAFF_ROLES = [
  "admin",
  "doctor",
  "nurse",
  "receptionist",
  "pharmacist",
  "diagnostic_admin",
  "pathologist",
  "radiologist",
  "lab_technician",
  "radiology_technician",
  "emergency",
];

// POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email, and password are required",
      });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: "Database service unavailable. Please try again shortly.",
      });
    }

    // Role escalation prevention:
    // Determine whether caller is an authenticated administrator
    let isAdmin = false;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const decoded = jwt.verify(authHeader.split(" ")[1], env.jwtSecret);
        if (decoded.role === "admin") {
          isAdmin = true;
        }
      } catch {
        isAdmin = false;
      }
    }

    let assignedRole = "patient";

    if (role && role !== "patient") {
      // Privileged staff roles require an authenticated administrator
      if (!isAdmin) {
        return res.status(403).json({
          success: false,
          message: "Forbidden: Creating staff accounts or assigning privileged roles requires an authenticated administrator.",
        });
      }

      if (!ALLOWED_STAFF_ROLES.includes(role)) {
        return res.status(400).json({
          success: false,
          message: `Invalid role requested. Allowed staff roles: ${ALLOWED_STAFF_ROLES.join(", ")}`,
        });
      }

      assignedRole = role;
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({ message: "Email is already registered" });
    }

    let doctorRef = null;
    if (assignedRole === "doctor") {
      const doc = await Doctor.findOne({ email: email.toLowerCase().trim() });
      if (doc) doctorRef = doc._id;
    }

    await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: assignedRole,
      doctor: doctorRef,
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully. Please log in to continue.",
      role: assignedRole,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Email is already registered" });
    }

    return res.status(400).json({ message: error.message });
  }
};

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Fail closed if database is unavailable: return 503; NEVER authenticate from hard-coded demo credentials
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: "Database service unavailable. Please try again shortly.",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });

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
    const patient = await Patient.findOne({ email: normalizedEmail }).select("+password");

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
    if (error.name === "MongooseServerSelectionError" || error.name === "MongoNetworkError") {
      return res.status(503).json({
        success: false,
        message: "Database connection failed. Please try again shortly.",
      });
    }
    return res.status(500).json({ message: "Unable to log in: " + (error.message || "Internal server error") });
  }
};
