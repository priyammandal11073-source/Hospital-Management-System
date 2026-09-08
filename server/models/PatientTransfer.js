import mongoose from "mongoose";

const patientTransferSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: [true, "Patient is required"],
      index: true,
    },
    fromBed: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bed",
    },
    fromWard: {
      type: String,
      required: true,
      trim: true,
    },
    fromBedNumber: {
      type: String,
      required: true,
      trim: true,
    },
    toBed: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bed",
      required: true,
    },
    toWard: {
      type: String,
      required: true,
      trim: true,
    },
    toBedNumber: {
      type: String,
      required: true,
      trim: true,
    },
    reason: {
      type: String,
      required: [true, "Transfer reason is required"],
      trim: true,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    requestedByName: {
      type: String,
      required: true,
      trim: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedByName: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Requested", "Approved", "In Progress", "Completed", "Cancelled"],
      default: "Requested",
      index: true,
    },
    completedAt: {
      type: Date,
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

patientTransferSchema.index({ patient: 1, createdAt: -1 });

const PatientTransfer = mongoose.model("PatientTransfer", patientTransferSchema);

export default PatientTransfer;
