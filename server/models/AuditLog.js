import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    userName: {
      type: String,
      trim: true,
      default: "System",
    },
    role: {
      type: String,
      trim: true,
      default: "system",
    },
    action: {
      type: String,
      required: true,
      trim: true,
    },
    module: {
      type: String,
      required: true,
      enum: [
        "auth",
        "patients",
        "doctors",
        "staff",
        "appointments",
        "billing",
        "beds",
        "laboratory",
        "prescriptions",
        "inventory",
        "equipment",
        "maintenance",
        "attendance",
        "procedures",
        "settings",
        "reports",
      ],
      default: "auth",
    },
    recordId: {
      type: String,
      trim: true,
    },
    details: {
      type: String,
      trim: true,
      default: "",
    },
    ipAddress: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ module: 1, action: 1 });
auditLogSchema.index({ user: 1 });

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

export default AuditLog;
