import mongoose from "mongoose";
import Patient from "../models/Patient.js";
import Bed from "../models/Bed.js";
import Vitals from "../models/Vitals.js";
import Prescription from "../models/Prescription.js";
import LabReport from "../models/LabReport.js";
import Doctor from "../models/Doctor.js";
import NursingNote from "../models/NursingNote.js";
import NursingTask from "../models/NursingTask.js";
import DoctorOrder from "../models/DoctorOrder.js";
import IntakeOutput from "../models/IntakeOutput.js";
import PatientTransfer from "../models/PatientTransfer.js";
import NurseHandover from "../models/NurseHandover.js";
import DiagnosticOrder from "../models/DiagnosticOrder.js";

// Helper to determine clinical severity based on vitals and admission reason
const assessPatientRisk = (vitals, bed) => {
  if (!vitals) {
    if (bed?.ward?.includes("ICU") || bed?.ward?.includes("CCU") || bed?.ward?.includes("Trauma")) {
      return { level: "High", reason: "Admitted in critical care unit" };
    }
    return { level: "Stable", reason: "Routine monitoring" };
  }

  // Critical thresholds
  if (
    (vitals.spo2 && vitals.spo2 <= 90) ||
    (vitals.bloodPressureSys && vitals.bloodPressureSys >= 180) ||
    (vitals.bloodPressureSys && vitals.bloodPressureSys <= 85) ||
    (vitals.heartRate && vitals.heartRate >= 130) ||
    (vitals.heartRate && vitals.heartRate <= 45) ||
    (vitals.temperature && vitals.temperature >= 103.5)
  ) {
    return { level: "Critical", reason: "Severe vital decompensation" };
  }

  // High thresholds
  if (
    (vitals.spo2 && vitals.spo2 <= 93) ||
    (vitals.bloodPressureSys && vitals.bloodPressureSys >= 150) ||
    (vitals.bloodSugar && vitals.bloodSugar >= 220) ||
    (vitals.temperature && vitals.temperature >= 101.5) ||
    bed?.ward?.includes("ICU") ||
    bed?.ward?.includes("CCU")
  ) {
    return { level: "High", reason: "Elevated vital abnormalities" };
  }

  // Moderate thresholds
  if (
    (vitals.bloodPressureSys && vitals.bloodPressureSys >= 135) ||
    (vitals.bloodSugar && vitals.bloodSugar >= 150) ||
    (vitals.temperature && vitals.temperature >= 99.5)
  ) {
    return { level: "Moderate", reason: "Mild vital variation" };
  }

  return { level: "Stable", reason: "All vitals within normal range" };
};

