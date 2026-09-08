import mongoose from "mongoose";

const clinicalNoteSchema = new mongoose.Schema(
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
      required: [true, "Doctor is required"],
      index: true,
    },
    doctorName: {
      type: String,
      required: [true, "Doctor name is required"],
      trim: true,
    },
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
    },
    noteType: {
      type: String,
      enum: ["Consultation", "Progress", "Follow-up", "Procedure", "Discharge"],
      default: "Consultation",
      index: true,
    },
    chiefComplaint: {
      type: String,
      trim: true,
      default: "",
    },
    clinicalHistory: {
      type: String,
      trim: true,
      default: "",
    },
    examination: {
      type: String,
      trim: true,
      default: "",
    },
    assessment: {
      type: String,
      trim: true,
      default: "",
    },
    diagnosis: {
      type: String,
      trim: true,
      default: "",
    },
    differentialDiagnosis: {
      type: String,
      trim: true,
      default: "",
    },
    treatmentPlan: {
      type: String,
      trim: true,
      default: "",
    },
    followUpInstructions: {
      type: String,
      trim: true,
      default: "",
    },
    isConfidential: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

clinicalNoteSchema.index({ patient: 1, createdAt: -1 });
clinicalNoteSchema.index({ doctor: 1, createdAt: -1 });

const ClinicalNote = mongoose.model("ClinicalNote", clinicalNoteSchema);

export default ClinicalNote;
