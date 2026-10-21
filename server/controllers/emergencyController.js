import mongoose from "mongoose";
import Patient from "../models/Patient.js";
import Doctor from "../models/Doctor.js";
import Bed from "../models/Bed.js";
import Billing from "../models/Billing.js";
import Prescription from "../models/Prescription.js";
import DiagnosticOrder from "../models/DiagnosticOrder.js";
import DiagnosticTest from "../models/DiagnosticTest.js";
import Vitals from "../models/Vitals.js";
import ClinicalNote from "../models/ClinicalNote.js";
import DoctorOrder from "../models/DoctorOrder.js";
import Notification from "../models/Notification.js";
import AuditLog from "../models/AuditLog.js";
import EmergencyEncounter from "../models/EmergencyEncounter.js";
import User from "../models/User.js";
import { logAuditEvent } from "./adminController.js";

const EMERGENCY_CHARGE = 1500;

const pushTimeline = (enc, event, details, user) => {
  enc.timeline.push({
    event,
    details: details || "",
    by: user?.name || "System",
    byId: user?._id || user?.id,
    at: new Date(),
  });
};

export const searchPatientsForEmergency = async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    if (!q) return res.status(200).json({ success: true, patients: [] });
    const regex = new RegExp(q, "i");
    const patients = await Patient.find({
      $or: [{ name: regex }, { contactNumber: regex }, { patientId: regex }, { abhaId: regex }, { email: regex }],
    })
      .select("name age gender contactNumber patientId abhaId bloodGroup allergies medicalHistory address emergencyContact")
      .limit(10);
    return res.status(200).json({ success: true, patients });
  } catch (error) {
    return res.status(500).json({ message: "Patient search failed" });
  }
};

// POST /api/emergency  - Emergency registration
export const createEmergencyEncounter = async (req, res) => {
  try {
    const {
      existingPatientId,
      patientName,
      age,
      gender,
      contactNumber,
      email,
      address,
      bloodGroup,
      dateOfBirth,
      isUnknown,
      arrivalMode,
      arrivalTime,
      chiefComplaint,
      knownAllergies,
      knownConditions,
      emergencyContact,
      priority,
    } = req.body;

    if (!chiefComplaint) {
      return res.status(400).json({ message: "Chief complaint is required" });
    }

    let patientId = existingPatientId;
    let patient = null;

    if (patientId && mongoose.isValidObjectId(patientId)) {
      patient = await Patient.findById(patientId);
      if (!patient) return res.status(404).json({ message: "Linked patient not found" });
    } else {
      // Create new patient if not linked
      if (isUnknown) {
        const token = `ER-UNK-${Date.now().toString().slice(-6)}`;
        patient = await Patient.create({
          name: patientName || `Unknown Patient ${token}`,
          age: age ? Number(age) : 30,
          gender: gender || "Other",
          contactNumber: contactNumber || "0000000000",
          address: address || "Unknown - Emergency",
          bloodGroup: bloodGroup || undefined,
          allergies: Array.isArray(knownAllergies) ? knownAllergies : knownAllergies ? [knownAllergies] : [],
          medicalHistory: Array.isArray(knownConditions) ? knownConditions : knownConditions ? [knownConditions] : [],
          emergencyContact: emergencyContact || {},
          patientId: token,
        });
        patientId = patient._id;
      } else {
        if (!patientName) return res.status(400).json({ message: "Patient name is required (or link existing patient, or mark as unknown)" });
        patient = await Patient.create({
          name: patientName,
          age: age ? Number(age) : 25,
          gender: gender || "Other",
          contactNumber: contactNumber || "0000000000",
          email: email || undefined,
          address: address || "",
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
          bloodGroup: bloodGroup || undefined,
          allergies: Array.isArray(knownAllergies) ? knownAllergies : knownAllergies ? String(knownAllergies).split(",").map(s=>s.trim()).filter(Boolean) : [],
          medicalHistory: Array.isArray(knownConditions) ? knownConditions : knownConditions ? String(knownConditions).split(",").map(s=>s.trim()).filter(Boolean) : [],
          emergencyContact: emergencyContact || {},
        });
        patientId = patient._id;
      }
    }

    const encounter = await EmergencyEncounter.create({
      patient: patientId,
      isUnknown: Boolean(isUnknown),
      arrivalTime: arrivalTime ? new Date(arrivalTime) : new Date(),
      arrivalMode: arrivalMode || "walk_in",
      chiefComplaint,
      chiefComplaintOnArrival: chiefComplaint,
      knownAllergies: Array.isArray(knownAllergies) ? knownAllergies : knownAllergies ? String(knownAllergies).split(",").map(s=>s.trim()).filter(Boolean) : patient?.allergies || [],
      knownConditions: Array.isArray(knownConditions) ? knownConditions : knownConditions ? String(knownConditions).split(",").map(s=>s.trim()).filter(Boolean) : patient?.medicalHistory || [],
      emergencyContact: emergencyContact || patient?.emergencyContact || {},
      priority: priority || "urgent",
      triageStatus: "awaiting_triage",
      triage: { chiefComplaint },
      status: "registered",
      location: "ER Triage Bay",
      createdBy: req.user?._id,
      createdByName: req.user?.name || "System",
      timeline: [],
    });

    pushTimeline(encounter, "Emergency arrival", `Arrival mode: ${encounter.arrivalMode}, Chief complaint: ${chiefComplaint}`, req.user);
    pushTimeline(encounter, "Emergency registered", `Token ${encounter.tokenNumber}, Priority ${encounter.priority}`, req.user);
    await encounter.save();

    // Billing: emergency consultation charge
    try {
      await Billing.create({
        patient: patientId,
        itemizedCharges: [{ description: `Emergency Consultation (${encounter.priority})`, cost: EMERGENCY_CHARGE }],
        totalAmount: EMERGENCY_CHARGE,
        paymentStatus: "pending",
      });
    } catch {}

    // Notification to staff
    try {
      await Notification.create({
        recipientType: "all",
        title: "New emergency arrival",
        message: `${patient?.name || patientName} — ${chiefComplaint} (${encounter.priority}) at ${encounter.location}`,
        type: "emergency_alert",
        link: `/emergency/patients/${encounter._id}`,
      });
    } catch {}

    await logAuditEvent({ user: req.user, action: "Emergency registration", module: "patients", recordId: encounter._id, details: `${encounter.emergencyId} for ${patient?.name}`, req });

    const populated = await EmergencyEncounter.findById(encounter._id).populate("patient", "name age gender contactNumber patientId abhaId bloodGroup allergies").populate("bed", "bedNumber ward status");

    return res.status(201).json({ success: true, message: "Emergency encounter registered", encounter: populated });
  } catch (error) {
    console.error("createEmergencyEncounter error:", error);
    return res.status(500).json({ message: error.message || "Failed to register emergency patient" });
  }
};

