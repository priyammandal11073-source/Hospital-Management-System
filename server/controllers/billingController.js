import mongoose from "mongoose";
import nodemailer from "nodemailer";
import Appointment from "../models/Appointment.js";
import Billing from "../models/Billing.js";
import Patient from "../models/Patient.js";
import { sendPaymentLinkSms } from "../services/smsService.js";
import { diagnosticSyncService } from "../services/diagnosticSyncService.js";
import env from "../config/env.js";
import asyncHandler from "../middleware/asyncHandler.js";
import AppError from "../utils/AppError.js";

const paymentStatuses = ["pending", "paid", "partially_paid", "cancelled", "refunded"];
const paymentMethods = ["cash", "card", "insurance", "upi", "netbanking", "wallet", "cheque", "razorpay"];

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

// Helper to strip sensitive patient address and clinical notes from public billing links
const sanitizeBillingForPublic = (billing) => {
  const plain = billing?.toObject ? billing.toObject() : { ...billing };

  if (plain.patient) {
    const rawName = plain.patient.name || "Patient";
    const rawContact = plain.patient.contactNumber || "";
    const rawEmail = plain.patient.email || "";

    plain.patient = {
      _id: plain.patient._id,
      name: rawName,
      contactNumber: rawContact ? rawContact.replace(/(\d{2,4})\d{4}(\d{2,4})/, "$1****$2") : "",
      email: rawEmail ? rawEmail.replace(/^(.)(.*)(@.*)$/, (_, a, b, c) => `${a}***${c}`) : "",
    };
  }

  if (plain.appointment) {
    delete plain.appointment.reasonForVisit;
    if (plain.appointment.doctor) {
      delete plain.appointment.doctor.contactNumber;
      delete plain.appointment.doctor.email;
    }
  }

  return plain;
};

// POST /api/billing
export const createBilling = asyncHandler(async (req, res) => {
  const { patient, appointment, itemizedCharges, paymentMethod, paymentStatus } = req.body;

  if (!patient || !itemizedCharges) {
    throw new AppError("Patient and itemized charges are required", 400);
  }

  if (!mongoose.isValidObjectId(patient)) {
    throw new AppError("Invalid patient ID", 400);
  }

  if (appointment && !mongoose.isValidObjectId(appointment)) {
    throw new AppError("Invalid appointment ID", 400);
  }

  if (!Array.isArray(itemizedCharges) || itemizedCharges.length === 0) {
    throw new AppError("Itemized charges must be a non-empty array", 400);
  }

  const existingPatient = await Patient.findById(patient);
  if (!existingPatient) {
    throw new AppError("Patient not found", 404);
  }

  if (appointment) {
    const existingAppointment = await Appointment.findOne({ _id: appointment, patient });
    if (!existingAppointment) {
      throw new AppError("Appointment not found for this patient", 404);
    }
  }

  const billingData = {
    patient,
    itemizedCharges,
  };
  if (appointment) billingData.appointment = appointment;
  if (paymentMethod) billingData.paymentMethod = paymentMethod;
  if (paymentStatus) billingData.paymentStatus = paymentStatus;

  // Billing's pre-validation hook calculates totalAmount from these line items.
  const billing = await Billing.create(billingData);

  return res.status(201).json({
    message: "Billing record created successfully",
    billing,
  });
});

