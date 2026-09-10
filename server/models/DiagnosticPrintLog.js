import mongoose from "mongoose";

const diagnosticPrintLogSchema = new mongoose.Schema(
  {
    printId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true,
    },
    patientId: {
      type: String,
      trim: true,
    },
    patientName: {
      type: String,
      trim: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DiagnosticOrder",
      index: true,
    },
    report: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DiagnosticReport",
      index: true,
    },
    reportNumber: {
      type: String,
      trim: true,
    },
    studyId: {
      type: String,
      trim: true,
    },
    documentType: {
      type: String,
      enum: [
        "PATHOLOGY_REPORT",
        "RADIOLOGY_REPORT",
        "RADIOLOGY_FILM",
        "IMAGE_SHEET",
        "SINGLE_IMAGE",
        "DIAGNOSTIC_SUMMARY",
      ],
      required: true,
      index: true,
    },
    copies: {
      type: Number,
      default: 1,
      min: 1,
    },
    printedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    printedByName: {
      type: String,
      trim: true,
      default: "Authorized Staff",
    },
    userRole: {
      type: String,
      trim: true,
    },
    reason: {
      type: String,
      trim: true,
      default: "Initial clinical hardcopy",
    },
    isReprint: {
      type: Boolean,
      default: false,
      index: true,
    },
    reprintCount: {
      type: Number,
      default: 0,
    },
    layout: {
      type: String,
      trim: true,
      default: "Standard A4",
    },
    selectedImages: {
      type: [String],
      default: [],
    },
    ipAddress: {
      type: String,
      trim: true,
      default: "127.0.0.1",
    },
    status: {
      type: String,
      enum: ["SUCCESS", "FAILED", "PENDING"],
      default: "SUCCESS",
    },
  },
  {
    timestamps: true,
  }
);

diagnosticPrintLogSchema.index({ patient: 1, createdAt: -1 });
diagnosticPrintLogSchema.index({ documentType: 1, createdAt: -1 });

const DiagnosticPrintLog = mongoose.model(
  "DiagnosticPrintLog",
  diagnosticPrintLogSchema
);

export default DiagnosticPrintLog;