// GET /api/emergency/dashboard
export const getEmergencyDashboard = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({
        success: true,
        isOfflineDemo: true,
        stats: { totalActive: 12, critical: 2, under_care: 6, waiting: 4, observation: 3, availableBeds: 5, awaiting_triage: 3, awaiting_doctor: 2, pending_diagnostics: 4, pending_meds: 2, awaiting_admission: 2 },
        recent: [],
        beds: [],
      });
    }
    const now = new Date();
    const startDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const [allActive, triageWaiting, doctorWaiting, critical, underTreatment, observation, pendingDiagCount, pendingMeds, awaitingAdmission, beds, recent] = await Promise.all([
      EmergencyEncounter.countDocuments({ status: { $nin: ["discharged", "transferred", "cancelled", "admitted"] } }),
      EmergencyEncounter.countDocuments({ triageStatus: "awaiting_triage", status: { $nin: ["discharged", "cancelled"] } }),
      EmergencyEncounter.countDocuments({ status: { $in: ["triaged", "awaiting_doctor"] } }),
      EmergencyEncounter.countDocuments({ priority: "critical", status: { $nin: ["discharged", "cancelled", "admitted"] } }),
      EmergencyEncounter.countDocuments({ status: { $in: ["under_assessment", "under_treatment", "awaiting_diagnostics"] } }),
      EmergencyEncounter.countDocuments({ status: "under_observation" }),
      DiagnosticOrder.countDocuments({ status: { $in: ["Requested", "Scheduled", "Sample Collected", "In Progress"] } }),
      Prescription.countDocuments({ dispensingStatus: { $in: ["pending", "processing"] } }),
      EmergencyEncounter.countDocuments({ status: "awaiting_diagnostics" }), // proxy
      Bed.find({ ward: { $regex: /emergency|trauma/i } }),
      EmergencyEncounter.find({ createdAt: { $gte: startDay } }).populate("patient", "name age gender contactNumber").populate("assignedDoctor", "name specialization").sort({ arrivalTime: -1 }).limit(8),
    ]);
    const emergencyBeds = beds;
    const availableBeds = emergencyBeds.filter((b) => b.status === "available").length;
    return res.status(200).json({
      success: true,
      stats: {
        totalActive: allActive,
        critical,
        under_care: underTreatment,
        waiting: doctorWaiting + triageWaiting,
        observation,
        availableBeds,
        awaiting_triage: triageWaiting,
        awaiting_doctor: doctorWaiting,
        pending_diagnostics: pendingDiagCount,
        pending_meds: pendingMeds,
        awaiting_admission: await EmergencyEncounter.countDocuments({ status: "admitted" }).catch(() => 0),
      },
      recent,
      beds: emergencyBeds.slice(0, 12),
    });
  } catch (error) {
    console.error("dashboard error", error);
    return res.status(500).json({ message: "Failed to load emergency dashboard" });
  }
};

