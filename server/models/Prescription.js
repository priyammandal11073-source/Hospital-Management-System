import mongoose from "mongoose";

const medicationItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Medicine name is required"],
      trim: true,
    },
    dosage: {
      type: String,
      required: [true, "Dosage is required"],
      trim: true,
      default: "1 tablet",
    },
    frequency: {
      type: String,
      required: [true, "Frequency is required"],
      trim: true,
      default: "1-0-1",
    },
    timing: {
      type: String,
      enum: {
        values: ["After food", "Before food", "With food", "At bedtime", "As needed (SOS)"],
        message: "Please select a valid timing",
      },
      default: "After food",
    },
    duration: {
      type: String,
      required: [true, "Duration is required"],
      trim: true,
      default: "5 days",
    },
    instructions: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false }
);

const vitalsSchema = new mongoose.Schema(
  {
    bloodPressure: { type: String, trim: true, default: "" }, // e.g., 120/80 mmHg
    pulseRate: { type: String, trim: true, default: "" },     // e.g., 72 bpm
    temperature: { type: String, trim: true, default: "" },   // e.g., 98.6 °F
    weight: { type: String, trim: true, default: "" },        // e.g., 68 kg
    spo2: { type: String, trim: true, default: "" },          // e.g., 98%
  },
  { _id: false }
);

const administrationRecordSchema = new mongoose.Schema(
  {
    medicationIndex: { type: Number, required: true },
    medicationName: { type: String, required: true },
    doseTime: { type: Date, default: Date.now },
    administeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    administeredByName: { type: String, default: "Staff Nurse" },
    status: {
      type: String,
      enum: ["given", "held", "refused"],
      default: "given",
    },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

const prescriptionSchema = new mongoose.Schema(
  {
    prescriptionNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: [true, "Patient is required"],
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: [true, "Doctor is required"],
    },
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
    },
    diagnosis: {
      type: String,
      required: [true, "Diagnosis is required"],
      trim: true,
    },
    symptoms: {
      type: [String],
      default: [],
    },
    vitals: {
      type: vitalsSchema,
      default: () => ({}),
    },
    medications: {
      type: [medicationItemSchema],
      validate: {
        validator: (items) => Array.isArray(items) && items.length > 0,
        message: "At least one medication is required",
      },
    },
    labTestsRecommended: {
      type: [String],
      default: [],
    },
    advice: {
      type: String,
      trim: true,
      default: "",
    },
    followUpDate: {
      type: Date,
    },
    administrations: {
      type: [administrationRecordSchema],
      default: [],
    },
    digitalSignature: {
      signedByName: { type: String, default: "" },
      designation: { type: String, default: "" },
      signedAt: { type: Date, default: Date.now },
    },
  },
  {
    timestamps: true,
  }
);

prescriptionSchema.index({ patient: 1, createdAt: -1 });
prescriptionSchema.index({ doctor: 1, createdAt: -1 });

const Prescription = mongoose.model("Prescription", prescriptionSchema);

export default Prescription;
