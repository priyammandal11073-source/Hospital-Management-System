import mongoose from "mongoose";
import Bed from "../models/Bed.js";
import Patient from "../models/Patient.js";
import Doctor from "../models/Doctor.js";
import Billing from "../models/Billing.js";

const WARDS = [
  "General Ward",
  "ICU (Intensive Care Unit)",
  "CCU (Critical Care Unit)",
  "Emergency & Trauma",
  "Pediatric Ward",
  "Private Deluxe Room",
];

// GET /api/beds
export const getAllBeds = async (req, res) => {
  try {
    const { ward, status, search } = req.query;
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
  } catch (error) {
    console.error("Get all beds error:", error);
    return res.status(500).json({ message: "Failed to fetch beds" });
  }
};

// GET /api/beds/summary
export const getBedSummary = async (req, res) => {
  try {
    const beds = await Bed.find({});
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
  } catch (error) {
    console.error("Get bed summary error:", error);
    return res.status(500).json({ message: "Failed to calculate bed summary" });
  }
};

// GET /api/beds/:id
export const getBedById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid bed ID" });
    }

    const bed = await Bed.findById(id)
      .populate("currentAdmission.patient", "name age gender contactNumber email abhaId bloodGroup address allergies medicalHistory")
      .populate("currentAdmission.attendingDoctor", "name specialization department contactNumber email")
      .populate("admissionHistory.patient", "name age gender contactNumber abhaId")
      .populate("admissionHistory.attendingDoctor", "name specialization department");

    if (!bed) {
      return res.status(404).json({ message: "Bed not found" });
    }

    return res.status(200).json({ bed });
  } catch (error) {
    console.error("Get bed by ID error:", error);
    return res.status(500).json({ message: "Failed to fetch bed details" });
  }
};

// POST /api/beds
export const createBed = async (req, res) => {
  try {
    const { bedNumber, ward, floor, dailyRate, features } = req.body;

    if (!bedNumber || !ward) {
      return res.status(400).json({ message: "Bed number and ward are required" });
    }

    const existing = await Bed.findOne({ bedNumber: bedNumber.trim().toUpperCase() });
    if (existing) {
      return res.status(409).json({ message: `Bed number ${bedNumber.trim().toUpperCase()} already exists` });
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
  } catch (error) {
    console.error("Create bed error:", error);
    return res.status(400).json({ message: error.message || "Failed to create bed" });
  }
};

// POST /api/beds/:id/allocate
export const allocateBed = async (req, res) => {
  try {
    const { id } = req.params;
    const { patient, attendingDoctor, admissionReason, expectedDischargeDate, emergencyContact, notes } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid bed ID" });
    }

    if (!patient || !attendingDoctor || !admissionReason) {
      return res.status(400).json({ message: "Patient, attending doctor, and admission reason are required" });
    }

    if (!mongoose.isValidObjectId(patient) || !mongoose.isValidObjectId(attendingDoctor)) {
      return res.status(400).json({ message: "Invalid patient or doctor ID" });
    }

    const bed = await Bed.findById(id);
    if (!bed) {
      return res.status(404).json({ message: "Bed not found" });
    }

    if (bed.status !== "available") {
      return res.status(400).json({
        message: `Bed ${bed.bedNumber} is currently ${bed.status}. Only available beds can be allocated.`,
      });
    }

    // Check if patient is already admitted in another bed
    const existingAdmission = await Bed.findOne({
      "currentAdmission.patient": patient,
      status: "occupied",
    });

    if (existingAdmission) {
      return res.status(409).json({
        message: `This patient is already admitted in bed ${existingAdmission.bedNumber} (${existingAdmission.ward}). Please transfer or discharge first.`,
      });
    }

    bed.status = "occupied";
    bed.currentAdmission = {
      patient,
      attendingDoctor,
      admittedAt: new Date(),
      admissionReason: admissionReason.trim(),
      expectedDischargeDate: expectedDischargeDate ? new Date(expectedDischargeDate) : undefined,
      emergencyContact: emergencyContact ? emergencyContact.trim() : "",
      notes: notes ? notes.trim() : "",
    };

    await bed.save();

    const populated = await Bed.findById(bed._id)
      .populate("currentAdmission.patient", "name age gender contactNumber email abhaId bloodGroup address")
      .populate("currentAdmission.attendingDoctor", "name specialization department contactNumber email");

    return res.status(200).json({
      message: `Patient successfully admitted to bed ${bed.bedNumber}`,
      bed: populated,
    });
  } catch (error) {
    console.error("Allocate bed error:", error);
    return res.status(400).json({ message: error.message || "Failed to allocate bed" });
  }
};