// GET /api/emergency  queue
export const getEmergencyQueue = async (req, res) => {
  try {
    const { priority, status, doctor, date, location, search, triageStatus, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (priority && priority !== "all") filter.priority = priority;
    if (status && status !== "all") filter.status = status;
    if (triageStatus && triageStatus !== "all") filter.triageStatus = triageStatus;
    if (doctor && mongoose.isValidObjectId(doctor)) filter.assignedDoctor = doctor;
    if (location) filter.location = { $regex: location, $options: "i" };
    if (date) {
      const d = new Date(date);
      const s = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const e = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
      filter.arrivalTime = { $gte: s, $lte: e };
    }
    if (search) {
      const regex = new RegExp(search, "i");
      // Need patient lookup; we filter after fetch or via aggregate. Simpler: search via patient population later; first get matching patient ids
      const matchedPatients = await Patient.find({ $or: [{ name: regex }, { patientId: regex }, { contactNumber: regex }] }).select("_id").limit(20);
      const patientIds = matchedPatients.map((p) => p._id);
      filter.$or = [{ emergencyId: regex }, { tokenNumber: regex }, { chiefComplaint: regex }, { patient: { $in: patientIds } }];
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [encounters, total] = await Promise.all([
      EmergencyEncounter.find(filter)
        .populate("patient", "name age gender contactNumber patientId abhaId bloodGroup allergies")
        .populate("assignedDoctor", "name specialization department")
        .populate("bed", "bedNumber ward status")
        .sort({ priority: 1, arrivalTime: 1 })
        .skip(skip)
        .limit(Number(limit)),
      EmergencyEncounter.countDocuments(filter),
    ]);
    // Manual priority sort: critical first
    const order = { critical: 0, urgent: 1, less_urgent: 2, non_urgent: 3 };
    encounters.sort((a, b) => (order[a.priority] ?? 9) - (order[b.priority] ?? 9) || new Date(a.arrivalTime) - new Date(b.arrivalTime));
    return res.status(200).json({ success: true, encounters, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } });
  } catch (error) {
    console.error("queue error", error);
    return res.status(500).json({ message: "Failed to fetch emergency queue" });
  }
};

// GET /api/emergency/:id
export const getEmergencyById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: "Invalid emergency ID" });
    const enc = await EmergencyEncounter.findById(id)
      .populate("patient", "name age gender contactNumber patientId abhaId bloodGroup allergies medicalHistory address emergencyContact dateOfBirth")
      .populate("assignedDoctor", "name specialization department contactNumber")
      .populate("bed", "bedNumber ward floor status dailyRate")
      .populate("diagnosticOrders")
      .populate("prescriptions");
    if (!enc) return res.status(404).json({ message: "Emergency encounter not found" });

    // Fetch related vitals, notes, orders for this patient
    const [vitals, clinicalNotes, doctorOrders, diagnostics, prescriptions, billings] = await Promise.all([
      Vitals.find({ patient: enc.patient._id }).sort({ recordedAt: -1 }).limit(10).catch(() => []),
      ClinicalNote.find({ patient: enc.patient._id }).sort({ createdAt: -1 }).limit(10).catch(() => []),
      DoctorOrder.find({ patient: enc.patient._id }).sort({ createdAt: -1 }).limit(10).catch(() => []),
      DiagnosticOrder.find({ patient: enc.patient._id }).sort({ createdAt: -1 }).limit(20).populate("test", "name category"),
      Prescription.find({ patient: enc.patient._id }).sort({ createdAt: -1 }).limit(20),
      Billing.find({ patient: enc.patient._id }).sort({ createdAt: -1 }).limit(10),
    ]);

    return res.status(200).json({ success: true, encounter: enc, related: { vitals, clinicalNotes, doctorOrders, diagnostics, prescriptions, billings } });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load emergency encounter" });
  }
};

// POST /api/emergency/:id/triage
export const updateTriage = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      chiefComplaint,
      symptoms,
      bloodPressureSys,
      bloodPressureDia,
      heartRate,
      respiratoryRate,
      spo2,
      temperature,
      consciousnessLevel,
      painScore,
      allergies,
      relevantHistory,
      triageNotes,
      priority,
    } = req.body;
    const enc = await EmergencyEncounter.findById(id);
    if (!enc) return res.status(404).json({ message: "Encounter not found" });

    enc.triage = {
      chiefComplaint: chiefComplaint || enc.triage?.chiefComplaint || enc.chiefComplaint,
      symptoms: symptoms || "",
      bloodPressureSys: bloodPressureSys ? Number(bloodPressureSys) : undefined,
      bloodPressureDia: bloodPressureDia ? Number(bloodPressureDia) : undefined,
      heartRate: heartRate ? Number(heartRate) : undefined,
      respiratoryRate: respiratoryRate ? Number(respiratoryRate) : undefined,
      spo2: spo2 ? Number(spo2) : undefined,
      temperature: temperature ? Number(temperature) : undefined,
      consciousnessLevel: consciousnessLevel || "Alert",
      painScore: painScore !== undefined ? Number(painScore) : undefined,
      allergies: allergies || "",
      relevantHistory: relevantHistory || "",
      triageNotes: triageNotes || "",
      triagedBy: req.user?._id,
      triagedByName: req.user?.name || "",
      triagedAt: new Date(),
    };
    if (priority) enc.priority = priority;
    enc.triageStatus = "triaged";
    if (enc.status === "arrived" || enc.status === "registered" || enc.status === "awaiting_triage") {
      enc.status = "triaged";
      // also set to awaiting_doctor if not critical? keep triaged
      enc.status = "awaiting_doctor";
    }
    pushTimeline(enc, "Triage completed", `Priority ${enc.priority}, Pain ${painScore || 0}/10, By ${req.user?.name}`, req.user);
    // also add vitalsHistory entry
    enc.vitalsHistory.push({
      bloodPressureSys: bloodPressureSys ? Number(bloodPressureSys) : undefined,
      bloodPressureDia: bloodPressureDia ? Number(bloodPressureDia) : undefined,
      heartRate: heartRate ? Number(heartRate) : undefined,
      respiratoryRate: respiratoryRate ? Number(respiratoryRate) : undefined,
      spo2: spo2 ? Number(spo2) : undefined,
      temperature: temperature ? Number(temperature) : undefined,
      consciousnessLevel: consciousnessLevel || "Alert",
      painScore: painScore !== undefined ? Number(painScore) : undefined,
      recordedBy: req.user?.name || "",
      notes: triageNotes || "Triage vitals",
    });
    await enc.save();

    // Create Vitals doc
    try {
      await Vitals.create({
        patient: enc.patient,
        recordedBy: req.user?.role === "doctor" ? "doctor" : req.user?.role === "nurse" ? "nurse" : "staff",
        recorderName: req.user?.name || "",
        bloodPressureSys: bloodPressureSys ? Number(bloodPressureSys) : undefined,
        bloodPressureDia: bloodPressureDia ? Number(bloodPressureDia) : undefined,
        heartRate: heartRate ? Number(heartRate) : undefined,
        respiratoryRate: respiratoryRate ? Number(respiratoryRate) : undefined,
        spo2: spo2 ? Number(spo2) : undefined,
        temperature: temperature ? Number(temperature) : undefined,
        painScore: painScore ? Number(painScore) : undefined,
        notes: `ER Triage - ${chiefComplaint || enc.chiefComplaint}`,
      });
    } catch {}

    await logAuditEvent({ user: req.user, action: "Emergency triage", module: "patients", recordId: enc._id, details: `Priority ${enc.priority}`, req });
    const populated = await EmergencyEncounter.findById(enc._id).populate("patient", "name age gender").populate("assignedDoctor", "name");
    return res.status(200).json({ success: true, message: "Triage recorded", encounter: populated });
  } catch (error) {
    console.error("triage error", error);
    return res.status(500).json({ message: "Failed to record triage" });
  }
};

