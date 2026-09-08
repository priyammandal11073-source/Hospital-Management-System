import mongoose from "mongoose";
import nodemailer from "nodemailer";
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
      .populate("patient", "name contactNumber email age gender address")
      .populate({
        path: "appointment",
        select: "appointmentDate timeSlot status reasonForVisit doctor",
        populate: { path: "doctor", select: "name specialization department contactNumber" },
      })
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
      .populate("patient", "name contactNumber email age gender address")
      .populate({
        path: "appointment",
        select: "appointmentDate timeSlot status reasonForVisit doctor",
        populate: { path: "doctor", select: "name specialization department contactNumber" },
      });

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

// POST /api/billing/:id/send-email
export const sendBillingEmail = async (req, res) => {
  try {
    if (!isValidBillingId(req.params.id)) {
      return res.status(400).json({ message: "Invalid billing ID" });
    }

    const billing = await Billing.findById(req.params.id)
      .populate("patient", "name contactNumber email age gender address")
      .populate({
        path: "appointment",
        select: "appointmentDate timeSlot status reasonForVisit doctor",
        populate: { path: "doctor", select: "name specialization department contactNumber" },
      });

    if (!billing) {
      return res.status(404).json({ message: "Billing record not found" });
    }

    if (!billing.patient?.email) {
      return res.status(400).json({
        message: "Patient does not have an email address registered.",
      });
    }

    // Configure transporter
    let transporter;
    let isTest = false;

    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } else {
      isTest = true;
      try {
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
          host: "smtp.ethereal.email",
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
      } catch {
        transporter = {
          sendMail: async () => ({ messageId: "simulated-" + Date.now() }),
        };
      }
    }

    const patientName = billing.patient.name;
    const invoiceNumber = `INV-${billing._id.toString().slice(-6).toUpperCase()}`;
    const invoiceDate = new Date(billing.createdAt).toLocaleDateString();
    const totalAmount = billing.totalAmount.toFixed(2);
    const paymentStatus = billing.paymentStatus.toUpperCase();

    const chargesRows = (billing.itemizedCharges || [])
      .map(
        (charge, idx) => `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px; font-size: 14px; color: #475569;">${idx + 1}</td>
          <td style="padding: 10px; font-size: 14px; color: #1e293b;">${charge.description}</td>
          <td style="padding: 10px; font-size: 14px; text-align: right; color: #1e293b;">₹${charge.cost.toFixed(2)}</td>
        </tr>`
      )
      .join("");

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
        <div style="border-bottom: 2px solid #2563eb; padding-bottom: 15px; margin-bottom: 20px;">
          <h2 style="color: #1e293b; margin: 0 0 5px 0;">City General Hospital</h2>
          <p style="color: #64748b; font-size: 13px; margin: 0;">123 Healthcare Boulevard, Medical District • Tel: +91 9876543210</p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h3 style="color: #2563eb; margin: 0 0 10px 0;">Medical Invoice — ${invoiceNumber}</h3>
          <p style="margin: 3px 0; font-size: 14px; color: #334155;"><strong>Patient Name:</strong> ${patientName}</p>
          <p style="margin: 3px 0; font-size: 14px; color: #334155;"><strong>Date:</strong> ${invoiceDate}</p>
          <p style="margin: 3px 0; font-size: 14px; color: #334155;"><strong>Payment Status:</strong> <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-weight: bold; background-color: ${billing.paymentStatus === "paid" ? "#dcfce7; color: #166534" : "#fef9c3; color: #854d0e"};">${paymentStatus}</span></p>
          ${billing.paymentMethod ? `<p style="margin: 3px 0; font-size: 14px; color: #334155;"><strong>Payment Method:</strong> ${billing.paymentMethod.toUpperCase()}</p>` : ""}
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #f8fafc; border-bottom: 2px solid #cbd5e1; text-align: left;">
              <th style="padding: 10px; font-size: 13px; color: #475569;">#</th>
              <th style="padding: 10px; font-size: 13px; color: #475569;">Description</th>
              <th style="padding: 10px; font-size: 13px; text-align: right; color: #475569;">Cost (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${chargesRows}
          </tbody>
          <tfoot>
            <tr style="font-weight: bold; background-color: #f1f5f9;">
              <td colspan="2" style="padding: 12px; font-size: 15px; color: #0f172a; text-align: right;">Total Amount:</td>
              <td style="padding: 12px; font-size: 15px; color: #2563eb; text-align: right;">₹${totalAmount}</td>
            </tr>
          </tfoot>
        </table>

        <div style="border-top: 1px solid #e2e8f0; padding-top: 15px; font-size: 12px; color: #64748b; text-align: center;">
          <p style="margin: 0 0 5px 0;">Thank you for choosing City General Hospital. We wish you good health!</p>
          <p style="margin: 0;">This is a computer-generated invoice and requires no physical signature.</p>
        </div>
      </div>
    `;

    const info = await transporter.sendMail({
      from: `"City General Hospital" <${process.env.SMTP_FROM || "billing@hospital.com"}>`,
      to: billing.patient.email,
      subject: `Hospital Invoice ${invoiceNumber} - City General Hospital`,
      html: htmlContent,
    });

    let previewUrl = null;
    if (isTest && nodemailer.getTestMessageUrl) {
      previewUrl = nodemailer.getTestMessageUrl(info);
    }

    return res.status(200).json({
      message: `Invoice successfully sent to ${billing.patient.email}`,
      previewUrl,
    });
  } catch (error) {
    console.error("Error sending billing email:", error);
    return res.status(500).json({ message: "Failed to send invoice email: " + error.message });
  }
};

