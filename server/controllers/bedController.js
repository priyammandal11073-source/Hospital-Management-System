import mongoose from "mongoose";
import Bed from "../models/Bed.js";
import Patient from "../models/Patient.js";
import Billing from "../models/Billing.js";
import asyncHandler from "../middleware/asyncHandler.js";
import AppError from "../utils/AppError.js";
import { requireDb } from "../utils/requireDb.js";

const WARDS = [
  "General Ward",
  "ICU (Intensive Care Unit)",
  "CCU (Critical Care Unit)",
  "Emergency & Trauma",
  "Pediatric Ward",
  "Private Deluxe Room",
];

// GET /api/beds
export const getAllBeds = asyncHandler(async (req, res) => {
  const { ward, status, search } = req.query;

  await requireDb();

  const filter = {};

  if (ward && ward.trim()) {
    filter.ward = ward.trim();
  }

  if (status && status.trim()) {
    filter.status = status.trim();
  }

  if (search && search.trim()) {
    const searchRegex = new RegExp(search.trim(), "i");
    // Find matching patients
    const matchedPatients = await Patient.find({
      $or: [{ name: searchRegex }, { abhaId: searchRegex }, { contactNumber: searchRegex }],
    }).select("_id");
    const patientIds = matchedPatients.map((p) => p._id);

    filter.$or = [
      { bedNumber: searchRegex },
      { ward: searchRegex },
      { floor: searchRegex },
      { "currentAdmission.patient": { $in: patientIds } },
    ];
  }

  const beds = await Bed.find(filter)
    .populate("currentAdmission.patient", "name age gender contactNumber email abhaId bloodGroup address")
    .populate("currentAdmission.attendingDoctor", "name specialization department contactNumber email")
    .sort({ ward: 1, bedNumber: 1 });

  return res.status(200).json({ beds });
});

// GET /api/beds/summary
export const getBedSummary = asyncHandler(async (req, res) => {
  await requireDb();

  const beds = await Bed.find({})
    .populate("currentAdmission.patient", "name age gender contactNumber email abhaId bloodGroup address")
    .populate("currentAdmission.attendingDoctor", "name specialization department contactNumber email")
    .sort({ ward: 1, bedNumber: 1 });
  
  const total = beds.length;
  const occupied = beds.filter((b) => b.status === "occupied").length;
  const available = beds.filter((b) => b.status === "available").length;
  const cleaning = beds.filter((b) => b.status === "cleaning").length;
  const maintenance = beds.filter((b) => b.status === "maintenance").length;
  const occupancyRate = total > 0 ? Math.round((occupied / total) * 100) : 0;

  const wardStats = WARDS.map((w) => {
    const wardBeds = beds.filter((b) => b.ward === w);
    return {
      ward: w,
      total: wardBeds.length,
      occupied: wardBeds.filter((b) => b.status === "occupied").length,
      available: wardBeds.filter((b) => b.status === "available").length,
      cleaning: wardBeds.filter((b) => b.status === "cleaning").length,
      maintenance: wardBeds.filter((b) => b.status === "maintenance").length,
    };
  });

  return res.status(200).json({
    summary: {
      total,
      occupied,
      available,
      cleaning,
      maintenance,
      occupancyRate,
      wards: wardStats,
    },
  });
});

// GET /api/beds/:id
export const getBedById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError("Invalid bed ID", 400);
  }

  const bed = await Bed.findById(id)
    .populate("currentAdmission.patient", "name age gender contactNumber email abhaId bloodGroup address allergies medicalHistory")
    .populate("currentAdmission.attendingDoctor", "name specialization department contactNumber email")
    .populate("admissionHistory.patient", "name age gender contactNumber abhaId")
    .populate("admissionHistory.attendingDoctor", "name specialization department");

  if (!bed) {
    throw new AppError("Bed not found", 404);
  }

  return res.status(200).json({ bed });
});

// POST /api/beds
export const createBed = asyncHandler(async (req, res) => {
  const { bedNumber, ward, floor, dailyRate, features } = req.body;

  if (!bedNumber || !ward) {
    throw new AppError("Bed number and ward are required", 400);
  }

  const existing = await Bed.findOne({ bedNumber: bedNumber.trim().toUpperCase() });
  if (existing) {
    throw new AppError(`Bed number ${bedNumber.trim().toUpperCase()} already exists`, 409);
  }

  const bed = await Bed.create({
    bedNumber: bedNumber.trim().toUpperCase(),
    ward,
    floor: floor || "Ground floor",
    dailyRate: dailyRate !== undefined ? Number(dailyRate) : 1000,
    features: features || {},
    status: "available",
  });

  return res.status(201).json({ message: "Bed added successfully", bed });
});