// 1. GET /api/nurse/dashboard-metrics
export const getNurseDashboardMetrics = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({
        success: true,
        admittedPatients: [],
        metrics: {
          totalAdmitted: 6,
          highRiskVitalsCount: 1,
          pendingTasksCount: 4,
          todayMedicationsCount: 8,
          criticalAlertsCount: 0,
        },
        isOfflineDemo: true,
      });
    }

    const todayStr = new Date().toISOString().split("T")[0];

    // Fetch occupied beds
    const occupiedBeds = await Bed.find({ status: "occupied", "currentAdmission.patient": { $exists: true, $ne: null } })
      .populate("currentAdmission.patient", "name age gender bloodGroup contactNumber abhaId allergies medicalHistory")
      .populate("currentAdmission.attendingDoctor", "name specialization department contactNumber");

    const admittedPatients = occupiedBeds.map((b) => ({
      bed: b,
      patient: b.currentAdmission.patient,
      doctor: b.currentAdmission.attendingDoctor,
      admission: b.currentAdmission,
    })).filter((item) => item.patient);

    const patientIds = admittedPatients.map((item) => item.patient._id);

    // Fetch latest vitals for all admitted patients
    const latestVitalsList = await Vitals.aggregate([
      { $match: { patient: { $in: patientIds } } },
      { $sort: { recordedAt: -1 } },
      {
        $group: {
          _id: "$patient",
          latestVital: { $first: "$$ROOT" },
        },
      },
    ]);

    const vitalsMap = {};
    latestVitalsList.forEach((v) => {
      vitalsMap[v._id.toString()] = v.latestVital;
    });

    // Classify critical patients
    const criticalPatients = [];
    let criticalCount = 0;

    admittedPatients.forEach((item) => {
      const v = vitalsMap[item.patient._id.toString()];
      const risk = assessPatientRisk(v, item.bed);
      if (risk.level === "Critical" || risk.level === "High") {
        criticalCount++;
        criticalPatients.push({
          patientId: item.patient._id,
          name: item.patient.name,
          abhaId: item.patient.abhaId || "ABDM-TEMP",
          age: item.patient.age,
          gender: item.patient.gender,
          ward: item.bed.ward,
          roomBed: `${item.bed.floor} / ${item.bed.bedNumber}`,
          bedId: item.bed._id,
          diagnosis: item.admission.admissionReason || "Under evaluation",
          attendingDoctor: item.doctor?.name ? `Dr. ${item.doctor.name}` : "On-Call Physician",
          severity: risk.level,
          riskReason: risk.reason,
          latestVital: v || null,
          lastUpdated: v ? v.recordedAt : item.admission.admittedAt,
        });
      }
    });

    // Medications due queue from active Prescriptions
    const activePrescriptions = await Prescription.find({
      patient: { $in: patientIds },
    })
      .populate("patient", "name age gender")
      .populate("doctor", "name specialization")
      .sort({ createdAt: -1 });

    const medicationsDue = [];
    activePrescriptions.forEach((rx) => {
      rx.medications.forEach((med, index) => {
        // Find if administered today
        const todayAdmin = (rx.administrations || []).find(
          (adm) =>
            adm.medicationIndex === index &&
            new Date(adm.doseTime).toISOString().split("T")[0] === todayStr
        );

        medicationsDue.push({
          prescriptionId: rx._id,
          prescriptionNumber: rx.prescriptionNumber,
          medicationIndex: index,
          patientId: rx.patient?._id,
          patientName: rx.patient?.name || "Patient",
          medication: med.name,
          dosage: med.dosage,
          route: med.timing || "Oral",
          frequency: med.frequency,
          timing: med.timing,
          scheduledTime: med.timing.includes("Before") ? "08:30 AM" : "01:30 PM",
          prescribingDoctor: rx.doctor?.name ? `Dr. ${rx.doctor.name}` : "Attending Doctor",
          status: todayAdmin ? todayAdmin.status : "Due",
          administeredAt: todayAdmin?.doseTime || null,
          administeredByName: todayAdmin?.administeredByName || null,
          notes: todayAdmin?.notes || "",
        });
      });
    });

    // Pending tasks
    const pendingTasks = await NursingTask.find({
      status: { $in: ["Pending", "In Progress"] },
    })
      .populate("patient", "name age gender")
      .sort({ dueTime: 1 })
      .limit(10);

    const pendingTasksCount = await NursingTask.countDocuments({
      status: { $in: ["Pending", "In Progress"] },
    });

    // Recent Doctor Orders
    const recentDoctorOrders = await DoctorOrder.find()
      .populate("patient", "name age gender")
      .sort({ createdAt: -1 })
      .limit(10);

    const activeOrdersCount = await DoctorOrder.countDocuments({
      status: { $in: ["New", "Acknowledged", "In Progress"] },
    });

    // Pending discharges (admitted patients where expectedDischargeDate <= today or notes contain discharge)
    const dischargePendingCount = occupiedBeds.filter((b) => {
      const exp = b.currentAdmission?.expectedDischargeDate;
      if (exp && new Date(exp) <= new Date()) return true;
      const notes = (b.currentAdmission?.notes || "").toLowerCase();
      return notes.includes("discharge") || notes.includes("fit for discharge");
    }).length;

    return res.status(200).json({
      metrics: {
        myPatients: admittedPatients.length,
        criticalPatients: criticalCount,
        medicationsDue: medicationsDue.filter((m) => m.status === "Due").length,
        pendingTasks: pendingTasksCount,
        doctorOrders: activeOrdersCount,
        dischargePending: dischargePendingCount,
      },
      criticalPatients,
      medicationsDue: medicationsDue.slice(0, 15),
      pendingTasks: pendingTasks.map((t) => ({
        ...t.toObject(),
        isOverdue: new Date(t.dueTime) < new Date() && t.status !== "Completed",
      })),
      recentDoctorOrders,
    });
  } catch (error) {
    console.error("Nurse dashboard metrics error:", error);
    return res.status(500).json({ message: "Failed to load nursing dashboard metrics" });
  }
};

