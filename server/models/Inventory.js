import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Item name is required"],
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "Medication",
        "Medical Supplies",
        "Consumables",
        "Emergency Supplies",
        "Diagnostic Reagents",
        "Equipment Parts",
      ],
      default: "Medication",
    },
    itemCode: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [0, "Quantity cannot be negative"],
      default: 0,
    },
    unit: {
      type: String,
      trim: true,
      default: "Units", // e.g., Strips, Bottles, Boxes, Vials
    },
    minThreshold: {
      type: Number,
      default: 20,
    },
    reorderQuantity: {
      type: Number,
      default: 100,
    },
    unitPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    supplier: {
      type: String,
      trim: true,
      default: "MedLife Pharmaceuticals",
    },
    expiryDate: {
      type: Date,
    },
    batchNumber: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["in_stock", "low_stock", "out_of_stock", "expired"],
      default: "in_stock",
    },
  },
  {
    timestamps: true,
  }
);

inventorySchema.pre("save", function (next) {
  if (this.quantity === 0) {
    this.status = "out_of_stock";
  } else if (this.quantity <= this.minThreshold) {
    this.status = "low_stock";
  } else {
    this.status = "in_stock";
  }
  if (this.expiryDate && new Date(this.expiryDate) < new Date()) {
    this.status = "expired";
  }
  next();
});

inventorySchema.index({ category: 1, status: 1 });

const Inventory = mongoose.model("Inventory", inventorySchema);

export default Inventory;
