import mongoose from "mongoose";
import Doctor from "../models/Doctor.js";
import Patient from "../models/Patient.js";
import Appointment from "../models/Appointment.js";
import Prescription from "../models/Prescription.js";
import LabReport from "../models/LabReport.js";
import Vitals from "../models/Vitals.js";
import DoctorOrder from "../models/DoctorOrder.js";
import Referral from "../models/Referral.js";
import ClinicalNote from "../models/ClinicalNote.js";
import Notification from "../models/Notification.js";
import { resolveDoctorForUser } from "../utils/doctorHelper.js";

// Helper: send error
const sendError = (res, statusCode, message, err = null) => {
  if (err) console.error(`[DoctorClinicalController Error]: ${message}`, err);
  return res.status(statusCode).json({ success: false, message });
};

/**
 * 1. GET /api/doctor-workspace/dashboard
 * Aggregates 8-10 KPI metrics, urgent clinical alerts, roster breakdown, and consultation queue
 */
export const getDoctorDashboard = async (req, res) => {
  try {
    const doctor = await resolveDoctorForUser(req.user);
    if (!doctor && req.user.role === "doctor") {
      return sendError(res, 404, "Doctor profile not found for this account");
    }

    const doctorFilter = doctor ? { doctor: doctor._id } : {};

    // Today's date range (midnight to midnight local/UTC)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const next7Days = new Date(todayStart);
    next7Days.setDate(next7Days.getDate() + 7);

    // Run parallel counts and queries
    const [
      todayAppointments,
      waitingAppointments,
      inProgressAppointments,
      completedTodayAppointments,
      totalDistinctPatients,
      pendingLabReports,
      criticalLabReports,
      activeOrders,
      inboundReferrals,
      outboundReferrals,
      upcomingFollowUps,
      consultationQueue,
    ] = await Promise.all([
      // 1. Today's appointments for this doctor
      Appointment.countDocuments({
        ...doctorFilter,
        appointmentDate: { $gte: todayStart, $lt: todayEnd },
      }),
      // 2. Waiting queue
      Appointment.countDocuments({
        ...doctorFilter,
        appointmentDate: { $gte: todayStart, $lt: todayEnd },
        status: "waiting",
      }),
      // 3. In Progress / In Consultation
      Appointment.countDocuments({
        ...doctorFilter,
        appointmentDate: { $gte: todayStart, $lt: todayEnd },
        status: { $in: ["in_progress", "in_consultation"] },
      }),
      // 4. Completed Today
      Appointment.countDocuments({
        ...doctorFilter,
        appointmentDate: { $gte: todayStart, $lt: todayEnd },
        status: "completed",
      }),
      // 5. Total assigned unique patients
      Appointment.distinct("patient", doctorFilter),
      // 6. Pending Lab Reviews (for this doctor's orders or patients)
      LabReport.countDocuments({
        ...(doctor ? { doctor: doctor._id } : {}),
        doctorReviewStatus: "pending",
        status: "completed",
      }),
      // 7. Critical Lab Reports pending review
      LabReport.countDocuments({
        ...(doctor ? { doctor: doctor._id } : {}),
        $or: [
          { isCritical: true, doctorReviewStatus: "pending" },
          { "testResults.status": "critical", doctorReviewStatus: "pending" },
        ],
      }),
      // 8. Active Doctor Orders (placed by this doctor or currently open)
      DoctorOrder.countDocuments({
        ...(doctor ? { doctor: doctor._id } : {}),
        status: { $in: ["New", "Acknowledged", "In Progress"] },
      }),
      // 9. Inbound pending referrals
      doctor
        ? Referral.countDocuments({ specialistDoctor: doctor._id, status: "Requested" })
        : Referral.countDocuments({ status: "Requested" }),
      // 10. Outbound pending referrals
      doctor
        ? Referral.countDocuments({ referringDoctor: doctor._id, status: "Requested" })
        : 0,
      // 11. Follow-ups due in next 7 days
      Appointment.countDocuments({
        ...doctorFilter,
        followUpDate: { $gte: todayStart, $lte: next7Days },
      }),
      // 12. Active Consultation Queue (today's appointments sorted by status and queue number/time)
      Appointment.find({
        ...doctorFilter,
        appointmentDate: { $gte: todayStart, $lt: todayEnd },
        status: { $in: ["waiting", "in_progress", "in_consultation", "confirmed", "checked_in"] },
      })
        .populate("patient", "name patientId age gender bloodGroup phone allergies emergencyContact")
        .sort({ queueNumber: 1, appointmentDate: 1, timeSlot: 1 })
        .limit(20)
        .lean(),
    ]);

    // Fetch latest vitals for patients in the queue for quick clinical glance
    const queuePatientIds = consultationQueue
      .map((a) => a.patient?._id)
      .filter((id) => mongoose.isValidObjectId(id));

    const latestVitalsMap = {};
    if (queuePatientIds.length > 0) {
      const vitalsRecords = await Vitals.aggregate([
        { $match: { patient: { $in: queuePatientIds } } },
        { $sort: { recordedAt: -1 } },
        {
          $group: {
            _id: "$patient",
            latest: { $first: "$$ROOT" },
          },
        },
      ]);
      vitalsRecords.forEach((v) => {
        latestVitalsMap[v._id.toString()] = v.latest;
      });
    }

    // Attach latest vitals and flag abnormal status to consultation queue
    const enrichedQueue = consultationQueue.map((apt, idx) => {
      const patientId = apt.patient?._id?.toString();
      const vitals = patientId ? latestVitalsMap[patientId] : null;

      let isVitalsAbnormal = false;
      let abnormalDetails = [];
      if (vitals) {
        if (vitals.bloodPressureSys >= 140 || vitals.bloodPressureDia >= 90) {
          isVitalsAbnormal = true;
          abnormalDetails.push(`BP ${vitals.bloodPressureSys}/${vitals.bloodPressureDia}`);
        }
        if (vitals.spo2 && vitals.spo2 < 95) {
          isVitalsAbnormal = true;
          abnormalDetails.push(`SpO2 ${vitals.spo2}%`);
        }
        if (vitals.heartRate && (vitals.heartRate < 50 || vitals.heartRate > 100)) {
          isVitalsAbnormal = true;
          abnormalDetails.push(`HR ${vitals.heartRate}`);
        }
        if (vitals.temperature && vitals.temperature > 100.4) {
          isVitalsAbnormal = true;
          abnormalDetails.push(`Temp ${vitals.temperature}°F`);
        }
      }

      return {
        ...apt,
        queuePosition: apt.queueNumber || idx + 1,
        latestVitals: vitals,
        isVitalsAbnormal,
        abnormalDetails: abnormalDetails.join(", "),
      };
    });

    // Generate Urgent Clinical Alerts List
    const urgentAlerts = [];
    if (criticalLabReports > 0) {
      urgentAlerts.push({
        type: "critical_lab",
        level: "danger",
        title: "Critical Lab Results Pending Review",
        message: `${criticalLabReports} abnormal/critical lab investigations require immediate doctor acknowledgment.`,
        actionLink: "/doctor-critical-labs",
      });
    }
    if (inboundReferrals > 0) {
      urgentAlerts.push({
        type: "referral",
        level: "warning",
        title: "Specialist Inbound Referrals",
        message: `You have ${inboundReferrals} pending cross-department referrals awaiting clinical review.`,
        actionLink: "/doctor-referrals",
      });
    }
    if (waitingAppointments > 3) {
      urgentAlerts.push({
        type: "waiting_queue",
        level: "info",
        title: "High Waiting Queue Volume",
        message: `${waitingAppointments} patients are currently waiting at the clinical station.`,
        actionLink: "/appointments",
      });
    }

    // Schedule / Roster breakdown for today
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const currentDayName = days[new Date().getDay()];
    const todaySchedule = doctor?.weeklySchedule?.find((s) => s.day === currentDayName) || null;

    return res.status(200).json({
      success: true,
      data: {
        metrics: {
          todayConsultations: todayAppointments,
          waitingQueue: waitingAppointments,
          inProgressConsultations: inProgressAppointments,
          completedToday: completedTodayAppointments,
          assignedPatients: totalDistinctPatients.length,
          pendingLabReviews: pendingLabReports,
          criticalLabReports,
          activeOrders,
          inboundReferrals,
          outboundReferrals,
          upcomingFollowUps,
        },
        doctorProfile: doctor
          ? {
              _id: doctor._id,
              name: doctor.name,
              specialization: doctor.specialization,
              department: doctor.department,
              phone: doctor.phone,
              email: doctor.email,
              consultationFee: doctor.consultationFee,
              todaySchedule,
            }
          : null,
        urgentAlerts,
        consultationQueue: enrichedQueue,
      },
    });
  } catch (error) {
    return sendError(res, 500, "Error loading doctor dashboard", error);
  }
};

