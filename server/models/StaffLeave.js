import mongoose from "mongoose";

const staffLeaveSchema = new mongoose.Schema(
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
    },
    leaveType: {
      type: String,
      enum: ["Casual Leave", "Sick Leave", "Earned Leave", "Maternity/Paternity", "Medical Emergency", "Conference / Training"],
      default: "Casual Leave",
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    totalDays: {
      type: Number,
      default: 1,
    },
    reason: {
      type: String,
      required: [true, "Leave reason is required"],
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled"],
      default: "pending",
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewerNotes: {
      type: String,
      trim: true,
      default: "",
    },
    reviewedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

staffLeaveSchema.index({ status: 1, startDate: 1 });

const StaffLeave = mongoose.model("StaffLeave", staffLeaveSchema);

export default StaffLeave;