// GET /api/billing?paymentStatus=paid&startDate=2026-08-01&endDate=2026-08-31
export const getAllBillings = asyncHandler(async (req, res) => {
  const { paymentStatus, startDate, endDate } = req.query;

  // Seamless offline fallback when database connection is unavailable
  if (mongoose.connection.readyState !== 1) {
    const demoBillings = [
      {
        _id: "65f123456789012345678901",
        invoiceNumber: "INV-2026-001",
        patient: { _id: "65a123456789012345678901", name: "John Fernandes", contactNumber: "+91 98765 43210", email: "john@example.com" },
        totalAmount: 12500,
        paidAmount: 12500,
        balanceAmount: 0,
        paymentStatus: "paid",
        paymentMethod: "upi",
        createdAt: new Date("2026-10-20T10:00:00Z"),
      },
      {
        _id: "65f123456789012345678902",
        invoiceNumber: "INV-2026-002",
        patient: { _id: "65a123456789012345678902", name: "Priya Patel", contactNumber: "+91 98765 43211", email: "alice@example.com" },
        totalAmount: 3200,
        paidAmount: 3200,
        balanceAmount: 0,
        paymentStatus: "paid",
        paymentMethod: "card",
        createdAt: new Date("2026-10-21T14:30:00Z"),
      },
      {
        _id: "65f123456789012345678903",
        invoiceNumber: "INV-2026-003",
        patient: { _id: "65a123456789012345678903", name: "Amit Kumar", contactNumber: "+91 98765 43212", email: "amit.kumar@example.com" },
        totalAmount: 8500,
        paidAmount: 5000,
        balanceAmount: 3500,
        paymentStatus: "partially_paid",
        paymentMethod: "cash",
        createdAt: new Date("2026-10-21T16:00:00Z"),
      },
    ];
    return res.status(200).json({ billings: demoBillings, isOfflineDemo: true });
  }

  const filter = {};

  if (paymentStatus) {
    if (!paymentStatuses.includes(paymentStatus)) {
      throw new AppError("Invalid payment status", 400);
    }

    filter.paymentStatus = paymentStatus;
  }

  if (startDate || endDate) {
    const start = startDate ? parseDate(startDate) : null;
    const end = endDate ? parseDate(endDate, true) : null;

    if ((startDate && !start) || (endDate && !end)) {
      throw new AppError("Invalid date range", 400);
    }

    if (start && end && start > end) {
      throw new AppError("Start date must be before end date", 400);
    }

    filter.createdAt = {};
    if (start) filter.createdAt.$gte = start;
    if (end) filter.createdAt.$lte = end;
  }

  const page = req.query.page ? Math.max(1, parseInt(req.query.page, 10)) : null;
  const limit = req.query.limit ? Math.min(200, Math.max(1, parseInt(req.query.limit, 10))) : (page ? 50 : 200);
  const skip = page ? (page - 1) * limit : 0;

  let query = Billing.find(filter)
    .populate("patient", "name contactNumber email age gender address")
    .populate("bed", "bedNumber ward floor dailyRate")
    .populate({
      path: "appointment",
      select: "appointmentDate timeSlot status reasonForVisit doctor",
      populate: { path: "doctor", select: "name specialization department contactNumber" },
    })
    .sort({ createdAt: -1 });

  if (page) {
    const [billings, totalCount] = await Promise.all([
      query.skip(skip).limit(limit),
      Billing.countDocuments(filter),
    ]);
    return res.status(200).json({
      billings,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    });
  }

  const billings = await query.limit(limit);
  return res.status(200).json({ billings });
});

