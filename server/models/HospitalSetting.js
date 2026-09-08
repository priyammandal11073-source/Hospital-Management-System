import mongoose from "mongoose";

const hospitalSettingSchema = new mongoose.Schema(
  {
    hospitalName: {
      type: String,
      default: "Nivora Care Hospital",
      trim: true,
    },
    tagline: {
      type: String,
      default: "Center for Clinical Excellence & Patient Governance",
      trim: true,
    },
    accreditation: {
      type: String,
      default: "NABH Accredited • Ayushman Bharat (ABDM) Connected",
      trim: true,
    },
    emergencyHelpline: {
      type: String,
      default: "108 / 112",
      trim: true,
    },
    hospitalPhone: {
      type: String,
      default: "+91 98765 43210",
      trim: true,
    },
    hospitalEmail: {
      type: String,
      default: "admin@nivoracare.com",
      trim: true,
    },
    address: {
      type: String,
      default: "Plot 42, Health City Avenue, Sector 12",
      trim: true,
    },
    city: {
      type: String,
      default: "New Delhi, Delhi - 110001",
      trim: true,
    },
    opdConsultationFee: {
      type: Number,
      default: 500,
    },
    operatingHours: {
      type: String,
      default: "24 Hours Emergency • OPD 08:00 AM - 08:00 PM",
      trim: true,
    },
    tpaDeskContact: {
      type: String,
      default: "+91 98765 43215",
      trim: true,
    },
    notificationEmailAlerts: {
      type: Boolean,
      default: true,
    },
    systemMaintenanceMode: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const HospitalSetting = mongoose.model("HospitalSetting", hospitalSettingSchema);

export default HospitalSetting;
