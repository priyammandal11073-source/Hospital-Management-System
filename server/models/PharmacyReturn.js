import mongoose from "mongoose";

const pharmacyReturnSchema = new mongoose.Schema(
  {
    returnNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    returnType: {
      type: String,
      enum: ["patient_return", "supplier_return", "damaged_stock", "expired_stock"],
      required: true,
    },
    medicine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inventory",
      required: true,
    },
    medicineName: {
      type: String,
      required: true,
    },
    batchNumber: {
      type: String,
      default: "",
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    refundAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
    },
    patientName: {
      type: String,
      default: "",
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
    },
    supplierName: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["requested", "approved", "processed", "rejected"],
      default: "requested",
      index: true,
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    processedByName: {
      type: String,
      default: "Staff Pharmacist",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedByName: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const PharmacyReturn = mongoose.model("PharmacyReturn", pharmacyReturnSchema);

export default PharmacyReturn;