// 2. GET /api/nurse/inpatients
export const getInpatientsWithCare = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const demoInpatients = [
        {
          bedId: "bed_101",
          bedNumber: "BED-ICU-01",
          ward: "Intensive Care Unit (ICU)",
          floor: "2nd Floor",
          admittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          admissionReason: "Post-op CABG Recovery",
          riskLevel: "Critical",
          patient: { _id: "pat_1", name: "Ramesh Patel", age: 58, gender: "Male", bloodGroup: "B+" },
          attendingDoctor: { name: "Dr. Sarah Jenkins", specialization: "Cardiology" },
        },
        {
          bedId: "bed_102",
          bedNumber: "BED-GW-04",
          ward: "General Ward (Male)",
          floor: "1st Floor",
          admittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          admissionReason: "Acute Gastroenteritis with dehydration",
          riskLevel: "Stable",
          patient: { _id: "pat_2", name: "Anand Kulkarni", age: 34, gender: "Male", bloodGroup: "O+" },
          attendingDoctor: { name: "Dr. Rajesh Sharma", specialization: "General Medicine" },
        },
      ];
      return res.status(200).json({ success: true, inpatients: demoInpatients, isOfflineDemo: true });
    }

    const { ward, search, riskLevel } = req.query;

    const filter = { status: "occupied", "currentAdmission.patient": { $exists: true, $ne: null } };
    if (ward && ward.trim()) {
      filter.ward = ward.trim();
    }

    const beds = await Bed.find(filter)
      .populate("currentAdmission.patient", "name age gender bloodGroup contactNumber abhaId allergies medicalHistory email address")
      .populate("currentAdmission.attendingDoctor", "name specialization department contactNumber")
      .sort({ ward: 1, bedNumber: 1 });

    const patientIds = beds.map((b) => b.currentAdmission?.patient?._id).filter(Boolean);

    // Latest vitals map
    const latestVitalsList = await Vitals.aggregate([
      { $match: { patient: { $in: patientIds } } },
      { $sort: { recordedAt: -1 } },
      {
        $group: {
          _id: "$patient",
          latestVital: { $first: "$$ROOT" },
        },
      },
    ]);

    const vitalsMap = {};
    latestVitalsList.forEach((v) => {
      vitalsMap[v._id.toString()] = v.latestVital;
    });

    let inpatients = beds.map((bed) => {
      const patient = bed.currentAdmission.patient;
      const v = vitalsMap[patient?._id?.toString()] || null;
      const risk = assessPatientRisk(v, bed);

      return {
        bedId: bed._id,
        bedNumber: bed.bedNumber,
        ward: bed.ward,
        floor: bed.floor,
        features: bed.features,
        admittedAt: bed.currentAdmission.admittedAt,
        expectedDischargeDate: bed.currentAdmission.expectedDischargeDate,
        admissionReason: bed.currentAdmission.admissionReason,
        admissionNotes: bed.currentAdmission.notes,
        attendingDoctor: bed.currentAdmission.attendingDoctor,
        patient: patient,
        latestVitals: v,
        riskLevel: risk.level,
        riskReason: risk.reason,
      };
    });

    if (search && search.trim()) {
      const s = search.trim().toLowerCase();
      inpatients = inpatients.filter(
        (item) =>
          item.patient?.name?.toLowerCase().includes(s) ||
          item.bedNumber?.toLowerCase().includes(s) ||
          item.ward?.toLowerCase().includes(s) ||
          item.admissionReason?.toLowerCase().includes(s)
      );
    }

    if (riskLevel && riskLevel.trim()) {
      inpatients = inpatients.filter((item) => item.riskLevel.toLowerCase() === riskLevel.trim().toLowerCase());
    }

    return res.status(200).json({ inpatients, total: inpatients.length });
  } catch (error) {
    console.error("Get inpatients error:", error);
    return res.status(500).json({ message: "Failed to fetch inpatients" });
  }
};

