import mongoose from "mongoose";
import Appointment from "../models/Appointment.js";
import Bed from "../models/Bed.js";
import Billing from "../models/Billing.js";
import Patient from "../models/Patient.js";
import Prescription from "../models/Prescription.js";
import Vitals from "../models/Vitals.js";
import LabReport from "../models/LabReport.js";
import Notification from "../models/Notification.js";
import Doctor from "../models/Doctor.js";
import ClinicalNote from "../models/ClinicalNote.js";
import Referral from "../models/Referral.js";
import Feedback from "../models/Feedback.js";
import DiagnosticReport from "../models/DiagnosticReport.js";
import DiagnosticOrder from "../models/DiagnosticOrder.js";
import { diagnosticSyncService } from "../services/diagnosticSyncService.js";
import env from "../config/env.js";

const OPD_FEE = env.opdFee;

// GET /api/patient-portal/me
export const getMyProfile = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({
        patient: {
          _id: req.patient?.id || "demo_patient_id",
          name: req.patient?.name || "John Doe",
          email: req.patient?.email || "patient@hospital.com",
          contactNumber: "9876543210",
          gender: "Male",
          age: 35,
          bloodGroup: "O+",
          address: "123 Healthcare Blvd, Medical District",
          emergencyContact: {
            name: "Jane Doe",
            relationship: "Spouse",
            contactNumber: "9876543211",
          },
          allergies: ["Penicillin"],
          isOfflineDemo: true,
        },
      });
    }

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
    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({
        appointments: [
          {
            _id: "demo_apt_1",
            doctor: { _id: "doc_1", name: "Dr. Sarah Jenkins", specialization: "Cardiology" },
            appointmentDate: new Date(),
            timeSlot: "10:30 AM",
            status: "confirmed",
            reasonForVisit: "Routine Cardiovascular Evaluation",
          },
        ],
      });
    }

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
    const { doctor, appointmentDate, timeSlot, reasonForVisit, paymentMethod, appointmentType } = req.body;

    if (!doctor || !appointmentDate || !timeSlot || !reasonForVisit) {
      return res.status(400).json({
        message: "Doctor, appointment date, time slot, and reason for visit are required",
      });
    }

    if (!mongoose.isValidObjectId(doctor)) {
      return res.status(400).json({ message: "Invalid doctor ID" });
    }

    const validAppointmentTypes = ["opd", "teleconsultation", "follow_up"];
    const resolvedType = validAppointmentTypes.includes(appointmentType)
      ? appointmentType
      : "opd";

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
      appointmentType: resolvedType,
    });

    // Auto-create an OPD billing record for immediate payment.
    const allowedPaymentMethods = ["cash", "card", "upi", "insurance", "razorpay", "netbanking", "wallet"];
    const resolvedMethod = allowedPaymentMethods.includes(paymentMethod)
      ? paymentMethod
      : "cash";

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
    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({
        billings: [
          {
            _id: "demo_bill_1",
            totalAmount: 500,
            paymentStatus: "paid",
            paymentMethod: "upi",
            itemizedCharges: [{ description: "OPD Consultation Fee", cost: 500 }],
            createdAt: new Date(),
          },
        ],
      });
    }

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
    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({
        prescriptions: [
          {
            _id: "demo_rx_1",
            doctor: { name: "Dr. Sarah Jenkins", specialization: "Cardiology", department: "Cardiology" },
            patient: { name: "John Doe" },
            medications: [
              { name: "Atorvastatin", dosage: "10mg", frequency: "Once daily at bedtime", duration: "30 days" },
            ],
            createdAt: new Date(),
          },
        ],
      });
    }

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
    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({ bedStay: null });
    }

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
    const {
      paymentMethod = "upi",
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

    billing.paymentMethod = paymentMethod;
    billing.paymentDate = new Date();

    if (paymentMethod === "razorpay") {
      const finalRzpId = razorpayPaymentId
        ? String(razorpayPaymentId).trim()
        : "pay_rzp_" + Math.floor(100000000000 + Math.random() * 900000000000);

      billing.paymentStatus = "paid";
      billing.razorpayPaymentId = finalRzpId;
      if (razorpayOrderId) billing.razorpayOrderId = String(razorpayOrderId).trim();
      if (razorpaySignature) billing.razorpaySignature = String(razorpaySignature).trim();
    } else if (paymentMethod === "card") {
      const cardNum = cardDetails?.cardNumber ? String(cardDetails.cardNumber).replace(/\s/g, "") : "";
      const last4 = cardNum ? cardNum.slice(-4) : "4242";
      const brand = cardDetails?.cardBrand || (cardNum.startsWith("4") ? "Visa" : cardNum.startsWith("5") ? "Mastercard" : cardNum.startsWith("6") ? "RuPay" : "Card");
      const ref = "CARD_" + Math.floor(100000000000 + Math.random() * 900000000000);

      billing.paymentStatus = "paid";
      billing.cardDetails = {
        cardLast4: last4,
        cardBrand: brand,
        transactionRef: ref,
      };
    } else if (paymentMethod === "insurance") {
      billing.paymentStatus = "partially_paid";
      billing.insuranceDetails = {
        providerName: insuranceDetails?.providerName || "Health Insurance",
        policyNumber: insuranceDetails?.policyNumber || "",
        claimId: insuranceDetails?.claimId || "CLM" + Math.floor(100000 + Math.random() * 900000),
        insuredMemberName: insuranceDetails?.insuredMemberName || "",
        contactNumber: insuranceDetails?.contactNumber || "",
        notes: insuranceDetails?.notes || "",
        status: "pending_verification",
      };
    } else if (paymentMethod === "netbanking") {
      billing.paymentStatus = "paid";
      billing.netbankingDetails = {
        bankName: netbankingDetails?.bankName || "State Bank of India",
        transactionRef: netbankingDetails?.transactionRef || "NINB" + Math.floor(1000000000 + Math.random() * 9000000000),
      };
    } else if (paymentMethod === "wallet") {
      billing.paymentStatus = "paid";
      billing.walletDetails = {
        walletAccountId: walletDetails?.walletAccountId || "NVR-WLT-" + req.patient.id.slice(-6).toUpperCase(),
        transactionRef: walletDetails?.transactionRef || "WLT_" + Math.floor(100000000 + Math.random() * 900000000),
      };
    } else if (paymentMethod === "cheque") {
      billing.paymentStatus = "partially_paid";
      billing.chequeDetails = {
        chequeNumber: chequeDetails?.chequeNumber || "000123",
        bankName: chequeDetails?.bankName || "HDFC Bank",
        micrCode: chequeDetails?.micrCode || "110240001",
        transactionRef: chequeDetails?.transactionRef || "CHQ_CLR_" + Math.floor(100000 + Math.random() * 900000),
      };
    } else {
      // UPI
      const finalUpiTrxId = upiTransactionId
        ? String(upiTransactionId).trim()
        : "UPI" + Math.floor(100000000000 + Math.random() * 900000000000);

      billing.paymentStatus = "paid";
      billing.upiTransactionId = finalUpiTrxId;
      if (upiPayerVpa) {
        billing.upiPayerVpa = String(upiPayerVpa).trim();
      }
    }

    await billing.save();

    // Two-way synchronization with Diagnostic Services
    try {
      await diagnosticSyncService.onBillingPaymentReceived(billing, {
        userId: req.patient?.id,
        userName: req.patient?.name || "Patient",
        role: "patient",
      });
    } catch (syncErr) {
      console.error("Patient portal diagnostic payment sync error:", syncErr.message);
    }

    const populatedBilling = await Billing.findById(billing._id)
      .populate("patient", "name contactNumber email age gender address")
      .populate("bed", "bedNumber ward floor dailyRate")
      .populate({
        path: "appointment",
        select: "appointmentDate timeSlot status reasonForVisit doctor",
        populate: { path: "doctor", select: "name specialization department contactNumber" },
      });

    return res.status(200).json({
      message:
        paymentMethod === "card"
          ? "Online Card payment processed successfully!"
          : paymentMethod === "insurance"
          ? "Insurance claim details submitted successfully. Desk verification in progress."
          : paymentMethod === "netbanking"
          ? "Net Banking payment processed successfully!"
          : paymentMethod === "wallet"
          ? "Paid using Hospital Advance Deposit Wallet!"
          : paymentMethod === "cheque"
          ? "Cheque / DD details recorded. Pending bank clearing."
          : "UPI payment received and invoice marked as paid!",
      billing: populatedBilling,
    });
  } catch (error) {
    console.error("Error processing online payment:", error);
    return res.status(500).json({ message: "Unable to complete payment" });
  }
};

