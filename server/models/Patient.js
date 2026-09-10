import mongoose from "mongoose";
import bcrypt from "bcryptjs";

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
    abhaId: {
      type: String,
      trim: true,
    },
    patientId: {
      type: String,
      trim: true,
      index: true,
    },
    dateOfBirth: {
      type: Date,
    },
    emergencyContact: {
      name: { type: String, trim: true },
      phone: { type: String, trim: true },
      relationship: { type: String, trim: true },
    },
    // Patient self-service authentication fields
    // Not required:true to keep staff-created patients (via POST /api/patients) working.
    // Patient self-registration (POST /api/patient-auth/register) validates password separately.
    password: {
      type: String,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// Re-hash only when a patient's password is changed.
patientSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Checks a login password against the stored bcrypt hash.
patientSchema.methods.comparePassword = async function comparePassword(
  candidatePassword
) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Indexes for quick email searches, name/contact queries, and registration date sorting
patientSchema.index({ email: 1 }, { unique: true, sparse: true });
patientSchema.index({ name: 1, contactNumber: 1 });
patientSchema.index({ registrationDate: -1 });
patientSchema.index({ createdAt: -1 });

const Patient = mongoose.model("Patient", patientSchema);

export default Patient;