import mongoose from "mongoose";

const staffAttendanceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    employeeName: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      trim: true,
    },
    department: {
      type: String,
      trim: true,
      default: "General",
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    shift: {
      type: String,
      enum: ["Morning (07:00 - 15:00)", "Evening (15:00 - 23:00)", "Night (23:00 - 07:00)", "General (09:00 - 17:00)"],
      default: "General (09:00 - 17:00)",
    },
    checkIn: {
      type: String,
      default: "09:00 AM",
    },
    checkOut: {
      type: String,
      default: "05:00 PM",
    },
    status: {
      type: String,
      enum: ["present", "absent", "late", "half_day", "on_leave"],
      default: "present",
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

staffAttendanceSchema.index({ user: 1, date: 1 }, { unique: true });

const StaffAttendance = mongoose.model("StaffAttendance", staffAttendanceSchema);

export default StaffAttendance;