// ── PATIENT VITALS ──────────────────────────────────────────────────────────
// GET /api/patient-portal/vitals
export const getMyVitals = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({
        vitals: [
          {
            _id: "demo_vit_1",
            bloodPressureSys: 120,
            bloodPressureDia: 80,
            bloodSugar: 95,
            heartRate: 72,
            temperature: 98.6,
            spo2: 99,
            recordedAt: new Date(),
          },
        ],
      });
    }

    const vitals = await Vitals.find({ patient: req.patient.id }).sort({ recordedAt: -1 });
    return res.status(200).json({ vitals });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch vitals records" });
  }
};

// POST /api/patient-portal/vitals
export const recordMyVitals = async (req, res) => {
  try {
    const {
      bloodPressureSys,
      bloodPressureDia,
      bloodSugar,
      sugarType,
      weight,
      height,
      heartRate,
      temperature,
      spo2,
      notes,
    } = req.body;

    const patientObj = await Patient.findById(req.patient.id);

    const vitals = await Vitals.create({
      patient: req.patient.id,
      recordedBy: "patient",
      recorderName: patientObj?.name || "Patient Self-Logged",
      bloodPressureSys: bloodPressureSys ? Number(bloodPressureSys) : undefined,
      bloodPressureDia: bloodPressureDia ? Number(bloodPressureDia) : undefined,
      bloodSugar: bloodSugar ? Number(bloodSugar) : undefined,
      sugarType,
      weight: weight ? Number(weight) : undefined,
      height: height ? Number(height) : undefined,
      heartRate: heartRate ? Number(heartRate) : undefined,
      temperature: temperature ? Number(temperature) : undefined,
      spo2: spo2 ? Number(spo2) : undefined,
      notes,
    });

    return res.status(201).json({
      message: "Vitals logged successfully",
      vitals,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Unable to log vitals" });
  }
};

// ── PATIENT LAB REPORTS ─────────────────────────────────────────────────────
// GET /api/patient-portal/lab-reports
export const getMyLabReports = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({
        reports: [
          {
            _id: "demo_lab_1",
            testName: "Complete Blood Count (CBC)",
            category: "Hematology",
            status: "completed",
            testDate: new Date(),
            doctor: { name: "Dr. Emily Zhang", specialization: "Pathology" },
            summary: "All parameters within normal reference ranges.",
          },
        ],
      });
    }

    const [reports, diagReports] = await Promise.all([
      LabReport.find({
        patient: req.patient.id,
        isSharedWithPatient: true,
      })
        .populate("doctor", "name specialization department")
        .sort({ createdAt: -1 }),
      DiagnosticReport.find({
        patient: req.patient.id,
        status: { $in: ["Finalized", "Approved"] },
      }).sort({ createdAt: -1 }),
    ]);

    const formattedDiagReports = diagReports.map((dr) => ({
      _id: dr._id,
      reportNumber: dr.reportNumber,
      testName: dr.testName,
      category: dr.category || dr.department,
      status: "completed",
      testDate: dr.reportDate || dr.createdAt,
      doctor: { name: dr.doctorName || dr.specialistName || "Consultant" },
      summaryConclusion: dr.summaryConclusion,
      attachmentUrl: dr.attachedFiles?.[0]?.secureUrl,
      attachmentName: dr.attachedFiles?.[0]?.originalName,
      isDiagnosticReport: true,
      department: dr.department,
      testResults: dr.testResults,
      radiologyStudy: dr.radiologyStudy,
      digitalSignature: dr.digitalSignature,
    }));

    const combinedReports = [...formattedDiagReports, ...reports];

    return res.status(200).json({ reports: combinedReports });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch lab reports" });
  }
};

// GET /api/patient-portal/lab-reports/:id
export const getMyLabReportById = async (req, res) => {
  try {
    const report = await LabReport.findOne({
      _id: req.params.id,
      patient: req.patient.id,
      isSharedWithPatient: true,
    }).populate("doctor", "name specialization department");

    if (report) {
      return res.status(200).json({ report });
    }

    // Check DiagnosticReport
    const diagReport = await DiagnosticReport.findOne({
      _id: req.params.id,
      patient: req.patient.id,
      status: { $in: ["Finalized", "Approved"] },
    });

    if (!diagReport) {
      return res.status(404).json({ message: "Lab report not found or not shared" });
    }

    return res.status(200).json({ report: diagReport });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch lab report" });
  }
};

