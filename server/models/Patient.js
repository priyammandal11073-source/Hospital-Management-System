import mongoose from "mongoose";

const patientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Patient name is required"],
      trim: true,
    },
    age: {
      type: Number,
      required: [true, "Patient age is required"],
      min: [0, "Age cannot be negative"],
    },
    gender: {
      type: String,
      required: [true, "Gender is required"],
      enum: {
        values: ["Male", "Female", "Other"],
        message: "Gender must be Male, Female, or Other",
      },
    },
    contactNumber: {
      type: String,
      required: [true, "Contact number is required"],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    address: {
      type: String,
      trim: true,
    },
    bloodGroup: {
      type: String,
      enum: {
        values: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
        message: "Please provide a valid blood group",
      },
    },
    allergies: {
      type: [String],
      default: [],
    },
    medicalHistory: {
      type: [String],
      default: [],
    },
    registrationDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// This supports quick email searches and prevents duplicate supplied emails.
// `sparse` allows multiple patients to leave the optional email field empty.
patientSchema.index({ email: 1 }, { unique: true, sparse: true });

const Patient = mongoose.model("Patient", patientSchema);

export default Patient;
