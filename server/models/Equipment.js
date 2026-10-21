import mongoose from "mongoose";

const equipmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Equipment name is required"],
      trim: true,
    },
    equipmentId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true, // e.g., EQ-VENT-01, EQ-ECG-03
    },
    category: {
      type: String,
      required: true,
      enum: [
        "Ventilator",
        "ECG Machine",
        "Patient Monitor",
        "Infusion Pump",
        "Dialysis Unit",
        "Defibrillator",
        "X-Ray / Imaging",
        "Hospital Bed",
        "Wheelchair / Transport",
        "Surgical Tool",
        "Other",
      ],
      default: "Patient Monitor",
    },
    department: {
      type: String,
      trim: true,
      default: "ICU (Intensive Care Unit)",
    },
    location: {
      type: String,
      trim: true,
      default: "Room 101",
    },
    manufacturer: {
      type: String,
      trim: true,
      default: "",
    },
    modelNumber: {
      type: String,
      trim: true,
      default: "",
    },
    purchaseDate: {
      type: Date,
    },
    lastServiceDate: {
      type: Date,
    },
    nextServiceDate: {
      type: Date,
    },
    serviceIntervalDays: {
      type: Number,
      min: 1,
      default: 90,
    },
    status: {
      type: String,
      enum: ["operational", "under_maintenance", "out_of_service"],
      default: "operational",
    },
  },
  {
    timestamps: true,
  }
);

equipmentSchema.index({ status: 1, department: 1 });

const Equipment = mongoose.model("Equipment", equipmentSchema);

export default Equipment;