// ── PATIENT NOTIFICATIONS ───────────────────────────────────────────────────
// GET /api/patient-portal/notifications
export const getMyPatientNotifications = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({
        notifications: [
          {
            _id: "demo_notif_1",
            title: "Welcome to Nivora Care Health Hub",
            message: "Your patient health record has been initialized.",
            isRead: false,
            createdAt: new Date(),
          },
        ],
        unreadCount: 1,
      });
    }

    const filter = {
      $or: [{ recipientType: "patient", patient: req.patient.id }, { recipientType: "all" }],
    };

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(30);

    const unreadCount = await Notification.countDocuments({ ...filter, isRead: false });

    return res.status(200).json({ notifications, unreadCount });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch notifications" });
  }
};

// PATCH /api/patient-portal/notifications/:id/read
export const markMyNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        $or: [{ patient: req.patient.id }, { recipientType: "all" }],
      },
      { isRead: true },
      { new: true }
    );

    return res.status(200).json({ notification });
  } catch (error) {
    return res.status(500).json({ message: "Unable to update notification" });
  }
};

// PATCH /api/patient-portal/notifications/read-all
export const markAllMyNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      {
        $or: [{ recipientType: "patient", patient: req.patient.id }, { recipientType: "all" }],
        isRead: false,
      },
      { isRead: true }
    );

    return res.status(200).json({ message: "All notifications marked as read" });
  } catch (error) {
    return res.status(500).json({ message: "Unable to mark notifications as read" });
  }
};

// ── PATIENT HEALTH HUB / DASHBOARD SUMMARY ──────────────────────────────────
// GET /api/patient-portal/dashboard
export const getPatientDashboardSummary = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const demoPatient = {
        _id: req.patient?.id || "demo_patient_id",
        name: req.patient?.name || "John Doe",
        email: req.patient?.email || "patient@hospital.com",
        contactNumber: "9876543210",
        bloodGroup: "O+",
        allergies: ["Penicillin"],
      };

      const demoNextAppt = {
        _id: "demo_next_apt",
        appointmentDate: new Date(Date.now() + 24 * 3600 * 1000),
        timeSlot: "10:30 AM",
        doctor: {
          name: "Dr. Sarah Jenkins",
          specialization: "Cardiology",
          department: "Cardiology",
          consultationFee: 500,
        },
        status: "confirmed",
      };

      const demoLatestPrescription = {
        _id: "demo_rx_1",
        doctor: { name: "Dr. Sarah Jenkins", specialization: "Cardiology" },
        medications: [{ name: "Atorvastatin", dosage: "10mg", frequency: "Daily" }],
        createdAt: new Date(),
      };

      const demoLatestLab = {
        _id: "demo_lab_1",
        testName: "Lipid Profile",
        status: "completed",
        testDate: new Date(),
        doctor: { name: "Dr. Emily Zhang" },
      };

      return res.status(200).json({
        success: true,
        profile: demoPatient,
        stats: {
          upcomingAppointments: 1,
          completedConsultations: 3,
          activePrescriptions: 1,
          labReportsCount: 2,
          pendingBills: 0,
          pendingAmount: 0,
          unreadNotifications: 1,
        },
        metrics: {
          upcomingVisits: 1,
          completedVisits: 3,
          activePrescriptions: 1,
          pendingLabReports: 0,
          outstandingBillsCount: 0,
          outstandingBillsAmount: 0,
          unreadNotifications: 1,
        },
        nextAppointment: demoNextAppt,
        activePrescription: demoLatestPrescription,
        latestPrescription: demoLatestPrescription,
        latestLabReport: demoLatestLab,
        activeBedStay: null,
        bedStay: null,
        upcomingDiagnostics: [],
        recentConsultation: null,
        latestVitals: {
          bloodPressure: "120/80",
          heartRate: 72,
          temperature: 98.6,
          spO2: 99,
          recordedAt: new Date(),
        },
        alerts: [
          {
            type: "allergy",
            severity: "warning",
            title: "Allergy Alert",
            message: "Registered allergies: Penicillin. Always notify hospital care teams.",
          },
        ],
        isOfflineDemo: true,
      });
    }

    const patientId = req.patient.id;
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const [
      patient,
      upcomingAppointments,
      completedCount,
      activePrescriptionsCount,
      pendingLabsCount,
      billings,
      unreadNotifications,
      nextAppointment,
      recentConsultation,
      latestPrescription,
      latestLabReport,
      bedStay,
      latestVitals,
      upcomingDiagnostics,
    ] = await Promise.all([
      Patient.findById(patientId).select("-password"),
      Appointment.countDocuments({
        patient: patientId,
        status: { $in: ["pending", "confirmed", "waiting", "in_consultation"] },
        appointmentDate: { $gte: today },
      }),
      Appointment.countDocuments({
        patient: patientId,
        status: "completed",
      }),
      Prescription.countDocuments({
        patient: patientId,
        status: { $ne: "Discontinued" },
      }),
      LabReport.countDocuments({
        patient: patientId,
        status: { $ne: "completed" },
        isSharedWithPatient: true,
      }),
      Billing.find({ patient: patientId }),
      Notification.countDocuments({
        $or: [{ recipientType: "patient", patient: patientId }, { recipientType: "all" }],
        isRead: false,
      }),
      Appointment.findOne({
        patient: patientId,
        status: { $in: ["pending", "confirmed", "waiting", "in_consultation"] },
        appointmentDate: { $gte: today },
      })
        .sort({ appointmentDate: 1, timeSlot: 1 })
        .populate("doctor", "name specialization department contactNumber email consultationFee"),
      Appointment.findOne({
        patient: patientId,
        status: "completed",
      })
        .sort({ appointmentDate: -1 })
        .populate("doctor", "name specialization department"),
      Prescription.findOne({ patient: patientId })
        .sort({ createdAt: -1 })
        .populate("doctor", "name specialization department"),
      LabReport.findOne({ patient: patientId, isSharedWithPatient: true })
        .sort({ testDate: -1, createdAt: -1 })
        .populate("doctor", "name specialization department"),
      Bed.findOne({
        "currentAdmission.patient": patientId,
        status: "occupied",
      }).populate("currentAdmission.attendingDoctor", "name specialization department contactNumber"),
      Vitals.findOne({ patient: patientId }).sort({ recordedAt: -1 }),
      DiagnosticOrder.find({
        patient: patientId,
        status: { $in: ["Requested", "Scheduled", "Patient Ready", "In Progress", "Procedure Started", "Sample Collected"] },
      }).sort({ scheduledDate: 1, requestedDate: 1 }).limit(10),
    ]);

    const unpaidBills = billings.filter((b) => b.paymentStatus !== "paid");
    const unpaidAmount = unpaidBills.reduce((acc, b) => acc + (b.totalAmount || 0), 0);

    // Active Health Alerts
    const alerts = [];
    if (patient?.allergies && patient.allergies.length > 0) {
      alerts.push({
        type: "allergy",
        severity: "warning",
        title: "Allergy Alert",
        message: `Registered allergies: ${patient.allergies.join(", ")}. Always notify hospital care teams.`,
      });
    }

    if (unpaidBills.length > 0) {
      alerts.push({
        type: "billing",
        severity: "info",
        title: "Pending Invoices",
        message: `You have ${unpaidBills.length} unpaid invoice(s) totaling ₹${unpaidAmount}.`,
      });
    }

    if (nextAppointment) {
      const apptDate = new Date(nextAppointment.appointmentDate);
      const diffHours = (apptDate.getTime() - Date.now()) / (1000 * 60 * 60);
      if (diffHours >= 0 && diffHours <= 48) {
        alerts.push({
          type: "appointment",
          severity: "urgent",
          title: "Upcoming Visit Reminder",
          message: `Consultation with Dr. ${nextAppointment.doctor?.name} scheduled for ${apptDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} at ${nextAppointment.timeSlot}.`,
        });
      }
    }

    // Check if any upcoming diagnostic test has fasting / prep instructions
    upcomingDiagnostics.forEach((dx) => {
      if (dx.preparationInstructions) {
        alerts.push({
          type: "diagnostic_prep",
          severity: "info",
          title: `Preparation for ${dx.testName}`,
          message: `${dx.preparationInstructions} (Scheduled: ${
            dx.scheduledDate ? new Date(dx.scheduledDate).toLocaleDateString() : "Pending"
          } ${dx.scheduledTimeSlot || ""})`,
        });
      }
    });

    return res.status(200).json({
      success: true,
      profile: patient,
      stats: {
        upcomingAppointments,
        completedConsultations: completedCount,
        activePrescriptions: activePrescriptionsCount,
        labReportsCount: pendingLabsCount,
        pendingDiagnosticsCount: upcomingDiagnostics.length,
        pendingBills: unpaidBills.length,
        pendingAmount: unpaidAmount,
        unreadNotifications,
      },
      metrics: {
        upcomingVisits: upcomingAppointments,
        completedVisits: completedCount,
        activePrescriptions: activePrescriptionsCount,
        pendingLabReports: pendingLabsCount,
        pendingDiagnostics: upcomingDiagnostics.length,
        outstandingBillsCount: unpaidBills.length,
        outstandingBillsAmount: unpaidAmount,
        unreadNotifications,
      },
      nextAppointment,
      activePrescription: latestPrescription,
      latestPrescription,
      latestLabReport,
      activeBedStay: bedStay,
      bedStay,
      recentConsultation,
      latestVitals,
      alerts,
      upcomingDiagnostics,
    });
  } catch (error) {
    console.error("Dashboard summary error:", error);
    return res.status(500).json({ message: "Unable to load patient health hub summary" });
  }
};

