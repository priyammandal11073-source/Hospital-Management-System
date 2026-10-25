import mongoose from "mongoose";
import nodemailer from "nodemailer";
import Prescription from "../models/Prescription.js";
import Patient from "../models/Patient.js";
import Doctor from "../models/Doctor.js";
import Appointment from "../models/Appointment.js";
import { resolveDoctorForUser, formatDoctorName } from "../utils/doctorHelper.js";
import env from "../config/env.js";
import asyncHandler from "../middleware/asyncHandler.js";
import AppError from "../utils/AppError.js";
import { requireDb } from "../utils/requireDb.js";

const generateRxNumber = () => {
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const year = new Date().getFullYear();
  return `RX-${year}-${randomSuffix}`;
};

// POST /api/prescriptions
export const createPrescription = asyncHandler(async (req, res) => {
  await requireDb();

  const {
    patient,
    doctor,
    appointment,
    diagnosis,
    symptoms,
    vitals,
    medications,
    labTestsRecommended,
    advice,
    followUpDate,
  } = req.body;

  let targetDoctorId = doctor;
  if (req.user?.role === "doctor") {
    const myDoctor = await resolveDoctorForUser(req.user);
    if (!myDoctor) {
      throw new AppError("Doctor profile not found for this account", 403);
    }
    targetDoctorId = myDoctor._id;
  }

  if (!patient || !targetDoctorId || !diagnosis || !medications || medications.length === 0) {
    throw new AppError("Patient, doctor, diagnosis, and at least one medication are required", 400);
  }

  if (!mongoose.isValidObjectId(patient) || !mongoose.isValidObjectId(targetDoctorId)) {
    throw new AppError("Invalid patient or doctor ID", 400);
  }

  const [patientRecord, doctorRecord] = await Promise.all([
    Patient.findById(patient),
    Doctor.findById(targetDoctorId),
  ]);

  if (!patientRecord) {
    throw new AppError("Patient not found", 404);
  }

  if (!doctorRecord) {
    throw new AppError("Doctor not found", 404);
  }

  let rxNumber = generateRxNumber();
  let exists = await Prescription.findOne({ prescriptionNumber: rxNumber });
  while (exists) {
    rxNumber = generateRxNumber();
    exists = await Prescription.findOne({ prescriptionNumber: rxNumber });
  }

  const prescription = await Prescription.create({
    prescriptionNumber: rxNumber,
    patient,
    doctor: targetDoctorId,
    appointment: appointment && mongoose.isValidObjectId(appointment) ? appointment : undefined,
    diagnosis: diagnosis.trim(),
    symptoms: Array.isArray(symptoms) ? symptoms : typeof symptoms === "string" ? symptoms.split(",").map(s => s.trim()).filter(Boolean) : [],
    vitals: vitals || {},
    medications,
    labTestsRecommended: Array.isArray(labTestsRecommended) ? labTestsRecommended : typeof labTestsRecommended === "string" ? labTestsRecommended.split(",").map(s => s.trim()).filter(Boolean) : [],
    advice: advice ? advice.trim() : "",
    followUpDate: followUpDate || undefined,
    digitalSignature: {
      signedByName: formatDoctorName(doctorRecord.name),
      designation: `${doctorRecord.specialization} (${doctorRecord.department})`,
      signedAt: new Date(),
    },
  });

  // If linked to an appointment, mark appointment as completed
  if (appointment && mongoose.isValidObjectId(appointment)) {
    await Appointment.findByIdAndUpdate(appointment, { status: "completed" });
  }

  const populated = await Prescription.findById(prescription._id)
    .populate("patient", "name age gender contactNumber email abhaId address bloodGroup")
    .populate("doctor", "name specialization department contactNumber email");

  return res.status(201).json({
    message: "Digital prescription generated successfully",
    prescription: populated,
  });
});

