import dotenv from "dotenv";
import mongoose from "mongoose";
import Appointment from "./models/Appointment.js";
import Billing from "./models/Billing.js";
import Doctor from "./models/Doctor.js";
import Patient from "./models/Patient.js";
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
    ]);

    // 1. Create Staff Users
    console.log("Creating staff users...");
    const adminUser = await User.create({
      name: "Admin User",
      email: "admin@hospital.com",
      password: "admin123",
      role: "admin",
    });

    const doctorUser = await User.create({
      name: "Dr. Sarah Smith",
      email: "doctor@hospital.com",
      password: "doctor123",
      role: "doctor",
    });

    const receptionistUser = await User.create({
      name: "Jane Receptionist",
      email: "receptionist@hospital.com",
      password: "receptionist123",
      role: "receptionist",
    });

    // 2. Create Doctors
    console.log("Creating doctor profiles...");
    const doctor1 = await Doctor.create({
      name: "Sarah Smith",
      email: "doctor@hospital.com",
      specialization: "Cardiology",
      department: "Cardiology",
      contactNumber: "9876543210",
      availableDays: ["Monday", "Wednesday", "Friday"],
      availableTimeSlots: ["09:00 AM", "11:00 AM", "02:00 PM", "04:00 PM"],
      yearsOfExperience: 10,
    });

    const doctor2 = await Doctor.create({
      name: "James Wilson",
      email: "dr.wilson@hospital.com",
      specialization: "Pediatrics",
      department: "Pediatrics",
      contactNumber: "9876543211",
      availableDays: ["Tuesday", "Thursday", "Saturday"],
      availableTimeSlots: ["10:00 AM", "12:00 PM", "03:00 PM"],
      yearsOfExperience: 8,
    });

    const doctor3 = await Doctor.create({
      name: "Emily Brown",
      email: "dr.brown@hospital.com",
      specialization: "Neurology",
      department: "Neurology",
      contactNumber: "9876543212",
      availableDays: ["Monday", "Tuesday", "Thursday"],
      availableTimeSlots: ["09:30 AM", "11:30 AM", "02:30 PM"],
      yearsOfExperience: 12,
    });

    // 3. Create Patients (one with portal login, one general)
    console.log("Creating patients...");
    const patient1 = await Patient.create({
      name: "John Doe",
      email: "john@example.com",
      password: "patient123",
      age: 35,
      gender: "Male",
      contactNumber: "9123456780",
      address: "123 Elm Street, Cityville",
      bloodGroup: "O+",
      allergies: ["Penicillin"],
      medicalHistory: ["Hypertension"],
    });

    const patient2 = await Patient.create({
      name: "Alice Johnson",
      email: "alice@example.com",
      password: "patient123",
      age: 28,
      gender: "Female",
      contactNumber: "9123456781",
      address: "456 Oak Avenue, Metropolis",
      bloodGroup: "A+",
      allergies: ["Dust"],
      medicalHistory: ["Asthma"],
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
      reasonForVisit: "Routine heart checkup",
      bookedBy: "staff",
    });

    const appt2 = await Appointment.create({
      patient: patient2._id,
      doctor: doctor2._id,
      appointmentDate: tomorrow,
      timeSlot: "10:00 AM",
      status: "pending",
      reasonForVisit: "Persistent cough and seasonal allergy",
      bookedBy: "patient",
    });

    const appt3 = await Appointment.create({
      patient: patient1._id,
      doctor: doctor1._id,
      appointmentDate: pastDate,
      timeSlot: "11:00 AM",
      status: "completed",
      reasonForVisit: "Cardiology follow-up",
      bookedBy: "staff",
    });

    // 5. Create Billing Records
    console.log("Creating billing records...");
    await Billing.create({
      patient: patient1._id,
      appointment: appt3._id,
      itemizedCharges: [
        { description: "Doctor Consultation Fee", cost: 1200 },
        { description: "ECG Test", cost: 800 },
        { description: "Blood Pressure Monitoring", cost: 200 },
      ],
      paymentStatus: "paid",
      paymentMethod: "card",
      paymentDate: pastDate,
    });

    await Billing.create({
      patient: patient2._id,
      appointment: appt2._id,
      itemizedCharges: [
        { description: "Pediatric Consultation", cost: 1000 },
        { description: "Allergy Test Kit", cost: 500 },
      ],
      paymentStatus: "pending",
    });

    console.log("\n========================================================");
    console.log("Database seeded successfully with initial test accounts!");
    console.log("========================================================");
    console.log("\nStaff Portal Logins (http://localhost:5173/login):");
    console.log("  1. Admin:        admin@hospital.com       / admin123");
    console.log("  2. Doctor:       doctor@hospital.com      / doctor123");
    console.log("  3. Receptionist: receptionist@hospital.com / receptionist123");
    console.log("\nPatient Portal Login (http://localhost:5173/patient/login):");
    console.log("  1. Patient:      john@example.com         / patient123");
    console.log("  2. Patient:      alice@example.com        / patient123");
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