// ── RESCHEDULE APPOINTMENT ──────────────────────────────────────────────────
// PATCH /api/patient-portal/appointments/:id/reschedule
export const rescheduleMyAppointment = async (req, res) => {
  try {
    const { id: appointmentId } = req.params;
    const { appointmentDate, timeSlot, reason } = req.body;

    if (!appointmentDate || !timeSlot) {
      return res.status(400).json({ message: "New appointment date and time slot are required" });
    }

    const appointment = await Appointment.findOne({
      _id: appointmentId,
      patient: req.patient.id,
      status: { $in: ["pending", "confirmed"] },
    });

    if (!appointment) {
      return res.status(404).json({
        message: "Appointment not found or is no longer eligible for rescheduling",
      });
    }

    const formattedDate = new Date(appointmentDate);
    if (Number.isNaN(formattedDate.getTime())) {
      return res.status(400).json({ message: "Invalid appointment date format" });
    }
    formattedDate.setUTCHours(0, 0, 0, 0);

    // Verify slot collision for the same doctor
    const collision = await Appointment.findOne({
      _id: { $ne: appointment._id },
      doctor: appointment.doctor,
      appointmentDate: formattedDate,
      timeSlot: timeSlot.trim(),
      status: { $in: ["pending", "confirmed", "waiting", "in_consultation"] },
    });

    if (collision) {
      return res.status(409).json({ message: "Selected time slot is already booked for this doctor" });
    }

    appointment.appointmentDate = formattedDate;
    appointment.timeSlot = timeSlot.trim();
    if (reason) appointment.reasonForVisit = `${appointment.reasonForVisit} [Rescheduled: ${reason}]`;
    appointment.status = "pending"; // Requires station re-confirmation
    await appointment.save();

    const populated = await Appointment.findById(appointment._id).populate(
      "doctor",
      "name specialization department contactNumber email consultationFee"
    );

    // Create confirmation notification
    await Notification.create({
      recipientType: "patient",
      patient: req.patient.id,
      title: "Appointment Rescheduled",
      message: `Your visit with Dr. ${populated.doctor?.name} was rescheduled to ${formattedDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} at ${timeSlot}.`,
      type: "appointment",
      priority: "normal",
      link: "/patient/appointments",
    });

    return res.status(200).json({
      message: "Appointment rescheduled successfully",
      appointment: populated,
    });
  } catch (error) {
    console.error("Reschedule error:", error);
    return res.status(500).json({ message: "Unable to reschedule appointment" });
  }
};