// 3. GET /api/nurse/patient-profile/:id
export const getClinicalPatientProfile = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid patient ID" });
    }

    const patient = await Patient.findById(id);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    // Active Bed / Admission
    const activeBed = await Bed.findOne({
      "currentAdmission.patient": patient._id,
      status: "occupied",
    }).populate("currentAdmission.attendingDoctor", "name specialization department contactNumber email");

    // All vitals history
    const vitals = await Vitals.find({ patient: patient._id }).sort({ recordedAt: -1 }).limit(50);

    // Active & historical prescriptions with eMAR
    const prescriptions = await Prescription.find({ patient: patient._id })
      .populate("doctor", "name specialization department")
      .sort({ createdAt: -1 });

    // Nursing Notes
    const nursingNotes = await NursingNote.find({ patient: patient._id }).sort({ recordedAt: -1 });

    // Doctor Orders
    const doctorOrders = await DoctorOrder.find({ patient: patient._id }).sort({ createdAt: -1 });

    // Investigations / Lab Reports & Diagnostic Orders
    const [labReports, diagnosticOrders] = await Promise.all([
      LabReport.find({ patient: patient._id })
        .populate("doctor", "name specialization")
        .sort({ testDate: -1 }),
      DiagnosticOrder.find({ patient: patient._id })
        .populate("doctor", "name specialization department")
        .populate("report")
        .populate("test")
        .sort({ requestedDate: -1 }),
    ]);

    // Intake & Output
    const intakeOutput = await IntakeOutput.find({ patient: patient._id }).sort({ date: -1, createdAt: -1 }).limit(30);

    // Nursing Tasks
    const tasks = await NursingTask.find({ patient: patient._id }).sort({ dueTime: -1 });

    // Patient Transfers
    const transfers = await PatientTransfer.find({ patient: patient._id }).sort({ createdAt: -1 });

    const latestVital = vitals[0] || null;
    const risk = assessPatientRisk(latestVital, activeBed);

    return res.status(200).json({
      patient,
      activeBed,
      vitals,
      prescriptions,
      nursingNotes,
      doctorOrders,
      labReports,
      diagnosticOrders,
      intakeOutput,
      tasks,
      transfers,
      clinicalSummary: {
        riskLevel: risk.level,
        riskReason: risk.reason,
        latestVital,
      },
    });
  } catch (error) {
    console.error("Clinical patient profile error:", error);
    return res.status(500).json({ message: "Failed to fetch clinical patient profile" });
  }
};

