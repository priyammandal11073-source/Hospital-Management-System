import mongoose from "mongoose";

const procedureScheduleSchema = new mongoose.Schema(
  {
    procedureName: {
      type: String,
      required: [true, "Procedure name is required"],
      trim: true,
    },
    procedureCode: {
      type: String,
      trim: true,
      default: "PR-SURG",
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    leadSurgeon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    anesthetist: {
      type: String,
      trim: true,
      default: "On-call Anesthesiologist",
    },
    operatingRoom: {
      type: String,
      required: true,
      enum: ["OT Suite 1 (General & Laparoscopy)", "OT Suite 2 (Cardiac & Thoracic)", "OT Suite 3 (Orthopedics & Trauma)", "Minor Procedure Room"],
      default: "OT Suite 1 (General & Laparoscopy)",
    },
    scheduledDate: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
      default: "09:00 AM",
    },
    durationMinutes: {
      type: Number,
      default: 90,
    },
    status: {
      type: String,
      enum: ["scheduled", "preparing", "in_progress", "completed", "cancelled"],
      default: "scheduled",
    },
    preOpInstructions: {
      type: String,
      trim: true,
      default: "NPO 8 hours prior. Complete PAC clearance.",
    },
    postOpNotes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

procedureScheduleSchema.index({ scheduledDate: 1, operatingRoom: 1 });

const ProcedureSchedule = mongoose.model("ProcedureSchedule", procedureScheduleSchema);

export default ProcedureSchedule;