// ── DOCTOR DIRECTORY & PROFILES ─────────────────────────────────────────────
// GET /api/patient-portal/doctors
export const getMyDoctors = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const demoDoctors = [
        {
          _id: "doc_1",
          name: "Dr. Sarah Jenkins",
          specialization: "Cardiology",
          department: "Cardiology",
          contactNumber: "9876543201",
          email: "sarah.jenkins@hospital.com",
          consultationFee: 750,
          availableDays: ["Monday", "Wednesday", "Friday"],
          yearsOfExperience: 12,
        },
        {
          _id: "doc_2",
          name: "Dr. Marcus Vance",
          specialization: "Neurology",
          department: "Neurology",
          contactNumber: "9876543202",
          email: "marcus.vance@hospital.com",
          consultationFee: 900,
          availableDays: ["Tuesday", "Thursday", "Saturday"],
          yearsOfExperience: 15,
        },
      ];
      return res.status(200).json({ success: true, doctors: demoDoctors });
    }

    const { search, department, specialization } = req.query;
    const filter = {};

    if (department && department !== "All") {
      filter.department = department;
    }
    if (specialization && specialization !== "All") {
      filter.specialization = specialization;
    }
    if (search) {
      const regex = new RegExp(search, "i");
      filter.$or = [{ name: regex }, { specialization: regex }, { department: regex }];
    }

    const doctors = await Doctor.find(filter)
      .select("name specialization department contactNumber email availableDays availableTimeSlots weeklySchedule yearsOfExperience consultationFee leaves")
      .sort({ name: 1 });

    return res.status(200).json({ success: true, doctors });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch doctor directory" });
  }
};

// GET /api/patient-portal/doctors/:id
export const getMyDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }
    return res.status(200).json({ success: true, doctor });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch doctor profile" });
  }
};

// ── MEDICAL RECORDS (360 AGGREGATED VIEW) ───────────────────────────────────
// GET /api/patient-portal/records
export const getMyMedicalRecords = async (req, res) => {
  try {
    const patientId = req.patient.id;
    const { category, search } = req.query;

    const [appointments, prescriptions, labReports, clinicalNotes, bedStays] = await Promise.all([
      Appointment.find({ patient: patientId, status: "completed" })
        .populate("doctor", "name specialization department")
        .sort({ appointmentDate: -1 }),
      Prescription.find({ patient: patientId })
        .populate("doctor", "name specialization department")
        .sort({ createdAt: -1 }),
      LabReport.find({ patient: patientId, isSharedWithPatient: true })
        .populate("doctor", "name specialization department")
        .sort({ testDate: -1, createdAt: -1 }),
      ClinicalNote.find({ patient: patientId, isConfidential: false })
        .populate("doctor", "name specialization department")
        .sort({ createdAt: -1 }),
      Bed.find({
        $or: [{ "currentAdmission.patient": patientId }, { "admissionHistory.patient": patientId }],
      }).populate("currentAdmission.attendingDoctor admissionHistory.attendingDoctor", "name specialization department"),
    ]);

    const records = [];

    // Map completed consultations
    appointments.forEach((a) => {
      records.push({
        id: a._id,
        recordType: "Consultation",
        date: a.appointmentDate,
        doctor: a.doctor?.name || "Consultant",
        department: a.doctor?.department || "General OPD",
        title: `Consultation: ${a.doctor?.specialization || "General"}`,
        summary: a.diagnosis || a.reasonForVisit || "Completed consultation visit",
        details: {
          diagnosis: a.diagnosis,
          clinicalSummary: a.clinicalSummary,
          followUpDate: a.followUpDate,
          followUpInstructions: a.followUpInstructions,
          reasonForVisit: a.reasonForVisit,
          timeSlot: a.timeSlot,
        },
      });
    });

    // Map prescriptions
    prescriptions.forEach((p) => {
      const medNames = (p.medications || []).map((m) => m.name).join(", ");
      records.push({
        id: p._id,
        recordType: "Prescription",
        date: p.createdAt,
        doctor: p.doctor?.name || "Physician",
        department: p.doctor?.department || "Clinical Care",
        title: `Prescription (${p.medications?.length || 0} medicines)`,
        summary: medNames || "Prescribed medication schedule",
        details: {
          medications: p.medications,
          diagnosis: p.diagnosis,
          notes: p.notes,
          status: p.status,
        },
      });
    });

    // Map lab reports
    labReports.forEach((l) => {
      records.push({
        id: l._id,
        recordType: "Lab Report",
        date: l.testDate || l.createdAt,
        doctor: l.doctor?.name || "Pathologist",
        department: l.category || "Diagnostic Laboratory",
        title: l.testName,
        summary: l.summary || `Status: ${l.status}. Results verified.`,
        details: {
          reportNumber: l.reportNumber,
          category: l.category,
          status: l.status,
          results: l.results,
          isCritical: l.isCritical,
          summary: l.summary,
        },
      });
    });

    // Map non-confidential clinical notes
    clinicalNotes.forEach((n) => {
      records.push({
        id: n._id,
        recordType: "Clinical Note",
        date: n.createdAt,
        doctor: n.doctorName || n.doctor?.name || "Attending Doctor",
        department: n.doctor?.department || "Clinical Department",
        title: `${n.noteType} Note`,
        summary: n.assessment || n.diagnosis || n.chiefComplaint || "Clinical assessment note",
        details: {
          chiefComplaint: n.chiefComplaint,
          examination: n.examination,
          assessment: n.assessment,
          diagnosis: n.diagnosis,
          treatmentPlan: n.treatmentPlan,
          followUpInstructions: n.followUpInstructions,
        },
      });
    });

    // Map admissions
    bedStays.forEach((b) => {
      if (b.currentAdmission && b.currentAdmission.patient?.toString() === patientId.toString()) {
        records.push({
          id: b._id,
          recordType: "Admission",
          date: b.currentAdmission.admittedAt,
          doctor: b.currentAdmission.attendingDoctor?.name || "Inpatient Attending",
          department: b.ward,
          title: `Active Inpatient Stay (${b.bedNumber})`,
          summary: `Admitted for: ${b.currentAdmission.admissionReason || "Inpatient Care"}`,
          details: {
            bedNumber: b.bedNumber,
            ward: b.ward,
            floor: b.floor,
            status: "Admitted",
            admittedAt: b.currentAdmission.admittedAt,
            reason: b.currentAdmission.admissionReason,
          },
        });
      }

      (b.admissionHistory || []).forEach((hist) => {
        if (hist.patient?.toString() === patientId.toString()) {
          records.push({
            id: hist._id,
            recordType: "Discharge",
            date: hist.dischargedAt || hist.admittedAt,
            doctor: hist.attendingDoctor?.name || "Attending Physician",
            department: b.ward,
            title: `Hospital Discharge: Ward ${b.ward}`,
            summary: hist.dischargeSummary || `Stay duration: ${hist.totalDays || 1} day(s)`,
            details: {
              bedNumber: b.bedNumber,
              ward: b.ward,
              admittedAt: hist.admittedAt,
              dischargedAt: hist.dischargedAt,
              admissionReason: hist.admissionReason,
              dischargeSummary: hist.dischargeSummary,
              totalDays: hist.totalDays,
            },
          });
        }
      });
    });

    // Filter by category if specified
    let filtered = records;
    if (category && category !== "All") {
      filtered = filtered.filter((r) => r.recordType.toLowerCase() === category.toLowerCase());
    }

    // Filter by search text
    if (search && search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.summary.toLowerCase().includes(q) ||
          r.doctor.toLowerCase().includes(q) ||
          r.department.toLowerCase().includes(q)
      );
    }

    // Sort by date descending
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    return res.status(200).json({ success: true, records: filtered });
  } catch (error) {
    console.error("Medical records error:", error);
    return res.status(500).json({ message: "Unable to compile medical records" });
  }
};