/**
 * 2. GET /api/doctor-workspace/consultation-bundle/:appointmentId
 * Full clinical bundle for Consultation Workspace (Patient chart, allergies, vitals, meds, notes, labs)
 */
export const getConsultationBundle = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    if (!mongoose.isValidObjectId(appointmentId)) {
      return sendError(res, 400, "Invalid appointment ID");
    }

    const appointment = await Appointment.findById(appointmentId)
      .populate("patient")
      .populate("doctor", "name specialization department consultationFee email phone")
      .lean();

    if (!appointment) {
      return sendError(res, 404, "Appointment not found");
    }

    const patientId = appointment.patient?._id;
    if (!patientId) {
      return sendError(res, 404, "Patient record associated with appointment not found");
    }

    // Parallel fetch of patient clinical history
    const [vitalsHistory, activePrescriptions, labReports, clinicalNotes, previousAppointments] =
      await Promise.all([
        Vitals.find({ patient: patientId }).sort({ recordedAt: -1 }).limit(10).lean(),
        Prescription.find({ patient: patientId, status: "Active" })
          .sort({ createdAt: -1 })
          .populate("doctor", "name specialization")
          .lean(),
        LabReport.find({ patient: patientId })
          .sort({ testDate: -1, createdAt: -1 })
          .limit(10)
          .lean(),
        ClinicalNote.find({ patient: patientId })
          .sort({ createdAt: -1 })
          .limit(10)
          .lean(),
        Appointment.find({ patient: patientId, _id: { $ne: appointment._id } })
          .sort({ appointmentDate: -1 })
          .limit(5)
          .populate("doctor", "name specialization")
          .lean(),
      ]);

    // Extract active medications from active prescriptions
    const currentMedications = [];
    activePrescriptions.forEach((rx) => {
      if (Array.isArray(rx.medications)) {
        rx.medications.forEach((med) => {
          currentMedications.push({
            ...med,
            prescriptionNumber: rx.prescriptionNumber,
            prescribedBy: rx.doctor?.name || "Doctor",
            prescribedDate: rx.createdAt,
          });
        });
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        appointment,
        patient: appointment.patient,
        latestVitals: vitalsHistory[0] || null,
        vitalsHistory,
        currentMedications,
        activePrescriptions,
        labReports,
        clinicalNotes,
        previousAppointments,
      },
    });
  } catch (error) {
    return sendError(res, 500, "Error loading consultation bundle", error);
  }
};

