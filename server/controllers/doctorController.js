import mongoose from "mongoose";
import Doctor from "../models/Doctor.js";
import Appointment from "../models/Appointment.js";
import User from "../models/User.js";
import { resolveDoctorForUser } from "../utils/doctorHelper.js";

const sendDatabaseError = (error, res) => {
  if (error.name === "ValidationError") {
    return res.status(400).json({ message: "Validation failed" });
  }

  if (error.code === 11000) {
    return res.status(409).json({ message: "A doctor with this email already exists" });
  }

  console.error("Doctor database error:", error.message);
  return res.status(500).json({ message: "Unable to process doctor request" });
};

const isValidDoctorId = (id) => mongoose.isValidObjectId(id);

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// GET /api/doctors/me - Returns the authenticated doctor's dedicated profile & stats
export const getCurrentDoctorProfile = async (req, res) => {
  try {
    const doctor = await resolveDoctorForUser(req.user);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor profile not found for this account" });
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [todayCount, pendingCount, completedCount, totalCount, patientIds] = await Promise.all([
      Appointment.countDocuments({
        doctor: doctor._id,
        appointmentDate: { $gte: today, $lt: tomorrow },
      }),
      Appointment.countDocuments({
        doctor: doctor._id,
        status: "pending",
      }),
      Appointment.countDocuments({
        doctor: doctor._id,
        status: "completed",
      }),
      Appointment.countDocuments({
        doctor: doctor._id,
      }),
      Appointment.distinct("patient", { doctor: doctor._id }),
    ]);

    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const currentDayName = days[new Date().getDay()];
    const todaySchedule = doctor.weeklySchedule?.find((s) => s.day === currentDayName) || null;

    return res.status(200).json({
      doctor,
      stats: {
        todayAppointments: todayCount,
        pendingAppointments: pendingCount,
        completedAppointments: completedCount,
        totalAppointments: totalCount,
        totalPatients: patientIds.length,
      },
      todaySchedule,
    });
  } catch (error) {
    return sendDatabaseError(error, res);
  }
};

// POST /api/doctors
export const createDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.create(req.body);

    // Link or create User account if needed
    if (doctor.email) {
      const existingUser = await User.findOne({ email: doctor.email.toLowerCase() });
      if (existingUser) {
        existingUser.doctor = doctor._id;
        await existingUser.save().catch(() => {});
      }
    }

    return res.status(201).json({
      message: "Doctor created successfully",
      doctor,
    });
  } catch (error) {
    return sendDatabaseError(error, res);
  }
};

// GET /api/doctors?specialization=cardio&department=medicine
export const getAllDoctors = async (req, res) => {
  try {
    // If a doctor is authenticated, default to their own profile unless hospital directory requested
    if (req.user?.role === "doctor" && req.query.directory !== "true" && req.query.all !== "true") {
      const myDoctor = await resolveDoctorForUser(req.user);
      return res.status(200).json({ doctors: myDoctor ? [myDoctor] : [] });
    }

    const { specialization, department } = req.query;
    const filter = {};

    if (specialization?.trim()) {
      filter.specialization = {
        $regex: escapeRegex(specialization.trim()),
        $options: "i",
      };
    }

    if (department?.trim()) {
      filter.department = {
        $regex: escapeRegex(department.trim()),
        $options: "i",
      };
    }

    const doctors = await Doctor.find(filter).sort({ name: 1 });
    return res.status(200).json({ doctors });
  } catch (error) {
    return sendDatabaseError(error, res);
  }
};

// GET /api/doctors/:id
export const getDoctorById = async (req, res) => {
  try {
    if (!isValidDoctorId(req.params.id)) {
      return res.status(400).json({ message: "Invalid doctor ID" });
    }

    // If logged-in as doctor, only permit accessing their own record
    if (req.user?.role === "doctor") {
      const myDoctor = await resolveDoctorForUser(req.user);
      if (!myDoctor || myDoctor._id.toString() !== req.params.id) {
        return res.status(403).json({ message: "Access denied. You cannot view another doctor's detailed record." });
      }
    }

    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    return res.status(200).json({ doctor });
  } catch (error) {
    return sendDatabaseError(error, res);
  }
};

