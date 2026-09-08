import mongoose from "mongoose";
import Appointment from "../models/Appointment.js";
import Billing from "../models/Billing.js";
import Patient from "../models/Patient.js";

// GET /api/patient-portal/me
export const getMyProfile = async (req, res) => {
  try {
    const patient = await Patient.findById(req.patient.id).select("-password");
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }
    return res.status(200).json({ patient });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch profile" });
  }
};

// GET /api/patient-portal/appointments
export const getMyAppointments = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { patient: req.patient.id };

    if (status) {
      const validStatuses = ["pending", "confirmed", "completed", "cancelled"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status filter" });
      }
      filter.status = status;
    }

    const appointments = await Appointment.find(filter)
      .populate("doctor", "name specialization")
      .sort({ appointmentDate: -1 });

    return res.status(200).json({ appointments });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch appointments" });
  }
};

// POST /api/patient-portal/appointments
export const bookMyAppointment = async (req, res) => {
  try {
    const { doctor, appointmentDate, timeSlot, reasonForVisit } = req.body;

    if (!doctor || !appointmentDate || !timeSlot || !reasonForVisit) {
      return res.status(400).json({
        message: "Doctor, appointment date, time slot, and reason for visit are required",
      });
    }

    if (!mongoose.isValidObjectId(doctor)) {
      return res.status(400).json({ message: "Invalid doctor ID" });
    }

    if (typeof timeSlot !== "string" || typeof reasonForVisit !== "string") {
      return res.status(400).json({ message: "Time slot and reason for visit must be text" });
    }

    const formattedDate = new Date(appointmentDate);
    if (Number.isNaN(formattedDate.getTime())) {
      return res.status(400).json({ message: "Invalid appointment date" });
    }
    formattedDate.setUTCHours(0, 0, 0, 0);

    const existingAppointment = await Appointment.findOne({
      doctor,
      appointmentDate: formattedDate,
      timeSlot: timeSlot.trim(),
      status: { $in: ["pending", "confirmed"] },
    });

    if (existingAppointment) {
      return res.status(409).json({ message: "This time slot is already booked" });
    }

    // SECURITY: patient is ALWAYS req.patient.id, never req.body.patient
    const appointment = await Appointment.create({
      patient: req.patient.id,
      doctor,
      appointmentDate: formattedDate,
      timeSlot: timeSlot.trim(),
      reasonForVisit: reasonForVisit.trim(),
      status: "pending",
      bookedBy: "patient",
    });

    return res.status(201).json({
      message: "Appointment booked successfully. Pending staff confirmation.",
      appointment,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "This time slot is already booked" });
    }
    return res.status(500).json({ message: "Unable to book appointment" });
  }
};

// GET /api/patient-portal/billings
export const getMyBillings = async (req, res) => {
  try {
    const billings = await Billing.find({ patient: req.patient.id })
      .populate("patient", "name contactNumber email age gender address")
      .populate({
        path: "appointment",
        select: "appointmentDate timeSlot status reasonForVisit doctor",
        populate: { path: "doctor", select: "name specialization department contactNumber" },
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({ billings });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch billing records" });
  }
};

// PATCH /api/patient-portal/appointments/:id/cancel
export const cancelMyAppointment = async (req, res) => {
  try {
    const { id: appointmentId } = req.params;

    if (!mongoose.isValidObjectId(appointmentId)) {
      return res.status(400).json({ message: "Invalid appointment ID" });
    }

    // Atomic ownership + status check: only own pending/confirmed can be cancelled
    const appointment = await Appointment.findOneAndUpdate(
      {
        _id: appointmentId,
        patient: req.patient.id,
        status: { $in: ["pending", "confirmed"] },
      },
      { status: "cancelled" },
      { new: true, runValidators: true }
    );

    if (!appointment) {
      // Distinguish 403 (owned but wrong status or not owned) vs 404
      const exists = await Appointment.findById(appointmentId);
      if (!exists) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      if (exists.patient.toString() !== req.patient.id.toString()) {
        return res.status(403).json({ message: "You can only cancel appointments that belong to you" });
      }
      return res.status(400).json({ message: "Only pending or confirmed appointments can be cancelled" });
    }

    return res.status(200).json({
      message: "Appointment cancelled successfully",
      appointment,
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to cancel appointment" });
  }
};