/**
 * 3. POST /api/doctor-workspace/conclude-consultation
 * Concludes consultation: Updates appointment, creates clinical note, issues prescription,
 * orders lab investigations, and files specialist referral.
 */
export const concludeConsultation = async (req, res) => {
  try {
    const doctor = await resolveDoctorForUser(req.user);
    if (!doctor && req.user.role === "doctor") {
      return sendError(res, 404, "Doctor profile not found for this account");
    }

    const {
      appointmentId,
      chiefComplaint,
      clinicalHistory,
      examination,
      assessment,
      diagnosis,
      differentialDiagnosis,
      treatmentPlan,
      clinicalSummary,
      followUpDate,
      followUpInstructions,
      prescription, // { medications: [], advice, vitals, allergyWarningAcknowledged, allergyWarningDetails }
      labOrders, // [ { testName, category, notes } ]
      referral, // { specialistDoctorId, specialistDoctorName, department, reason, priority, clinicalSummary }
    } = req.body;

    if (!appointmentId || !mongoose.isValidObjectId(appointmentId)) {
      return sendError(res, 400, "Valid appointment ID is required");
    }

    const appointment = await Appointment.findById(appointmentId).populate("patient");
    if (!appointment) {
      return sendError(res, 404, "Appointment not found");
    }

    const patient = appointment.patient;
    const doctorId = doctor ? doctor._id : appointment.doctor;
    const doctorName = doctor ? doctor.name : "Doctor";

    // 1. Create Clinical Note
    const clinicalNote = await ClinicalNote.create({
      patient: patient._id,
      doctor: doctorId,
      doctorName,
      appointment: appointment._id,
      noteType: "Consultation",
      chiefComplaint: chiefComplaint || appointment.reasonForVisit || "",
      clinicalHistory: clinicalHistory || "",
      examination: examination || "",
      assessment: assessment || "",
      diagnosis: diagnosis || appointment.diagnosis || "Clinical evaluation completed",
      differentialDiagnosis: differentialDiagnosis || "",
      treatmentPlan: treatmentPlan || "",
      followUpInstructions: followUpInstructions || "",
    });

    // 2. Handle Prescription if medications provided
    let createdPrescription = null;
    if (prescription && Array.isArray(prescription.medications) && prescription.medications.length > 0) {
      const rxCount = await Prescription.countDocuments();
      const prescriptionNumber = `RX-${Date.now().toString().slice(-6)}-${String(rxCount + 1).padStart(3, "0")}`;

      createdPrescription = await Prescription.create({
        prescriptionNumber,
        patient: patient._id,
        doctor: doctorId,
        appointment: appointment._id,
        diagnosis: diagnosis || "Consultation Prescribed Treatment",
        symptoms: chiefComplaint ? [chiefComplaint] : [],
        vitals: prescription.vitals || {},
        medications: prescription.medications,
        labTestsRecommended: Array.isArray(labOrders) ? labOrders.map((l) => l.testName) : [],
        advice: prescription.advice || "",
        followUpDate: followUpDate ? new Date(followUpDate) : undefined,
        allergyWarningAcknowledged: Boolean(prescription.allergyWarningAcknowledged),
        allergyWarningDetails: prescription.allergyWarningDetails || "",
        digitalSignature: {
          signedByName: doctorName,
          designation: doctor?.specialization ? `Specialist in ${doctor.specialization}` : "Consulting Physician",
          signedAt: new Date(),
        },
      });
    }

    // 3. Handle Lab Orders
    const createdLabReports = [];
    if (Array.isArray(labOrders) && labOrders.length > 0) {
      const labCount = await LabReport.countDocuments();
      for (let i = 0; i < labOrders.length; i++) {
        const order = labOrders[i];
        if (!order.testName) continue;

        const reportNumber = `LAB-${Date.now().toString().slice(-6)}-${String(labCount + i + 1).padStart(3, "0")}`;
        const newReport = await LabReport.create({
          reportNumber,
          patient: patient._id,
          doctor: doctorId,
          testName: order.testName,
          category: order.category || "General Lab",
          status: "ordered",
          doctorReviewStatus: "pending",
          notes: order.notes || `Ordered during consultation by Dr. ${doctorName}`,
        });
        createdLabReports.push(newReport);
      }
    }

    // 4. Handle Specialist Referral
    let createdReferral = null;
    if (referral && referral.specialistDoctorId && referral.reason) {
      createdReferral = await Referral.create({
        patient: patient._id,
        referringDoctor: doctorId,
        referringDoctorName: doctorName,
        specialistDoctor: referral.specialistDoctorId,
        specialistDoctorName: referral.specialistDoctorName || "Specialist Doctor",
        department: referral.department || "Specialist Department",
        reason: referral.reason,
        clinicalSummary: referral.clinicalSummary || diagnosis || "",
        priority: referral.priority || "Routine",
        appointment: appointment._id,
      });

      // Notify the specialist doctor if user account linked
      const specialistDoctorDoc = await Doctor.findById(referral.specialistDoctorId);
      if (specialistDoctorDoc?.user) {
        await Notification.create({
          user: specialistDoctorDoc.user,
          title: "New Patient Referral",
          message: `Dr. ${doctorName} has referred patient ${patient.name} (${referral.priority} priority) for ${referral.reason}.`,
          type: "appointment",
          relatedId: createdReferral._id,
        }).catch(() => {});
      }
    }

    // 5. Update Appointment status to 'completed'
    appointment.status = "completed";
    appointment.diagnosis = diagnosis || appointment.diagnosis || "";
    appointment.clinicalSummary = clinicalSummary || treatmentPlan || "";
    if (followUpDate) appointment.followUpDate = new Date(followUpDate);
    if (followUpInstructions) appointment.followUpInstructions = followUpInstructions;
    await appointment.save();

    // 6. Notify Patient if user account exists
    if (patient.user) {
      await Notification.create({
        user: patient.user,
        title: "Consultation Completed",
        message: `Your consultation with Dr. ${doctorName} is completed. Diagnosis & treatment plan have been updated.`,
        type: "appointment",
        relatedId: appointment._id,
      }).catch(() => {});
    }

    return res.status(200).json({
      success: true,
      message: "Consultation concluded successfully with all clinical documentation recorded",
      data: {
        appointment,
        clinicalNote,
        prescription: createdPrescription,
        labReports: createdLabReports,
        referral: createdReferral,
      },
    });
  } catch (error) {
    return sendError(res, 500, "Error concluding consultation", error);
  }
};

