import mongoose from "mongoose";
import Doctor from "../models/Doctor.js";
import Appointment from "../models/Appointment.js";
import User from "../models/User.js";
import { resolveDoctorForUser } from "../utils/doctorHelper.js";
import { mockDatabase, demoDoctors } from "../utils/mockDatabase.js";
import asyncHandler from "../middleware/asyncHandler.js";
import AppError from "../utils/AppError.js";

const isValidDoctorId = (id) => mongoose.isValidObjectId(id);

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// GET /api/doctors/me - Returns the authenticated doctor's dedicated profile & stats
export const getCurrentDoctorProfile = asyncHandler(async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    const doctor = demoDoctors[0];
    return res.status(200).json({
      doctor,
      stats: {
        todayAppointments: 6,
        pendingAppointments: 2,
        completedAppointments: 4,
        totalAppointments: 18,
        totalPatients: 14,
      },
      todaySchedule: { day: "Today", slots: ["09:00 AM", "10:30 AM", "02:00 PM"] },
      isOfflineDemo: true,
    });
  }

  const doctor = await resolveDoctorForUser(req.user);
  if (!doctor) {
    throw new AppError("Doctor profile not found for this account", 404);
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
});

// POST /api/doctors
export const createDoctor = asyncHandler(async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    const newDoc = {
      _id: new mongoose.Types.ObjectId().toString(),
      ...req.body,
      createdAt: new Date(),
    };
    demoDoctors.push(newDoc);
    return res.status(201).json({
      message: "Doctor created successfully",
      doctor: newDoc,
      isOfflineDemo: true,
    });
  }

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
});

// GET /api/doctors?specialization=cardio&department=medicine
export const getAllDoctors = asyncHandler(async (req, res) => {
  const { specialization, department } = req.query;

  // Seamless offline fallback when database connection is unavailable
  if (mongoose.connection.readyState !== 1) {
    const doctors = mockDatabase.getDoctors({ specialization, department });
    return res.status(200).json({ doctors, isOfflineDemo: true });
  }

  // If a doctor is authenticated, default to their own profile unless hospital directory requested
  if (req.user?.role === "doctor" && req.query.directory !== "true" && req.query.all !== "true") {
    const myDoctor = await resolveDoctorForUser(req.user);
    return res.status(200).json({ doctors: myDoctor ? [myDoctor] : [] });
  }

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

  const doctors = await Doctor.find(filter).sort({ name: 1 }).lean();
  return res.status(200).json({ doctors });
});

// GET /api/doctors/:id
export const getDoctorById = asyncHandler(async (req, res) => {
  if (!isValidDoctorId(req.params.id)) {
    throw new AppError("Invalid doctor ID", 400);
  }

  // Seamless offline fallback when database connection is unavailable
  if (mongoose.connection.readyState !== 1) {
    const doctor = mockDatabase.getDoctorById(req.params.id) || demoDoctors[0];
    if (!doctor) {
      throw new AppError("Doctor not found", 404);
    }
    return res.status(200).json({ doctor, isOfflineDemo: true });
  }

  // If logged-in as doctor, only permit accessing their own record
  if (req.user?.role === "doctor") {
    const myDoctor = await resolveDoctorForUser(req.user);
    if (!myDoctor || myDoctor._id.toString() !== req.params.id) {
      throw new AppError("Access denied. You cannot view another doctor's detailed record.", 403);
    }
  }

  const doctor = await Doctor.findById(req.params.id).lean();

  if (!doctor) {
    throw new AppError("Doctor not found", 404);
  }

  return res.status(200).json({ doctor });
});

// PUT /api/doctors/:id
export const updateDoctor = asyncHandler(async (req, res) => {
  if (!isValidDoctorId(req.params.id)) {
    throw new AppError("Invalid doctor ID", 400);
  }

  // A doctor can only update their own profile
  if (req.user?.role === "doctor") {
    const myDoctor = await resolveDoctorForUser(req.user);
    if (!myDoctor || myDoctor._id.toString() !== req.params.id) {
      throw new AppError("Access denied. You cannot modify another doctor's profile.", 403);
    }
  }

  const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!doctor) {
    throw new AppError("Doctor not found", 404);
  }

  return res.status(200).json({
    message: "Doctor updated successfully",
    doctor,
  });
});

// DELETE /api/doctors/:id
export const deleteDoctor = asyncHandler(async (req, res) => {
  if (!isValidDoctorId(req.params.id)) {
    throw new AppError("Invalid doctor ID", 400);
  }

  const doctor = await Doctor.findByIdAndDelete(req.params.id);

  if (!doctor) {
    throw new AppError("Doctor not found", 404);
  }

  return res.status(200).json({ message: "Doctor deleted successfully" });
});

// PUT /api/doctors/:id/schedule
export const updateDoctorSchedule = asyncHandler(async (req, res) => {
  if (!isValidDoctorId(req.params.id)) {
    throw new AppError("Invalid doctor ID", 400);
  }

  // A doctor can only update their own schedule
  if (req.user?.role === "doctor") {
    const myDoctor = await resolveDoctorForUser(req.user);
    if (!myDoctor || myDoctor._id.toString() !== req.params.id) {
      throw new AppError("Access denied. You cannot modify another doctor's schedule.", 403);
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
    throw new AppError("Doctor not found", 404);
  }

  return res.status(200).json({
    message: "Doctor schedule updated successfully",
    doctor,
  });
});

// POST /api/doctors/:id/leaves
export const addDoctorLeave = asyncHandler(async (req, res) => {
  if (!isValidDoctorId(req.params.id)) {
    throw new AppError("Invalid doctor ID", 400);
  }

  // A doctor can only add leave for themselves
  if (req.user?.role === "doctor") {
    const myDoctor = await resolveDoctorForUser(req.user);
    if (!myDoctor || myDoctor._id.toString() !== req.params.id) {
      throw new AppError("Access denied. You cannot modify another doctor's leave.", 403);
    }
  }

  const { startDate, endDate, reason } = req.body;
  if (!startDate || !endDate) {
    throw new AppError("Start date and end date are required", 400);
  }

  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) {
    throw new AppError("Doctor not found", 404);
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
});

// DELETE /api/doctors/:id/leaves/:leaveIndex
export const removeDoctorLeave = asyncHandler(async (req, res) => {
  if (!isValidDoctorId(req.params.id)) {
    throw new AppError("Invalid doctor ID", 400);
  }

  // A doctor can only remove their own leaves
  if (req.user?.role === "doctor") {
    const myDoctor = await resolveDoctorForUser(req.user);
    if (!myDoctor || myDoctor._id.toString() !== req.params.id) {
      throw new AppError("Access denied. You cannot modify another doctor's leave.", 403);
    }
  }

  const { leaveIndex } = req.params;
  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) {
    throw new AppError("Doctor not found", 404);
  }

  const idx = parseInt(leaveIndex, 10);
  if (isNaN(idx) || idx < 0 || idx >= doctor.leaves.length) {
    throw new AppError("Invalid leave index", 400);
  }

  doctor.leaves.splice(idx, 1);
  await doctor.save();

  return res.status(200).json({
    message: "Leave removed successfully",
    leaves: doctor.leaves,
    doctor,
  });
});
