import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: [true, "Patient is required"],
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: [
        function () {
          return !this.isDiagnostic;
        },
        "Doctor is required for non-diagnostic appointments",
      ],
    },
    diagnosticOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DiagnosticOrder",
    },
    isDiagnostic: {
      type: Boolean,
      default: false,
      index: true,
    },
    modality: {
      type: String,
      trim: true,
      default: "",
    },
    equipment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Equipment",
      index: true,
    },
    room: {
      type: String,
      trim: true,
      default: "",
    },
    appointmentDate: {
      type: Date,
      required: [true, "Appointment date is required"],
    },
    timeSlot: {
      type: String,
      required: [true, "Appointment time slot is required"],
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: [
          "pending",
          "confirmed",
          "waiting",
          "checked_in",
          "in_consultation",
          "in_progress",
          "completed",
          "cancelled",
          "no_show",
        ],
        message: "Please provide a valid appointment status",
      },
      default: "pending",
    },
    reasonForVisit: {
      type: String,
      required: [true, "Reason for visit is required"],
      trim: true,
    },
    diagnosis: {
      type: String,
      trim: true,
      default: "",
    },
    clinicalSummary: {
      type: String,
      trim: true,
      default: "",
    },
    followUpDate: {
      type: Date,
    },
    followUpInstructions: {
      type: String,
      trim: true,
      default: "",
    },
    queueNumber: {
      type: Number,
    },
    tokenNumber: {
      type: String,
      trim: true,
      default: "",
    },
    checkedInAt: {
      type: Date,
    },
    appointmentType: {
      type: String,
      enum: {
        values: ["opd", "walk_in", "follow_up", "emergency", "teleconsultation", "diagnostic"],
        message: "Invalid appointment type",
      },
      default: "opd",
    },
    priority: {
      type: String,
      enum: {
        values: ["normal", "urgent", "emergency"],
        message: "Invalid priority level",
      },
      default: "normal",
    },
    notes: {
      type: String,
      trim: true,
    },
    prepChecklist: [
      {
        label: { type: String, required: true },
        isDone: { type: Boolean, default: false },
        checkedByName: { type: String, default: "" },
        checkedAt: { type: Date },
      },
    ],
    bookedBy: {
      type: String,
      enum: {
        values: ["staff", "patient"],
        message: "bookedBy must be 'staff' or 'patient'",
      },
      default: "staff",
    },
  },
  {
    timestamps: true,
  }
);

// Enforces one active appointment per doctor, date, and time slot.
// Cancelled appointments do not occupy a slot and can be rebooked.
appointmentSchema.index(
  { doctor: 1, appointmentDate: 1, timeSlot: 1 },
  {
    unique: true,
    partialFilterExpression: {
      isDiagnostic: { $eq: false },
      status: { $in: ["pending", "confirmed"] },
    },
  }
);

// Equipment conflict index for diagnostic bookings (partialFilterExpression covers sparseness)
appointmentSchema.index(
  { equipment: 1, appointmentDate: 1, timeSlot: 1 },
  {
    partialFilterExpression: {
      isDiagnostic: { $eq: true },
      status: { $in: ["pending", "confirmed", "waiting", "checked_in"] },
    },
  }
);

// Compound query indexes for doctor consultation queues, patient history, and front desk work queue
appointmentSchema.index({ patient: 1, appointmentDate: -1, status: 1 });
appointmentSchema.index({ doctor: 1, appointmentDate: 1, status: 1 });
appointmentSchema.index({ status: 1, appointmentDate: 1 });
appointmentSchema.index({ tokenNumber: 1 }, { sparse: true });
appointmentSchema.index({ diagnosticOrder: 1 }, { sparse: true });

const Appointment = mongoose.model("Appointment", appointmentSchema);

export default Appointment;