// POST /api/emergency/:id/vitals
export const addEmergencyVitals = async (req, res) => {
  try {
    const { id } = req.params;
    const { bloodPressureSys, bloodPressureDia, heartRate, respiratoryRate, spo2, temperature, painScore, consciousnessLevel, notes } = req.body;
    const enc = await EmergencyEncounter.findById(id);
    if (!enc) return res.status(404).json({ message: "Encounter not found" });
    const snap = {
      bloodPressureSys: bloodPressureSys ? Number(bloodPressureSys) : undefined,
      bloodPressureDia: bloodPressureDia ? Number(bloodPressureDia) : undefined,
      heartRate: heartRate ? Number(heartRate) : undefined,
      respiratoryRate: respiratoryRate ? Number(respiratoryRate) : undefined,
      spo2: spo2 ? Number(spo2) : undefined,
      temperature: temperature ? Number(temperature) : undefined,
      painScore: painScore !== undefined ? Number(painScore) : undefined,
      consciousnessLevel: consciousnessLevel || "Alert",
      recordedBy: req.user?.name || "",
      notes: notes || "",
    };
    enc.vitalsHistory.push(snap);
    pushTimeline(enc, "Vitals recorded", `BP ${bloodPressureSys || "-"}/${bloodPressureDia || "-"}, HR ${heartRate || "-"}, SpO2 ${spo2 || "-"}`, req.user);
    await enc.save();
    try {
      await Vitals.create({
        patient: enc.patient,
        recordedBy: req.user?.role === "doctor" ? "doctor" : req.user?.role === "nurse" ? "nurse" : "staff",
        recorderName: req.user?.name || "",
        bloodPressureSys: snap.bloodPressureSys,
        bloodPressureDia: snap.bloodPressureDia,
        heartRate: snap.heartRate,
        respiratoryRate: snap.respiratoryRate,
        spo2: snap.spo2,
        temperature: snap.temperature,
        painScore: snap.painScore,
        notes: notes || `ER Vitals ${enc.emergencyId}`,
      });
    } catch {}
    await logAuditEvent({ user: req.user, action: "ER vitals recorded", module: "patients", recordId: enc._id, details: `Vitals for ${enc.emergencyId}`, req });
    return res.status(200).json({ success: true, encounter: enc });
  } catch (error) {
    return res.status(500).json({ message: "Failed to record vitals" });
  }
};

// POST /api/emergency/:id/notes
export const addEmergencyNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { note, noteType } = req.body;
    if (!note) return res.status(400).json({ message: "Note content required" });
    const enc = await EmergencyEncounter.findById(id);
    if (!enc) return res.status(404).json({ message: "Encounter not found" });
    enc.clinicalNotes.push({ note, by: req.user?._id, byName: req.user?.name || "Staff", byRole: req.user?.role || "", at: new Date() });
    pushTimeline(enc, noteType ? `${noteType} note` : "Clinical note added", note.substring(0, 120), req.user);
    // Also create ClinicalNote doc for medical records
    try {
      await ClinicalNote.create({
        patient: enc.patient,
        doctor: enc.assignedDoctor || undefined,
        doctorName: enc.assignedDoctorName || req.user?.name || "ER Doctor",
        noteType: noteType || "Progress",
        chiefComplaint: enc.chiefComplaint,
        assessment: note,
        diagnosis: enc.discharge?.finalDiagnosis || "",
      });
    } catch (e) { console.error("clinical note create error", e.message); }
    await enc.save();
    await logAuditEvent({ user: req.user, action: "ER clinical note", module: "patients", recordId: enc._id, details: note.substring(0, 80), req });
    return res.status(200).json({ success: true, encounter: enc });
  } catch (error) {
    return res.status(500).json({ message: "Failed to add note" });
  }
};

// PATCH /api/emergency/:id/assign-doctor
export const assignEmergencyDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    const { doctorId } = req.body;
    if (!doctorId || !mongoose.isValidObjectId(doctorId)) return res.status(400).json({ message: "Valid doctorId required" });
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });
    const enc = await EmergencyEncounter.findById(id);
    if (!enc) return res.status(404).json({ message: "Encounter not found" });
    enc.assignedDoctor = doctor._id;
    enc.assignedDoctorName = doctor.name;
    // find linked user if exists
    const doctorUser = await User.findOne({ doctor: doctor._id });
    if (doctorUser) enc.assignedDoctorUser = doctorUser._id;
    if (["awaiting_doctor", "triaged", "awaiting_triage", "registered"].includes(enc.status)) enc.status = "under_assessment";
    pushTimeline(enc, "Doctor assigned", `${doctor.name} (${doctor.specialization})`, req.user);
    await enc.save();
    try {
      await Notification.create({
        recipientType: "staff",
        user: doctorUser?._id,
        title: "ER case assigned",
        message: `Emergency ${enc.emergencyId} (${enc.patient ? enc.patient : ""}) - ${enc.chiefComplaint} assigned to you. Priority: ${enc.priority}`,
        type: "emergency_alert",
        link: `/emergency/patients/${enc._id}`,
      });
    } catch {}
    await logAuditEvent({ user: req.user, action: "ER doctor assignment", module: "patients", recordId: enc._id, details: `Assigned ${doctor.name}`, req });
    const populated = await EmergencyEncounter.findById(enc._id).populate("assignedDoctor", "name specialization").populate("patient", "name");
    return res.status(200).json({ success: true, encounter: populated });
  } catch (error) {
    return res.status(500).json({ message: "Failed to assign doctor" });
  }
};

