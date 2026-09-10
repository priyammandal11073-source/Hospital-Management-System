import mongoose from "mongoose";

const diagnosticFileSchema = new mongoose.Schema(
  {
    fileId: {
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
    diagnosticOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DiagnosticOrder",
      index: true,
    },
    diagnosticReport: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DiagnosticReport",
      index: true,
    },
    fileName: {
      type: String,
      required: true,
      trim: true,
    },
    originalName: {
      type: String,
      required: true,
      trim: true,
    },
    mimeType: {
      type: String,
      required: true,
      trim: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    storageProvider: {
      type: String,
      enum: ["local_object_storage", "s3_compatible", "gcs"],
      default: "local_object_storage",
    },
    storagePath: {
      type: String,
      required: true,
      trim: true,
    },
    secureUrl: {
      type: String,
      required: true,
      trim: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    uploadedByName: {
      type: String,
      trim: true,
    },
    studyModality: {
      type: String,
      enum: ["X-Ray", "CT Scan", "MRI", "Ultrasound", "Mammography", "Pathology Slide", "Report PDF", "Other"],
      default: "Other",
    },
    isRestricted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

diagnosticFileSchema.index({ patient: 1, createdAt: -1 });

const DiagnosticFile = mongoose.model("DiagnosticFile", diagnosticFileSchema);

export default DiagnosticFile;
