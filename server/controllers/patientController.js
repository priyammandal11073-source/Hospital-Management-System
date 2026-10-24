import mongoose from "mongoose";
import Patient from "../models/Patient.js";
import Appointment from "../models/Appointment.js";
import Prescription from "../models/Prescription.js";
import { resolveDoctorForUser } from "../utils/doctorHelper.js";
import { mockDatabase } from "../utils/mockDatabase.js";
import asyncHandler from "../middleware/asyncHandler.js";
import AppError from "../utils/AppError.js";

const isValidPatientId = (id) => mongoose.isValidObjectId(id);

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// POST /api/patients
export const createPatient = asyncHandler(async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    const patient = mockDatabase.createPatient(req.body);
    return res.status(201).json({
      message: "Patient created successfully",
      patient,
      isOfflineDemo: true,
    });
  }

  const patient = await Patient.create(req.body);
  return res.status(201).json({
    message: "Patient created successfully",
    patient,
  });
});

// GET /api/patients?search=an&page=1&limit=10
export const getAllPatients = asyncHandler(async (req, res) => {
  const { search } = req.query;
  const page = req.query.page ? Number(req.query.page) : 1;
  const limit = req.query.limit ? Number(req.query.limit) : 10;

  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new AppError("Page must be positive and limit must be between 1 and 100", 400);
  }

  // Seamless offline fallback when database connection is unavailable
  if (mongoose.connection.readyState !== 1) {
    const result = mockDatabase.getPatients({ search, page, limit });
    return res.status(200).json({
      patients: result.patients,
      pagination: {
        page: result.page,
        limit: result.limit,
        totalPatients: result.totalPatients,
        totalPages: result.totalPages,
      },
      isOfflineDemo: true,
    });
  }

  const filter = {};

  // Doctor role enforcement: only view patients assigned to this doctor via appointments or prescriptions
  if (req.user?.role === "doctor") {
    const myDoctor = await resolveDoctorForUser(req.user);
    if (!myDoctor) {
      throw new AppError("Doctor profile not found for this account", 403);
    }

    const [apptPatientIds, rxPatientIds] = await Promise.all([
      Appointment.distinct("patient", { doctor: myDoctor._id }),
      Prescription.distinct("patient", { doctor: myDoctor._id }),
    ]);

    const assignedPatientIds = Array.from(
      new Set([...apptPatientIds.map(String), ...rxPatientIds.map(String)])
    );

    filter._id = { $in: assignedPatientIds };
  }

  if (search?.trim()) {
    const escaped = escapeRegex(search.trim());
    const searchFilter = [
      { name: { $regex: escaped, $options: "i" } },
      { contactNumber: { $regex: escaped, $options: "i" } },
      { abhaId: { $regex: escaped, $options: "i" } },
    ];

    if (filter._id) {
      filter.$and = [{ _id: filter._id }, { $or: searchFilter }];
      delete filter._id;
    } else {
      filter.$or = searchFilter;
    }
  }

  const [patients, totalPatients] = await Promise.all([
    Patient.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Patient.countDocuments(filter),
  ]);

  return res.status(200).json({
    patients,
    pagination: {
      page,
      limit,
      totalPatients,
      totalPages: Math.ceil(totalPatients / limit),
    },
  });
});

// GET /api/patients/:id
export const getPatientById = asyncHandler(async (req, res) => {
  if (!isValidPatientId(req.params.id)) {
    throw new AppError("Invalid patient ID", 400);
  }

  // Seamless offline fallback when database connection is unavailable
  if (mongoose.connection.readyState !== 1) {
    const patient = mockDatabase.getPatientById(req.params.id) || mockDatabase.demoPatients?.[0];
    if (!patient) {
      throw new AppError("Patient not found", 404);
    }
    return res.status(200).json({ patient, isOfflineDemo: true });
  }

  // Doctor role enforcement
  if (req.user?.role === "doctor") {
    const myDoctor = await resolveDoctorForUser(req.user);
    if (!myDoctor) {
      throw new AppError("Doctor profile not found for this account", 403);
    }

    const [hasAppt, hasRx] = await Promise.all([
      Appointment.exists({ doctor: myDoctor._id, patient: req.params.id }),
      Prescription.exists({ doctor: myDoctor._id, patient: req.params.id }),
    ]);

    if (!hasAppt && !hasRx) {
      throw new AppError("Access denied: This patient is not assigned to your clinical care.", 403);
    }
  }

  const patient = await Patient.findById(req.params.id).lean();

  if (!patient) {
    throw new AppError("Patient not found", 404);
  }

  return res.status(200).json({ patient });
});

// PUT /api/patients/:id
export const updatePatient = asyncHandler(async (req, res) => {
  if (!isValidPatientId(req.params.id)) {
    throw new AppError("Invalid patient ID", 400);
  }

  // Seamless offline fallback when database connection is unavailable
  if (mongoose.connection.readyState !== 1) {
    const patient = mockDatabase.updatePatient(req.params.id, req.body);
    if (!patient) {
      throw new AppError("Patient not found", 404);
    }
    return res.status(200).json({
      message: "Patient updated successfully",
      patient,
      isOfflineDemo: true,
    });
  }

  const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!patient) {
    throw new AppError("Patient not found", 404);
  }

  return res.status(200).json({
    message: "Patient updated successfully",
    patient,
  });
});

// DELETE /api/patients/:id
export const deletePatient = asyncHandler(async (req, res) => {
  if (!isValidPatientId(req.params.id)) {
    throw new AppError("Invalid patient ID", 400);
  }

  // Seamless offline fallback when database connection is unavailable
  if (mongoose.connection.readyState !== 1) {
    const deleted = mockDatabase.deletePatient(req.params.id);
    if (!deleted) {
      throw new AppError("Patient not found", 404);
    }
    return res.status(200).json({ message: "Patient deleted successfully", isOfflineDemo: true });
  }

  const patient = await Patient.findByIdAndDelete(req.params.id);

  if (!patient) {
    throw new AppError("Patient not found", 404);
  }

  return res.status(200).json({ message: "Patient deleted successfully" });
});
