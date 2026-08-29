import mongoose from "mongoose";
import Appointment from "../models/Appointment.js";
import Billing from "../models/Billing.js";
import Patient from "../models/Patient.js";

const paymentStatuses = ["pending", "paid", "partially_paid"];
const paymentMethods = ["cash", "card", "insurance", "upi"];

const sendDatabaseError = (error, res) => {
  if (error.name === "ValidationError") {
    return res.status(400).json({ message: "Validation failed" });
  }

  console.error("Billing database error:", error.message);
  return res.status(500).json({ message: "Unable to process billing request" });
};

const isValidBillingId = (id) => mongoose.isValidObjectId(id);

const parseDate = (value, endOfDay = false) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  if (endOfDay) {
    date.setUTCHours(23, 59, 59, 999);
  } else {
    date.setUTCHours(0, 0, 0, 0);
  }

  return date;
};

// POST /api/billing
export const createBilling = async (req, res) => {
  try {
    const { patient, appointment, itemizedCharges } = req.body;

    if (!patient || !appointment || !itemizedCharges) {
      return res.status(400).json({
        message: "Patient, appointment, and itemized charges are required",
      });
    }

    if (!mongoose.isValidObjectId(patient) || !mongoose.isValidObjectId(appointment)) {
      return res.status(400).json({ message: "Invalid patient or appointment ID" });
    }

    if (!Array.isArray(itemizedCharges)) {
      return res.status(400).json({ message: "Itemized charges must be an array" });
    }

    // Verify references and ensure the appointment belongs to the billed patient.
    const [existingPatient, existingAppointment] = await Promise.all([
      Patient.findById(patient),
      Appointment.findOne({ _id: appointment, patient }),
    ]);

    if (!existingPatient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    if (!existingAppointment) {
      return res.status(404).json({
        message: "Appointment not found for this patient",
      });
    }

    // Billing's pre-validation hook calculates totalAmount from these line items.
    const billing = await Billing.create({ patient, appointment, itemizedCharges });

    return res.status(201).json({
      message: "Billing record created successfully",
      billing,
    });
  } catch (error) {
    return sendDatabaseError(error, res);
  }
};

// GET /api/billing?paymentStatus=paid&startDate=2026-08-01&endDate=2026-08-31
export const getAllBillings = async (req, res) => {
  try {
    const { paymentStatus, startDate, endDate } = req.query;
    const filter = {};

    if (paymentStatus) {
      if (!paymentStatuses.includes(paymentStatus)) {
        return res.status(400).json({ message: "Invalid payment status" });
      }

      filter.paymentStatus = paymentStatus;
    }

    if (startDate || endDate) {
      const start = startDate ? parseDate(startDate) : null;
      const end = endDate ? parseDate(endDate, true) : null;

      if ((startDate && !start) || (endDate && !end)) {
        return res.status(400).json({ message: "Invalid date range" });
      }

      if (start && end && start > end) {
        return res.status(400).json({ message: "Start date must be before end date" });
      }

      filter.createdAt = {};
      if (start) filter.createdAt.$gte = start;
      if (end) filter.createdAt.$lte = end;
    }

    const billings = await Billing.find(filter)
      .populate("patient", "name contactNumber")
      .sort({ createdAt: -1 });

    return res.status(200).json({ billings });
  } catch (error) {
    return sendDatabaseError(error, res);
  }
};

// GET /api/billing/:id
export const getBillingById = async (req, res) => {
  try {
    if (!isValidBillingId(req.params.id)) {
      return res.status(400).json({ message: "Invalid billing ID" });
    }

    const billing = await Billing.findById(req.params.id)
      .populate("patient", "name contactNumber")
      .populate("appointment", "appointmentDate timeSlot status reasonForVisit");

    if (!billing) {
      return res.status(404).json({ message: "Billing record not found" });
    }

    return res.status(200).json({ billing });
  } catch (error) {
    return sendDatabaseError(error, res);
  }
};

// PATCH /api/billing/:id/payment
export const updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus, paymentDate, paymentMethod } = req.body;

    if (!isValidBillingId(req.params.id)) {
      return res.status(400).json({ message: "Invalid billing ID" });
    }

    if (!paymentStatus || !paymentStatuses.includes(paymentStatus)) {
      return res.status(400).json({ message: "Invalid payment status" });
    }

    if (paymentMethod && !paymentMethods.includes(paymentMethod)) {
      return res.status(400).json({ message: "Invalid payment method" });
    }

    const updates = { paymentStatus };

    if (paymentDate) {
      const parsedPaymentDate = new Date(paymentDate);

      if (Number.isNaN(parsedPaymentDate.getTime())) {
        return res.status(400).json({ message: "Invalid payment date" });
      }

      updates.paymentDate = parsedPaymentDate;
    } else if (paymentStatus === "paid") {
      updates.paymentDate = new Date();
    }

    if (paymentMethod) {
      updates.paymentMethod = paymentMethod;
    }

    const billing = await Billing.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!billing) {
      return res.status(404).json({ message: "Billing record not found" });
    }

    return res.status(200).json({
      message: "Payment status updated successfully",
      billing,
    });
  } catch (error) {
    return sendDatabaseError(error, res);
  }
};

// GET /api/billing/summary
export const getRevenueSummary = async (req, res) => {
  try {
    const totalsByStatus = await Billing.aggregate([
      {
        $match: {
          paymentStatus: { $in: ["paid", "pending"] },
        },
      },
      {
        $group: {
          _id: "$paymentStatus",
          totalAmount: { $sum: "$totalAmount" },
        },
      },
    ]);

    const totals = totalsByStatus.reduce(
      (summary, item) => ({ ...summary, [item._id]: item.totalAmount }),
      { paid: 0, pending: 0 }
    );

    return res.status(200).json({
      totalRevenue: totals.paid,
      totalPendingAmount: totals.pending,
    });
  } catch (error) {
    return sendDatabaseError(error, res);
  }
};