// PATCH /api/emergency/:id/assign-nurse
export const assignEmergencyNurse = async (req, res) => {
  try {
    const { id } = req.params;
    const { nurseId, nurseName } = req.body;
    let assignName = nurseName || "";
    let assignId = null;
    if (nurseId && mongoose.isValidObjectId(nurseId)) {
      const nurseUser = await User.findById(nurseId);
      if (nurseUser) { assignId = nurseUser._id; assignName = nurseUser.name; }
    } else if (nurseName) {
      assignName = nurseName;
    } else if (req.user?.role === "nurse") {
      assignId = req.user._id;
      assignName = req.user?.name || "";
    }
    const enc = await EmergencyEncounter.findById(id);
    if (!enc) return res.status(404).json({ message: "Encounter not found" });
    enc.assignedNurse = assignId;
    enc.assignedNurseName = assignName;
    pushTimeline(enc, "Nurse assigned", assignName, req.user);
    await enc.save();
    return res.status(200).json({ success: true, encounter: enc });
  } catch (error) {
    return res.status(500).json({ message: "Failed to assign nurse" });
  }
};

// PATCH /api/emergency/:id/status
export const updateEmergencyStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, location } = req.body;
    const enc = await EmergencyEncounter.findById(id);
    if (!enc) return res.status(404).json({ message: "Encounter not found" });
    if (status) enc.status = status;
    if (location) enc.location = location;
    pushTimeline(enc, `Status → ${status || location}`, location || "", req.user);
    await enc.save();
    return res.status(200).json({ success: true, encounter: enc });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update status" });
  }
};

// POST /api/emergency/:id/orders  (diagnostic)
export const createEmergencyDiagnosticOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { testName, testId, priority, notes } = req.body;
    const enc = await EmergencyEncounter.findById(id).populate("patient");
    if (!enc) return res.status(404).json({ message: "Encounter not found" });
    if (!testName && !testId) return res.status(400).json({ message: "testName or testId required" });

    let testDoc = null;
    if (testId && mongoose.isValidObjectId(testId)) testDoc = await DiagnosticTest.findById(testId);
    if (!testDoc && testName) testDoc = await DiagnosticTest.findOne({ name: { $regex: new RegExp(testName, "i") } });
    if (!testDoc) testDoc = await DiagnosticTest.findOne();
    if (!testDoc) return res.status(400).json({ message: "No diagnostic tests configured. Please seed diagnostic catalog." });

    const isRadiology = /x-?ray|ct|mri|ultrasound|usg|radiology|scan|echo|ecg|doppler/i.test(testName || testDoc.name || "");
    const dept = testDoc.diagnosticDepartment || (isRadiology ? "Radiology" : "Pathology");
    const modality = testDoc.modality || (isRadiology ? (/mri/i.test(testName || testDoc.name) ? "MRI" : /ct/i.test(testName || testDoc.name) ? "CT" : /ultrasound|usg/i.test(testName || testDoc.name) ? "Ultrasound" : "X-Ray") : "Laboratory");

    let docRef = enc.assignedDoctor || req.user?.doctor;
    if (!docRef) {
      const anyDoc = await Doctor.findOne();
      if (anyDoc) docRef = anyDoc._id;
    }

    const orderNumber = `ORD-ER-${Date.now().toString().slice(-6)}`;
    const order = await DiagnosticOrder.create({
      orderNumber,
      patient: enc.patient,
      patientName: enc.patient?.name || patientNameFallback(enc),
      doctor: docRef,
      doctorName: enc.assignedDoctorName || req.user?.name || "ER Doctor",
      test: testDoc._id,
      testName: testDoc.name || testName,
      testCode: testDoc.testCode || testDoc.code || "",
      diagnosticDepartment: dept,
      category: testDoc.category || (isRadiology ? "Radiology / Imaging" : "Emergency Lab"),
      modality: modality,
      priority: priority || (enc.priority === "critical" ? "STAT" : "Urgent"),
      status: "Requested",
      notes: notes || `ER ${enc.emergencyId} - ${enc.chiefComplaint}`,
      isEmergency: true,
      emergencyEncounter: enc._id,
    });

    enc.diagnosticOrders.push(order._id);
    if (enc.status === "under_assessment" || enc.status === "triaged") enc.status = "awaiting_diagnostics";
    pushTimeline(enc, "Diagnostic ordered", `${order.testName} (${order.priority})`, req.user);
    await enc.save();

    // Billing for diagnostic
    try {
      await Billing.create({
        patient: enc.patient,
        diagnosticOrder: order._id,
        itemizedCharges: [{ description: `Diagnostic: ${order.testName}`, cost: testDoc?.price || 1200 }],
        totalAmount: testDoc?.price || 1200,
        paymentStatus: "pending",
      });
    } catch {}

    try {
      await Notification.create({
        recipientType: "staff",
        title: "STAT diagnostic from ER",
        message: `${order.testName} for ${enc.patient?.name || "ER patient"} (${enc.emergencyId}) - ${order.priority}`,
        type: "diagnostic_ordered",
        diagnosticOrder: order._id,
        link: `/diagnostic/requests`,
      });
    } catch {}

    await logAuditEvent({ user: req.user, action: "ER diagnostic order", module: "diagnostics", recordId: order._id, details: `${order.testName} for ${enc.emergencyId}`, req });
    return res.status(201).json({ success: true, order });
  } catch (error) {
    console.error("diag order error", error);
    return res.status(500).json({ message: "Failed to create diagnostic order" });
  }
};

