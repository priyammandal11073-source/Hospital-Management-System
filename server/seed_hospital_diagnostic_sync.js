/**
 * seed_hospital_diagnostic_sync.js
 * Master Hospital-Wide Diagnostic Integration Demo Seeder for Nivora Care HMS
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env"), override: true });

import Patient from "./models/Patient.js";
import Doctor from "./models/Doctor.js";
import Bed from "./models/Bed.js";
import Equipment from "./models/Equipment.js";
import DiagnosticTest from "./models/DiagnosticTest.js";
import DiagnosticOrder from "./models/DiagnosticOrder.js";
import DiagnosticReport from "./models/DiagnosticReport.js";
import DiagnosticSample from "./models/DiagnosticSample.js";
import Appointment from "./models/Appointment.js";
import Billing from "./models/Billing.js";
import NursingTask from "./models/NursingTask.js";
import Notification from "./models/Notification.js";
import AuditLog from "./models/AuditLog.js";

import { diagnosticSyncService } from "./services/diagnosticSyncService.js";

const MONGO_URI = process.env.MONGO_URI;

async function seedDiagnosticIntegration() {
  console.log("==========================================================================");
  console.log("    SEEDING COMPREHENSIVE HOSPITAL-WIDE DIAGNOSTIC INTEGRATION DATA       ");
  console.log("==========================================================================\n");

  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB Atlas\n");

    // Fetch existing patients and doctors
    const patients = await Patient.find().limit(10);
    const doctors = await Doctor.find().limit(5);
    const beds = await Bed.find({ status: "occupied" });

    if (patients.length === 0 || doctors.length === 0) {
      console.log("Patients or doctors missing, please run master seed first.");
      process.exit(1);
    }

    const p1 = patients[0];
    const p2 = patients[1] || patients[0];
    const p3 = patients[2] || patients[0];
    const p4 = patients[3] || patients[0];
    const d1 = doctors[0];
    const d2 = doctors[1] || doctors[0];
    const bed1 = beds[0] || { bedNumber: "BED-ICU-02", ward: "Intensive Care Unit" };

    // Fetch or create tests
    const tests = await DiagnosticTest.find();
    const cbcTest = tests.find(t => t.testCode === "CBC" || t.category === "Hematology") || tests[0];
    const ctTest = tests.find(t => t.modality === "CT Scan") || tests[1] || tests[0];
    const mriTest = tests.find(t => t.modality === "MRI") || tests[2] || tests[0];
    const usgTest = tests.find(t => t.modality === "Ultrasound") || tests[3] || tests[0];
    const xrayTest = tests.find(t => t.modality === "X-Ray") || tests[4] || tests[0];

    // Clean up old demo sync orders
    await DiagnosticOrder.deleteMany({ orderNumber: { $regex: /^DIAG-DEMO-/ } });

    console.log("Seeding Scenario 1: STAT Critical Troponin Alert for Inpatient...");
    const order1 = await DiagnosticOrder.create({
      orderNumber: `DIAG-DEMO-STAT-001`,
      patient: p1._id,
      patientName: p1.name,
      patientIdStr: p1.patientId || "PID-1001",
      doctor: d1._id,
      doctorName: `Dr. ${d1.name}`,
      department: "Cardiology",
      test: cbcTest._id,
      testCode: "TROP_STAT",
      testName: "High Sensitivity Troponin-I STAT",
      diagnosticDepartment: "Pathology",
      category: "Biochemistry",
      modality: "Laboratory",
      price: 1350,
      priority: "STAT",
      status: "In Progress",
      isInpatient: true,
      ward: bed1.ward || "ICU",
      bedNumber: bed1.bedNumber || "ICU-01",
      isCritical: true,
      criticalDetails: {
        isCritical: true,
        flaggedAt: new Date(Date.now() - 30 * 60 * 1000), // 30m ago
        parameter: "Troponin-I",
        detectedValue: "340.2 ng/L",
        normalRange: "< 14.0 ng/L",
        escalationStatus: "Open",
      },
      clinicalIndication: "Severe retrosternal chest pain with diaphoresis",
    });
    await diagnosticSyncService.onDiagnosticRequestCreated(order1, {
      userId: d1._id,
      userName: `Dr. ${d1.name}`,
      role: "doctor",
    });

    console.log("Seeding Scenario 2: Inpatient High-Resolution CT Chest with Contrast Media...");
    const order2 = await DiagnosticOrder.create({
      orderNumber: `DIAG-DEMO-CT-002`,
      patient: p2._id,
      patientName: p2.name,
      patientIdStr: p2.patientId || "PID-1002",
      doctor: d2._id,
      doctorName: `Dr. ${d2.name}`,
      department: "Pulmonology",
      test: ctTest._id,
      testCode: ctTest.testCode,
      testName: "High Resolution CT Chest with IV Contrast",
      diagnosticDepartment: "Radiology",
      category: "Computed Tomography",
      modality: "CT Scan",
      price: 4500,
      priority: "Urgent",
      status: "Scheduled",
      isInpatient: true,
      ward: "Pulmonary High Dependency Unit",
      bedNumber: "HDU-04",
      preparationRequired: true,
      preparationInstructions: "Strict 4-hour fasting. Verify serum creatinine (must be < 1.4 mg/dL).",
      transportRequired: true,
      requiresContrast: true,
      scheduledDate: new Date(Date.now() + 2 * 3600 * 1000),
      scheduledTimeSlot: "02:30 PM",
      assignedRoom: "Radiology Suite 1 (128-Slice CT)",
    });
    await diagnosticSyncService.onDiagnosticRequestCreated(order2, {
      userId: d2._id,
      userName: `Dr. ${d2.name}`,
      role: "doctor",
    });

    console.log("Seeding Scenario 3: Receptionist Walk-in Patient Ready for Ultrasound...");
    const order3 = await DiagnosticOrder.create({
      orderNumber: `DIAG-DEMO-USG-003`,
      patient: p3._id,
      patientName: p3.name,
      patientIdStr: p3.patientId || "PID-1003",
      doctor: d1._id,
      doctorName: `Dr. ${d1.name}`,
      department: "Gastroenterology",
      test: usgTest._id,
      testCode: usgTest.testCode,
      testName: "Ultrasound Whole Abdomen & Pelvis",
      diagnosticDepartment: "Radiology",
      category: "Ultrasonography",
      modality: "Ultrasound",
      price: 1800,
      priority: "Routine",
      status: "Patient Ready",
      tokenNumber: "DX-042",
      scheduledDate: new Date(),
      scheduledTimeSlot: "11:30 AM",
      assignedRoom: "Sonography Suite 2",
      preparationRequired: true,
      preparationInstructions: "Overnight fasting (6-8 hours). Full urinary bladder required.",
    });
    await diagnosticSyncService.onDiagnosticRequestCreated(order3, {
      userName: "Front Desk Staff",
      role: "receptionist",
    });

    console.log("Seeding Scenario 4: Finalized Verified MRI Brain Report with Laser Film...");
    const order4 = await DiagnosticOrder.create({
      orderNumber: `DIAG-DEMO-MRI-004`,
      patient: p4._id,
      patientName: p4.name,
      patientIdStr: p4.patientId || "PID-1004",
      doctor: d2._id,
      doctorName: `Dr. ${d2.name}`,
      department: "Neurology",
      test: mriTest._id,
      testCode: mriTest.testCode,
      testName: "MRI Brain (Plain & Contrast Enhanced)",
      diagnosticDepartment: "Radiology",
      category: "Magnetic Resonance Imaging",
      modality: "MRI",
      price: 7500,
      priority: "Routine",
      status: "Finalized",
      billingStatus: "Paid",
    });

    const report4 = await DiagnosticReport.create({
      reportNumber: `RPT-DEMO-MRI-2026-004`,
      order: order4._id,
      orderNumber: order4.orderNumber,
      patient: p4._id,
      doctor: d2._id,
      department: "Radiology",
      modality: "MRI",
      test: mriTest._id,
      testName: "MRI Brain (Plain & Contrast Enhanced)",
      status: "Approved",
      publishedToPatient: true,
      publishedToDoctor: true,
      findings: "3T MRI of brain demonstrates normal ventricular morphology. No focal space occupying lesions, edema, or hemorrhage. Basal cisterns patent. Intracranial flow voids preserved.",
      impression: "Unremarkable study. No acute intracranial infarct, mass effect, or structural abnormalities.",
      radiologistSignOff: {
        doctorName: "Dr. Arthur Conan, MD (Radiology / Neuroradiology)",
        signedAt: new Date(),
      },
    });
    await diagnosticSyncService.onReportFinalized(report4, {
      userId: d2._id,
      userName: "Dr. Arthur Conan",
      role: "radiologist",
    });

    console.log("Seeding Scenario 5: Phlebotomy Sample Recollection Required...");
    const order5 = await DiagnosticOrder.create({
      orderNumber: `DIAG-DEMO-RECOL-005`,
      patient: p1._id,
      patientName: p1.name,
      patientIdStr: p1.patientId || "PID-1001",
      doctor: d1._id,
      doctorName: `Dr. ${d1.name}`,
      department: "Internal Medicine",
      test: cbcTest._id,
      testCode: "LFT_PROF",
      testName: "Comprehensive Liver Function Panel",
      diagnosticDepartment: "Pathology",
      category: "Biochemistry",
      modality: "Laboratory",
      price: 950,
      priority: "Urgent",
      status: "Sample Rejected",
      rejectionReason: "Gross hemolysis in serum separator tube (SST). Inaccurate potassium and enzyme readings.",
    });
    await diagnosticSyncService.onDiagnosticRequestCreated(order5, {
      userId: d1._id,
      userName: `Dr. ${d1.name}`,
      role: "doctor",
    });
    await diagnosticSyncService.onSampleRejected(order5._id, order5.rejectionReason, {
      userName: "Pathologist Lab Lead",
      role: "pathologist",
    });

    console.log("\n==========================================================================");
    console.log("    DIAGNOSTIC INTEGRATION DEMO DATA SUCCESSFULLY SEEDED!                ");
    console.log("==========================================================================\n");

  } catch (err) {
    console.error("Seeding error:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Database connection closed.");
  }
}

seedDiagnosticIntegration();
