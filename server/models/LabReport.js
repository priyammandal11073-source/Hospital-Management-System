import mongoose from "mongoose";

const labTestItemSchema = new mongoose.Schema(
  {
    parameter: { type: String, required: true, trim: true }, // e.g. "Hemoglobin", "Fasting Glucose"
    result: { type: String, required: true, trim: true }, // e.g. "14.2", "110"
    unit: { type: String, trim: true, default: "" }, // e.g. "g/dL", "mg/dL"
    referenceRange: { type: String, trim: true, default: "" }, // e.g. "13.0 - 17.0"
    status: {
      type: String,
      enum: ["normal", "low", "high", "critical"],
      default: "normal",
    },
  },
  { _id: false }
);

const labReportSchema = new mongoose.Schema(
  {
    reportNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: [true, "Patient is required"],
      index: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
    },
    testName: {
      type: String,
      required: [true, "Test name is required"],
      trim: true,
    },
    category: {
      type: String,
      enum: [
        "Hematology",
        "Biochemistry",
        "Pathology",
        "Microbiology",
        "Radiology / X-Ray",
        "Cardiology / ECG",
        "Urine Analysis",
        "Immunology",
        "General Lab",
      ],
      default: "General Lab",
    },
    testDate: {
      type: Date,
      default: Date.now,
    },
    reportDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["ordered", "sample_collected", "in_progress", "completed", "cancelled"],
      default: "ordered",
      index: true,
    },
    technicianName: {
      type: String,
      trim: true,
      default: "Central Lab Tech",
    },
    testResults: {
      type: [labTestItemSchema],
      default: [],
    },
    summaryConclusion: {
      type: String,
      trim: true,
      default: "",
    },
    // PDF / Attachment representation (Data URI or URL or base64 file)
    attachmentName: {
      type: String,
      trim: true,
    },
    attachmentUrl: {
      type: String, // Can store base64 data URI or file path
    },
    isSharedWithPatient: {
      type: Boolean,
      default: true,
    },
    isCritical: {
      type: Boolean,
      default: false,
      index: true,
    },
    doctorReviewStatus: {
      type: String,
      enum: ["pending", "reviewed"],
      default: "pending",
      index: true,
    },
    reviewedByDoctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
    },
    reviewedAt: {
      type: Date,
    },
    doctorReviewNotes: {
      type: String,
      trim: true,
      default: "",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const LabReport = mongoose.model("LabReport", labReportSchema);

export default LabReport;