// 4. Tasks: GET, POST, PATCH
export const getNursingTasks = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const demoTasks = [
        { _id: "task_1", taskType: "Record Vitals", title: "Q2H Blood Pressure & SpO2 Check", priority: "Urgent", status: "Pending", dueTime: new Date(Date.now() + 30 * 60 * 1000), patient: { name: "Ramesh Patel", age: 58, gender: "Male" } },
        { _id: "task_2", taskType: "Medication Admin", title: "IV Infusion Saline 500ml", priority: "Routine", status: "In Progress", dueTime: new Date(Date.now() + 60 * 60 * 1000), patient: { name: "Anand Kulkarni", age: 34, gender: "Male" } },
      ];
      return res.status(200).json({ success: true, tasks: demoTasks, isOfflineDemo: true });
    }

    const { patientId, status, priority } = req.query;
    const filter = {};

    if (patientId && mongoose.isValidObjectId(patientId)) {
      filter.patient = patientId;
    }
    if (status) {
      filter.status = status;
    }
    if (priority) {
      filter.priority = priority;
    }

    const tasks = await NursingTask.find(filter)
      .populate("patient", "name age gender")
      .sort({ dueTime: 1 });

    const tasksWithOverdue = tasks.map((t) => ({
      ...t.toObject(),
      isOverdue: new Date(t.dueTime) < new Date() && t.status !== "Completed",
    }));

    return res.status(200).json({ tasks: tasksWithOverdue });
  } catch (error) {
    console.error("Get nursing tasks error:", error);
    return res.status(500).json({ message: "Failed to fetch nursing tasks" });
  }
};

export const createNursingTask = async (req, res) => {
  try {
    const { patient, taskType, title, description, priority, dueTime, notes } = req.body;

    if (!patient || !title || !dueTime) {
      return res.status(400).json({ message: "Patient, title, and due time are required" });
    }

    const task = await NursingTask.create({
      patient,
      assignedNurse: req.user._id,
      assignedNurseName: req.user.name,
      taskType: taskType || "Record Vitals",
      title,
      description: description || "",
      priority: priority || "Routine",
      dueTime: new Date(dueTime),
      notes: notes || "",
    });

    const populated = await NursingTask.findById(task._id).populate("patient", "name age gender");

    return res.status(201).json({ message: "Nursing task created successfully", task: populated });
  } catch (error) {
    console.error("Create nursing task error:", error);
    return res.status(500).json({ message: "Failed to create nursing task" });
  }
};

export const updateNursingTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!["Pending", "In Progress", "Completed", "Cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid task status" });
    }

    const update = { status };
    if (status === "Completed") {
      update.completedAt = new Date();
      update.completedBy = req.user._id;
      update.completedByName = req.user.name;
    }
    if (notes) {
      update.notes = notes;
    }

    const task = await NursingTask.findByIdAndUpdate(id, update, { new: true }).populate("patient", "name age gender");
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    return res.status(200).json({ message: `Task marked as ${status}`, task });
  } catch (error) {
    console.error("Update task status error:", error);
    return res.status(500).json({ message: "Failed to update task status" });
  }
};

// 5. Nursing Notes: GET, POST
export const getNursingNotes = async (req, res) => {
  try {
    const { patientId } = req.query;
    const filter = {};
    if (patientId && mongoose.isValidObjectId(patientId)) {
      filter.patient = patientId;
    }

    const notes = await NursingNote.find(filter)
      .populate("patient", "name age gender")
      .sort({ recordedAt: -1 });

    return res.status(200).json({ notes });
  } catch (error) {
    console.error("Get nursing notes error:", error);
    return res.status(500).json({ message: "Failed to fetch nursing notes" });
  }
};

export const createNursingNote = async (req, res) => {
  try {
    const { patient, shift, category, note, symptomsObserved, patientComplaints, patientResponse, isCritical } = req.body;

    if (!patient || !note) {
      return res.status(400).json({ message: "Patient and note content are required" });
    }

    const newNote = await NursingNote.create({
      patient,
      nurse: req.user._id,
      nurseName: req.user.name,
      shift: shift || "Morning",
      category: category || "General Condition",
      note,
      symptomsObserved: symptomsObserved || "",
      patientComplaints: patientComplaints || "",
      patientResponse: patientResponse || "",
      isCritical: Boolean(isCritical),
    });

    const populated = await NursingNote.findById(newNote._id).populate("patient", "name age gender");

    return res.status(201).json({ message: "Nursing note recorded successfully", note: populated });
  } catch (error) {
    console.error("Create nursing note error:", error);
    return res.status(500).json({ message: "Failed to record nursing note" });
  }
};