/**
 * 4. GET /api/doctor-workspace/patient-profile/:patientId
 * 360-degree patient clinical profile for doctors
 */
export const getDoctorPatientProfile = async (req, res) => {
  try {
    const { patientId } = req.params;
    if (!mongoose.isValidObjectId(patientId)) {
      return sendError(res, 400, "Invalid patient ID");
    }

    const patient = await Patient.findById(patientId).lean();
    if (!patient) {
      return sendError(res, 404, "Patient not found");
    }

    const [
      vitalsHistory,
      prescriptions,
      labReports,
      clinicalNotes,
      appointments,
      doctorOrders,
      referrals,
    ] = await Promise.all([
      Vitals.find({ patient: patientId }).sort({ recordedAt: -1 }).lean(),
      Prescription.find({ patient: patientId })
        .sort({ createdAt: -1 })
        .populate("doctor", "name specialization")
        .lean(),
      LabReport.find({ patient: patientId })
        .sort({ testDate: -1, createdAt: -1 })
        .populate("doctor", "name specialization")
        .lean(),
      ClinicalNote.find({ patient: patientId })
        .sort({ createdAt: -1 })
        .populate("doctor", "name specialization")
        .lean(),
      Appointment.find({ patient: patientId })
        .sort({ appointmentDate: -1 })
        .populate("doctor", "name specialization")
        .lean(),
      DoctorOrder.find({ patient: patientId })
        .sort({ createdAt: -1 })
        .populate("doctor", "name specialization")
        .lean(),
      Referral.find({ patient: patientId })
        .sort({ createdAt: -1 })
        .populate("referringDoctor", "name specialization")
        .populate("specialistDoctor", "name specialization")
        .lean(),
    ]);

    // Build unified chronological clinical timeline
    const timeline = [];

    vitalsHistory.forEach((v) => {
      timeline.push({
        type: "vitals",
        date: v.recordedAt,
        title: "Vitals Recorded",
        subtitle: `BP: ${v.bloodPressureSys || "-"}/${v.bloodPressureDia || "-"} mmHg, HR: ${v.heartRate || "-"} bpm, SpO2: ${v.spo2 || "-"}%`,
        details: v,
      });
    });

    clinicalNotes.forEach((n) => {
      timeline.push({
        type: "note",
        date: n.createdAt,
        title: `${n.noteType} Note by Dr. ${n.doctorName}`,
        subtitle: n.diagnosis ? `Dx: ${n.diagnosis}` : n.chiefComplaint,
        details: n,
      });
    });

    prescriptions.forEach((p) => {
      timeline.push({
        type: "prescription",
        date: p.createdAt,
        title: `Prescription ${p.prescriptionNumber}`,
        subtitle: `${p.medications?.length || 0} medications prescribed for ${p.diagnosis}`,
        details: p,
      });
    });

    labReports.forEach((l) => {
      timeline.push({
        type: "lab",
        date: l.reportDate || l.testDate || l.createdAt,
        title: `Lab Test: ${l.testName} (${l.status})`,
        subtitle: l.summaryConclusion || `Category: ${l.category}`,
        isCritical: l.isCritical,
        details: l,
      });
    });

    doctorOrders.forEach((o) => {
      timeline.push({
        type: "order",
        date: o.createdAt,
        title: `Order: ${o.orderType} (${o.priority})`,
        subtitle: `${o.description} - Status: ${o.status}`,
        details: o,
      });
    });

    // Sort timeline newest first
    timeline.sort((a, b) => new Date(b.date) - new Date(a.date));

    return res.status(200).json({
      success: true,
      data: {
        patient,
        vitalsHistory,
        prescriptions,
        labReports,
        clinicalNotes,
        appointments,
        doctorOrders,
        referrals,
        timeline,
      },
    });
  } catch (error) {
    return sendError(res, 500, "Error loading patient profile", error);
  }
};