// ── MEDICAL TIMELINE ────────────────────────────────────────────────────────
// GET /api/patient-portal/timeline
export const getMyTimeline = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const demoTimeline = [
        {
          id: "tl_1",
          eventType: "Appointment",
          badge: "Consultation Completed",
          icon: "🩺",
          color: "emerald",
          date: new Date(Date.now() - 7 * 86400000),
          doctor: "Dr. Sarah Jenkins",
          department: "Cardiology",
          title: "Consultation with Dr. Sarah Jenkins",
          description: "Routine follow-up and blood pressure monitoring. All parameters stable.",
        },
        {
          id: "tl_2",
          eventType: "Prescription",
          badge: "Prescription Issued",
          icon: "💊",
          color: "indigo",
          date: new Date(Date.now() - 7 * 86400000),
          doctor: "Dr. Sarah Jenkins",
          department: "Cardiology",
          title: "Digital Prescription Issued",
          description: "1 medication prescribed (Atorvastatin 10mg)",
        },
        {
          id: "tl_3",
          eventType: "Lab Report",
          badge: "Report Available",
          icon: "🧪",
          color: "teal",
          date: new Date(Date.now() - 14 * 86400000),
          doctor: "Dr. Emily Zhang",
          department: "Pathology",
          title: "Lipid Profile & HbA1c",
          description: "Cholesterol levels within optimal range.",
        },
      ];
      return res.status(200).json({ success: true, timeline: demoTimeline });
    }

    const patientId = req.patient.id;

    const [appointments, prescriptions, labReports, notes, bedStays] = await Promise.all([
      Appointment.find({ patient: patientId }).populate("doctor", "name specialization department"),
      Prescription.find({ patient: patientId }).populate("doctor", "name specialization department"),
      LabReport.find({ patient: patientId, isSharedWithPatient: true }).populate("doctor", "name specialization department"),
      ClinicalNote.find({ patient: patientId, isConfidential: false }).populate("doctor", "name specialization department"),
      Bed.find({
        $or: [{ "currentAdmission.patient": patientId }, { "admissionHistory.patient": patientId }],
      }).populate("currentAdmission.attendingDoctor admissionHistory.attendingDoctor", "name specialization department"),
    ]);

    const timeline = [];

    appointments.forEach((a) => {
      timeline.push({
        id: a._id,
        eventType: "Appointment",
        badge: a.status === "completed" ? "Consultation Completed" : "Appointment Scheduled",
        icon: "🩺",
        color: a.status === "completed" ? "emerald" : "cyan",
        date: a.appointmentDate,
        doctor: a.doctor?.name || "Physician",
        department: a.doctor?.department || "Outpatient Care",
        title: `Consultation with Dr. ${a.doctor?.name || "Consultant"}`,
        description: a.diagnosis ? `Diagnosis: ${a.diagnosis}` : a.reasonForVisit || "Scheduled Consultation",
      });
    });

    prescriptions.forEach((p) => {
      timeline.push({
        id: p._id,
        eventType: "Prescription",
        badge: "Prescription Issued",
        icon: "💊",
        color: "indigo",
        date: p.createdAt,
        doctor: p.doctor?.name || "Physician",
        department: p.doctor?.department || "Pharmacy",
        title: "Digital Prescription Issued",
        description: `${p.medications?.length || 0} medications prescribed (${(p.medications || []).map((m) => m.name).slice(0, 3).join(", ")})`,
      });
    });

    labReports.forEach((l) => {
      timeline.push({
        id: l._id,
        eventType: "Lab Report",
        badge: l.status === "completed" ? "Report Available" : "Lab Test Ordered",
        icon: "🧪",
        color: l.isCritical ? "rose" : "teal",
        date: l.testDate || l.createdAt,
        doctor: l.doctor?.name || "Pathologist",
        department: l.category || "Laboratory",
        title: l.testName,
        description: l.summary || `Test status: ${l.status}. Results cataloged.`,
      });
    });

    notes.forEach((n) => {
      timeline.push({
        id: n._id,
        eventType: "Clinical Note",
        badge: "Physician Assessment",
        icon: "📋",
        color: "blue",
        date: n.createdAt,
        doctor: n.doctorName || n.doctor?.name || "Doctor",
        department: n.doctor?.department || "Medicine",
        title: `${n.noteType} Record`,
        description: n.assessment || n.treatmentPlan || n.chiefComplaint || "Clinical documentation entry",
      });
    });

    bedStays.forEach((b) => {
      if (b.currentAdmission && b.currentAdmission.patient?.toString() === patientId.toString()) {
        timeline.push({
          id: b._id,
          eventType: "Admission",
          badge: "Ward Admission",
          icon: "🛏️",
          color: "amber",
          date: b.currentAdmission.admittedAt,
          doctor: b.currentAdmission.attendingDoctor?.name || "Inpatient Care",
          department: b.ward,
          title: `Admitted to ${b.ward} (Bed ${b.bedNumber})`,
          description: b.currentAdmission.admissionReason || "Inpatient clinical monitoring",
        });
      }
      (b.admissionHistory || []).forEach((hist) => {
        if (hist.patient?.toString() === patientId.toString()) {
          timeline.push({
            id: hist._id,
            eventType: "Discharge",
            badge: "Patient Discharge",
            icon: "📤",
            color: "emerald",
            date: hist.dischargedAt,
            doctor: hist.attendingDoctor?.name || "Physician",
            department: b.ward,
            title: `Discharged from Ward ${b.ward}`,
            description: hist.dischargeSummary || `Completed inpatient stay (${hist.totalDays || 1} days)`,
          });
        }
      });
    });

    timeline.sort((a, b) => new Date(b.date) - new Date(a.date));

    return res.status(200).json({ success: true, timeline });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch medical timeline" });
  }
};

