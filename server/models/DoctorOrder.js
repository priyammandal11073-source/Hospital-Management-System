import mongoose from "mongoose";

const doctorOrderSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: [true, "Patient is required"],
      index: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
    },
    doctorName: {
      type: String,
      required: [true, "Doctor name is required"],
      trim: true,
    },
    orderType: {
      type: String,
      enum: [
        "Medication",
        "Lab Test",
        "Imaging",
        "Procedure",
        "Diet",
        "Monitoring",
        "Other",
      ],
      required: true,
    },
    description: {
      type: String,
      required: [true, "Order description is required"],
      trim: true,
    },
    priority: {
      type: String,
      enum: ["Routine", "Urgent", "STAT"],
      default: "Routine",
    },
    status: {
      type: String,
      enum: ["New", "Acknowledged", "In Progress", "Completed", "Cancelled"],
      default: "New",
      index: true,
    },
    acknowledgedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    acknowledgedByName: {
      type: String,
      trim: true,
    },
    acknowledgedAt: {
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
    completedAt: {
      type: Date,
    },
    nurseNotes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

doctorOrderSchema.index({ patient: 1, createdAt: -1 });
doctorOrderSchema.index({ status: 1, priority: 1 });

const DoctorOrder = mongoose.model("DoctorOrder", doctorOrderSchema);

export default DoctorOrder;
