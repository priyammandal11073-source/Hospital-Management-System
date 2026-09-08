import mongoose from "mongoose";

const referralSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: [true, "Patient is required"],
      index: true,
    },
    referringDoctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: [true, "Referring doctor is required"],
      index: true,
    },
    referringDoctorName: {
      type: String,
      required: [true, "Referring doctor name is required"],
      trim: true,
    },
    specialistDoctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: [true, "Specialist doctor is required"],
      index: true,
    },
    specialistDoctorName: {
      type: String,
      required: [true, "Specialist doctor name is required"],
      trim: true,
    },
    department: {
      type: String,
      required: [true, "Department is required"],
      trim: true,
    },
    reason: {
      type: String,
      required: [true, "Referral reason is required"],
      trim: true,
    },
    clinicalSummary: {
      type: String,
      trim: true,
      default: "",
    },
    priority: {
      type: String,
      enum: ["Routine", "Urgent", "STAT"],
      default: "Routine",
    },
    status: {
      type: String,
      enum: ["Requested", "Accepted", "Scheduled", "Completed", "Cancelled"],
      default: "Requested",
      index: true,
    },
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
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

const Referral = mongoose.model("Referral", referralSchema);

export default Referral;