// ── PATIENT-FRIENDLY ACTIVE MEDICINES ───────────────────────────────────────
// GET /api/patient-portal/medicines
export const getMyActiveMedicines = async (req, res) => {
  try {
    const prescriptions = await Prescription.find({
      patient: req.patient.id,
      status: { $ne: "Discontinued" },
    })
      .populate("doctor", "name specialization department")
      .sort({ createdAt: -1 });

    const medicines = [];

    prescriptions.forEach((p) => {
      (p.medications || []).forEach((m, idx) => {
        // Translate clinical frequency into plain language
        let scheduleText = m.timing || "With meals";
        if (m.frequency === "1-0-1") scheduleText = "Twice daily: Morning & Night";
        else if (m.frequency === "1-1-1") scheduleText = "Thrice daily: Morning, Afternoon & Night";
        else if (m.frequency === "1-0-0") scheduleText = "Once daily: Morning";
        else if (m.frequency === "0-0-1") scheduleText = "Once daily: At bedtime";
        else if (m.frequency === "0-1-0") scheduleText = "Once daily: Afternoon";
        else if (m.frequency?.toLowerCase().includes("sos")) scheduleText = "As needed (SOS)";

        medicines.push({
          id: `${p._id}_${idx}`,
          prescriptionId: p._id,
          name: m.name,
          dosage: m.dosage,
          strength: m.strength || "Standard",
          route: m.route || "Oral",
          frequency: m.frequency,
          timing: m.timing,
          scheduleText,
          duration: m.duration,
          instructions: m.instructions || "Follow prescribed dosage routine",
          prescribingDoctor: p.doctor?.name || "Consulting Physician",
          doctorDepartment: p.doctor?.department || "General Medicine",
          prescribedDate: p.createdAt,
          startDate: m.startDate || p.createdAt,
          endDate: m.endDate,
          status: m.status || p.status || "Active",
        });
      });
    });

    return res.status(200).json({ success: true, medicines });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch active medicines" });
  }
};

// ── CONSULTATION HISTORY & SUMMARY ──────────────────────────────────────────
// GET /api/patient-portal/consultations
export const getMyConsultationHistory = async (req, res) => {
  try {
    const appointments = await Appointment.find({
      patient: req.patient.id,
      status: "completed",
    })
      .populate("doctor", "name specialization department contactNumber email consultationFee")
      .sort({ appointmentDate: -1 });

    return res.status(200).json({ success: true, consultations: appointments });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch consultation history" });
  }
};

// GET /api/patient-portal/consultations/:id
export const getMyConsultationSummary = async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      patient: req.patient.id,
    }).populate("doctor", "name specialization department contactNumber email consultationFee");

    if (!appointment) {
      return res.status(404).json({ message: "Consultation not found" });
    }

    const [prescription, clinicalNotes] = await Promise.all([
      Prescription.findOne({ appointment: appointment._id }).populate("doctor", "name specialization"),
      ClinicalNote.find({
        appointment: appointment._id,
        isConfidential: false,
      }),
    ]);

    return res.status(200).json({
      success: true,
      consultation: appointment,
      prescription,
      notes: clinicalNotes,
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch consultation summary" });
  }
};

// ── FOLLOW-UP APPOINTMENTS ──────────────────────────────────────────────────
// GET /api/patient-portal/follow-ups
export const getMyFollowUps = async (req, res) => {
  try {
    const appointmentsWithFollowUp = await Appointment.find({
      patient: req.patient.id,
      followUpDate: { $exists: true, $ne: null },
    })
      .populate("doctor", "name specialization department consultationFee")
      .sort({ followUpDate: 1 });

    const followUps = appointmentsWithFollowUp.map((a) => ({
      id: a._id,
      doctor: a.doctor,
      department: a.doctor?.department || "General",
      followUpDate: a.followUpDate,
      reason: a.diagnosis || a.reasonForVisit || "Routine Follow-up",
      instructions: a.followUpInstructions || "Post-consultation evaluation",
      previousAppointmentDate: a.appointmentDate,
      isScheduled: false,
    }));

    return res.status(200).json({ success: true, followUps });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch follow-ups" });
  }
};

// ── SPECIALIST REFERRALS ────────────────────────────────────────────────────
// GET /api/patient-portal/referrals
export const getMyReferrals = async (req, res) => {
  try {
    const referrals = await Referral.find({ patient: req.patient.id })
      .populate("referringDoctor", "name specialization department")
      .populate("specialistDoctor", "name specialization department consultationFee availableDays")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, referrals });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch referrals" });
  }
};