// POST /api/beds/:id/transfer
export const transferBed = async (req, res) => {
  try {
    const { id: sourceBedId } = req.params;
    const { targetBedId, transferReason } = req.body;

    if (!mongoose.isValidObjectId(sourceBedId) || !mongoose.isValidObjectId(targetBedId)) {
      return res.status(400).json({ message: "Invalid source or target bed ID" });
    }

    if (sourceBedId === targetBedId) {
      return res.status(400).json({ message: "Target bed cannot be the same as source bed" });
    }

    const [sourceBed, targetBed] = await Promise.all([
      Bed.findById(sourceBedId),
      Bed.findById(targetBedId),
    ]);

    if (!sourceBed) return res.status(404).json({ message: "Source bed not found" });
    if (!targetBed) return res.status(404).json({ message: "Target bed not found" });

    if (sourceBed.status !== "occupied" || !sourceBed.currentAdmission) {
      return res.status(400).json({ message: `Source bed ${sourceBed.bedNumber} is not currently occupied` });
    }

    if (targetBed.status !== "available") {
      return res.status(400).json({
        message: `Target bed ${targetBed.bedNumber} is ${targetBed.status}. Only available beds can receive a patient.`,
      });
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
  } catch (error) {
    console.error("Transfer bed error:", error);
    return res.status(400).json({ message: error.message || "Failed to transfer bed" });
  }
};

// POST /api/beds/:id/discharge
export const dischargeBed = async (req, res) => {
  try {
    const { id } = req.params;
    const { dischargeSummary, generateBill = true } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid bed ID" });
    }

    const bed = await Bed.findById(id);
    if (!bed) {
      return res.status(404).json({ message: "Bed not found" });
    }

    if (bed.status !== "occupied" || !bed.currentAdmission) {
      return res.status(400).json({ message: `Bed ${bed.bedNumber} is not currently occupied` });
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
  } catch (error) {
    console.error("Discharge bed error:", error);
    return res.status(400).json({ message: error.message || "Failed to discharge patient" });
  }
};

// PATCH /api/beds/:id/status
export const updateBedStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid bed ID" });
    }

    const validStatuses = ["available", "cleaning", "maintenance"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Status must be 'available', 'cleaning', or 'maintenance'" });
    }

    const bed = await Bed.findById(id);
    if (!bed) {
      return res.status(404).json({ message: "Bed not found" });
    }

    if (bed.status === "occupied") {
      return res.status(400).json({ message: "Cannot change status directly while bed is occupied by a patient. Use discharge instead." });
    }

    bed.status = status;
    await bed.save();

    return res.status(200).json({
      message: `Bed ${bed.bedNumber} status updated to ${status}`,
      bed,
    });
  } catch (error) {
    console.error("Update bed status error:", error);
    return res.status(400).json({ message: error.message || "Failed to update bed status" });
  }
};

// DELETE /api/beds/:id
export const deleteBed = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid bed ID" });
    }

    const bed = await Bed.findById(id);
    if (!bed) {
      return res.status(404).json({ message: "Bed not found" });
    }

    if (bed.status === "occupied") {
      return res.status(400).json({ message: "Cannot delete an occupied bed" });
    }

    await Bed.findByIdAndDelete(id);

    return res.status(200).json({ message: `Bed ${bed.bedNumber} deleted successfully` });
  } catch (error) {
    console.error("Delete bed error:", error);
    return res.status(500).json({ message: "Failed to delete bed" });
  }
};
