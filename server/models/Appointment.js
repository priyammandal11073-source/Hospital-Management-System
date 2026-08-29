import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: [true, "Patient is required"],
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: [true, "Doctor is required"],
    },
    appointmentDate: {
      type: Date,
      required: [true, "Appointment date is required"],
    },
    timeSlot: {
      type: String,
      required: [true, "Appointment time slot is required"],
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "confirmed", "completed", "cancelled"],
        message: "Please provide a valid appointment status",
      },
      default: "pending",
    },
    reasonForVisit: {
      type: String,
      required: [true, "Reason for visit is required"],
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Enforces one active appointment per doctor, date, and time slot.
// Cancelled appointments do not occupy a slot and can be rebooked.
appointmentSchema.index(
  { doctor: 1, appointmentDate: 1, timeSlot: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ["pending", "confirmed"] },
    },
  }
);

const Appointment = mongoose.model("Appointment", appointmentSchema);

export default Appointment;
