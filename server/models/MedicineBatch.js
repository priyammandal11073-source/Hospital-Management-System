import mongoose from "mongoose";

const medicineBatchSchema = new mongoose.Schema(
  {
    medicine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inventory",
      required: [true, "Medicine reference is required"],
    },
    medicineName: {
      type: String,
      required: true,
      trim: true,
    },
    batchNumber: {
      type: String,
      required: [true, "Batch number is required"],
      trim: true,
      uppercase: true,
    },
    manufacturer: {
      type: String,
      trim: true,
      default: "Standard Pharma Ltd.",
    },
    manufacturingDate: {
      type: Date,
      required: true,
    },
    expiryDate: {
      type: Date,
      required: true,
      index: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [0, "Batch quantity cannot be negative"],
      default: 0,
    },
    unit: {
      type: String,
      trim: true,
      default: "Units",
    },
    purchasePrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    sellingPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    supplier: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["active", "quarantined", "expired", "depleted"],
      default: "active",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

medicineBatchSchema.pre("save", function (next) {
  if (this.expiryDate && new Date(this.expiryDate) <= new Date()) {
    this.status = "expired";
  } else if (this.quantity === 0) {
    this.status = "depleted";
  } else if (this.status !== "quarantined") {
    this.status = "active";
  }
  next();
});

medicineBatchSchema.index({ medicine: 1, batchNumber: 1 }, { unique: true });
medicineBatchSchema.index({ expiryDate: 1, status: 1 });

const MedicineBatch = mongoose.model("MedicineBatch", medicineBatchSchema);

export default MedicineBatch;
