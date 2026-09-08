import mongoose from "mongoose";

const deskHandoverSchema = new mongoose.Schema(
  {
    shiftType: {
      type: String,
      enum: ["Morning", "Evening", "Night"],
      required: [true, "Shift type is required"],
    },
    shiftDate: {
      type: String, // YYYY-MM-DD
      required: [true, "Shift date is required"],
      index: true,
    },
    deskNumber: {
      type: String,
      trim: true,
      default: "Desk 1 - Main Reception",
    },
    outgoingStaff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    outgoingStaffName: {
      type: String,
      required: true,
      trim: true,
    },
    incomingStaff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    incomingStaffName: {
      type: String,
      trim: true,
      default: "",
    },
    pendingAdmissionsCount: {
      type: Number,
      default: 0,
    },
    unsettledPaymentsTotal: {
      type: Number,
      default: 0,
    },
    waitingPatientsCount: {
      type: Number,
      default: 0,
    },
    unconfirmedOnlineBookings: {
      type: Number,
      default: 0,
    },
    administrativeNotes: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["Submitted", "Acknowledged"],
      default: "Submitted",
      index: true,
    },
    acknowledgedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const DeskHandover = mongoose.model("DeskHandover", deskHandoverSchema);

export default DeskHandover;
