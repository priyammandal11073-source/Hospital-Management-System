import mongoose from "mongoose";
import Appointment from "../models/Appointment.js";
import Billing from "../models/Billing.js";
import { resolveDoctorForUser } from "../utils/doctorHelper.js";
import { mockDatabase } from "../utils/mockDatabase.js";
import env from "../config/env.js";
import asyncHandler from "../middleware/asyncHandler.js";
import AppError from "../utils/AppError.js";

const appointmentStatuses = [
  "pending",
  "confirmed",
  "waiting",
  "checked_in",
  "in_consultation",
  "in_progress",
  "completed",
  "cancelled",
  "no_show",
];
const activeStatuses = ["pending", "confirmed", "waiting", "checked_in", "in_consultation", "in_progress"];
const OPD_FEE = env.opdFee;

const isValidAppointmentId = (id) => mongoose.isValidObjectId(id);

// Dates are stored at UTC midnight because the time is held separately in timeSlot.
const normaliseAppointmentDate = (value) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  date.setUTCHours(0, 0, 0, 0);
  return date;
};

// POST /api/appointments
export const createAppointment = asyncHandler(async (req, res) => {
  const { patient, doctor, appointmentDate, timeSlot, reasonForVisit, paymentMethod } = req.body;

  if (!patient || !doctor || !appointmentDate || !timeSlot || !reasonForVisit) {
    throw new AppError("Patient, doctor, date, time slot, and reason for visit are required", 400);
  }

  if (!mongoose.isValidObjectId(patient) || !mongoose.isValidObjectId(doctor)) {
    throw new AppError("Invalid patient or doctor ID", 400);
  }

  if (typeof timeSlot !== "string" || typeof reasonForVisit !== "string") {
    throw new AppError("Time slot and reason for visit must be text", 400);
  }

  const formattedDate = normaliseAppointmentDate(appointmentDate);

  if (!formattedDate) {
    throw new AppError("Invalid appointment date", 400);
  }

  // Seamless offline fallback when database connection is unavailable
  if (mongoose.connection.readyState !== 1) {
    const newAppt = {
      _id: new mongoose.Types.ObjectId().toString(),
      patient: mockDatabase.getPatientById(patient) || mockDatabase.demoPatients[0],
      doctor: mockDatabase.getDoctorById(doctor) || mockDatabase.demoDoctors[0],
      appointmentDate: formattedDate,
      timeSlot: timeSlot.trim(),
      reasonForVisit: reasonForVisit.trim(),
      status: "confirmed",
      bookedBy: req.user?.role === "patient" ? "patient" : "staff",
      createdAt: new Date(),
    };
    mockDatabase.demoAppointments.unshift(newAppt);
    return res.status(201).json({
      message: "Appointment booked successfully",
      appointment: newAppt,
      isOfflineDemo: true,
    });
  }

  const existingAppointment = await Appointment.findOne({
    doctor,
    appointmentDate: formattedDate,
    timeSlot: timeSlot.trim(),
    status: { $in: activeStatuses },
  });

  if (existingAppointment) {
    throw new AppError("This time slot is already booked", 409);
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
});

// GET /api/appointments?status=pending&doctor=<doctorId>&startDate=2026-08-01&endDate=2026-08-31&bookedBy=patient
export const getAllAppointments = asyncHandler(async (req, res) => {
  const { status, doctor, startDate, endDate, bookedBy } = req.query;

  // Seamless offline fallback when database connection is unavailable
  if (mongoose.connection.readyState !== 1) {
    const appointments = mockDatabase.getAppointments({ status, doctor });
    return res.status(200).json({ appointments, isOfflineDemo: true });
  }

  const filter = {};

  // Doctor role enforcement: doctor can only ever see their own appointments
  if (req.user?.role === "doctor") {
    const doctorRecord = await resolveDoctorForUser(req.user);
    if (!doctorRecord) {
      throw new AppError("Doctor profile not found for this account", 403);
    }
    filter.doctor = doctorRecord._id;
  } else if (doctor) {
    if (!mongoose.isValidObjectId(doctor)) {
      throw new AppError("Invalid doctor ID", 400);
    }

    filter.doctor = doctor;
  }

  if (bookedBy) {
    if (!["staff", "patient"].includes(bookedBy)) {
      throw new AppError("Invalid bookedBy filter", 400);
    }
    filter.bookedBy = bookedBy;
  }

  if (status) {
    if (!appointmentStatuses.includes(status)) {
      throw new AppError("Invalid appointment status", 400);
    }

    filter.status = status;
  }

  if (startDate || endDate) {
    const start = startDate ? normaliseAppointmentDate(startDate) : null;
    const end = endDate ? normaliseAppointmentDate(endDate) : null;

    if ((startDate && !start) || (endDate && !end)) {
      throw new AppError("Invalid date range", 400);
    }

    if (start && end && start > end) {
      throw new AppError("Start date must be before end date", 400);
    }

    filter.appointmentDate = {};
    if (start) filter.appointmentDate.$gte = start;
    if (end) filter.appointmentDate.$lte = end;
  }

  const page = req.query.page ? Math.max(1, parseInt(req.query.page, 10)) : null;
  const limit = req.query.limit ? Math.min(200, Math.max(1, parseInt(req.query.limit, 10))) : (page ? 50 : 200);
  const skip = page ? (page - 1) * limit : 0;

  let query = Appointment.find(filter)
    .populate("patient", "name contactNumber age gender abhaId bloodGroup")
    .populate("doctor", "name specialization department")
    .sort({ appointmentDate: 1, timeSlot: 1 });

  if (page) {
    const [appointments, totalCount] = await Promise.all([
      query.skip(skip).limit(limit),
      Appointment.countDocuments(filter),
    ]);
    return res.status(200).json({
      appointments,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    });
  }

  const appointments = await query.limit(limit);
  return res.status(200).json({ appointments });
});

// GET /api/appointments/:id
export const getAppointmentById = asyncHandler(async (req, res) => {
  if (!isValidAppointmentId(req.params.id)) {
    throw new AppError("Invalid appointment ID", 400);
  }

  // Seamless offline fallback when database connection is unavailable
  if (mongoose.connection.readyState !== 1) {
    const appointment = mockDatabase.demoAppointments.find(a => a._id === req.params.id) || mockDatabase.demoAppointments[0];
    return res.status(200).json({ appointment, isOfflineDemo: true });
  }

  const appointment = await Appointment.findById(req.params.id)
    .populate("patient", "name contactNumber age gender abhaId bloodGroup")
    .populate("doctor", "name specialization department");

  if (!appointment) {
    throw new AppError("Appointment not found", 404);
  }

  if (req.user?.role === "doctor") {
    const doctorRecord = await resolveDoctorForUser(req.user);
    if (!doctorRecord || !appointment.doctor?._id.equals(doctorRecord._id)) {
      throw new AppError("Access denied. You can only view your own appointments.", 403);
    }
  }

  return res.status(200).json({ appointment });
});

// PATCH /api/appointments/:id/status
export const updateAppointmentStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!isValidAppointmentId(req.params.id)) {
    throw new AppError("Invalid appointment ID", 400);
  }

  if (!appointmentStatuses.includes(status)) {
    throw new AppError("Invalid appointment status", 400);
  }

  // Seamless offline fallback when database connection is unavailable
  if (mongoose.connection.readyState !== 1) {
    const appt = mockDatabase.demoAppointments.find(a => a._id === req.params.id);
    if (appt) appt.status = status;
    return res.status(200).json({
      message: "Appointment status updated successfully",
      appointment: appt || mockDatabase.demoAppointments[0],
      isOfflineDemo: true,
    });
  }

  if (req.user?.role === "doctor") {
    const doctorRecord = await resolveDoctorForUser(req.user);
    const existing = await Appointment.findById(req.params.id);
    if (!existing) {
      throw new AppError("Appointment not found", 404);
    }
    if (!doctorRecord || !existing.doctor.equals(doctorRecord._id)) {
      throw new AppError("Access denied. You can only update your own appointments.", 403);
    }
  }

  const appointment = await Appointment.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true, runValidators: true }
  );

  if (!appointment) {
    throw new AppError("Appointment not found", 404);
  }

  return res.status(200).json({
    message: "Appointment status updated successfully",
    appointment,
  });
});

// DELETE /api/appointments/:id
export const deleteAppointment = asyncHandler(async (req, res) => {
  if (!isValidAppointmentId(req.params.id)) {
    throw new AppError("Invalid appointment ID", 400);
  }

  const appointment = await Appointment.findByIdAndDelete(req.params.id);

  if (!appointment) {
    throw new AppError("Appointment not found", 404);
  }

  return res.status(200).json({ message: "Appointment deleted successfully" });
});

// PATCH /api/appointments/:id/checklist
export const updateAppointmentChecklist = asyncHandler(async (req, res) => {
  if (!isValidAppointmentId(req.params.id)) {
    throw new AppError("Invalid appointment ID", 400);
  }

  const { prepChecklist } = req.body;

  const appointment = await Appointment.findByIdAndUpdate(
    req.params.id,
    { prepChecklist },
    { new: true }
  )
    .populate("patient", "name age gender contactNumber isAdmitted")
    .populate("doctor", "name specialization department");

  if (!appointment) {
    throw new AppError("Appointment not found", 404);
  }

  return res.status(200).json({
    message: "Nursing intake / pre-procedure checklist updated",
    appointment,
  });
});
