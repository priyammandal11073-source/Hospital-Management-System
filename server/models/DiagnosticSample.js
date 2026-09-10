import mongoose from "mongoose";

const diagnosticSampleSchema = new mongoose.Schema(
  {
    sampleId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DiagnosticOrder",
      required: true,
      index: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true,
    },
    patientName: {
      type: String,
      trim: true,
    },
    testName: {
      type: String,
      trim: true,
    },
    sampleType: {
      type: String,
      required: [true, "Sample type is required"],
      trim: true,
    },
    containerType: {
      type: String,
      trim: true,
      default: "Standard Vial",
    },
    collectionTime: {
      type: Date,
      default: Date.now,
    },
    collector: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    collectorName: {
      type: String,
      trim: true,
      default: "Phlebotomist",
    },
    collectionLocation: {
      type: String,
      trim: true,
      default: "Phlebotomy Station 1",
    },
    receivedTime: {
      type: Date,
    },
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    processingTime: {
      type: Date,
    },
    completedTime: {
      type: Date,
    },
    status: {
      type: String,
      enum: [
        "Pending",
        "Collected",
        "Received",
        "Processing",
        "Completed",
        "Rejected",
        "Recollection Required",
      ],
      default: "Pending",
      index: true,
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: "",
    },
    recollectionNotes: {
      type: String,
      trim: true,
      default: "",
    },
    barcodeData: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

diagnosticSampleSchema.index({ status: 1, collectionTime: -1 });

const DiagnosticSample = mongoose.model("DiagnosticSample", diagnosticSampleSchema);

export default DiagnosticSample;
