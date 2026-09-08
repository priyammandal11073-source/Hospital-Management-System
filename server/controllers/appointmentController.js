import mongoose from "mongoose";
import Appointment from "../models/Appointment.js";
import Billing from "../models/Billing.js";

const appointmentStatuses = ["pending", "confirmed", "completed", "cancelled"];
const activeStatuses = ["pending", "confirmed"];
const OPD_FEE = Number(process.env.OPD_FEE || 500);

const sendDatabaseError = (error, res) => {
  if (error.name === "ValidationError") {
    return res.status(400).json({ message: "Validation failed" });
  }

  // The unique compound index is the final protection against simultaneous requests.
  if (error.code === 11000) {
    return res.status(409).json({ message: "This time slot is already booked" });
  }

  console.error("Appointment database error:", error.message);
  return res.status(500).json({ message: "Unable to process appointment request" });
};

const isValidAppointmentId = (id) => mongoose.isValidObjectId(id);

// Dates are stored at UTC midnight because the time is held separately in timeSlot.
const normaliseAppointmentDate = (value) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  date.setUTCHours(0, 0, 0, 0);
  return date;
};

// POST /api/appointments
export const createAppointment = async (req, res) => {
  try {
    const { patient, doctor, appointmentDate, timeSlot, reasonForVisit, paymentMethod } = req.body;

    if (!patient || !doctor || !appointmentDate || !timeSlot || !reasonForVisit) {
      return res.status(400).json({
        message: "Patient, doctor, date, time slot, and reason for visit are required",
      });
    }

    if (!mongoose.isValidObjectId(patient) || !mongoose.isValidObjectId(doctor)) {
      return res.status(400).json({ message: "Invalid patient or doctor ID" });
    }

    if (typeof timeSlot !== "string" || typeof reasonForVisit !== "string") {
      return res.status(400).json({ message: "Time slot and reason for visit must be text" });
    }

    const formattedDate = normaliseAppointmentDate(appointmentDate);

    if (!formattedDate) {
      return res.status(400).json({ message: "Invalid appointment date" });
    }

    const existingAppointment = await Appointment.findOne({
      doctor,
      appointmentDate: formattedDate,
      timeSlot: timeSlot.trim(),
      status: { $in: activeStatuses },
    });

    if (existingAppointment) {
      return res.status(409).json({ message: "This time slot is already booked" });
    }

    const appointment = await Appointment.create({
      patient,
      doctor,
      appointmentDate: formattedDate,
      timeSlot: timeSlot.trim(),
      reasonForVisit: reasonForVisit.trim(),
      status: "pending",
      bookedBy: "staff",
    });

    // Auto-create an OPD billing record so the patient can pay immediately.
    const allowedPaymentMethods = ["cash", "card", "upi", "insurance"];
    const resolvedMethod = allowedPaymentMethods.includes(paymentMethod)
      ? paymentMethod
      : undefined;

    const billing = await Billing.create({
      patient,
      appointment: appointment._id,
      itemizedCharges: [{ description: "OPD Consultation Fee", cost: OPD_FEE }],
      paymentMethod: resolvedMethod,
      paymentStatus: "pending",
    });

    return res.status(201).json({
      message: "Appointment created successfully",
      appointment,
      billingId: billing._id,
    });
  } catch (error) {
    return sendDatabaseError(error, res);
  }
};

// GET /api/appointments?status=pending&doctor=<doctorId>&startDate=2026-08-01&endDate=2026-08-31&bookedBy=patient
export const getAllAppointments = async (req, res) => {
  try {
    const { status, doctor, startDate, endDate, bookedBy } = req.query;
    const filter = {};

    if (bookedBy) {
      if (!["staff", "patient"].includes(bookedBy)) {
        return res.status(400).json({ message: "Invalid bookedBy filter" });
      }
      filter.bookedBy = bookedBy;
    }

    if (status) {
      if (!appointmentStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid appointment status" });
      }

      filter.status = status;
    }

    if (doctor) {
      if (!mongoose.isValidObjectId(doctor)) {
        return res.status(400).json({ message: "Invalid doctor ID" });
      }

      filter.doctor = doctor;
    }

    if (startDate || endDate) {
      const start = startDate ? normaliseAppointmentDate(startDate) : null;
      const end = endDate ? normaliseAppointmentDate(endDate) : null;

      if ((startDate && !start) || (endDate && !end)) {
        return res.status(400).json({ message: "Invalid date range" });
      }

      if (start && end && start > end) {
        return res.status(400).json({ message: "Start date must be before end date" });
      }

      filter.appointmentDate = {};
      if (start) filter.appointmentDate.$gte = start;
      if (end) filter.appointmentDate.$lte = end;
    }

    const appointments = await Appointment.find(filter)
      .populate("patient", "name contactNumber")
      .populate("doctor", "name specialization")
      .sort({ appointmentDate: 1, timeSlot: 1 });

    return res.status(200).json({ appointments });
  } catch (error) {
    return sendDatabaseError(error, res);
  }
};

// GET /api/appointments/:id
export const getAppointmentById = async (req, res) => {
  try {
    if (!isValidAppointmentId(req.params.id)) {
      return res.status(400).json({ message: "Invalid appointment ID" });
    }

    const appointment = await Appointment.findById(req.params.id)
      .populate("patient", "name contactNumber")
      .populate("doctor", "name specialization");

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    return res.status(200).json({ appointment });
  } catch (error) {
    return sendDatabaseError(error, res);
  }
};

// PATCH /api/appointments/:id/status
export const updateAppointmentStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!isValidAppointmentId(req.params.id)) {
      return res.status(400).json({ message: "Invalid appointment ID" });
    }

    if (!appointmentStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid appointment status" });
    }

    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    return res.status(200).json({
      message: "Appointment status updated successfully",
      appointment,
    });
  } catch (error) {
    return sendDatabaseError(error, res);
  }
};

// DELETE /api/appointments/:id
export const deleteAppointment = async (req, res) => {
  try {
    if (!isValidAppointmentId(req.params.id)) {
      return res.status(400).json({ message: "Invalid appointment ID" });
    }

    const appointment = await Appointment.findByIdAndDelete(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    return res.status(200).json({ message: "Appointment deleted successfully" });
  } catch (error) {
    return sendDatabaseError(error, res);
  }
};
