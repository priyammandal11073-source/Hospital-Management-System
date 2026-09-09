import mongoose from "mongoose";

const dispensedItemSchema = new mongoose.Schema(
  {
    medicineName: {
      type: String,
      required: true,
      trim: true,
    },
    inventoryItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inventory",
    },
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MedicineBatch",
    },
    batchNumber: {
      type: String,
      default: "",
    },
    dosage: {
      type: String,
      default: "",
    },
    frequency: {
      type: String,
      default: "",
    },
    duration: {
      type: String,
      default: "",
    },
    instructions: {
      type: String,
      default: "",
    },
    requestedQuantity: {
      type: Number,
      required: true,
      min: 1,
    },
    dispensedQuantity: {
      type: Number,
      required: true,
      min: 0,
    },
    unitPrice: {
      type: Number,
      default: 0,
    },
    totalPrice: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["dispensed", "out_of_stock", "partially_dispensed", "held"],
      default: "dispensed",
    },
  },
  { _id: true }
);

const pharmacyDispensingSchema = new mongoose.Schema(
  {
    receiptNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    prescription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Prescription",
      required: true,
      index: true,
    },
    prescriptionNumber: {
      type: String,
      required: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true,
    },
    patientName: {
      type: String,
      required: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    doctorName: {
      type: String,
      required: true,
    },
    dispensedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    dispensedByName: {
      type: String,
      default: "Staff Pharmacist",
    },
    items: {
      type: [dispensedItemSchema],
      required: true,
    },
    totalAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "waived"],
      default: "paid",
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "upi", "insurance", "razorpay", "other"],
      default: "cash",
    },
    allergyCheckAcknowledged: {
      type: Boolean,
      default: true,
    },
    doctorClarification: {
      requested: { type: Boolean, default: false },
      reason: { type: String, default: "" },
      message: { type: String, default: "" },
      response: { type: String, default: "" },
      status: {
        type: String,
        enum: ["none", "pending", "responded", "resolved"],
        default: "none",
      },
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

pharmacyDispensingSchema.index({ createdAt: -1 });

const PharmacyDispensing = mongoose.model("PharmacyDispensing", pharmacyDispensingSchema);

export default PharmacyDispensing;
