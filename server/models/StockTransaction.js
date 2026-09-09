import mongoose from "mongoose";

const stockTransactionSchema = new mongoose.Schema(
  {
    medicine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inventory",
      required: true,
    },
    medicineName: {
      type: String,
      required: true,
      trim: true,
    },
    batchNumber: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      enum: [
        "purchase",
        "dispensing",
        "return",
        "adjustment",
        "damage",
        "expiry",
        "transfer",
      ],
      required: true,
      index: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    previousStock: {
      type: Number,
      required: true,
    },
    newStock: {
      type: Number,
      required: true,
    },
    unitPrice: {
      type: Number,
      default: 0,
    },
    reason: {
      type: String,
      trim: true,
      default: "",
    },
    referenceType: {
      type: String,
      enum: ["Prescription", "PurchaseOrder", "Return", "ManualAdjustment", "Other"],
      default: "ManualAdjustment",
    },
    referenceId: {
      type: String,
      default: "",
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    performedByName: {
      type: String,
      default: "Staff Pharmacist",
    },
  },
  {
    timestamps: true,
  }
);

stockTransactionSchema.index({ medicine: 1, createdAt: -1 });
stockTransactionSchema.index({ type: 1, createdAt: -1 });

const StockTransaction = mongoose.model("StockTransaction", stockTransactionSchema);

export default StockTransaction;
