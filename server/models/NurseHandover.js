import mongoose from "mongoose";

const patientHandoverSummarySchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    patientName: { type: String, required: true },
    ward: { type: String, default: "" },
    bedNumber: { type: String, default: "" },
    condition: { type: String, default: "Stable" }, // Critical, High Risk, Moderate, Stable
    recentVitalsSummary: { type: String, default: "" },
    medicationStatus: { type: String, default: "" },
    pendingMeds: { type: String, default: "" },
    pendingTasks: { type: String, default: "" },
    pendingInvestigations: { type: String, default: "" },
    doctorInstructions: { type: String, default: "" },
    specialCareRequirements: { type: String, default: "" },
  },
  { _id: false }
);

const nurseHandoverSchema = new mongoose.Schema(
  {
    shiftType: {
      type: String,
      enum: ["Morning", "Afternoon", "Night"],
      required: true,
    },
    shiftDate: {
      type: String, // YYYY-MM-DD
      required: true,
    },
    ward: {
      type: String,
      required: true,
      trim: true,
    },
    outgoingNurse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    outgoingNurseName: {
      type: String,
      required: true,
      trim: true,
    },
    incomingNurse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    incomingNurseName: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["Submitted", "Acknowledged"],
      default: "Submitted",
      index: true,
    },
    acknowledgedAt: {
      type: Date,
    },
    generalNotes: {
      type: String,
      trim: true,
      default: "",
    },
    patientsSummary: {
      type: [patientHandoverSummarySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

nurseHandoverSchema.index({ shiftDate: -1, ward: 1 });

const NurseHandover = mongoose.model("NurseHandover", nurseHandoverSchema);

export default NurseHandover;
