import mongoose from "mongoose";

const emergencyVitalsSnapshotSchema = new mongoose.Schema(
  {
    bloodPressureSys: { type: Number },
    bloodPressureDia: { type: Number },
    heartRate: { type: Number },
    respiratoryRate: { type: Number },
    spo2: { type: Number },
    temperature: { type: Number },
    consciousnessLevel: {
      type: String,
      enum: ["A", "V", "P", "U", "Alert", "Verbal", "Pain", "Unresponsive"],
      default: "Alert",
    },
    painScore: { type: Number, min: 0, max: 10 },
    recordedBy: { type: String, default: "" },
    recordedAt: { type: Date, default: Date.now },
    notes: { type: String, default: "" },
  },
  { _id: true }
);

const emergencyTimelineSchema = new mongoose.Schema(
  {
    event: { type: String, required: true, trim: true },
    details: { type: String, default: "" },
    by: { type: String, default: "" },
    byId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    at: { type: Date, default: Date.now },
  },
  { _id: true }
);

const emergencyEncounterSchema = new mongoose.Schema(
  {
    emergencyId: {
      type: String,
      unique: true,
      index: true,
      trim: true,
    },
    tokenNumber: {
      type: String,
      trim: true,
      index: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true,
    },
    isUnknown: {
      type: Boolean,
      default: false,
    },
    arrivalTime: {
      type: Date,
      default: Date.now,
      index: true,
    },
    arrivalMode: {
      type: String,
      enum: ["walk_in", "ambulance", "police", "transfer", "other"],
      default: "walk_in",
    },
    chiefComplaint: {
      type: String,
      required: [true, "Chief complaint is required"],
      trim: true,
    },
    chiefComplaintOnArrival: {
      type: String,
      default: "",
    },
    knownAllergies: {
      type: [String],
      default: [],
    },
    knownConditions: {
      type: [String],
      default: [],
    },
    emergencyContact: {
      name: { type: String, default: "", trim: true },
      phone: { type: String, default: "", trim: true },
      relationship: { type: String, default: "", trim: true },
    },
    // Triage
    priority: {
      type: String,
      enum: ["critical", "urgent", "less_urgent", "non_urgent"],
      default: "urgent",
      index: true,
    },
    triageStatus: {
      type: String,
      enum: ["awaiting_triage", "triaged"],
      default: "awaiting_triage",
      index: true,
    },
    triage: {
      chiefComplaint: { type: String, default: "" },
      symptoms: { type: String, default: "" },
      vitals: { type: emergencyVitalsSnapshotSchema, default: null },
      bloodPressureSys: { type: Number },
      bloodPressureDia: { type: Number },
      heartRate: { type: Number },
      respiratoryRate: { type: Number },
      spo2: { type: Number },
      temperature: { type: Number },
      consciousnessLevel: { type: String, default: "Alert" },
      painScore: { type: Number, min: 0, max: 10 },
      allergies: { type: String, default: "" },
      relevantHistory: { type: String, default: "" },
      triageNotes: { type: String, default: "" },
      triagedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      triagedByName: { type: String, default: "" },
      triagedAt: { type: Date },
    },
    vitalsHistory: {
      type: [emergencyVitalsSnapshotSchema],
      default: [],
    },
    assignedDoctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
    },
    assignedDoctorUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    assignedDoctorName: {
      type: String,
      default: "",
    },
    assignedNurse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    assignedNurseName: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: [
        "arrived",
        "registered",
        "awaiting_triage",
        "triaged",
        "awaiting_doctor",
        "under_assessment",
        "under_treatment",
        "awaiting_diagnostics",
        "under_observation",
        "admitted",
        "transferred",
        "discharged",
        "cancelled",
      ],
      default: "arrived",
      index: true,
    },
    location: {
      type: String,
      trim: true,
      default: "ER Bay 1",
    },
    bed: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bed",
    },
    clinicalNotes: [
      {
        note: { type: String, required: true },
        by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        byName: { type: String, default: "" },
        byRole: { type: String, default: "" },
        at: { type: Date, default: Date.now },
      },
    ],
    diagnosticOrders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "DiagnosticOrder",
      },
    ],
    prescriptions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Prescription",
      },
    ],
    procedures: {
      type: [String],
      default: [],
    },
    observation: {
      notes: { type: String, default: "" },
      startedAt: { type: Date },
      endedAt: { type: Date },
      status: { type: String, enum: ["active", "completed", "cancelled"], default: "active" },
    },
    billing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Billing",
    },
    transferHistory: [
      {
        from: { type: String, required: true },
        to: { type: String, required: true },
        reason: { type: String, default: "" },
        requestedBy: { type: String, default: "" },
        requestedById: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        approvedBy: { type: String, default: "" },
        transferredAt: { type: Date, default: Date.now },
      },
    ],
    discharge: {
      finalDiagnosis: { type: String, default: "" },
      treatmentSummary: { type: String, default: "" },
      medications: { type: String, default: "" },
      instructions: { type: String, default: "" },
      followUp: { type: String, default: "" },
      dischargeNotes: { type: String, default: "" },
      dischargedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      dischargedByName: { type: String, default: "" },
      dischargedAt: { type: Date },
    },
    timeline: {
      type: [emergencyTimelineSchema],
      default: [],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    createdByName: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

emergencyEncounterSchema.index({ status: 1, priority: 1, arrivalTime: -1 });
emergencyEncounterSchema.index({ assignedDoctor: 1, status: 1 });
emergencyEncounterSchema.index({ assignedNurse: 1, status: 1 });
emergencyEncounterSchema.index({ patient: 1, createdAt: -1 });

// Auto-generate emergencyId & tokenNumber with collision guard
emergencyEncounterSchema.pre("validate", async function generateIds() {
  if (!this.emergencyId) {
    const year = new Date().getFullYear();
    const count = await mongoose.model("EmergencyEncounter").countDocuments();
    let candidate = `ER-${year}-${String(count + 1).padStart(6, "0")}`;
    const exists = await mongoose.model("EmergencyEncounter").exists({ emergencyId: candidate });
    if (exists) {
      candidate = `ER-${year}-${Date.now().toString().slice(-6)}${Math.floor(10 + Math.random() * 90)}`;
    }
    this.emergencyId = candidate;
  }
  if (!this.tokenNumber) {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayCount = await mongoose.model("EmergencyEncounter").countDocuments({
      createdAt: { $gte: start },
    });
    let candidateToken = `ER-T${String(todayCount + 1).padStart(3, "0")}`;
    const tokenExists = await mongoose.model("EmergencyEncounter").exists({
      tokenNumber: candidateToken,
      createdAt: { $gte: start },
    });
    if (tokenExists) {
      candidateToken = `ER-T${String(todayCount + 1).padStart(3, "0")}-${Math.floor(10 + Math.random() * 90)}`;
    }
    this.tokenNumber = candidateToken;
  }
});

const EmergencyEncounter = mongoose.model("EmergencyEncounter", emergencyEncounterSchema);

export default EmergencyEncounter;
