import mongoose from "mongoose";

const structuredResultItemSchema = new mongoose.Schema(
  {
    parameter: { type: String, required: true, trim: true },
    result: { type: String, required: true, trim: true },
    unit: { type: String, trim: true, default: "" },
    referenceRange: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: ["normal", "low", "high", "critical"],
      default: "normal",
    },
    flag: { type: String, trim: true, default: "" }, // e.g. "H", "L", "CRITICAL"
  },
  { _id: false }
);

const radiologyStudySchema = new mongoose.Schema(
  {
    technique: { type: String, trim: true, default: "" },
    findings: { type: String, trim: true, default: "" },
    impression: { type: String, trim: true, default: "" },
    recommendations: { type: String, trim: true, default: "" },
    radiationDose: { type: String, trim: true, default: "" },
    contrastUsed: { type: String, trim: true, default: "None" },
  },
  { _id: false }
);

const digitalSignatureSchema = new mongoose.Schema(
  {
    signedBy: { type: String, trim: true },
    specialistRole: { type: String, trim: true }, // "Pathologist" | "Radiologist"
    licenseNumber: { type: String, trim: true },
    timestamp: { type: Date },
    signatureHash: { type: String, trim: true },
    isVerified: { type: Boolean, default: true },
  },
  { _id: false }
);

const fileAttachmentRefSchema = new mongoose.Schema(
  {
    fileId: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    secureUrl: { type: String, required: true },
    studyModality: { type: String, default: "Image" },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const historyComparisonSchema = new mongoose.Schema(
  {
    parameter: { type: String, trim: true },
    currentResult: { type: String, trim: true },
    previousResult: { type: String, trim: true },
    previousReportDate: { type: Date },
  },
  { _id: false }
);

const diagnosticReportSchema = new mongoose.Schema(
  {
    reportNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    hospitalName: {
      type: String,
      default: "Nivora Care Hospital — Central Diagnostic Services",
      trim: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DiagnosticOrder",
      required: true,
      index: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true,
    },
    patientName: {
      type: String,
      trim: true,
    },
    patientAge: {
      type: Number,
    },
    patientGender: {
      type: String,
    },
    patientAbhaId: {
      type: String,
      trim: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
    },
    doctorName: {
      type: String,
      trim: true,
    },
    test: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DiagnosticTest",
    },
    testName: {
      type: String,
      required: true,
      trim: true,
    },
    testCode: {
      type: String,
      trim: true,
    },
    department: {
      type: String,
      enum: ["Pathology", "Radiology"],
      required: true,
      index: true,
    },
    category: {
      type: String,
      trim: true,
    },
    modality: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: [
        "Draft",
        "Pending Review",
        "Under Review",
        "Approved",
        "Finalized",
        "Amended",
      ],
      default: "Draft",
      index: true,
    },
    // Technician details
    technician: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    technicianName: {
      type: String,
      trim: true,
    },
    technicianNotes: {
      type: String,
      trim: true,
      default: "",
    },
    technicianCompletedAt: {
      type: Date,
    },
    // Structured results (Pathology)
    testResults: {
      type: [structuredResultItemSchema],
      default: [],
    },
    // Radiology study findings & impression (Radiology)
    radiologyStudy: {
      type: radiologyStudySchema,
    },
    // Overall interpretation / summary
    summaryConclusion: {
      type: String,
      trim: true,
      default: "",
    },
    // Specialist Review (Pathologist / Radiologist)
    specialist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    specialistName: {
      type: String,
      trim: true,
    },
    specialistReviewNotes: {
      type: String,
      trim: true,
      default: "",
    },
    specialistApprovedAt: {
      type: Date,
    },
    digitalSignature: {
      type: digitalSignatureSchema,
    },
    // Critical result flag & tracking
    isCritical: {
      type: Boolean,
      default: false,
      index: true,
    },
    criticalDetails: {
      parameter: { type: String, trim: true },
      value: { type: String, trim: true },
      alertSentToDoctor: { type: Boolean, default: false },
      acknowledgedByDoctor: { type: Boolean, default: false },
      acknowledgedAt: { type: Date },
      acknowledgedByName: { type: String, trim: true },
    },
    // Patient portal access
    isSharedWithPatient: {
      type: Boolean,
      default: true,
      index: true,
    },
    // External object file attachments
    fileAttachments: {
      type: [fileAttachmentRefSchema],
      default: [],
    },
    // Historical comparison
    historyComparison: {
      type: [historyComparisonSchema],
      default: [],
    },
    // Versioning & Amendments (Section 50)
    version: {
      type: Number,
      default: 1,
    },
    isAmended: {
      type: Boolean,
      default: false,
      index: true,
    },
    amendmentReason: {
      type: String,
      trim: true,
      default: "",
    },
    amendedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    amendedByName: {
      type: String,
      trim: true,
    },
    amendedAt: {
      type: Date,
    },
    amendmentHistory: [
      {
        version: Number,
        reason: String,
        amendedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        amendedByName: String,
        amendedAt: { type: Date, default: Date.now },
        previousResults: [structuredResultItemSchema],
        previousRadiology: radiologyStudySchema,
        previousConclusion: String,
      },
    ],
    // Print Tracking (Section 48 & 49)
    printCount: {
      type: Number,
      default: 0,
    },
    reprintCount: {
      type: Number,
      default: 0,
    },
    lastPrintedAt: {
      type: Date,
    },
    lastPrintedBy: {
      type: String,
      trim: true,
    },
    reportDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

diagnosticReportSchema.index({ patient: 1, status: 1 });

const DiagnosticReport = mongoose.model("DiagnosticReport", diagnosticReportSchema);

export default DiagnosticReport;
