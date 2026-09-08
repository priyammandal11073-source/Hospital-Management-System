import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Department name is required"],
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    headOfDepartment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
    },
    location: {
      type: String,
      trim: true,
      default: "Main Hospital Building",
    },
    floor: {
      type: String,
      trim: true,
      default: "1st Floor",
    },
    contactExtension: {
      type: String,
      trim: true,
      default: "101",
    },
    operatingHours: {
      type: String,
      trim: true,
      default: "09:00 AM - 05:00 PM",
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

departmentSchema.index({ status: 1, name: 1 });

const Department = mongoose.model("Department", departmentSchema);

export default Department;
