import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
    },
    role: {
      type: String,
      required: [true, "Role is required"],
      enum: {
        values: [
          "admin",
          "super_admin",
          "operations_admin",
          "finance_admin",
          "clinical_admin",
          "hr_admin",
          "doctor",
          "nurse",
          "receptionist",
          "pharmacist",
          "lab_technician",
          "accountant",
          "patient",
        ],
        message: "Invalid user role",
      },
    },
    employeeId: {
      type: String,
      trim: true,
      sparse: true,
    },
    designation: {
      type: String,
      trim: true,
      default: "Hospital Staff",
    },
    department: {
      type: String,
      trim: true,
      default: "General Administration",
    },
    contactNumber: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["active", "inactive", "on_leave", "suspended"],
      default: "active",
    },
    joiningDate: {
      type: Date,
      default: Date.now,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
    },
    permissions: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Re-hash only when a user is created or changes their password.
userSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Checks a login password against the stored bcrypt hash.
userSchema.methods.comparePassword = async function comparePassword(
  candidatePassword
) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
