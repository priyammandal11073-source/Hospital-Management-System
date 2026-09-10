import mongoose from "mongoose";

const referenceRangeSchema = new mongoose.Schema(
  {
    parameter: { type: String, required: true, trim: true },
    unit: { type: String, trim: true, default: "" },
    normalRange: { type: String, trim: true, default: "" },
    lowCritical: { type: Number },
    highCritical: { type: Number },
    gender: { type: String, enum: ["Both", "Male", "Female"], default: "Both" },
    ageGroup: { type: String, default: "Adult" },
  },
  { _id: false }
);

const diagnosticTestSchema = new mongoose.Schema(
  {
    testCode: {
      type: String,
      required: [true, "Test code is required"],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    testName: {
      type: String,
      required: [true, "Test name is required"],
      trim: true,
      index: true,
    },
    department: {
      type: String,
      required: [true, "Department is required"],
      enum: ["Pathology", "Radiology"],
      index: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      index: true,
    },
    subCategory: {
      type: String,
      trim: true,
      default: "",
    },
    modality: {
      type: String,
      required: [true, "Modality is required"],
      enum: [
        "Laboratory",
        "X-Ray",
        "CT Scan",
        "MRI",
        "Ultrasound",
        "Mammography",
        "Interventional Radiology",
        "ECG",
        "Echocardiography",
        "Other",
      ],
      index: true,
    },
    sampleType: {
      type: String,
      trim: true,
      default: "None (Imaging)",
    },
    containerType: {
      type: String,
      trim: true,
      default: "N/A",
    },
    turnaroundTime: {
      type: String,
      trim: true,
      default: "24 hours",
    },
    price: {
      type: Number,
      required: [true, "Test price is required"],
      min: [0, "Price cannot be negative"],
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    requiresAppointment: {
      type: Boolean,
      default: false,
    },
    requiresSample: {
      type: Boolean,
      default: true,
    },
    requiresSpecialistApproval: {
      type: Boolean,
      default: true,
    },
    fastingRequired: {
      type: Boolean,
      default: false,
    },
    contrastRequired: {
      type: Boolean,
      default: false,
    },
    preparationInstructions: {
      type: String,
      trim: true,
      default: "No special preparation required.",
    },
    referenceRanges: {
      type: [referenceRangeSchema],
      default: [],
    },
    units: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

diagnosticTestSchema.index({ department: 1, category: 1, active: 1 });
diagnosticTestSchema.index({ testName: "text", testCode: "text" });

const DiagnosticTest = mongoose.model("DiagnosticTest", diagnosticTestSchema);

export default DiagnosticTest;