function patientNameFallback(enc) {
  return enc?.patient?.name || "ER Patient";
}

// POST /api/emergency/:id/prescription
export const createEmergencyPrescription = async (req, res) => {
  try {
    const { id } = req.params;
    const { medications, diagnosis, advice } = req.body;
    if (!medications || !Array.isArray(medications) || medications.length === 0) return res.status(400).json({ message: "Medications array required" });
    const enc = await EmergencyEncounter.findById(id).populate("patient").populate("assignedDoctor");
    if (!enc) return res.status(404).json({ message: "Encounter not found" });

    const doctor = enc.assignedDoctor ? await Doctor.findById(enc.assignedDoctor) : null;
    const prescriberUser = enc.assignedDoctorUser ? await User.findById(enc.assignedDoctorUser) : req.user;

    const count = await Prescription.countDocuments();
    const rxNumber = `RX-ER-${Date.now().toString().slice(-6)}-${String(count + 1).padStart(3, "0")}`;

    const prescription = await Prescription.create({
      prescriptionNumber: rxNumber,
      patient: enc.patient._id,
      doctor: doctor?._id || enc.assignedDoctor,
      appointment: undefined,
      diagnosis: diagnosis || enc.chiefComplaint || "Emergency treatment",
      symptoms: enc.chiefComplaint ? [enc.chiefComplaint] : [],
      medications: medications.map((m) => ({
        name: m.name,
        dosage: m.dosage || m.dose || "",
        frequency: m.frequency || "1-0-1",
        timing: m.timing || "After food",
        duration: m.duration || "5 days",
        instructions: m.instructions || "",
        quantity: m.quantity || 10,
      })),
      advice: advice || "",
      dispensingStatus: "pending",
      digitalSignature: {
        signedByName: doctor?.name || prescriberUser?.name || "ER Doctor",
        designation: doctor?.specialization ? `Specialist in ${doctor.specialization}` : "Emergency Physician",
        signedAt: new Date(),
      },
    });

    enc.prescriptions.push(prescription._id);
    enc.status = enc.status === "under_assessment" ? "under_treatment" : enc.status;
    pushTimeline(enc, "Prescription created", `${medications.map((m) => m.name).join(", ")}`, req.user);
    await enc.save();

    // Billing
    try {
      const total = medications.length * 150;
      await Billing.create({
        patient: enc.patient._id,
        itemizedCharges: medications.map((m) => ({ description: `Pharmacy: ${m.name}`, cost: 150 })),
        totalAmount: total,
        paymentStatus: "pending",
      });
    } catch {}

    try {
      await Notification.create({
        recipientType: "staff",
        title: "ER prescription ready",
        message: `Prescription ${rxNumber} for ${enc.patient?.name || "ER patient"} requires dispensing`,
        type: "general",
        link: `/pharmacy/queue`,
      });
    } catch {}

    await logAuditEvent({ user: req.user, action: "ER prescription", module: "prescriptions", recordId: prescription._id, details: `${rxNumber} for ${enc.emergencyId}`, req });
    return res.status(201).json({ success: true, prescription });
  } catch (error) {
    console.error("er prescription error", error);
    return res.status(500).json({ message: "Failed to create prescription" });
  }
};

// POST /api/emergency/:id/admit
export const admitEmergencyPatient = async (req, res) => {
  try {
    const { id } = req.params;
    const { bedId, ward, department, expectedDischargeDate, admissionReason, notes } = req.body;
    const enc = await EmergencyEncounter.findById(id).populate("patient").populate("assignedDoctor");
    if (!enc) return res.status(404).json({ message: "Encounter not found" });
    if (enc.status === "admitted") return res.status(400).json({ message: "Already admitted" });

    let bed = null;
    if (bedId && mongoose.isValidObjectId(bedId)) bed = await Bed.findById(bedId);
    if (!bed && ward) {
      bed = await Bed.findOne({ ward: { $regex: new RegExp(ward, "i") }, status: "available" });
    }
    if (!bed) bed = await Bed.findOne({ status: "available" });
    if (!bed) return res.status(400).json({ message: "No available beds for admission" });
    if (bed.status !== "available") return res.status(400).json({ message: `Bed ${bed.bedNumber} is ${bed.status}` });

    let attendingDoctor = enc.assignedDoctor || req.user?.doctor;
    if (!attendingDoctor) {
      const defaultDoc = (await Doctor.findOne({ isAvailable: true })) || (await Doctor.findOne());
      if (defaultDoc) attendingDoctor = defaultDoc._id;
    }
    const reason = admissionReason || `Emergency admission via ${enc.emergencyId} - ${enc.chiefComplaint}`;

    bed.status = "occupied";
    bed.currentAdmission = {
      patient: enc.patient._id,
      attendingDoctor: attendingDoctor,
      admittedAt: new Date(),
      admissionReason: reason,
      expectedDischargeDate: expectedDischargeDate ? new Date(expectedDischargeDate) : undefined,
      emergencyContact: enc.emergencyContact?.phone || "",
      notes: notes || `Admitted from ER ${enc.emergencyId}`,
    };
    bed.admissionHistory.push({
      patient: enc.patient._id,
      attendingDoctor,
      admittedAt: new Date(),
      admissionReason: reason,
      totalDays: 1,
      totalBedCost: bed.dailyRate,
    });
    await bed.save();

    enc.bed = bed._id;
    enc.status = "admitted";
    enc.location = `${bed.ward} - ${bed.bedNumber}`;
    pushTimeline(enc, "Admitted", `${bed.ward} ${bed.bedNumber} - ${reason}`, req.user);
    enc.transferHistory.push({ from: "Emergency", to: `${bed.ward} ${bed.bedNumber}`, reason, requestedBy: req.user?.name || "", requestedById: req.user?._id, transferredAt: new Date() });
    await enc.save();

    // Billing for admission/bed
    try {
      await Billing.create({
        patient: enc.patient._id,
        bed: bed._id,
        itemizedCharges: [{ description: `Admission - ${bed.ward} ${bed.bedNumber}`, cost: bed.dailyRate }],
        totalAmount: bed.dailyRate,
        paymentStatus: "pending",
      });
    } catch {}

    try {
      await Notification.create({
        recipientType: "staff",
        title: "ER patient admitted",
        message: `${enc.patient?.name || "ER patient"} admitted to ${bed.ward} ${bed.bedNumber} from ${enc.emergencyId}`,
        type: "admission_info",
        link: `/beds`,
      });
    } catch {}

    await logAuditEvent({ user: req.user, action: "ER admission", module: "beds", recordId: bed._id, details: `${enc.emergencyId} -> ${bed.bedNumber}`, req });
    const populated = await EmergencyEncounter.findById(enc._id).populate("bed");
    return res.status(200).json({ success: true, message: "Patient admitted", encounter: populated, bed });
  } catch (error) {
    console.error("admit error", error);
    return res.status(500).json({ message: "Failed to admit patient" });
  }
};

