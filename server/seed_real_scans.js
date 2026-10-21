import mongoose from "mongoose";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env"), override: true });

const MONGO_URI = process.env.MONGO_URI;

async function seedRealFiles() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGO_URI);
  console.log("Connected.");

  const { default: Patient } = await import("./models/Patient.js");
  const { default: DiagnosticOrder } = await import("./models/DiagnosticOrder.js");
  const { default: DiagnosticReport } = await import("./models/DiagnosticReport.js");
  const { default: DiagnosticFile } = await import("./models/DiagnosticFile.js");
  const { default: DiagnosticTest } = await import("./models/DiagnosticTest.js");
  const { default: User } = await import("./models/User.js");

  const patient = await Patient.findOne();
  const doctor = await User.findOne({ role: "doctor" });

  let ctTest = await DiagnosticTest.findOne({ modality: "CT Scan" });
  if (!ctTest) {
    ctTest = await DiagnosticTest.create({
      testCode: "RAD-CT-001",
      testName: "HRCT Chest Thorax High Resolution",
      department: "Radiology",
      category: "CT Scan",
      modality: "CT Scan",
      price: 3500,
      turnaroundTimeHours: 12,
      isActive: true,
    });
  }

  let mriTest = await DiagnosticTest.findOne({ modality: "MRI" });
  if (!mriTest) {
    mriTest = await DiagnosticTest.create({
      testCode: "RAD-MRI-001",
      testName: "MRI Brain with Contrast (T1, T2, FLAIR, DWI)",
      department: "Radiology",
      category: "MRI",
      modality: "MRI",
      price: 7000,
      turnaroundTimeHours: 24,
      isActive: true,
    });
  }

  // Ensure CT Order exists
  let ctOrder = await DiagnosticOrder.findOne({ orderNumber: "DIAG-2026-003" });
  if (!ctOrder && patient) {
    await DiagnosticOrder.create({
      orderNumber: "DIAG-2026-003",
      patient: patient._id,
      patientName: patient.name,
      patientIdStr: patient.patientId || patient.abhaId,
      doctor: doctor?._id,
      doctorName: doctor ? `Dr. ${doctor.name}` : "Dr. Rajesh Sharma",
      department: "Pulmonology",
      test: ctTest._id,
      testCode: "RAD-CT-001",
      testName: "HRCT Chest Thorax High Resolution",
      diagnosticDepartment: "Radiology",
      category: "CT Scan",
      modality: "CT",
      clinicalIndication: "Persistent cough & ground glass opacity evaluation",
      priority: "Urgent",
      status: "Finalized",
      price: 3500,
      assignedRoom: "CT Suite 1 - 128 Slice",
      assignedTechnicianName: "Ramesh Radiology Technician",
    });
  } else if (ctOrder) {
    ctOrder.modality = "CT";
    ctOrder.status = "Finalized";
    await ctOrder.save();
  }

  // Ensure MRI Order exists
  let mriOrder = await DiagnosticOrder.findOne({ orderNumber: "DIAG-2026-004" });
  if (!mriOrder && patient) {
    await DiagnosticOrder.create({
      orderNumber: "DIAG-2026-004",
      patient: patient._id,
      patientName: patient.name,
      patientIdStr: patient.patientId || patient.abhaId,
      doctor: doctor?._id,
      doctorName: doctor ? `Dr. ${doctor.name}` : "Dr. Rajesh Sharma",
      department: "Neurology",
      test: mriTest._id,
      testCode: "RAD-MRI-001",
      testName: "MRI Brain with Contrast (T1, T2, FLAIR, DWI)",
      diagnosticDepartment: "Radiology",
      category: "MRI",
      modality: "MRI",
      clinicalIndication: "Intractable headache & focal neurological deficit workup",
      priority: "Routine",
      status: "Finalized",
      price: 7000,
      assignedRoom: "MRI Suite 2 - 3.0 Tesla",
      assignedTechnicianName: "Ramesh Radiology Technician",
    });
  } else if (mriOrder) {
    mriOrder.modality = "MRI";
    mriOrder.status = "Finalized";
    await mriOrder.save();
  }

  const allRadOrders = await DiagnosticOrder.find({ modality: { $in: ["X-Ray", "CT", "MRI", "Ultrasound"] } }).populate("patient");

  for (const ord of allRadOrders) {
    const patientId = ord.patient?._id || ord.patient || patient._id;
    const modality = ord.modality || "X-Ray";
    const fileModality = modality === "CT" ? "CT Scan" : modality;

    let fileName = "sample_chest_xray.png";
    let originalName = "chest_xray_pa_view.png";
    let secureUrl = "/medical_scans/chest_xray_pa_view.png";

    if (modality === "CT") {
      fileName = "sample_ct_scan.png";
      originalName = "ct_thorax_axial.png";
      secureUrl = "/medical_scans/ct_thorax_axial.png";
    } else if (modality === "MRI") {
      fileName = "sample_brain_mri.png";
      originalName = "mri_brain_axial.png";
      secureUrl = "/medical_scans/mri_brain_axial.png";
    } else if (modality === "Ultrasound") {
      fileName = "sample_abdominal_usg.png";
      originalName = "usg_abdomen.png";
      secureUrl = "/medical_scans/usg_abdomen.png";
    }

    const storagePath = path.resolve(__dirname, "storage", "medical_files", fileName);

    await DiagnosticFile.deleteMany({ diagnosticOrder: ord._id });

    // Insert 4 slices for each scan so 4-Up and 9-Up layouts have rich multi-frame series!
    const attachments = [];
    for (let s = 1; s <= 4; s++) {
      const fId = crypto.randomUUID();
      const file = await DiagnosticFile.create({
        fileId: fId,
        patient: patientId,
        diagnosticOrder: ord._id,
        fileName,
        originalName: s === 1 ? originalName : `${originalName.replace(".png", "")}_slice_0${s}.png`,
        mimeType: "image/png",
        fileSize: 550000,
        storageProvider: "local_object_storage",
        storagePath,
        secureUrl,
        uploadedByName: "Senior Imaging Technologist",
        studyModality: fileModality,
      });

      attachments.push({
        fileId: fId,
        originalName: file.originalName,
        mimeType: "image/png",
        fileSize: 550000,
        secureUrl,
        studyModality: fileModality,
        uploadedAt: new Date(),
      });
    }

    ord.fileAttachments = attachments;
    await ord.save();

    // Ensure corresponding DiagnosticReport exists
    let rep = await DiagnosticReport.findOne({ order: ord._id });
    if (!rep) {
      rep = await DiagnosticReport.create({
        reportNumber: `REP-${ord.orderNumber.replace("DIAG-", "")}`,
        order: ord._id,
        patient: patientId,
        patientName: ord.patientName,
        patientAge: ord.patient?.age || 45,
        patientGender: ord.patient?.gender || "Male",
        patientAbhaId: ord.patient?.abhaId || "14-8891-2345-6789",
        doctor: ord.doctor,
        doctorName: ord.doctorName,
        test: ord.test,
        testName: ord.testName,
        testCode: ord.testCode,
        department: "Radiology",
        category: ord.category,
        modality: ord.modality,
        status: "Finalized",
        fileAttachments: attachments,
        radiologyStudy: {
          technique: "Standard digital volumetric protocol with optimal contrast enhancement.",
          findings: "Anatomical structures well visualized with normal morphological appearances and physiological boundaries.",
          impression: "No acute pathology demonstrated. Normal examination.",
          recommendations: "Follow up as clinically indicated.",
        },
        summaryConclusion: "Normal examination without acute pathology.",
        specialistName: "Dr. Vikram Seth, MD",
      });
      ord.report = rep._id;
      await ord.save();
    } else {
      rep.fileAttachments = attachments;
      await rep.save();
    }

    console.log(`Updated Order ${ord.orderNumber} (${modality}) with ${attachments.length} real scan slices.`);
  }

  console.log("All radiology studies successfully configured with real medical film slices.");
  await mongoose.disconnect();
}

seedRealFiles().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
