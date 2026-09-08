import mongoose from "mongoose";

const shiftSchema = new mongoose.Schema(
  {
    startTime: { type: String, default: "09:00 AM" },
    endTime: { type: String, default: "05:00 PM" },
    slotDurationMinutes: { type: Number, default: 30 },
    maxPatientsPerSlot: { type: Number, default: 1 },
  },
  { _id: false }
);

const dayScheduleSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      required: true,
    },
    isAvailable: { type: Boolean, default: true },
    shifts: { type: [shiftSchema], default: [{ startTime: "09:00 AM", endTime: "05:00 PM", slotDurationMinutes: 30, maxPatientsPerSlot: 1 }] },
  },
  { _id: false }
);

const leaveSchema = new mongoose.Schema(
  {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    reason: { type: String, trim: true, default: "Personal / Conference Leave" },
    status: { type: String, enum: ["approved", "pending"], default: "approved" },
  },
  { _id: false }
);

const doctorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Doctor name is required"],
      trim: true,
    },
    specialization: {
      type: String,
      required: [true, "Specialization is required"],
      trim: true,
    },
    department: {
      type: String,
      required: [true, "Department is required"],
      trim: true,
    },
    contactNumber: {
      type: String,
      required: [true, "Contact number is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
    },
    availableDays: {
      type: [String],
      default: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    },
    availableTimeSlots: {
      type: [String],
      default: ["09:00 AM", "10:00 AM", "11:00 AM", "02:00 PM", "03:00 PM", "04:00 PM"],
    },
    weeklySchedule: {
      type: [dayScheduleSchema],
      default: [
        { day: "Monday", isAvailable: true, shifts: [{ startTime: "09:00 AM", endTime: "05:00 PM", slotDurationMinutes: 30, maxPatientsPerSlot: 1 }] },
        { day: "Tuesday", isAvailable: true, shifts: [{ startTime: "09:00 AM", endTime: "05:00 PM", slotDurationMinutes: 30, maxPatientsPerSlot: 1 }] },
        { day: "Wednesday", isAvailable: true, shifts: [{ startTime: "09:00 AM", endTime: "05:00 PM", slotDurationMinutes: 30, maxPatientsPerSlot: 1 }] },
        { day: "Thursday", isAvailable: true, shifts: [{ startTime: "09:00 AM", endTime: "05:00 PM", slotDurationMinutes: 30, maxPatientsPerSlot: 1 }] },
        { day: "Friday", isAvailable: true, shifts: [{ startTime: "09:00 AM", endTime: "05:00 PM", slotDurationMinutes: 30, maxPatientsPerSlot: 1 }] },
        { day: "Saturday", isAvailable: true, shifts: [{ startTime: "09:00 AM", endTime: "01:00 PM", slotDurationMinutes: 30, maxPatientsPerSlot: 1 }] },
        { day: "Sunday", isAvailable: false, shifts: [] },
      ],
    },
    leaves: {
      type: [leaveSchema],
      default: [],
    },
    yearsOfExperience: {
      type: Number,
      min: [0, "Years of experience cannot be negative"],
      default: 5,
    },
    consultationFee: {
      type: Number,
      default: 500,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

doctorSchema.index({ email: 1 }, { unique: true });

const Doctor = mongoose.model("Doctor", doctorSchema);

export default Doctor;