// PUT /api/doctors/:id
export const updateDoctor = async (req, res) => {
  try {
    if (!isValidDoctorId(req.params.id)) {
      return res.status(400).json({ message: "Invalid doctor ID" });
    }

    // A doctor can only update their own profile
    if (req.user?.role === "doctor") {
      const myDoctor = await resolveDoctorForUser(req.user);
      if (!myDoctor || myDoctor._id.toString() !== req.params.id) {
        return res.status(403).json({ message: "Access denied. You cannot modify another doctor's profile." });
      }
    }

    const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    return res.status(200).json({
      message: "Doctor updated successfully",
      doctor,
    });
  } catch (error) {
    return sendDatabaseError(error, res);
  }
};

// DELETE /api/doctors/:id
export const deleteDoctor = async (req, res) => {
  try {
    if (!isValidDoctorId(req.params.id)) {
      return res.status(400).json({ message: "Invalid doctor ID" });
    }

    const doctor = await Doctor.findByIdAndDelete(req.params.id);

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    return res.status(200).json({ message: "Doctor deleted successfully" });
  } catch (error) {
    return sendDatabaseError(error, res);
  }
};

// PUT /api/doctors/:id/schedule
export const updateDoctorSchedule = async (req, res) => {
  try {
    if (!isValidDoctorId(req.params.id)) {
      return res.status(400).json({ message: "Invalid doctor ID" });
    }

    // A doctor can only update their own schedule
    if (req.user?.role === "doctor") {
      const myDoctor = await resolveDoctorForUser(req.user);
      if (!myDoctor || myDoctor._id.toString() !== req.params.id) {
        return res.status(403).json({ message: "Access denied. You cannot modify another doctor's schedule." });
      }
    }

    const { weeklySchedule, availableDays, availableTimeSlots } = req.body;

    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      {
        ...(weeklySchedule ? { weeklySchedule } : {}),
        ...(availableDays ? { availableDays } : {}),
        ...(availableTimeSlots ? { availableTimeSlots } : {}),
      },
      { new: true, runValidators: true }
    );

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    return res.status(200).json({
      message: "Doctor schedule updated successfully",
      doctor,
    });
  } catch (error) {
    return sendDatabaseError(error, res);
  }
};

// POST /api/doctors/:id/leaves
export const addDoctorLeave = async (req, res) => {
  try {
    if (!isValidDoctorId(req.params.id)) {
      return res.status(400).json({ message: "Invalid doctor ID" });
    }

    // A doctor can only add leave for themselves
    if (req.user?.role === "doctor") {
      const myDoctor = await resolveDoctorForUser(req.user);
      if (!myDoctor || myDoctor._id.toString() !== req.params.id) {
        return res.status(403).json({ message: "Access denied. You cannot modify another doctor's leave." });
      }
    }

    const { startDate, endDate, reason } = req.body;
    if (!startDate || !endDate) {
      return res.status(400).json({ message: "Start date and end date are required" });
    }

    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    doctor.leaves.push({
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason: reason || "Leave / Conference",
      status: "approved",
    });

    await doctor.save();

    return res.status(200).json({
      message: "Leave scheduled successfully",
      leaves: doctor.leaves,
      doctor,
    });
  } catch (error) {
    return sendDatabaseError(error, res);
  }
};

// DELETE /api/doctors/:id/leaves/:leaveIndex
export const removeDoctorLeave = async (req, res) => {
  try {
    if (!isValidDoctorId(req.params.id)) {
      return res.status(400).json({ message: "Invalid doctor ID" });
    }

    // A doctor can only remove their own leaves
    if (req.user?.role === "doctor") {
      const myDoctor = await resolveDoctorForUser(req.user);
      if (!myDoctor || myDoctor._id.toString() !== req.params.id) {
        return res.status(403).json({ message: "Access denied. You cannot modify another doctor's leave." });
      }
    }

    const { leaveIndex } = req.params;
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const idx = parseInt(leaveIndex, 10);
    if (isNaN(idx) || idx < 0 || idx >= doctor.leaves.length) {
      return res.status(400).json({ message: "Invalid leave index" });
    }

    doctor.leaves.splice(idx, 1);
    await doctor.save();

    return res.status(200).json({
      message: "Leave removed successfully",
      leaves: doctor.leaves,
      doctor,
    });
  } catch (error) {
    return sendDatabaseError(error, res);
  }
};