// 6. Doctor Orders: GET, PATCH
export const getDoctorOrders = async (req, res) => {
  try {
    const { patientId, status, orderType } = req.query;
    const filter = {};

    if (patientId && mongoose.isValidObjectId(patientId)) {
      filter.patient = patientId;
    }
    if (status) {
      filter.status = status;
    }
    if (orderType) {
      filter.orderType = orderType;
    }

    const orders = await DoctorOrder.find(filter)
      .populate("patient", "name age gender")
      .sort({ createdAt: -1 });

    return res.status(200).json({ orders });
  } catch (error) {
    console.error("Get doctor orders error:", error);
    return res.status(500).json({ message: "Failed to fetch doctor orders" });
  }
};

export const updateDoctorOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, nurseNotes } = req.body;

    if (!["Acknowledged", "In Progress", "Completed", "Cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid order status" });
    }

    const update = { status };
    if (status === "Acknowledged") {
      update.acknowledgedBy = req.user._id;
      update.acknowledgedByName = req.user.name;
      update.acknowledgedAt = new Date();
    } else if (status === "Completed") {
      update.completedBy = req.user._id;
      update.completedByName = req.user.name;
      update.completedAt = new Date();
    }

    if (nurseNotes) {
      update.nurseNotes = nurseNotes;
    }

    const order = await DoctorOrder.findByIdAndUpdate(id, update, { new: true }).populate("patient", "name age gender");
    if (!order) {
      return res.status(404).json({ message: "Doctor order not found" });
    }

    return res.status(200).json({ message: `Doctor order marked as ${status}`, order });
  } catch (error) {
    console.error("Update doctor order status error:", error);
    return res.status(500).json({ message: "Failed to update doctor order status" });
  }
};

// 7. Intake & Output: GET, POST
export const getIntakeOutputRecords = async (req, res) => {
  try {
    const { patientId, date } = req.query;
    const filter = {};

    if (patientId && mongoose.isValidObjectId(patientId)) {
      filter.patient = patientId;
    }
    if (date) {
      filter.date = date;
    }

    const records = await IntakeOutput.find(filter)
      .populate("patient", "name age gender")
      .sort({ date: -1, createdAt: -1 });

    const totalIntakeMl = records.reduce((sum, r) => sum + (r.intakeAmountMl || 0), 0);
    const totalOutputMl = records.reduce((sum, r) => sum + (r.outputAmountMl || 0), 0);
    const fluidBalanceMl = totalIntakeMl - totalOutputMl;

    return res.status(200).json({
      records,
      totals: {
        totalIntakeMl,
        totalOutputMl,
        fluidBalanceMl,
      },
    });
  } catch (error) {
    console.error("Get intake output error:", error);
    return res.status(500).json({ message: "Failed to fetch intake/output records" });
  }
};

export const createIntakeOutputRecord = async (req, res) => {
  try {
    const { patient, date, time, intakeType, intakeAmountMl, intakeNotes, outputType, outputAmountMl, outputNotes } = req.body;

    if (!patient) {
      return res.status(400).json({ message: "Patient is required" });
    }

    const record = await IntakeOutput.create({
      patient,
      recordedBy: req.user._id,
      recorderName: req.user.name,
      date: date || new Date().toISOString().split("T")[0],
      time: time || new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      intakeType: intakeType || "None",
      intakeAmountMl: Number(intakeAmountMl) || 0,
      intakeNotes: intakeNotes || "",
      outputType: outputType || "None",
      outputAmountMl: Number(outputAmountMl) || 0,
      outputNotes: outputNotes || "",
    });

    const populated = await IntakeOutput.findById(record._id).populate("patient", "name age gender");

    return res.status(201).json({ message: "Intake/Output record logged successfully", record: populated });
  } catch (error) {
    console.error("Create intake output error:", error);
    return res.status(500).json({ message: "Failed to log intake/output record" });
  }
};