// POST /api/beds/:id/allocate
export const allocateBed = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { patient, attendingDoctor, admissionReason, expectedDischargeDate, emergencyContact, notes } = req.body;

  if (!mongoose.isValidObjectId(id)) {
    throw new AppError("Invalid bed ID", 400);
  }

  if (!patient || !attendingDoctor || !admissionReason) {
    throw new AppError("Patient, attending doctor, and admission reason are required", 400);
  }

  if (!mongoose.isValidObjectId(patient) || !mongoose.isValidObjectId(attendingDoctor)) {
    throw new AppError("Invalid patient or doctor ID", 400);
  }

  await requireDb();

  // Check if patient is already admitted in another bed
  const existingAdmission = await Bed.findOne({
    "currentAdmission.patient": patient,
    status: "occupied",
  });

  if (existingAdmission) {
    throw new AppError(
      `This patient is already admitted in bed ${existingAdmission.bedNumber} (${existingAdmission.ward}). Please transfer or discharge first.`,
      409
    );
  }

  // Atomic reservation: ensures no concurrent transaction can double-allocate this bed
  const updatedBed = await Bed.findOneAndUpdate(
    { _id: id, status: "available" },
    {
      $set: {
        status: "occupied",
        currentAdmission: {
          patient,
          attendingDoctor,
          admittedAt: new Date(),
          admissionReason: admissionReason.trim(),
          expectedDischargeDate: expectedDischargeDate ? new Date(expectedDischargeDate) : undefined,
          emergencyContact: emergencyContact ? emergencyContact.trim() : "",
          notes: notes ? notes.trim() : "",
        },
      },
    },
    { new: true }
  );

  if (!updatedBed) {
    const currentBed = await Bed.findById(id);
    if (!currentBed) {
      throw new AppError("Bed not found", 404);
    }
    throw new AppError(
      `Bed ${currentBed.bedNumber} is currently ${currentBed.status}. Only available beds can be allocated.`,
      409
    );
  }

  const populated = await Bed.findById(updatedBed._id)
    .populate("currentAdmission.patient", "name age gender contactNumber email abhaId bloodGroup address")
    .populate("currentAdmission.attendingDoctor", "name specialization department contactNumber email");

  return res.status(200).json({
    message: `Patient successfully admitted to bed ${updatedBed.bedNumber}`,
    bed: populated,
  });
});

// POST /api/beds/:id/transfer
export const transferBed = asyncHandler(async (req, res) => {
  const { id: sourceBedId } = req.params;
  const { targetBedId, transferReason } = req.body;

  if (!mongoose.isValidObjectId(sourceBedId) || !mongoose.isValidObjectId(targetBedId)) {
    throw new AppError("Invalid source or target bed ID", 400);
  }

  if (sourceBedId === targetBedId) {
    throw new AppError("Target bed cannot be the same as source bed", 400);
  }

  const [sourceBed, targetBed] = await Promise.all([
    Bed.findById(sourceBedId),
    Bed.findById(targetBedId),
  ]);

  if (!sourceBed) throw new AppError("Source bed not found", 404);
  if (!targetBed) throw new AppError("Target bed not found", 404);

  if (sourceBed.status !== "occupied" || !sourceBed.currentAdmission) {
    throw new AppError(`Source bed ${sourceBed.bedNumber} is not currently occupied`, 400);
  }

  if (targetBed.status !== "available") {
    throw new AppError(
      `Target bed ${targetBed.bedNumber} is ${targetBed.status}. Only available beds can receive a patient.`,
      400
    );
  }

  const admissionData = sourceBed.currentAdmission.toObject ? sourceBed.currentAdmission.toObject() : sourceBed.currentAdmission;

  // Put patient into target bed
  targetBed.status = "occupied";
  targetBed.currentAdmission = {
    ...admissionData,
    notes: `${admissionData.notes || ""}${admissionData.notes ? " | " : ""}Transferred from ${sourceBed.bedNumber} (${sourceBed.ward}) on ${new Date().toLocaleDateString("en-IN")}${transferReason ? `: ${transferReason}` : ""}`.trim(),
  };

  // Free source bed and place into cleaning
  sourceBed.status = "cleaning";
  sourceBed.currentAdmission = null;

  await Promise.all([sourceBed.save(), targetBed.save()]);

  const populatedTarget = await Bed.findById(targetBed._id)
    .populate("currentAdmission.patient", "name age gender contactNumber email abhaId bloodGroup address")
    .populate("currentAdmission.attendingDoctor", "name specialization department contactNumber email");

  return res.status(200).json({
    message: `Patient successfully transferred from ${sourceBed.bedNumber} to ${targetBed.bedNumber}`,
    sourceBed,
    targetBed: populatedTarget,
  });
});