// GET /api/prescriptions
export const getAllPrescriptions = asyncHandler(async (req, res) => {
  const { patient, doctor, search } = req.query;

  await requireDb();

  const filter = {};

  // Doctor role enforcement: doctor can only view their own authored prescriptions
  if (req.user?.role === "doctor") {
    const myDoctor = await resolveDoctorForUser(req.user);
    if (!myDoctor) {
      throw new AppError("Doctor profile not found for this account", 403);
    }
    filter.doctor = myDoctor._id;
  } else if (doctor && mongoose.isValidObjectId(doctor)) {
    filter.doctor = doctor;
  }

  if (patient && mongoose.isValidObjectId(patient)) {
    filter.patient = patient;
  }

  if (search && search.trim()) {
    const searchRegex = new RegExp(search.trim(), "i");
    // Find matching patients first
    const matchedPatients = await Patient.find({
      $or: [{ name: searchRegex }, { abhaId: searchRegex }, { contactNumber: searchRegex }],
    }).select("_id");

    const patientIds = matchedPatients.map((p) => p._id);

    filter.$or = [
      { prescriptionNumber: searchRegex },
      { diagnosis: searchRegex },
      { patient: { $in: patientIds } },
    ];
  }

  const prescriptions = await Prescription.find(filter)
    .populate("patient", "name age gender contactNumber email abhaId")
    .populate("doctor", "name specialization department")
    .sort({ createdAt: -1 });

  return res.status(200).json({ prescriptions });
});

// GET /api/prescriptions/:id
export const getPrescriptionById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    throw new AppError("Invalid prescription ID", 400);
  }

  await requireDb();

  const prescription = await Prescription.findById(id)
    .populate("patient", "name age gender contactNumber email abhaId address bloodGroup allergies medicalHistory")
    .populate("doctor", "name specialization department contactNumber email yearsOfExperience")
    .populate("appointment", "appointmentDate timeSlot reasonForVisit");

  if (!prescription) {
    throw new AppError("Prescription not found", 404);
  }

  // Doctor role enforcement
  if (req.user?.role === "doctor") {
    const myDoctor = await resolveDoctorForUser(req.user);
    if (!myDoctor || !prescription.doctor?._id.equals(myDoctor._id)) {
      throw new AppError("Access denied. You can only view your own prescriptions.", 403);
    }
  }

  return res.status(200).json({ prescription });
});

// PUT /api/prescriptions/:id
export const updatePrescription = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    throw new AppError("Invalid prescription ID", 400);
  }

  await requireDb();

  // Doctor role enforcement
  if (req.user?.role === "doctor") {
    const myDoctor = await resolveDoctorForUser(req.user);
    const existing = await Prescription.findById(id);
    if (!existing) {
      throw new AppError("Prescription not found", 404);
    }
    if (!myDoctor || !existing.doctor.equals(myDoctor._id)) {
      throw new AppError("Access denied. You can only modify your own prescriptions.", 403);
    }
  }

  const { diagnosis, symptoms, vitals, medications, labTestsRecommended, advice, followUpDate } = req.body;

  const updates = {};
  if (diagnosis) updates.diagnosis = diagnosis.trim();
  if (symptoms) updates.symptoms = Array.isArray(symptoms) ? symptoms : symptoms.split(",").map(s => s.trim()).filter(Boolean);
  if (vitals) updates.vitals = vitals;
  if (medications) updates.medications = medications;
  if (labTestsRecommended) updates.labTestsRecommended = Array.isArray(labTestsRecommended) ? labTestsRecommended : labTestsRecommended.split(",").map(s => s.trim()).filter(Boolean);
  if (advice !== undefined) updates.advice = advice.trim();
  if (followUpDate !== undefined) updates.followUpDate = followUpDate || null;

  const updated = await Prescription.findByIdAndUpdate(id, updates, { new: true, runValidators: true })
    .populate("patient", "name age gender contactNumber email abhaId")
    .populate("doctor", "name specialization department");

  if (!updated) {
    throw new AppError("Prescription not found", 404);
  }

  return res.status(200).json({
    message: "Prescription updated successfully",
    prescription: updated,
  });
});

