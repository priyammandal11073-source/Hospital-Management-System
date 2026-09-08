import mongoose from "mongoose";
import Appointment from "../models/Appointment.js";
import Bed from "../models/Bed.js";
import Billing from "../models/Billing.js";
import Patient from "../models/Patient.js";
import Prescription from "../models/Prescription.js";

const OPD_FEE = Number(process.env.OPD_FEE || 500);

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
    const { doctor, appointmentDate, timeSlot, reasonForVisit, paymentMethod } = req.body;

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

    // Auto-create an OPD billing record for immediate payment.
    const allowedPaymentMethods = ["cash", "card", "upi", "insurance"];
    const resolvedMethod = allowedPaymentMethods.includes(paymentMethod)
      ? paymentMethod
      : undefined;

    const billing = await Billing.create({
      patient: req.patient.id,
      appointment: appointment._id,
      itemizedCharges: [{ description: "OPD Consultation Fee", cost: OPD_FEE }],
      paymentMethod: resolvedMethod,
      paymentStatus: "pending",
    });

    return res.status(201).json({
      message: "Appointment booked successfully. Pending staff confirmation.",
      appointment,
      billingId: billing._id,
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

// GET /api/patient-portal/prescriptions
export const getMyPrescriptions = async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ patient: req.patient.id })
      .populate("doctor", "name specialization department contactNumber email")
      .populate("patient", "name age gender contactNumber email abhaId address bloodGroup")
      .populate("appointment", "appointmentDate timeSlot reasonForVisit")
      .sort({ createdAt: -1 });

    return res.status(200).json({ prescriptions });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch prescriptions" });
  }
};

// GET /api/patient-portal/bed
export const getMyBedStay = async (req, res) => {
  try {
    const bedStay = await Bed.findOne({
      "currentAdmission.patient": req.patient.id,
      status: "occupied",
    }).populate("currentAdmission.attendingDoctor", "name specialization department contactNumber email");

    return res.status(200).json({ bedStay });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch bed allocation details" });
  }
};

// PATCH /api/patient-portal/billings/:id/pay-upi
export const payMyBillingUpi = async (req, res) => {
  try {
    const { id: billingId } = req.params;
    const { upiTransactionId, upiPayerVpa } = req.body;

    if (!mongoose.isValidObjectId(billingId)) {
      return res.status(400).json({ message: "Invalid billing ID" });
    }

    const billing = await Billing.findOne({
      _id: billingId,
      patient: req.patient.id,
    });

    if (!billing) {
      return res.status(404).json({ message: "Invoice not found or does not belong to you" });
    }

    if (billing.paymentStatus === "paid") {
      return res.status(400).json({ message: "This invoice is already paid" });
    }

    const finalUpiTrxId = upiTransactionId
      ? String(upiTransactionId).trim()
      : "UPI" + Math.floor(100000000000 + Math.random() * 900000000000);

    billing.paymentStatus = "paid";
    billing.paymentMethod = "upi";
    billing.paymentDate = new Date();
    billing.upiTransactionId = finalUpiTrxId;
    if (upiPayerVpa) {
      billing.upiPayerVpa = String(upiPayerVpa).trim();
    }

    await billing.save();

    const populatedBilling = await Billing.findById(billing._id)
      .populate("patient", "name contactNumber email age gender address")
      .populate({
        path: "appointment",
        select: "appointmentDate timeSlot status reasonForVisit doctor",
        populate: { path: "doctor", select: "name specialization department contactNumber" },
      });

    return res.status(200).json({
      message: "UPI payment received and invoice marked as paid!",
      billing: populatedBilling,
    });
  } catch (error) {
    console.error("Error processing UPI payment:", error);
    return res.status(500).json({ message: "Unable to complete UPI payment" });
  }
};