// POST /api/beds/:id/discharge
export const dischargeBed = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { dischargeSummary, generateBill = true } = req.body;

  if (!mongoose.isValidObjectId(id)) {
    throw new AppError("Invalid bed ID", 400);
  }

  const bed = await Bed.findById(id);
  if (!bed) {
    throw new AppError("Bed not found", 404);
  }

  if (bed.status !== "occupied" || !bed.currentAdmission) {
    throw new AppError(`Bed ${bed.bedNumber} is not currently occupied`, 400);
  }

  const admission = bed.currentAdmission;
  const admittedAt = new Date(admission.admittedAt);
  const dischargedAt = new Date();

  // Calculate days: minimum 1 day
  const diffMs = dischargedAt.getTime() - admittedAt.getTime();
  const diffDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  const totalBedCost = diffDays * (bed.dailyRate || 1000);

  // Add to admission history
  bed.admissionHistory.unshift({
    patient: admission.patient,
    attendingDoctor: admission.attendingDoctor,
    admittedAt,
    dischargedAt,
    admissionReason: admission.admissionReason,
    dischargeSummary: dischargeSummary ? dischargeSummary.trim() : "Patient discharged in stable condition.",
    totalDays: diffDays,
    totalBedCost,
  });

  const patientId = admission.patient;

  // Reset bed to cleaning
  bed.status = "cleaning";
  bed.currentAdmission = null;
  await bed.save();

  let createdBilling = null;
  if (generateBill) {
    createdBilling = await Billing.create({
      patient: patientId,
      bed: bed._id,
      itemizedCharges: [
        {
          description: `${bed.ward} Bed Charges (${bed.bedNumber}) - ${diffDays} day(s) @ ₹${bed.dailyRate}/day`,
          cost: totalBedCost,
        },
      ],
      totalAmount: totalBedCost,
      paymentStatus: "pending",
    });
  }

  return res.status(200).json({
    message: `Patient discharged from ${bed.bedNumber}. Bed is now in cleaning status.`,
    bed,
    staySummary: {
      admittedAt,
      dischargedAt,
      totalDays: diffDays,
      dailyRate: bed.dailyRate,
      totalBedCost,
    },
    billing: createdBilling,
  });
});

// PATCH /api/beds/:id/status
export const updateBedStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!mongoose.isValidObjectId(id)) {
    throw new AppError("Invalid bed ID", 400);
  }

  const validStatuses = ["available", "cleaning", "maintenance"];
  if (!validStatuses.includes(status)) {
    throw new AppError("Status must be 'available', 'cleaning', or 'maintenance'", 400);
  }

  const bed = await Bed.findById(id);
  if (!bed) {
    throw new AppError("Bed not found", 404);
  }

  if (bed.status === "occupied") {
    throw new AppError("Cannot change status directly while bed is occupied by a patient. Use discharge instead.", 400);
  }

  bed.status = status;
  await bed.save();

  return res.status(200).json({
    message: `Bed ${bed.bedNumber} status updated to ${status}`,
    bed,
  });
});

// DELETE /api/beds/:id
export const deleteBed = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError("Invalid bed ID", 400);
  }

  const bed = await Bed.findById(id);
  if (!bed) {
    throw new AppError("Bed not found", 404);
  }

  if (bed.status === "occupied") {
    throw new AppError("Cannot delete an occupied bed", 400);
  }

  await Bed.findByIdAndDelete(id);

  return res.status(200).json({ message: `Bed ${bed.bedNumber} deleted successfully` });
});
