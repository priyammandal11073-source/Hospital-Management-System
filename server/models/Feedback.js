import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: [true, "Patient is required"],
      index: true,
    },
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: 1,
      max: 5,
    },
    category: {
      type: String,
      trim: true,
      default: "Doctor Consultation",
    },
    comments: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["new", "reviewed"],
      default: "new",
      index: true,
    },
    response: {
      type: String,
      trim: true,
      default: "",
    },
    respondedBy: {
      type: String,
      trim: true,
      default: "",
    },
    respondedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

feedbackSchema.index({ patient: 1, createdAt: -1 });

const Feedback = mongoose.model("Feedback", feedbackSchema);

export default Feedback;