// 8. Patient Transfers: GET, POST, PATCH
export const getPatientTransfers = async (req, res) => {
  try {
    const transfers = await PatientTransfer.find()
      .populate("patient", "name age gender bloodGroup")
      .populate("fromBed", "bedNumber ward floor")
      .populate("toBed", "bedNumber ward floor")
      .sort({ createdAt: -1 });

    return res.status(200).json({ transfers });
  } catch (error) {
    console.error("Get transfers error:", error);
    return res.status(500).json({ message: "Failed to fetch patient transfers" });
  }
};

export const createPatientTransfer = async (req, res) => {
  try {
    const { patient, fromBed, fromWard, fromBedNumber, toBed, toWard, toBedNumber, reason, notes } = req.body;

    if (!patient || !toBed || !reason) {
      return res.status(400).json({ message: "Patient, destination bed, and transfer reason are required" });
    }

    // Check if target bed is available
    const targetBed = await Bed.findById(toBed);
    if (!targetBed || targetBed.status !== "available") {
      return res.status(400).json({ message: "Target destination bed is not available" });
    }

    const transfer = await PatientTransfer.create({
      patient,
      fromBed,
      fromWard: fromWard || "General Ward",
      fromBedNumber: fromBedNumber || "BED",
      toBed,
      toWard: toWard || targetBed.ward,
      toBedNumber: toBedNumber || targetBed.bedNumber,
      reason,
      requestedBy: req.user._id,
      requestedByName: req.user.name,
      status: "Requested",
      notes: notes || "",
    });

    const populated = await PatientTransfer.findById(transfer._id).populate("patient", "name age gender");

    return res.status(201).json({ message: "Patient transfer request submitted", transfer: populated });
  } catch (error) {
    console.error("Create patient transfer error:", error);
    return res.status(500).json({ message: "Failed to request patient transfer" });
  }
};

export const updatePatientTransferStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const transfer = await PatientTransfer.findById(id);
    if (!transfer) {
      return res.status(404).json({ message: "Transfer record not found" });
    }

    transfer.status = status;
    if (notes) transfer.notes = notes;

    if (status === "Approved") {
      transfer.approvedBy = req.user._id;
      transfer.approvedByName = req.user.name;
    } else if (status === "Completed") {
      transfer.completedAt = new Date();

      // Execute actual bed reallocation in Bed model
      const oldBed = await Bed.findById(transfer.fromBed);
      const newBed = await Bed.findById(transfer.toBed);

      if (newBed && newBed.status === "available" && oldBed) {
        newBed.status = "occupied";
        newBed.currentAdmission = {
          patient: transfer.patient,
          attendingDoctor: oldBed.currentAdmission?.attendingDoctor,
          admittedAt: oldBed.currentAdmission?.admittedAt || new Date(),
          admissionReason: oldBed.currentAdmission?.admissionReason || transfer.reason,
          expectedDischargeDate: oldBed.currentAdmission?.expectedDischargeDate,
          notes: `Transferred from ${oldBed.ward} (${oldBed.bedNumber}) on ${new Date().toLocaleDateString()}`,
        };
        await newBed.save();

        // Release old bed to cleaning
        oldBed.status = "cleaning";
        oldBed.currentAdmission = null;
        await oldBed.save();
      }
    }

    await transfer.save();
    return res.status(200).json({ message: `Transfer status updated to ${status}`, transfer });
  } catch (error) {
    console.error("Update transfer error:", error);
    return res.status(500).json({ message: "Failed to update transfer status" });
  }
};

