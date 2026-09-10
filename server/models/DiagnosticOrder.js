import mongoose from "mongoose";

const criticalDetailsSchema = new mongoose.Schema(
  {
    parameter: { type: String, trim: true },
    detectedValue: { type: String, trim: true },
    normalRange: { type: String, trim: true },
    flaggedAt: { type: Date, default: Date.now },
    alertSentToDoctor: { type: Boolean, default: false },
    acknowledgedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    acknowledgedByName: { type: String, trim: true },
    acknowledgedAt: { type: Date },
    acknowledgmentNotes: { type: String, trim: true, default: "" },
    escalationStatus: {
      type: String,
      enum: ["Open", "Acknowledged", "Resolved"],
      default: "Open",
    },
  },
  { _id: false }
);

const diagnosticOrderSchema = new mongoose.Schema(
  {
    orderNumber: {
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
    patientName: {
      type: String,
      trim: true,
    },
    patientIdStr: {
      type: String,
      trim: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      index: true,
    },
    doctorName: {
      type: String,
      trim: true,
      default: "OPD Physician",
    },
    department: {
      type: String,
      trim: true,
      default: "General Medicine",
    },
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
    },
    test: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DiagnosticTest",
      required: [true, "Diagnostic test is required"],
      index: true,
    },
    testCode: {
      type: String,
      trim: true,
    },
    testName: {
      type: String,
      required: [true, "Test name is required"],
      trim: true,
    },
    diagnosticDepartment: {
      type: String,
      enum: ["Pathology", "Radiology"],
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    modality: {
      type: String,
      required: true,
    },
    clinicalIndication: {
      type: String,
      trim: true,
      default: "Routine evaluation",
    },
    priority: {
      type: String,
      enum: ["Routine", "Urgent", "STAT"],
      default: "Routine",
      index: true,
    },
    status: {
      type: String,
      enum: [
        "Requested",
        "Accepted",
        "Scheduled",
        "Patient Ready",
        "Sample Collected",
        "Procedure Started",
        "In Progress",
        "Completed",
        "Report Pending",
        "Under Review",
        "Approved",
        "Finalized",
        "Rejected",
        "Cancelled",
        "Recollection Required",
        "Sample Rejected",
      ],
      default: "Requested",
      index: true,
    },
    requestedDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    scheduledDate: {
      type: Date,
    },
    scheduledTimeSlot: {
      type: String,
      trim: true,
    },
    assignedTechnician: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    assignedTechnicianName: {
      type: String,
      trim: true,
    },
    assignedRoom: {
      type: String,
      trim: true,
      default: "Diagnostic Suite A",
    },
    assignedEquipment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Equipment",
    },
    assignedEquipmentName: {
      type: String,
      trim: true,
    },
    isCritical: {
      type: Boolean,
      default: false,
      index: true,
    },
    criticalDetails: {
      type: criticalDetailsSchema,
    },
    billing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Billing",
    },
    billingStatus: {
      type: String,
      enum: ["Pending", "Paid", "Waived", "Billed"],
      default: "Pending",
    },
    price: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: "",
    },
    sample: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DiagnosticSample",
    },
    report: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DiagnosticReport",
    },
    admission: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admission",
    },
    ward: {
      type: String,
      trim: true,
      default: "",
    },
    bedNumber: {
      type: String,
      trim: true,
      default: "",
    },
    isInpatient: {
      type: Boolean,
      default: false,
      index: true,
    },
    preparationRequired: {
      type: Boolean,
      default: false,
    },
    preparationInstructions: {
      type: String,
      trim: true,
      default: "",
    },
    transportRequired: {
      type: Boolean,
      default: false,
    },
    nursingTask: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "NursingTask",
    },
    consultation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Consultation",
    },
    requiresContrast: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

diagnosticOrderSchema.index({ orderNumber: 1 }, { unique: true });
diagnosticOrderSchema.index({ patient: 1, status: 1 });
diagnosticOrderSchema.index({ diagnosticDepartment: 1, status: 1 });
diagnosticOrderSchema.index({ doctor: 1, status: 1 });
diagnosticOrderSchema.index({ priority: 1, requestedDate: -1 });
diagnosticOrderSchema.index({ status: 1, scheduledDate: 1 });
diagnosticOrderSchema.index({ isCritical: 1, "criticalDetails.escalationStatus": 1 });

const DiagnosticOrder = mongoose.model("DiagnosticOrder", diagnosticOrderSchema);

export default DiagnosticOrder;