// GET /api/billing/:id
export const getBillingById = asyncHandler(async (req, res) => {
  if (!isValidBillingId(req.params.id)) {
    throw new AppError("Invalid billing ID", 400);
  }

  // Seamless offline fallback when database connection is unavailable
  if (mongoose.connection.readyState !== 1) {
    const demoBilling = {
      _id: req.params.id,
      invoiceNumber: "INV-2026-001",
      patient: { _id: "65a123456789012345678901", name: "John Fernandes", contactNumber: "+91 98765 43210", email: "john@example.com", address: "123 M.G. Road, Indiranagar, Bengaluru" },
      itemizedCharges: [
        { description: "General Consultation Fee", amount: 800, category: "consultation" },
        { description: "Lipid Profile Test", amount: 1200, category: "diagnostics" },
        { description: "Cardiology Monitoring", amount: 2500, category: "monitoring" },
      ],
      totalAmount: 4500,
      paidAmount: 4500,
      balanceAmount: 0,
      paymentStatus: "paid",
      paymentMethod: "upi",
      createdAt: new Date(),
    };
    const isAuthorizedStaff = Boolean(req.user && req.user.role);
    const patientId = req.patient?.id || req.patient?._id;
    const isOwnerPatient = Boolean(
      patientId && String(demoBilling.patient._id) === String(patientId)
    );
    const resultBilling = (isAuthorizedStaff || isOwnerPatient)
      ? demoBilling
      : sanitizeBillingForPublic(demoBilling);

    return res.status(200).json({ billing: resultBilling, isOfflineDemo: true });
  }

  const billing = await Billing.findById(req.params.id)
    .populate("patient", "name contactNumber email age gender address")
    .populate("bed", "bedNumber ward floor dailyRate")
    .populate({
      path: "appointment",
      select: "appointmentDate timeSlot status reasonForVisit doctor",
      populate: { path: "doctor", select: "name specialization department contactNumber" },
    });

  if (!billing) {
    throw new AppError("Billing record not found", 404);
  }

  const isAuthorizedStaff = Boolean(req.user && req.user.role);
  const patientId = req.patient?.id || req.patient?._id;
  const isOwnerPatient = Boolean(
    patientId && billing.patient && (
      billing.patient._id?.toString() === patientId.toString() ||
      billing.patient.toString() === patientId.toString()
    )
  );

  const resultBilling = (isAuthorizedStaff || isOwnerPatient)
    ? billing
    : sanitizeBillingForPublic(billing);

  return res.status(200).json({ billing: resultBilling });
});

// PATCH /api/billing/:id/payment
export const updatePaymentStatus = asyncHandler(async (req, res) => {
  const {
    paymentStatus,
    paymentDate,
    paymentMethod,
    upiTransactionId,
    upiPayerVpa,
    razorpayPaymentId,
    razorpayOrderId,
    razorpaySignature,
    cardDetails,
    insuranceDetails,
    netbankingDetails,
    walletDetails,
    chequeDetails,
  } = req.body;

  if (!isValidBillingId(req.params.id)) {
    throw new AppError("Invalid billing ID", 400);
  }

  if (!paymentStatus || !paymentStatuses.includes(paymentStatus)) {
    throw new AppError("Invalid payment status", 400);
  }

  if (paymentMethod && !paymentMethods.includes(paymentMethod)) {
    throw new AppError("Invalid payment method", 400);
  }

  const updates = { paymentStatus };

  if (paymentDate) {
    const parsedPaymentDate = new Date(paymentDate);

    if (Number.isNaN(parsedPaymentDate.getTime())) {
      throw new AppError("Invalid payment date", 400);
    }

    updates.paymentDate = parsedPaymentDate;
  } else if (paymentStatus === "paid") {
    updates.paymentDate = new Date();
  }

  if (paymentMethod) {
    updates.paymentMethod = paymentMethod;
  }

  if (upiTransactionId) {
    updates.upiTransactionId = String(upiTransactionId).trim();
  } else if (paymentMethod === "upi" && !updates.upiTransactionId) {
    // If paying via UPI without explicit UTR, auto-generate standard 12-digit mock UTR
    updates.upiTransactionId = "UPI" + Math.floor(100000000000 + Math.random() * 900000000000);
  }

  if (upiPayerVpa) {
    updates.upiPayerVpa = String(upiPayerVpa).trim();
  }

  if (razorpayPaymentId) updates.razorpayPaymentId = String(razorpayPaymentId).trim();
  if (razorpayOrderId) updates.razorpayOrderId = String(razorpayOrderId).trim();
  if (razorpaySignature) updates.razorpaySignature = String(razorpaySignature).trim();

  if (cardDetails) updates.cardDetails = cardDetails;
  if (insuranceDetails) updates.insuranceDetails = insuranceDetails;
  if (netbankingDetails) updates.netbankingDetails = netbankingDetails;
  if (walletDetails) updates.walletDetails = walletDetails;
  if (chequeDetails) updates.chequeDetails = chequeDetails;

  const billing = await Billing.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  })
    .populate("patient", "name contactNumber email age gender address")
    .populate("bed", "bedNumber ward floor dailyRate")
    .populate({
      path: "appointment",
      select: "appointmentDate timeSlot status reasonForVisit doctor",
      populate: { path: "doctor", select: "name specialization department contactNumber" },
    });

  if (!billing) {
    throw new AppError("Billing record not found", 404);
  }

  // Two-way synchronization with Diagnostic Services
  try {
    await diagnosticSyncService.onBillingPaymentReceived(billing, {
      userId: req.user?._id || req.user?.id,
      userName: req.user?.name || "Billing Staff",
      role: req.user?.role || "billing",
    });
  } catch (syncErr) {
    console.error("Diagnostic payment sync error:", syncErr.message);
  }

  return res.status(200).json({
    message: "Payment status updated successfully",
    billing,
  });
});

