import mongoose from "mongoose";
import Appointment from "../models/Appointment.js";
import Billing from "../models/Billing.js";

// Helper: check if patient owns the appointment
const patientOwnsAppointment = async (appointmentId, patientId) => {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) return false;
  return appointment.patient.toString() === patientId.toString();
};

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
      // Only allow valid status values
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
        message:
          "Doctor, appointment date, time slot, and reason for visit are required",
      });
    }

    if (!mongoose.isValidObjectId(doctor)) {
      return res.status(400).json({ message: "Invalid doctor ID" });
    }

    // === DOUBLE-BOOKING PREVENTION (same logic as createAppointment) ===
    const formattedDate = new Date(appointmentDate);
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

    // === BOOK APPOINTMENT (patient auto-set to authenticated patient) ===
    const appointment = await Appointment.create({
      patient: req.patient.id,
      doctor,
      appointmentDate: formattedDate,
      timeSlot: timeSlot.trim(),
      reasonForVisit,
      status: "pending", // newly booked appointments start as pending
    });

    return res.status(201).json({
      message: "Appointment booked successfully. Pending staff confirmation.",
      appointment,
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to book appointment" });
  }
};

// GET /api/patient-portal/billings
export const getMyBillings = async (req, res) => {
  try {
    const billings = await Billing.find({ patient: req.patient.id })
      .populate("appointment", "appointmentDate timeSlot status reasonForVisit")
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

    // === OWNERSHIP CHECK ===
    const ownsAppointment = await patientOwnsAppointment(appointmentId, req.patient.id);

    if (!ownsAppointment) {
      return res.status(403).json({
        message: "You can only cancel appointments that belong to you",
      });
    }

    // === CANCEL APPPOINTMENT (only pending or confirmed) ===
    const appointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      { status: "cancelled" },
      { new: true, runValidators: true }
    );

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    return res.status(200).json({
      message: "Appointment cancelled successfully",
      appointment,
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to cancel appointment" });
  }
};