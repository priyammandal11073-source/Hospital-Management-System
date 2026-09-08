import mongoose from "mongoose";
import Patient from "../models/Patient.js";
import Appointment from "../models/Appointment.js";
import Prescription from "../models/Prescription.js";
import { resolveDoctorForUser } from "../utils/doctorHelper.js";

const sendDatabaseError = (error, res) => {
  if (error.name === "ValidationError") {
    return res.status(400).json({ message: "Validation failed" });
  }

  if (error.code === 11000) {
    return res.status(409).json({ message: "A patient with this email already exists" });
  }

  console.error("Patient database error:", error.message);
  return res.status(500).json({ message: "Unable to process patient request" });
};

const isValidPatientId = (id) => mongoose.isValidObjectId(id);

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// POST /api/patients
export const createPatient = async (req, res) => {
  try {
    const patient = await Patient.create(req.body);
    return res.status(201).json({
      message: "Patient created successfully",
      patient,
    });
  } catch (error) {
    return sendDatabaseError(error, res);
  }
};

// GET /api/patients?search=an&page=1&limit=10
export const getAllPatients = async (req, res) => {
  try {
    const { search } = req.query;
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 10;

    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
      return res.status(400).json({
        message: "Page must be positive and limit must be between 1 and 100",
      });
    }

    const filter = {};

    // Doctor role enforcement: only view patients assigned to this doctor via appointments or prescriptions
    if (req.user?.role === "doctor") {
      const myDoctor = await resolveDoctorForUser(req.user);
      if (!myDoctor) {
        return res.status(403).json({ message: "Doctor profile not found for this account" });
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
        .limit(limit),
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
  } catch (error) {
    return sendDatabaseError(error, res);
  }
};

// GET /api/patients/:id
export const getPatientById = async (req, res) => {
  try {
    if (!isValidPatientId(req.params.id)) {
      return res.status(400).json({ message: "Invalid patient ID" });
    }

    // Doctor role enforcement
    if (req.user?.role === "doctor") {
      const myDoctor = await resolveDoctorForUser(req.user);
      if (!myDoctor) {
        return res.status(403).json({ message: "Doctor profile not found for this account" });
      }

      const [hasAppt, hasRx] = await Promise.all([
        Appointment.exists({ doctor: myDoctor._id, patient: req.params.id }),
        Prescription.exists({ doctor: myDoctor._id, patient: req.params.id }),
      ]);

      if (!hasAppt && !hasRx) {
        return res.status(403).json({
          message: "Access denied: This patient is not assigned to your clinical care.",
        });
      }
    }

    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    return res.status(200).json({ patient });
  } catch (error) {
    return sendDatabaseError(error, res);
  }
};

// PUT /api/patients/:id
export const updatePatient = async (req, res) => {
  try {
    if (!isValidPatientId(req.params.id)) {
      return res.status(400).json({ message: "Invalid patient ID" });
    }

    const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    return res.status(200).json({
      message: "Patient updated successfully",
      patient,
    });
  } catch (error) {
    return sendDatabaseError(error, res);
  }
};

// DELETE /api/patients/:id
export const deletePatient = async (req, res) => {
  try {
    if (!isValidPatientId(req.params.id)) {
      return res.status(400).json({ message: "Invalid patient ID" });
    }

    const patient = await Patient.findByIdAndDelete(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    return res.status(200).json({ message: "Patient deleted successfully" });
  } catch (error) {
    return sendDatabaseError(error, res);
  }
};
