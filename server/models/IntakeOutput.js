import mongoose from "mongoose";

const intakeOutputSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: [true, "Patient is required"],
      index: true,
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recorderName: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true,
      index: true,
    },
    time: {
      type: String, // e.g., "10:30 AM"
      required: true,
    },
    intakeType: {
      type: String,
      enum: ["Oral Fluids", "IV Fluids", "Feeding Tube", "Blood Products", "Total Parenteral Nutrition", "Other", "None"],
      default: "None",
    },
    intakeAmountMl: {
      type: Number,
      min: 0,
      default: 0,
    },
    intakeNotes: {
      type: String,
      trim: true,
      default: "",
    },
    outputType: {
      type: String,
      enum: ["Urine", "Vomit", "Drainage", "Bowel / Stool", "Aspiration", "Other", "None"],
      default: "None",
    },
    outputAmountMl: {
      type: Number,
      min: 0,
      default: 0,
    },
    outputNotes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

intakeOutputSchema.index({ patient: 1, date: -1, createdAt: -1 });

const IntakeOutput = mongoose.model("IntakeOutput", intakeOutputSchema);

export default IntakeOutput;
