import dotenv from "dotenv";
import mongoose from "mongoose";
import Appointment from "./models/Appointment.js";
import Billing from "./models/Billing.js";
import Doctor from "./models/Doctor.js";
import Patient from "./models/Patient.js";
import Prescription from "./models/Prescription.js";
import User from "./models/User.js";

import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env"), override: true });

const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/hospital-db";

const seedDatabase = async () => {
  try {
    console.log(`Connecting to MongoDB at: ${mongoUri}`);
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log("Connected to MongoDB successfully.");

    // Clean existing data
    console.log("Clearing existing data...");
    await Promise.all([
      User.deleteMany({}),
      Doctor.deleteMany({}),
      Patient.deleteMany({}),
      Appointment.deleteMany({}),
      Billing.deleteMany({}),
      Prescription.deleteMany({}),
    ]);

    // 1. Create Staff Users
    console.log("Creating staff users...");
    const adminUser = await User.create({
      name: "Nivora Care Admin",
      email: "admin@hospital.com",
      password: "admin123",
      role: "admin",
    });

    const doctorUser = await User.create({
      name: "Dr. Rajesh Sharma",
      email: "doctor@hospital.com",
      password: "doctor123",
      role: "doctor",
    });

    const receptionistUser = await User.create({
      name: "Sunita Desk Officer",
      email: "receptionist@hospital.com",
      password: "receptionist123",
      role: "receptionist",
    });

    // 2. Create Doctors
    console.log("Creating doctor profiles...");
    const doctor1 = await Doctor.create({
      name: "Rajesh Sharma",
      email: "doctor@hospital.com",
      specialization: "Cardiology",
      department: "Cardiology",
      contactNumber: "9876543210",
      availableDays: ["Monday", "Wednesday", "Friday"],
      availableTimeSlots: ["09:00 AM", "11:00 AM", "02:00 PM", "04:00 PM"],
      yearsOfExperience: 15,
    });

    const doctor2 = await Doctor.create({
      name: "Priya Nair",
      email: "dr.nair@hospital.com",
      specialization: "Pediatrics",
      department: "Pediatrics",
      contactNumber: "9876543211",
      availableDays: ["Tuesday", "Thursday", "Saturday"],
      availableTimeSlots: ["10:00 AM", "12:00 PM", "03:00 PM"],
      yearsOfExperience: 10,
    });

    const doctor3 = await Doctor.create({
      name: "Vikram Patel",
      email: "dr.patel@hospital.com",
      specialization: "Neurology",
      department: "Neurology",
      contactNumber: "9876543212",
      availableDays: ["Monday", "Tuesday", "Thursday"],
      availableTimeSlots: ["09:30 AM", "11:30 AM", "02:30 PM"],
      yearsOfExperience: 12,
    });

    const doctor4 = await Doctor.create({
      name: "Arvind Verma",
      email: "dr.verma@hospital.com",
      specialization: "General Medicine",
      department: "Medicine",
      contactNumber: "9876543213",
      availableDays: ["Monday", "Wednesday", "Friday", "Saturday"],
      availableTimeSlots: ["10:00 AM", "01:00 PM", "05:00 PM"],
      yearsOfExperience: 14,
    });

    // 3. Create Patients (with ABHA numbers and Indian addresses)
    console.log("Creating patients...");
    const patient1 = await Patient.create({
      name: "Rahul Sharma",
      email: "john@example.com",
      password: "patient123",
      age: 35,
      gender: "Male",
      contactNumber: "9876543210",
      address: "123 M.G. Road, Indiranagar, Bengaluru, Karnataka - 560038",
      bloodGroup: "O+",
      abhaId: "14-8891-2345-6789",
      allergies: ["Penicillin"],
      medicalHistory: ["Hypertension"],
    });

    const patient2 = await Patient.create({
      name: "Priya Patel",
      email: "alice@example.com",
      password: "patient123",
      age: 28,
      gender: "Female",
      contactNumber: "9876543211",
      address: "Flat 402, Shanti Kunj, Sector 14, Rohini, New Delhi - 110085",
      bloodGroup: "A+",
      abhaId: "14-1234-5678-9012",
      allergies: ["Dust"],
      medicalHistory: ["Asthma"],
    });

    const patient3 = await Patient.create({
      name: "Amit Kumar",
      email: "amit.kumar@example.com",
      age: 42,
      gender: "Male",
      contactNumber: "9876543212",
      address: "78, Park Street, Salt Lake Sector V, Kolkata, West Bengal - 700091",
      bloodGroup: "B+",
      abhaId: "14-4321-8765-1098",
      allergies: ["Sulfa drugs"],
      medicalHistory: ["Type 2 Diabetes"],
    });

    // 4. Create Appointments
    console.log("Creating appointments...");
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const pastDate = new Date(today);
    pastDate.setDate(pastDate.getDate() - 3);

    const appt1 = await Appointment.create({
      patient: patient1._id,
      doctor: doctor1._id,
      appointmentDate: today,
      timeSlot: "09:00 AM",
      status: "confirmed",
      reasonForVisit: "Routine cardiology consultation",
      bookedBy: "staff",
    });

    const appt2 = await Appointment.create({
      patient: patient2._id,
      doctor: doctor2._id,
      appointmentDate: tomorrow,
      timeSlot: "10:00 AM",
      status: "pending",
      reasonForVisit: "Pediatric consultation & seasonal allergy check",
      bookedBy: "patient",
    });

    const appt3 = await Appointment.create({
      patient: patient1._id,
      doctor: doctor1._id,
      appointmentDate: pastDate,
      timeSlot: "11:00 AM",
      status: "completed",
      reasonForVisit: "Cardiology follow-up & ECG review",
      bookedBy: "staff",
    });

    // 5. Create Billing Records
    console.log("Creating billing records...");
    await Billing.create({
      patient: patient1._id,
      appointment: appt3._id,
      itemizedCharges: [
        { description: "Specialist OPD Consultation", cost: 800 },
        { description: "12-Lead ECG Test", cost: 600 },
        { description: "Blood Pressure & Vitals Monitoring", cost: 100 },
      ],
      paymentStatus: "paid",
      paymentMethod: "upi",
      paymentDate: pastDate,
    });

    await Billing.create({
      patient: patient2._id,
      appointment: appt2._id,
      itemizedCharges: [
        { description: "Pediatric OPD Consultation", cost: 700 },
        { description: "Allergy Screening Test", cost: 800 },
      ],
      paymentStatus: "pending",
    });

    // 6. Create Digital Prescriptions
    console.log("Creating digital prescriptions...");
    const followUp1 = new Date(today);
    followUp1.setDate(followUp1.getDate() + 30);

    const followUp2 = new Date(today);
    followUp2.setDate(followUp2.getDate() + 14);

    await Prescription.create({
      prescriptionNumber: "RX-2026-1042",
      patient: patient1._id,
      doctor: doctor1._id,
      appointment: appt3._id,
      diagnosis: "Primary Hypertension with Mild Tachycardia",
      symptoms: ["Occasional dizziness", "Morning headache", "Palpitations"],
      vitals: {
        bloodPressure: "142/92 mmHg",
        pulseRate: "88 bpm",
        temperature: "98.4 °F",
        weight: "74 kg",
        spo2: "99%",
      },
      medications: [
        {
          name: "Telmisartan 40mg (Telma 40)",
          dosage: "1 tablet",
          frequency: "1-0-0",
          timing: "Before food",
          duration: "30 days",
          instructions: "Take every morning at the same time with water",
        },
        {
          name: "Metoprolol Succinate 25mg (Betaloc)",
          dosage: "1 tablet",
          frequency: "0-0-1",
          timing: "After food",
          duration: "15 days",
          instructions: "Take at bedtime",
        },
        {
          name: "Paracetamol 650mg (Dolo 650)",
          dosage: "1 tablet",
          frequency: "As needed (SOS)",
          timing: "After food",
          duration: "3 days",
          instructions: "Only if severe headache occurs",
        },
      ],
      labTestsRecommended: ["Serum Electrolytes & Creatinine", "Lipid Profile Fasting", "Repeat 12-Lead ECG in 1 month"],
      advice: "Maintain a low-sodium diet (<2g/day). Engage in 30 mins brisk walking daily. Avoid tobacco and excess caffeine. Log BP readings twice weekly.",
      followUpDate: followUp1,
      digitalSignature: {
        signedByName: "Dr. Rajesh Sharma",
        designation: "Cardiology (Cardiology)",
        signedAt: pastDate,
      },
    });

    await Prescription.create({
      prescriptionNumber: "RX-2026-2189",
      patient: patient2._id,
      doctor: doctor2._id,
      diagnosis: "Allergic Rhinitis with Seasonal Bronchial Hyperresponsiveness",
      symptoms: ["Nasal congestion", "Sneezing fits", "Dry cough at night"],
      vitals: {
        bloodPressure: "118/76 mmHg",
        pulseRate: "76 bpm",
        temperature: "98.6 °F",
        weight: "56 kg",
        spo2: "98%",
      },
      medications: [
        {
          name: "Montelukast 10mg + Levocetirizine 5mg (Montair-LC)",
          dosage: "1 tablet",
          frequency: "0-0-1",
          timing: "At bedtime",
          duration: "10 days",
          instructions: "Take before sleeping",
        },
        {
          name: "Fluticasone Furoate Nasal Spray (Flomist)",
          dosage: "2 puffs per nostril",
          frequency: "1-0-1",
          timing: "After food",
          duration: "14 days",
          instructions: "Rinse mouth after use",
        },
        {
          name: "Steam Inhalation with Karvol Plus",
          dosage: "1 capsule in hot water",
          frequency: "1-0-1",
          timing: "As needed (SOS)",
          duration: "5 days",
          instructions: "Inhale steam for 10 minutes",
        },
      ],
      labTestsRecommended: ["Complete Blood Count (CBC) with Absolute Eosinophil Count (AEC)"],
      advice: "Avoid exposure to sudden temperature shifts and dust. Drink warm fluids. Wear a mask in traffic.",
      followUpDate: followUp2,
      digitalSignature: {
        signedByName: "Dr. Priya Nair",
        designation: "Pediatrics (Pediatrics)",
        signedAt: pastDate,
      },
    });

    console.log("\n========================================================");
    console.log("Database seeded successfully with Indian healthcare data!");
    console.log("========================================================");
    console.log("\nStaff Portal Logins (http://localhost:5173/login):");
    console.log("  1. Admin:        admin@hospital.com       / admin123");
    console.log("  2. Doctor:       doctor@hospital.com      / doctor123");
    console.log("  3. Receptionist: receptionist@hospital.com / receptionist123");
    console.log("\nPatient Portal Login (http://localhost:5173/patient/login):");
    console.log("  1. Patient:      john@example.com         / patient123 (Rahul Sharma)");
    console.log("  2. Patient:      alice@example.com        / patient123 (Priya Patel)");
    console.log("========================================================\n");

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error(`\n[!] Seeding failed: ${error.message}`);
    if (error.message.includes("ECONNREFUSED") || error.message.includes("buffering timed out")) {
      console.error("Please ensure MongoDB is running or configure MONGO_URI in server/.env before seeding.");
    }
    process.exit(1);
  }
};

seedDatabase();