/**
 * 5. GET /api/doctor-workspace/orders
 * Clinical orders managed by the doctor
 */
export const getDoctorOrders = async (req, res) => {
  try {
    const doctor = await resolveDoctorForUser(req.user);
    const filter = {};
    if (doctor) {
      filter.doctor = doctor._id;
    }
    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.priority) {
      filter.priority = req.query.priority;
    }

    const orders = await DoctorOrder.find(filter)
      .populate("patient", "name patientId age gender phone")
      .populate("doctor", "name specialization")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ success: true, data: orders });
  } catch (error) {
    return sendError(res, 500, "Error loading doctor orders", error);
  }
};

/**
 * 6. POST /api/doctor-workspace/orders
 * Doctor issues an order for nursing/staff
 */
export const createDoctorOrder = async (req, res) => {
  try {
    const doctor = await resolveDoctorForUser(req.user);
    const { patientId, orderType, description, priority } = req.body;

    if (!patientId || !mongoose.isValidObjectId(patientId)) {
      return sendError(res, 400, "Valid patient ID is required");
    }
    if (!orderType || !description) {
      return sendError(res, 400, "Order type and description are required");
    }

    const patient = await Patient.findById(patientId);
    if (!patient) return sendError(res, 404, "Patient not found");

    const doctorId = doctor ? doctor._id : null;
    const doctorName = doctor ? doctor.name : (req.user.name || "Doctor");

    const order = await DoctorOrder.create({
      patient: patientId,
      doctor: doctorId,
      doctorName,
      orderType,
      description,
      priority: priority || "Routine",
      status: "New",
    });

    return res.status(201).json({
      success: true,
      message: "Clinical order submitted successfully",
      data: order,
    });
  } catch (error) {
    return sendError(res, 500, "Error creating doctor order", error);
  }
};