// 9. My Shift: GET /api/nurse/shift
export const getMyShiftInfo = async (req, res) => {
  try {
    const now = new Date();
    const hour = now.getHours();

    let currentShiftName = "Morning Shift";
    let shiftTime = "07:00 AM – 03:00 PM";
    let nextShift = "Afternoon Shift (03:00 PM – 11:00 PM)";
    let prevShift = "Night Shift (11:00 PM – 07:00 AM)";

    if (hour >= 15 && hour < 23) {
      currentShiftName = "Afternoon Shift";
      shiftTime = "03:00 PM – 11:00 PM";
      nextShift = "Night Shift (11:00 PM – 07:00 AM)";
      prevShift = "Morning Shift (07:00 AM – 03:00 PM)";
    } else if (hour >= 23 || hour < 7) {
      currentShiftName = "Night Shift";
      shiftTime = "11:00 PM – 07:00 AM";
      nextShift = "Morning Shift (07:00 AM – 03:00 PM)";
      prevShift = "Afternoon Shift (03:00 PM – 11:00 PM)";
    }

    const occupiedBeds = await Bed.find({ status: "occupied", "currentAdmission.patient": { $exists: true, $ne: null } })
      .populate("currentAdmission.patient", "name age gender bloodGroup")
      .populate("currentAdmission.attendingDoctor", "name specialization");

    const pendingTasks = await NursingTask.find({ status: { $in: ["Pending", "In Progress"] } });

    return res.status(200).json({
      shift: {
        currentShiftName,
        shiftTime,
        nextShift,
        prevShift,
        nurseName: req.user.name,
        assignedWard: "General & Critical Care Wards",
        shiftDate: now.toISOString().split("T")[0],
        totalAssignedPatients: occupiedBeds.length,
        pendingTasksCount: pendingTasks.length,
        patients: occupiedBeds.map((b) => ({
          bedNumber: b.bedNumber,
          ward: b.ward,
          floor: b.floor,
          patientName: b.currentAdmission?.patient?.name,
          ageGender: `${b.currentAdmission?.patient?.age}y / ${b.currentAdmission?.patient?.gender}`,
          diagnosis: b.currentAdmission?.admissionReason,
        })),
      },
    });
  } catch (error) {
    console.error("Get shift info error:", error);
    return res.status(500).json({ message: "Failed to fetch shift information" });
  }
};

// 10. Handover: GET, POST, PATCH
export const getHandovers = async (req, res) => {
  try {
    const handovers = await NurseHandover.find()
      .populate("outgoingNurse", "name email")
      .populate("incomingNurse", "name email")
      .sort({ createdAt: -1 })
      .limit(20);

    return res.status(200).json({ handovers });
  } catch (error) {
    console.error("Get handovers error:", error);
    return res.status(500).json({ message: "Failed to fetch handovers" });
  }
};

export const createHandover = async (req, res) => {
  try {
    const { shiftType, ward, generalNotes, patientsSummary } = req.body;

    const handover = await NurseHandover.create({
      shiftType: shiftType || "Morning",
      shiftDate: new Date().toISOString().split("T")[0],
      ward: ward || "General Ward",
      outgoingNurse: req.user._id,
      outgoingNurseName: req.user.name,
      generalNotes: generalNotes || "",
      patientsSummary: patientsSummary || [],
      status: "Submitted",
    });

    return res.status(201).json({ message: "Shift handover submitted successfully", handover });
  } catch (error) {
    console.error("Create handover error:", error);
    return res.status(500).json({ message: "Failed to submit handover" });
  }
};

export const acknowledgeHandover = async (req, res) => {
  try {
    const { id } = req.params;
    const handover = await NurseHandover.findById(id);
    if (!handover) {
      return res.status(404).json({ message: "Handover report not found" });
    }

    handover.status = "Acknowledged";
    handover.incomingNurse = req.user._id;
    handover.incomingNurseName = req.user.name;
    handover.acknowledgedAt = new Date();

    await handover.save();
    return res.status(200).json({ message: "Handover report acknowledged", handover });
  } catch (error) {
    console.error("Acknowledge handover error:", error);
    return res.status(500).json({ message: "Failed to acknowledge handover" });
  }
};
