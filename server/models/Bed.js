import mongoose from "mongoose";

const admissionHistoryItemSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    attendingDoctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
    },
    admittedAt: {
      type: Date,
      required: true,
    },
    dischargedAt: {
      type: Date,
      default: Date.now,
    },
    admissionReason: {
      type: String,
      trim: true,
      default: "",
    },
    dischargeSummary: {
      type: String,
      trim: true,
      default: "",
    },
    totalDays: {
      type: Number,
      default: 1,
    },
    totalBedCost: {
      type: Number,
      default: 0,
    },
  },
  { _id: true }
);

const currentAdmissionSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    attendingDoctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    admittedAt: {
      type: Date,
      default: Date.now,
    },
    admissionReason: {
      type: String,
      required: [true, "Admission reason is required"],
      trim: true,
    },
    expectedDischargeDate: {
      type: Date,
    },
    emergencyContact: {
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
  { _id: false }
);

const bedSchema = new mongoose.Schema(
  {
    bedNumber: {
      type: String,
      required: [true, "Bed number is required"],
      unique: true,
      trim: true,
      uppercase: true,
    },
    ward: {
      type: String,
      required: [true, "Ward is required"],
      enum: {
        values: [
          "General Ward",
          "ICU (Intensive Care Unit)",
          "CCU (Critical Care Unit)",
          "Emergency & Trauma",
          "Pediatric Ward",
          "Private Deluxe Room",
        ],
        message: "Please select a valid hospital ward",
      },
    },
    floor: {
      type: String,
      required: [true, "Floor is required"],
      trim: true,
      default: "Ground floor",
    },
    dailyRate: {
      type: Number,
      required: [true, "Daily rate is required"],
      min: [0, "Daily rate cannot be negative"],
      default: 1000,
    },
    features: {
      hasOxygen: { type: Boolean, default: true },
      hasVentilator: { type: Boolean, default: false },
      isIsolation: { type: Boolean, default: false },
      hasMonitor: { type: Boolean, default: true },
    },
    status: {
      type: String,
      enum: {
        values: ["available", "occupied", "cleaning", "maintenance"],
        message: "Invalid bed status",
      },
      default: "available",
    },
    currentAdmission: {
      type: currentAdmissionSchema,
      default: null,
    },
    admissionHistory: {
      type: [admissionHistoryItemSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

bedSchema.index({ ward: 1, status: 1 });
bedSchema.index({ "currentAdmission.patient": 1 });

const Bed = mongoose.model("Bed", bedSchema);

export default Bed;