// DELETE /api/prescriptions/:id
export const deletePrescription = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    throw new AppError("Invalid prescription ID", 400);
  }

  await requireDb();

  // Doctor role enforcement
  if (req.user?.role === "doctor") {
    const myDoctor = await resolveDoctorForUser(req.user);
    const existing = await Prescription.findById(id);
    if (!existing) {
      throw new AppError("Prescription not found", 404);
    }
    if (!myDoctor || !existing.doctor.equals(myDoctor._id)) {
      throw new AppError("Access denied. You can only delete your own prescriptions.", 403);
    }
  }

  const deleted = await Prescription.findByIdAndDelete(id);

  if (!deleted) {
    throw new AppError("Prescription not found", 404);
  }

  return res.status(200).json({ message: "Prescription deleted successfully" });
});

// POST /api/prescriptions/:id/send-email
export const sendPrescriptionEmail = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    throw new AppError("Invalid prescription ID", 400);
  }

  await requireDb();

  const prescription = await Prescription.findById(id)
    .populate("patient", "name email age gender contactNumber abhaId")
    .populate("doctor", "name specialization department contactNumber");

  if (!prescription) {
    throw new AppError("Prescription not found", 404);
  }

  if (!prescription.patient?.email) {
    throw new AppError("This patient does not have an email address on file", 400);
  }

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
    isTest = true;
  }

  const medsHtml = prescription.medications
    .map(
      (m, i) => `
      <tr style="${i % 2 === 0 ? "background:#fff;" : "background:#f8fafc;"}">
        <td style="padding: 9px 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #0f172a;">${m.name}</td>
        <td style="padding: 9px 10px; border-bottom: 1px solid #e2e8f0; color: #334155;">${m.dosage}</td>
        <td style="padding: 9px 10px; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: #0d9488;">${m.frequency}</td>
        <td style="padding: 9px 10px; border-bottom: 1px solid #e2e8f0; color: #475569;">${m.timing}</td>
        <td style="padding: 9px 10px; border-bottom: 1px solid #e2e8f0; color: #475569;">${m.duration}</td>
        <td style="padding: 9px 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">${m.instructions || "—"}</td>
      </tr>
    `
    )
    .join("");

  const formattedDate = new Date(prescription.createdAt).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 24px; border: 1px solid #cbd5e1; border-radius: 12px; background: #ffffff;">
      <div style="border-bottom: 2px solid #0d9488; padding-bottom: 16px; margin-bottom: 20px;">
        <h2 style="color: #0f172a; margin: 0 0 4px 0;">NIVORA CARE HOSPITAL</h2>
        <p style="color: #0d9488; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 4px 0;">Care • Trust • Healing | Digital Clinical Prescription</p>
        <p style="color: #64748b; font-size: 12px; margin: 0;">Outer Ring Road, Near AIIMS Metro, New Delhi - 110029 • Emergency: 108 / 112</p>
        <p style="color: #64748b; font-size: 11px; margin: 2px 0 0 0;">NABH Accredited (NABH-2023-0412) • ABDM Connected</p>
      </div>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin-bottom: 20px;">
        <table style="width: 100%; font-size: 13px;">
          <tr>
            <td><strong>Patient:</strong> ${prescription.patient.name} (${prescription.patient.age} yrs / ${prescription.patient.gender})</td>
            <td style="text-align: right;"><strong>Rx Number:</strong> ${prescription.prescriptionNumber}</td>
          </tr>
          <tr>
            <td>${prescription.patient.abhaId ? `<strong>ABHA ID:</strong> ${prescription.patient.abhaId}` : ""}</td>
            <td style="text-align: right;"><strong>Date:</strong> ${formattedDate}</td>
          </tr>
          <tr>
            <td><strong>Doctor:</strong> Dr. ${prescription.doctor.name} (${prescription.doctor.specialization})</td>
            <td style="text-align: right;"><strong>Department:</strong> ${prescription.doctor.department}</td>
          </tr>
        </table>
      </div>

      <div style="margin-bottom: 16px;">
        <strong style="color: #0f172a; font-size: 14px;">Diagnosis:</strong>
        <p style="margin: 4px 0 0 0; font-size: 14px; color: #1e293b; background: #f0fdf4; padding: 8px 12px; border-left: 3px solid #0d9488; border-radius: 4px;">${prescription.diagnosis}</p>
      </div>

      <div style="margin-bottom: 20px;">
        <h3 style="color: #0f172a; font-size: 16px; margin: 0 0 10px 0;">℞ Prescribed Medications</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <thead>
            <tr style="background: #f1f5f9; text-align: left; font-size: 11px; text-transform: uppercase; color: #475569;">
              <th style="padding: 8px 10px; border-bottom: 2px solid #cbd5e1;">Medicine</th>
              <th style="padding: 8px 10px; border-bottom: 2px solid #cbd5e1;">Dosage</th>
              <th style="padding: 8px 10px; border-bottom: 2px solid #cbd5e1;">Frequency</th>
              <th style="padding: 8px 10px; border-bottom: 2px solid #cbd5e1;">Timing</th>
              <th style="padding: 8px 10px; border-bottom: 2px solid #cbd5e1;">Duration</th>
              <th style="padding: 8px 10px; border-bottom: 2px solid #cbd5e1;">Instructions</th>
            </tr>
          </thead>
          <tbody>
            ${medsHtml}
          </tbody>
        </table>
      </div>

      ${prescription.advice ? `
        <div style="margin-bottom: 16px;">
          <strong style="color: #0f172a; font-size: 13px;">Diet & Clinical Advice:</strong>
          <p style="margin: 4px 0 0 0; font-size: 13px; color: #475569;">${prescription.advice}</p>
        </div>
      ` : ""}

      <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 24px; display: flex; justify-content: space-between; align-items: flex-end;">
        <div style="font-size: 11px; color: #64748b;">
          This is an official computer-generated digital prescription issued by Nivora Care Hospital.<br />
          For medical queries, contact our 24/7 helpline at +91 98765 43210.
        </div>
      </div>
    </div>
  `;

  let info;
  try {
    info = await transporter.sendMail({
      from: env.smtp.from || `"Nivora Care Hospital" <prescriptions@nivoracare.com>`,
      to: prescription.patient.email,
      subject: `Digital Prescription ${prescription.prescriptionNumber} - Nivora Care Hospital`,
      html: emailHtml,
    });
  } catch (mailErr) {
    throw new AppError("Failed to send prescription email: " + mailErr.message, 500);
  }

  let previewUrl = null;
  if (isTest && nodemailer.getTestMessageUrl && info) {
    previewUrl = nodemailer.getTestMessageUrl(info);
  }

  return res.status(200).json({
    message: `Prescription successfully emailed to ${prescription.patient.email}!`,
    previewUrl,
  });
});

// POST /api/prescriptions/:id/administer
export const recordMedicationAdministration = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { medicationIndex, status = "given", notes = "" } = req.body;

  if (!mongoose.isValidObjectId(id)) {
    throw new AppError("Invalid prescription ID", 400);
  }

  await requireDb();

  const prescription = await Prescription.findById(id).populate("patient doctor");
  if (!prescription) {
    throw new AppError("Prescription not found", 404);
  }

  const medIndex = Number(medicationIndex);
  if (isNaN(medIndex) || medIndex < 0 || medIndex >= prescription.medications.length) {
    throw new AppError("Invalid medication selection", 400);
  }

  const med = prescription.medications[medIndex];

  const adminEntry = {
    medicationIndex: medIndex,
    medicationName: med.name,
    doseTime: new Date(),
    administeredBy: req.user._id,
    administeredByName: req.user.name || "Staff Nurse",
    status: ["given", "held", "refused"].includes(status) ? status : "given",
    notes: typeof notes === "string" ? notes.trim() : "",
  };

  prescription.administrations.unshift(adminEntry);
  await prescription.save();

  return res.status(200).json({
    message: `Dose of ${med.name} marked as ${status} by ${req.user.name || "Nurse"}.`,
    administration: adminEntry,
    administrations: prescription.administrations,
    prescription,
  });
});
