import mongoose from "mongoose";

const supplierSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Supplier name is required"],
      trim: true,
      unique: true,
    },
    contactPerson: {
      type: String,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
    city: {
      type: String,
      trim: true,
      default: "",
    },
    gstNumber: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
    },
    drugLicenseNumber: {
      type: String,
      trim: true,
      default: "",
    },
    paymentTerms: {
      type: String,
      enum: ["Immediate", "Net 15", "Net 30", "Net 60"],
      default: "Net 30",
    },
    medicinesSupplied: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ["active", "inactive", "blacklisted"],
      default: "active",
      index: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 4,
    },
  },
  {
    timestamps: true,
  }
);

const Supplier = mongoose.model("Supplier", supplierSchema);

export default Supplier;
