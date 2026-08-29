import mongoose from "mongoose";
import Doctor from "../models/Doctor.js";

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

// POST /api/doctors
export const createDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.create(req.body);
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
