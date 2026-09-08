import mongoose from "mongoose";

const vitalsSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: [true, "Patient is required"],
      index: true,
    },
    recordedBy: {
      type: String,
      enum: ["doctor", "nurse", "staff", "patient"],
      default: "staff",
    },
    recorderName: {
      type: String,
      trim: true,
      default: "",
    },
    bloodPressureSys: {
      type: Number, // Systolic mmHg (e.g. 120)
      min: [40, "Systolic pressure is too low"],
      max: [300, "Systolic pressure is too high"],
    },
    bloodPressureDia: {
      type: Number, // Diastolic mmHg (e.g. 80)
      min: [20, "Diastolic pressure is too low"],
      max: [200, "Diastolic pressure is too high"],
    },
    bloodSugar: {
      type: Number, // mg/dL (e.g. 105)
      min: [20, "Blood sugar is too low"],
      max: [1000, "Blood sugar is too high"],
    },
    sugarType: {
      type: String,
      enum: ["fasting", "postprandial", "random"],
      default: "random",
    },
    weight: {
      type: Number, // kg (e.g. 68.5)
      min: [1, "Weight is too low"],
      max: [500, "Weight is too high"],
    },
    height: {
      type: Number, // cm (e.g. 175)
      min: [30, "Height is too low"],
      max: [300, "Height is too high"],
    },
    heartRate: {
      type: Number, // bpm (e.g. 72)
      min: [30, "Heart rate is too low"],
      max: [250, "Heart rate is too high"],
    },
    temperature: {
      type: Number, // Fahrenheit (e.g. 98.6)
      min: [85, "Temperature is too low"],
      max: [110, "Temperature is too high"],
    },
    spo2: {
      type: Number, // Percentage (e.g. 98%)
      min: [50, "SpO2 is too low"],
      max: [100, "SpO2 cannot exceed 100%"],
    },
    recordedAt: {
      type: Date,
      default: Date.now,
      index: true,
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

const Vitals = mongoose.model("Vitals", vitalsSchema);

export default Vitals;