/**
 * 7. GET /api/doctor-workspace/referrals
 * Cross-specialist referrals (inbound or outbound)
 */
export const getReferrals = async (req, res) => {
  try {
    const doctor = await resolveDoctorForUser(req.user);
    const { type, status } = req.query; // type: "inbound", "outbound", or undefined

    const filter = {};
    if (doctor) {
      if (type === "inbound") {
        filter.specialistDoctor = doctor._id;
      } else if (type === "outbound") {
        filter.referringDoctor = doctor._id;
      } else {
        filter.$or = [{ specialistDoctor: doctor._id }, { referringDoctor: doctor._id }];
      }
    }

    if (status) filter.status = status;

    const referrals = await Referral.find(filter)
      .populate("patient", "name patientId age gender phone allergies bloodGroup")
      .populate("referringDoctor", "name department specialization")
      .populate("specialistDoctor", "name department specialization")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ success: true, data: referrals });
  } catch (error) {
    return sendError(res, 500, "Error loading referrals", error);
  }
};

/**
 * 8. POST /api/doctor-workspace/referrals
 * Creates a specialist referral
 */
export const createReferral = async (req, res) => {
  try {
    const doctor = await resolveDoctorForUser(req.user);
    const {
      patientId,
      specialistDoctorId,
      specialistDoctorName,
      department,
      reason,
      clinicalSummary,
      priority,
    } = req.body;

    if (!patientId || !specialistDoctorId || !reason) {
      return sendError(res, 400, "Patient, specialist doctor, and reason are required");
    }

    const patient = await Patient.findById(patientId);
    if (!patient) return sendError(res, 404, "Patient not found");

    const referringDoctorId = doctor ? doctor._id : null;
    const referringDoctorName = doctor ? doctor.name : (req.user.name || "Doctor");

    const referral = await Referral.create({
      patient: patientId,
      referringDoctor: referringDoctorId,
      referringDoctorName,
      specialistDoctor: specialistDoctorId,
      specialistDoctorName: specialistDoctorName || "Specialist Doctor",
      department: department || "General Specialty",
      reason,
      clinicalSummary: clinicalSummary || "",
      priority: priority || "Routine",
      status: "Requested",
    });

    return res.status(201).json({
      success: true,
      message: "Specialist referral initiated successfully",
      data: referral,
    });
  } catch (error) {
    return sendError(res, 500, "Error creating referral", error);
  }
};

