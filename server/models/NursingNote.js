import mongoose from "mongoose";

const nursingNoteSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: [true, "Patient is required"],
      index: true,
    },
    nurse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Nurse is required"],
    },
    nurseName: {
      type: String,
      required: true,
      trim: true,
    },
    shift: {
      type: String,
      enum: ["Morning", "Afternoon", "Night"],
      default: "Morning",
    },
    category: {
      type: String,
      enum: [
        "General Condition",
        "Clinical Intervention",
        "Wound Care & Dressing",
        "Mobility & Physical",
        "Dietary & Fluid",
        "Sleep & Rest",
        "Doctor Instructions",
        "Critical Alert",
        "Other",
      ],
      default: "General Condition",
    },
    note: {
      type: String,
      required: [true, "Nursing note text is required"],
      trim: true,
    },
    symptomsObserved: {
      type: String,
      trim: true,
      default: "",
    },
    patientComplaints: {
      type: String,
      trim: true,
      default: "",
    },
    patientResponse: {
      type: String,
      trim: true,
      default: "",
    },
    isCritical: {
      type: Boolean,
      default: false,
    },
    recordedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

nursingNoteSchema.index({ patient: 1, recordedAt: -1 });

const NursingNote = mongoose.model("NursingNote", nursingNoteSchema);

export default NursingNote;