// ── INPATIENT ADMISSIONS ────────────────────────────────────────────────────
// GET /api/patient-portal/admissions
export const getMyAdmissions = async (req, res) => {
  try {
    const patientId = req.patient.id;

    const [currentStay, historyBeds] = await Promise.all([
      Bed.findOne({
        "currentAdmission.patient": patientId,
        status: "occupied",
      }).populate("currentAdmission.attendingDoctor", "name specialization department contactNumber"),
      Bed.find({
        "admissionHistory.patient": patientId,
      }).populate("admissionHistory.attendingDoctor", "name specialization department"),
    ]);

    const pastAdmissions = [];
    historyBeds.forEach((b) => {
      (b.admissionHistory || []).forEach((hist) => {
        if (hist.patient?.toString() === patientId.toString()) {
          pastAdmissions.push({
            id: hist._id,
            ward: b.ward,
            floor: b.floor,
            bedNumber: b.bedNumber,
            admittedAt: hist.admittedAt,
            dischargedAt: hist.dischargedAt,
            attendingDoctor: hist.attendingDoctor,
            admissionReason: hist.admissionReason,
            dischargeSummary: hist.dischargeSummary,
            totalDays: hist.totalDays,
            totalBedCost: hist.totalBedCost,
            status: "Discharged",
          });
        }
      });
    });

    return res.status(200).json({
      success: true,
      currentAdmission: currentStay
        ? {
            bedId: currentStay._id,
            ward: currentStay.ward,
            floor: currentStay.floor,
            bedNumber: currentStay.bedNumber,
            dailyRate: currentStay.dailyRate,
            admittedAt: currentStay.currentAdmission?.admittedAt,
            admissionReason: currentStay.currentAdmission?.admissionReason,
            attendingDoctor: currentStay.currentAdmission?.attendingDoctor,
            status: "Admitted",
          }
        : null,
      pastAdmissions,
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch admission history" });
  }
};

// ── MY DOCUMENTS CATALOG ────────────────────────────────────────────────────
// GET /api/patient-portal/documents
export const getMyDocuments = async (req, res) => {
  try {
    const patientId = req.patient.id;

    const [prescriptions, labReports, billings, beds] = await Promise.all([
      Prescription.find({ patient: patientId }).populate("doctor", "name specialization department"),
      LabReport.find({ patient: patientId, isSharedWithPatient: true }).populate("doctor", "name specialization department"),
      Billing.find({ patient: patientId, paymentStatus: "paid" }),
      Bed.find({ "admissionHistory.patient": patientId }).populate("admissionHistory.attendingDoctor", "name specialization department"),
    ]);

    const documents = [];

    prescriptions.forEach((p) => {
      documents.push({
        id: p._id,
        type: "Prescription",
        title: `Digital Prescription (Dr. ${p.doctor?.name || "Consultant"})`,
        date: p.createdAt,
        doctor: p.doctor?.name || "Physician",
        department: p.doctor?.department || "Pharmacy",
        sourceId: p._id,
        downloadable: true,
        summary: `${p.medications?.length || 0} prescribed medications`,
      });
    });

    labReports.forEach((l) => {
      documents.push({
        id: l._id,
        type: "Lab Report",
        title: `Investigation: ${l.testName}`,
        date: l.testDate || l.createdAt,
        doctor: l.doctor?.name || "Pathologist",
        department: l.category || "Diagnostic Laboratory",
        sourceId: l._id,
        downloadable: true,
        summary: `Status: ${l.status}. Verified results catalog.`,
      });
    });

    billings.forEach((b) => {
      documents.push({
        id: b._id,
        type: "Medical Receipt",
        title: `Receipt #${b._id.toString().slice(-8).toUpperCase()}`,
        date: b.paymentDate || b.createdAt,
        doctor: "Hospital Accounts",
        department: "Billing Desk",
        sourceId: b._id,
        downloadable: true,
        summary: `Paid amount: ₹${b.totalAmount} via ${(b.paymentMethod || "UPI").toUpperCase()}`,
      });
    });

    beds.forEach((b) => {
      (b.admissionHistory || []).forEach((hist) => {
        if (hist.patient?.toString() === patientId.toString() && hist.dischargeSummary) {
          documents.push({
            id: hist._id,
            type: "Discharge Summary",
            title: `Discharge Summary - ${b.ward}`,
            date: hist.dischargedAt,
            doctor: hist.attendingDoctor?.name || "Attending Physician",
            department: b.ward,
            sourceId: hist._id,
            downloadable: true,
            summary: hist.dischargeSummary,
          });
        }
      });
    });

    documents.sort((a, b) => new Date(b.date) - new Date(a.date));

    return res.status(200).json({ success: true, documents });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch patient documents" });
  }
};

// ── UPDATE PATIENT PROFILE (SAFE FIELDS) ────────────────────────────────────
// PATCH /api/patient-portal/me
export const updateMyProfile = async (req, res) => {
  try {
    const { contactNumber, address, emergencyContact } = req.body;

    const patient = await Patient.findById(req.patient.id);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    if (contactNumber) patient.contactNumber = String(contactNumber).trim();
    if (address) patient.address = String(address).trim();
    if (emergencyContact) {
      if (typeof emergencyContact === "string") {
        patient.emergencyContact = { name: emergencyContact.trim(), phone: "", relationship: "" };
      } else if (typeof emergencyContact === "object") {
        patient.emergencyContact = {
          name: emergencyContact.name ? String(emergencyContact.name).trim() : "",
          phone: emergencyContact.phone ? String(emergencyContact.phone).trim() : "",
          relationship: emergencyContact.relationship ? String(emergencyContact.relationship).trim() : "",
        };
      }
    }

    await patient.save();

    const updated = patient.toObject();
    delete updated.password;

    return res.status(200).json({
      success: true,
      message: "Personal details updated successfully",
      patient: updated,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Unable to update profile" });
  }
};

// ── PATIENT FEEDBACK ────────────────────────────────────────────────────────
// POST /api/patient-portal/feedback
export const submitFeedback = async (req, res) => {
  try {
    const { appointment, doctor, rating, category, comments } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Please provide a valid rating between 1 and 5 stars" });
    }

    const feedback = await Feedback.create({
      patient: req.patient.id,
      appointment: appointment || undefined,
      doctor: doctor || undefined,
      rating: Number(rating),
      category: category || "Doctor Consultation",
      comments: comments ? comments.trim() : "",
    });

    return res.status(201).json({
      success: true,
      message: "Thank you! Your feedback has been submitted to Nivora Care Hospital quality desk.",
      feedback,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Unable to submit feedback" });
  }
};

// GET /api/patient-portal/feedback
export const getMyFeedback = async (req, res) => {
  try {
    const feedbackList = await Feedback.find({ patient: req.patient.id })
      .populate("doctor", "name specialization")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, feedback: feedbackList });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch feedback history" });
  }
};

// ── TELEMEDICINE (VIDEO CONSULTATIONS) ──────────────────────────────────────
// GET /api/patient-portal/telemedicine
export const getMyTelemedicine = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const demoAppointments = [
        {
          _id: "demo_tel_1",
          doctor: { name: "Dr. Sarah Jenkins", specialization: "Cardiology", department: "Cardiology" },
          appointmentDate: new Date(Date.now() + 2 * 3600 * 1000),
          timeSlot: "10:30 AM",
          status: "confirmed",
          reasonForVisit: "Cardiovascular follow-up",
          appointmentType: "teleconsultation",
          telemedicine: {
            joinCode: "DEMO2345",
            meetLink: "/teleconsult/DEMO2345",
            status: "scheduled",
          },
        },
      ];
      return res.status(200).json({ success: true, appointments: demoAppointments, isOfflineDemo: true });
    }

    const now = new Date();
    const appointments = await Appointment.find({
      patient: req.patient.id,
      appointmentType: "teleconsultation",
      status: { $in: ["pending", "confirmed", "checked_in", "waiting", "in_consultation"] },
    })
      .populate("doctor", "name specialization department contactNumber email")
      .sort({ appointmentDate: 1, timeSlot: 1 })
      .limit(30);

    return res.status(200).json({ success: true, appointments, now });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch telemedicine appointments" });
  }
};