/**
 * 9. PATCH /api/doctor-workspace/referrals/:id/status
 * Updates referral status (Accepted, Scheduled, Completed, Cancelled)
 */
export const updateReferralStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return sendError(res, 400, "Invalid referral ID");
    }

    const referral = await Referral.findById(id);
    if (!referral) return sendError(res, 404, "Referral not found");

    if (status) referral.status = status;
    if (notes) referral.notes = notes;
    await referral.save();

    return res.status(200).json({
      success: true,
      message: `Referral status updated to ${status}`,
      data: referral,
    });
  } catch (error) {
    return sendError(res, 500, "Error updating referral status", error);
  }
};

/**
 * 10. GET /api/doctor-workspace/critical-labs
 * Critical investigations requiring doctor review
 */
export const getCriticalLabResults = async (req, res) => {
  try {
    const doctor = await resolveDoctorForUser(req.user);
    const filter = {
      $or: [
        { isCritical: true },
        { "testResults.status": "critical" },
      ],
    };

    if (doctor) {
      filter.doctor = doctor._id;
    }

    if (req.query.status) {
      filter.doctorReviewStatus = req.query.status;
    }

    const reports = await LabReport.find(filter)
      .populate("patient", "name patientId age gender phone")
      .populate("doctor", "name specialization")
      .sort({ testDate: -1, createdAt: -1 })
      .lean();

    return res.status(200).json({ success: true, data: reports });
  } catch (error) {
    return sendError(res, 500, "Error loading critical lab results", error);
  }
};

/**
 * 11. POST /api/doctor-workspace/acknowledge-lab/:reportId
 * Acknowledge critical lab review
 */
export const acknowledgeCriticalLabResult = async (req, res) => {
  try {
    const doctor = await resolveDoctorForUser(req.user);
    const { reportId } = req.params;
    const { notes } = req.body;

    if (!mongoose.isValidObjectId(reportId)) {
      return sendError(res, 400, "Invalid lab report ID");
    }

    const report = await LabReport.findById(reportId);
    if (!report) return sendError(res, 404, "Lab report not found");

    report.doctorReviewStatus = "reviewed";
    report.reviewedByDoctor = doctor ? doctor._id : null;
    report.reviewedAt = new Date();
    if (notes) report.doctorReviewNotes = notes;
    await report.save();

    return res.status(200).json({
      success: true,
      message: "Lab report review acknowledged successfully",
      data: report,
    });
  } catch (error) {
    return sendError(res, 500, "Error acknowledging lab result", error);
  }
};

/**
 * 12. GET /api/doctor-workspace/follow-ups
 * Due follow-ups for this doctor
 */
export const getFollowUpsDue = async (req, res) => {
  try {
    const doctor = await resolveDoctorForUser(req.user);
    const daysAhead = parseInt(req.query.days || "14", 10);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const filter = {
      followUpDate: { $gte: today, $lte: futureDate },
    };
    if (doctor) {
      filter.doctor = doctor._id;
    }

    const followUps = await Appointment.find(filter)
      .populate("patient", "name patientId age gender phone")
      .populate("doctor", "name specialization department")
      .sort({ followUpDate: 1 })
      .lean();

    return res.status(200).json({ success: true, data: followUps });
  } catch (error) {
    return sendError(res, 500, "Error loading follow-ups", error);
  }
};

/**
 * 13. GET /api/doctor-workspace/specialist-directory
 * Directory of hospital doctors for cross-referrals and consultations
 */
export const getSpecialistDirectory = async (req, res) => {
  try {
    const doctors = await Doctor.find({ isAvailable: { $ne: false } })
      .select("name specialization department phone email consultationFee weeklySchedule availableDays workingHours")
      .sort({ department: 1, name: 1 })
      .lean();

    return res.status(200).json({ success: true, data: doctors });
  } catch (error) {
    return sendError(res, 500, "Error loading specialist directory", error);
  }
};
