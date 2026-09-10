import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipientType: {
      type: String,
      enum: ["staff", "patient", "all"],
      required: true,
      index: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: [
        "appointment_booked",
        "appointment_confirmed",
        "appointment_cancelled",
        "payment_received",
        "lab_report_ready",
        "vitals_alert",
        "doctor_leave",
        "checkin_confirmed",
        "admission_info",
        "discharge_ready",
        "emergency_alert",
        "general",
        "diagnostic_ordered",
        "diagnostic_scheduled",
        "diagnostic_checkin",
        "sample_collected",
        "sample_rejected",
        "diagnostic_completed",
        "critical_diagnostic",
        "report_amended",
      ],
      default: "general",
    },
    role: {
      type: String,
      trim: true,
      default: "",
    },
    diagnosticOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DiagnosticOrder",
    },
    link: {
      type: String,
      default: "",
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for staff and patient notification polling queues
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ patient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipientType: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
