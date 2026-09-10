import mongoose from "mongoose";

const nursingTaskSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: [true, "Patient is required"],
      index: true,
    },
    assignedNurse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    assignedNurseName: {
      type: String,
      trim: true,
      default: "Floor Nurse",
    },
    taskType: {
      type: String,
      enum: [
        "Record Vitals",
        "Dressing Change",
        "Sample Collection",
        "IV Monitoring",
        "Patient Repositioning",
        "Patient Preparation",
        "Patient Transport",
        "Discharge Preparation",
        "Medication Due",
        "Catheter Care",
        "Other",
      ],
      default: "Record Vitals",
    },
    diagnosticOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DiagnosticOrder",
      index: true,
    },
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    priority: {
      type: String,
      enum: ["Routine", "Moderate", "High", "Critical"],
      default: "Routine",
    },
    dueTime: {
      type: Date,
      required: [true, "Due time is required"],
      index: true,
    },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Completed", "Cancelled"],
      default: "Pending",
      index: true,
    },
    completedAt: {
      type: Date,
    },
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    completedByName: {
      type: String,
      trim: true,
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

nursingTaskSchema.index({ status: 1, dueTime: 1 });
nursingTaskSchema.index({ patient: 1, dueTime: 1 });

const NursingTask = mongoose.model("NursingTask", nursingTaskSchema);

export default NursingTask;