// POST /api/emergency/:id/transfer
export const transferEmergencyPatient = async (req, res) => {
  try {
    const { id } = req.params;
    const { toLocation, reason, toBedId } = req.body;
    if (!toLocation) return res.status(400).json({ message: "toLocation required" });
    const enc = await EmergencyEncounter.findById(id);
    if (!enc) return res.status(404).json({ message: "Encounter not found" });
    const from = enc.location || "Emergency";
    enc.location = toLocation;
    enc.status = "transferred";
    enc.transferHistory.push({ from, to: toLocation, reason: reason || "", requestedBy: req.user?.name || "", requestedById: req.user?._id, transferredAt: new Date() });
    pushTimeline(enc, "Transferred", `${from} → ${toLocation} : ${reason || ""}`, req.user);
    // If transferring to a bed, try to update bed assignment: release old bed if any, allocate new
    if (toBedId && mongoose.isValidObjectId(toBedId)) {
      const targetBed = await Bed.findById(toBedId);
      if (targetBed && targetBed.status === "available") {
        // release old bed if occupied by this patient
        if (enc.bed) {
          const oldBed = await Bed.findById(enc.bed);
          if (oldBed && String(oldBed.currentAdmission?.patient) === String(enc.patient)) {
            oldBed.status = "cleaning";
            oldBed.currentAdmission = null;
            await oldBed.save();
          }
        }
        let transferDoc = enc.assignedDoctor || req.user?.doctor;
        if (!transferDoc) {
          const defaultDoc = (await Doctor.findOne({ isAvailable: true })) || (await Doctor.findOne());
          if (defaultDoc) transferDoc = defaultDoc._id;
        }
        targetBed.status = "occupied";
        targetBed.currentAdmission = {
          patient: enc.patient,
          attendingDoctor: transferDoc,
          admittedAt: new Date(),
          admissionReason: `Transfer from ER ${enc.emergencyId} - ${enc.chiefComplaint}`,
          notes: `Transfer: ${reason || ""}`,
        };
        await targetBed.save();
        enc.bed = targetBed._id;
      }
    }
    await enc.save();
    await logAuditEvent({ user: req.user, action: "ER transfer", module: "patients", recordId: enc._id, details: `${from} -> ${toLocation}`, req });
    return res.status(200).json({ success: true, encounter: enc });
  } catch (error) {
    return res.status(500).json({ message: "Failed to transfer" });
  }
};

// POST /api/emergency/:id/discharge
export const dischargeEmergencyPatient = async (req, res) => {
  try {
    const { id } = req.params;
    const { finalDiagnosis, treatmentSummary, medications, instructions, followUp, dischargeNotes } = req.body;
    const enc = await EmergencyEncounter.findById(id).populate("patient");
    if (!enc) return res.status(404).json({ message: "Encounter not found" });
    if (["discharged", "cancelled"].includes(enc.status)) return res.status(400).json({ message: `Already ${enc.status}` });

    // RBAC: only doctor or admin can discharge – enforce by role
    if (req.user && !["doctor", "admin", "super_admin", "emergency"].includes(req.user.role)) {
      return res.status(403).json({ message: "Only doctors or administrators can discharge ER patients" });
    }

    enc.discharge = {
      finalDiagnosis: finalDiagnosis || enc.chiefComplaint,
      treatmentSummary: treatmentSummary || "",
      medications: medications || "",
      instructions: instructions || "",
      followUp: followUp || "",
      dischargeNotes: dischargeNotes || "",
      dischargedBy: req.user?._id,
      dischargedByName: req.user?.name || "",
      dischargedAt: new Date(),
    };
    enc.status = "discharged";
    pushTimeline(enc, "Discharged", `Diagnosis: ${finalDiagnosis || enc.chiefComplaint}`, req.user);

    // Release bed if occupied
    if (enc.bed) {
      const bed = await Bed.findById(enc.bed);
      if (bed && String(bed.currentAdmission?.patient) === String(enc.patient._id || enc.patient)) {
        const now = new Date();
        const admittedAt = bed.currentAdmission?.admittedAt ? new Date(bed.currentAdmission.admittedAt) : now;
        const days = Math.max(1, Math.ceil((now - admittedAt) / (24 * 60 * 60 * 1000)));
        bed.admissionHistory.push({
          patient: enc.patient._id || enc.patient,
          attendingDoctor: enc.assignedDoctor,
          admittedAt,
          dischargedAt: now,
          admissionReason: enc.chiefComplaint,
          dischargeSummary: treatmentSummary || dischargeNotes || "ER discharge",
          totalDays: days,
          totalBedCost: days * (bed.dailyRate || 1000),
        });
        bed.currentAdmission = null;
        bed.status = "cleaning";
        await bed.save();
      }
    }

    // Clinical note for discharge
    try {
      await ClinicalNote.create({
        patient: enc.patient._id || enc.patient,
        doctor: enc.assignedDoctor,
        doctorName: enc.assignedDoctorName || req.user?.name || "ER Doctor",
        noteType: "Discharge",
        chiefComplaint: enc.chiefComplaint,
        diagnosis: finalDiagnosis || enc.chiefComplaint,
        treatmentPlan: treatmentSummary || "",
        followUpInstructions: instructions || "",
      });
    } catch {}

    // Billing finalization: ensure discharge billing exists
    try {
      await Billing.create({
        patient: enc.patient._id || enc.patient,
        itemizedCharges: [{ description: `ER Discharge - ${finalDiagnosis || enc.chiefComplaint}`, cost: 500 }],
        totalAmount: 500,
        paymentStatus: "pending",
      });
    } catch {}

    await enc.save();
    await logAuditEvent({ user: req.user, action: "ER discharge", module: "patients", recordId: enc._id, details: `Discharged ${enc.emergencyId}`, req });
    return res.status(200).json({ success: true, message: "Patient discharged from ER", encounter: enc });
  } catch (error) {
    console.error("discharge error", error);
    return res.status(500).json({ message: "Failed to discharge" });
  }
};

