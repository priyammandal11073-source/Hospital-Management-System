import mongoose from "mongoose";

const maintenanceOrderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true, // e.g., MO-1001
    },
    equipment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Equipment",
    },
    equipmentName: {
      type: String,
      trim: true,
      default: "",
    },
    ward: {
      type: String,
      trim: true,
      default: "",
    },
    room: {
      type: String,
      trim: true,
      default: "",
    },
    issue: {
      type: String,
      required: [true, "Issue description is required"],
      trim: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    reportedBy: {
      type: String,
      trim: true,
      default: "Staff",
    },
    assignedTo: {
      type: String,
      trim: true,
      default: "Biomedical Team",
    },
    status: {
      type: String,
      enum: ["reported", "assigned", "in_progress", "resolved", "closed"],
      default: "reported",
    },
    resolutionNotes: {
      type: String,
      trim: true,
      default: "",
    },
    resolvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

maintenanceOrderSchema.index({ status: 1, priority: 1 });

const MaintenanceOrder = mongoose.model("MaintenanceOrder", maintenanceOrderSchema);

export default MaintenanceOrder;
