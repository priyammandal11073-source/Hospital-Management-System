import mongoose from "mongoose";

const frontDeskTaskSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
    },
    patientName: {
      type: String,
      trim: true,
      default: "",
    },
    taskTitle: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
    },
    category: {
      type: String,
      enum: [
        "online_booking",
        "waiting_checkin",
        "admission",
        "payment",
        "appointment_change",
        "appointment_cancellation",
        "awaiting_doctor",
        "discharge_admin",
        "general_desk",
      ],
      default: "general_desk",
    },
    priority: {
      type: String,
      enum: ["Normal", "Urgent", "Emergency"],
      default: "Normal",
    },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Completed", "Cancelled"],
      default: "Pending",
      index: true,
    },
    dueDate: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    actionLink: {
      type: String,
      default: "",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

const FrontDeskTask = mongoose.model("FrontDeskTask", frontDeskTaskSchema);

export default FrontDeskTask;