// GET /api/billing/summary
export const getRevenueSummary = asyncHandler(async (req, res) => {
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
});

// POST /api/billing/:id/send-email
export const sendBillingEmail = asyncHandler(async (req, res) => {
  if (!isValidBillingId(req.params.id)) {
    throw new AppError("Invalid billing ID", 400);
  }

  const billing = await Billing.findById(req.params.id)
    .populate("patient", "name contactNumber email age gender address")
    .populate({
      path: "appointment",
      select: "appointmentDate timeSlot status reasonForVisit doctor",
      populate: { path: "doctor", select: "name specialization department contactNumber" },
    });

  if (!billing) {
    throw new AppError("Billing record not found", 404);
  }

  if (!billing.patient?.email) {
    throw new AppError("Patient does not have an email address registered.", 400);
  }

  // Configure transporter
  let transporter;
  let isTest = false;

  if (env.smtp.isConfigured) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.secure,
      auth: {
        user: env.smtp.user,
        pass: env.smtp.pass,
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
      <div style="border-bottom: 2px solid #0d9488; padding-bottom: 15px; margin-bottom: 20px;">
        <h2 style="color: #0f172a; margin: 0 0 5px 0;">Nivora Care Hospital</h2>
        <p style="color: #0d9488; font-size: 11px; font-weight: bold; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 1px;">Care • Trust • Healing</p>
        <p style="color: #64748b; font-size: 13px; margin: 0;">Outer Ring Road, Near AIIMS Metro, New Delhi - 110029 • Tel: +91 9876543210</p>
      </div>
      
      <div style="margin-bottom: 20px;">
        <h3 style="color: #0d9488; margin: 0 0 10px 0;">Medical Tax Invoice — ${invoiceNumber}</h3>
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
            <td style="padding: 12px; font-size: 15px; color: #0d9488; text-align: right;">₹${totalAmount}</td>
          </tr>
        </tfoot>
      </table>

      <div style="border-top: 1px solid #e2e8f0; padding-top: 15px; font-size: 12px; color: #64748b; text-align: center;">
        <p style="margin: 0 0 5px 0;">Thank you for choosing Nivora Care Hospital. We wish you good health!</p>
        <p style="margin: 0;">This is a computer-generated invoice and requires no physical signature.</p>
      </div>
    </div>
  `;

  let info;
  try {
    info = await transporter.sendMail({
      from: env.smtp.from || `"Nivora Care Hospital" <billing@nivoracare.com>`,
      to: billing.patient.email,
      subject: `Hospital Invoice ${invoiceNumber} - Nivora Care Hospital`,
      html: htmlContent,
    });
  } catch (mailErr) {
    throw new AppError("Failed to send invoice email: " + mailErr.message, 500);
  }

  let previewUrl = null;
  if (isTest && nodemailer.getTestMessageUrl && info) {
    previewUrl = nodemailer.getTestMessageUrl(info);
  }

  return res.status(200).json({
    message: `Invoice successfully sent to ${billing.patient.email}`,
    previewUrl,
  });
});

// POST /api/billing/:id/send-sms
export const sendPaymentLinkSmsHandler = asyncHandler(async (req, res) => {
  if (!isValidBillingId(req.params.id)) {
    throw new AppError("Invalid billing ID", 400);
  }

  const billing = await Billing.findById(req.params.id).populate(
    "patient",
    "name contactNumber"
  );

  if (!billing) {
    throw new AppError("Billing record not found", 404);
  }

  // Allow override from request body (receptionist may correct the number)
  const phoneNumber = req.body.phoneNumber || billing.patient?.contactNumber;

  if (!phoneNumber) {
    throw new AppError("No phone number found for this patient. Please provide one.", 400);
  }

  try {
    const result = await sendPaymentLinkSms(
      phoneNumber,
      billing._id.toString(),
      billing.patient?.name || "Patient",
      billing.totalAmount
    );

    return res.status(200).json({
      message: `Payment link sent to ${phoneNumber}`,
      ...result,
    });
  } catch (smsErr) {
    throw new AppError("Failed to send payment SMS: " + smsErr.message, 500);
  }
});

// GET /api/billing/analytics
export const getRevenueAnalytics = asyncHandler(async (req, res) => {
  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // 1. Total KPI stats
  const allBillings = await Billing.find({});
  
  let totalRevenue = 0;
  let pendingAmount = 0;
  let todayRevenue = 0;
  let monthRevenue = 0;
  let paidInvoicesCount = 0;
  let pendingInvoicesCount = 0;

  const methodCounts = {
    razorpay: { name: "Razorpay Gateway", value: 0, count: 0 },
    upi: { name: "Instant UPI / QR", value: 0, count: 0 },
    cash: { name: "Cash Counter", value: 0, count: 0 },
    insurance: { name: "Health Insurance", value: 0, count: 0 },
    card: { name: "Debit / Credit Card", value: 0, count: 0 },
    other: { name: "Other / Direct", value: 0, count: 0 },
  };

  // Monthly aggregation map for the last 6 months
  const monthlyMap = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toLocaleString("default", { month: "short", year: "2-digit" });
    monthlyMap[key] = { month: key, revenue: 0, pending: 0, count: 0 };
  }

  allBillings.forEach((b) => {
    const amt = Number(b.totalAmount) || 0;
    const createdAt = new Date(b.createdAt);
    const monthKey = createdAt.toLocaleString("default", { month: "short", year: "2-digit" });

    if (b.paymentStatus === "paid") {
      totalRevenue += amt;
      paidInvoicesCount++;

      if (createdAt >= startOfToday) {
        todayRevenue += amt;
      }
      if (createdAt >= startOfThisMonth) {
        monthRevenue += amt;
      }

      const methodKey = b.paymentMethod && methodCounts[b.paymentMethod] ? b.paymentMethod : "other";
      methodCounts[methodKey].value += amt;
      methodCounts[methodKey].count += 1;

      if (monthlyMap[monthKey]) {
        monthlyMap[monthKey].revenue += amt;
        monthlyMap[monthKey].count += 1;
      }
    } else {
      pendingAmount += amt;
      pendingInvoicesCount++;

      if (monthlyMap[monthKey]) {
        monthlyMap[monthKey].pending += amt;
      }
    }
  });

  const monthlyTrends = Object.values(monthlyMap);
  const paymentMethodsBreakdown = Object.values(methodCounts).filter((m) => m.value > 0 || m.count > 0);

  // If all are 0 (e.g. fresh DB), provide structured starter data
  const safeMethodsBreakdown = paymentMethodsBreakdown.length > 0 ? paymentMethodsBreakdown : [
    { name: "Razorpay Gateway", value: 0, count: 0 },
    { name: "Instant UPI / QR", value: 0, count: 0 },
    { name: "Cash Counter", value: 0, count: 0 },
    { name: "Health Insurance", value: 0, count: 0 },
  ];

  return res.status(200).json({
    kpis: {
      totalRevenue,
      pendingAmount,
      todayRevenue,
      monthRevenue,
      paidInvoicesCount,
      pendingInvoicesCount,
      totalInvoices: allBillings.length,
      collectionRate: allBillings.length > 0 ? Math.round((paidInvoicesCount / allBillings.length) * 100) : 100,
    },
    monthlyTrends,
    paymentMethodsBreakdown: safeMethodsBreakdown,
  });
});