// POST /api/emergency/:id/observation
export const updateObservation = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes, status } = req.body;
    const enc = await EmergencyEncounter.findById(id);
    if (!enc) return res.status(404).json({ message: "Encounter not found" });
    if (notes) enc.observation.notes = notes;
    if (!enc.observation.startedAt) enc.observation.startedAt = new Date();
    if (status) enc.observation.status = status;
    if (notes) pushTimeline(enc, "Observation note", notes.substring(0, 120), req.user);
    if (enc.status !== "under_observation" && status !== "completed") enc.status = "under_observation";
    if (status === "completed") {
      enc.observation.endedAt = new Date();
      enc.observation.status = "completed";
    }
    await enc.save();
    return res.status(200).json({ success: true, encounter: enc });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update observation" });
  }
};

// POST /api/emergency/:id/procedures
export const addEmergencyProcedure = async (req, res) => {
  try {
    const { id } = req.params;
    const { procedureName, notes } = req.body;
    if (!procedureName || !procedureName.trim()) {
      return res.status(400).json({ message: "Procedure name is required" });
    }
    const enc = await EmergencyEncounter.findById(id);
    if (!enc) return res.status(404).json({ message: "Encounter not found" });

    const formattedProc = notes ? `${procedureName.trim()} (${notes.trim()})` : procedureName.trim();
    enc.procedures.push(formattedProc);
    pushTimeline(enc, "Procedure performed", formattedProc, req.user);
    await enc.save();

    await logAuditEvent({
      user: req.user,
      action: "ER procedure",
      module: "patients",
      recordId: enc._id,
      details: `${procedureName} on ${enc.emergencyId}`,
      req,
    });

    return res.status(200).json({ success: true, message: "Procedure recorded", procedures: enc.procedures, encounter: enc });
  } catch (error) {
    console.error("add procedure error", error);
    return res.status(500).json({ message: "Failed to record procedure" });
  }
};

// GET /api/emergency/reports/summary
export const getEmergencyReports = async (req, res) => {
  try {
    const now = new Date();
    const startDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const [todayTotal, weekTotal, criticalToday, admittedFromER, dischargedFromER, pendingDiagTurnaround, avgWaitAgg] = await Promise.all([
      EmergencyEncounter.countDocuments({ createdAt: { $gte: startDay } }),
      EmergencyEncounter.countDocuments({ createdAt: { $gte: startWeek } }),
      EmergencyEncounter.countDocuments({ priority: "critical", createdAt: { $gte: startDay } }),
      EmergencyEncounter.countDocuments({ status: "admitted", updatedAt: { $gte: startDay } }),
      EmergencyEncounter.countDocuments({ status: "discharged", updatedAt: { $gte: startDay } }),
      DiagnosticOrder.countDocuments({ isEmergency: true, status: { $nin: ["Completed", "Cancelled"] } }).catch(() => 0),
      EmergencyEncounter.aggregate([
        { $match: { triage: { $exists: true }, "triage.triagedAt": { $exists: true } } },
        { $project: { waitMs: { $subtract: ["$triage.triagedAt", "$arrivalTime"] } } },
        { $group: { _id: null, avgWait: { $avg: "$waitMs" } } },
      ]),
    ]);
    const avgWaitMinutes = avgWaitAgg[0]?.avgWait ? Math.round(avgWaitAgg[0].avgWait / 60000) : 0;
    return res.status(200).json({
      success: true,
      reports: {
        register: { todayTotal, weekTotal },
        critical: { today: criticalToday },
        flow: { admittedFromER, dischargedFromER },
        diagnostics: { pending: pendingDiagTurnaround },
        waitTime: { averageMinutes: avgWaitMinutes },
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load reports" });
  }
};

// GET /api/emergency/beds
export const getEmergencyBeds = async (req, res) => {
  try {
    const beds = await Bed.find({ ward: { $regex: /emergency|trauma/i } }).populate("currentAdmission.patient", "name age gender").populate("currentAdmission.attendingDoctor", "name");
    if (beds.length === 0) {
      const demo = await Bed.find({ status: "available" }).limit(10);
      return res.status(200).json({ success: true, beds: demo });
    }
    return res.status(200).json({ success: true, beds });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch ER beds" });
  }
};
