import dotenv from "dotenv";
import mongoose from "mongoose";
import Appointment from "./models/Appointment.js";
import Bed from "./models/Bed.js";
import Billing from "./models/Billing.js";
import Doctor from "./models/Doctor.js";
import Patient from "./models/Patient.js";
import Prescription from "./models/Prescription.js";
import User from "./models/User.js";
import Vitals from "./models/Vitals.js";
import LabReport from "./models/LabReport.js";
import NursingNote from "./models/NursingNote.js";
import NursingTask from "./models/NursingTask.js";
import DoctorOrder from "./models/DoctorOrder.js";
import IntakeOutput from "./models/IntakeOutput.js";
import PatientTransfer from "./models/PatientTransfer.js";
import NurseHandover from "./models/NurseHandover.js";

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
      Bed.deleteMany({}),
      Vitals.deleteMany({}),
      LabReport.deleteMany({}),
      NursingNote.deleteMany({}),
      NursingTask.deleteMany({}),
      DoctorOrder.deleteMany({}),
      IntakeOutput.deleteMany({}),
      PatientTransfer.deleteMany({}),
      NurseHandover.deleteMany({}),
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

    const doctor2User = await User.create({
      name: "Dr. Priya Nair",
      email: "dr.nair@hospital.com",
      password: "doctor123",
      role: "doctor",
    });

    const doctor3User = await User.create({
      name: "Dr. Vikram Patel",
      email: "dr.patel@hospital.com",
      password: "doctor123",
      role: "doctor",
    });

    const receptionistUser = await User.create({
      name: "Sunita Desk Officer",
      email: "receptionist@hospital.com",
      password: "receptionist123",
      role: "receptionist",
    });

    const nurseUser = await User.create({
      name: "Sister Mary Clinical Nurse",
      email: "nurse@hospital.com",
      password: "nurse123",
      role: "nurse",
    });

    const pharmacistUser = await User.create({
      name: "Ananya Deshmukh",
      email: "pharmacist@hospital.com",
      password: "pharmacist123",
      role: "pharmacist",
      designation: "Chief Pharmacist",
      department: "Pharmacy & Medication Services",
      status: "active",
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

    doctorUser.doctor = doctor1._id;
    await doctorUser.save();
    doctor2User.doctor = doctor2._id;
    await doctor2User.save();
    doctor3User.doctor = doctor3._id;
    await doctor3User.save();

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

    // 7. Create Hospital Beds Across All 6 Wards
    console.log("Creating hospital wards and beds...");
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const bedsData = [
      // ICU (Intensive Care Unit) - 2nd Floor
      {
        bedNumber: "ICU-01",
        ward: "ICU (Intensive Care Unit)",
        floor: "2nd floor (East wing)",
        dailyRate: 5000,
        features: { hasOxygen: true, hasVentilator: true, isIsolation: false, hasMonitor: true },
        status: "occupied",
        currentAdmission: {
          patient: patient1._id,
          attendingDoctor: doctor1._id,
          admittedAt: twoDaysAgo,
          admissionReason: "Severe hypertensive urgency with acute chest discomfort & continuous arterial monitoring",
          emergencyContact: "Anjali Sharma (+91 98765 43219)",
          notes: "Cardiac telemetry active. Administering IV antihypertensives as charted.",
        },
      },
      {
        bedNumber: "ICU-02",
        ward: "ICU (Intensive Care Unit)",
        floor: "2nd floor (East wing)",
        dailyRate: 5000,
        features: { hasOxygen: true, hasVentilator: true, isIsolation: false, hasMonitor: true },
        status: "available",
      },
      {
        bedNumber: "ICU-03",
        ward: "ICU (Intensive Care Unit)",
        floor: "2nd floor (East wing)",
        dailyRate: 4500,
        features: { hasOxygen: true, hasVentilator: false, isIsolation: false, hasMonitor: true },
        status: "available",
      },
      {
        bedNumber: "ICU-04",
        ward: "ICU (Intensive Care Unit)",
        floor: "2nd floor (East wing)",
        dailyRate: 4500,
        features: { hasOxygen: true, hasVentilator: false, isIsolation: true, hasMonitor: true },
        status: "cleaning",
      },

      // CCU (Critical Care Unit) - 2nd Floor
      {
        bedNumber: "CCU-01",
        ward: "CCU (Critical Care Unit)",
        floor: "2nd floor (West wing)",
        dailyRate: 4500,
        features: { hasOxygen: true, hasVentilator: true, isIsolation: false, hasMonitor: true },
        status: "occupied",
        currentAdmission: {
          patient: patient3._id,
          attendingDoctor: doctor1._id,
          admittedAt: oneDayAgo,
          admissionReason: "Uncontrolled hyperglycemia with severe ketoacidotic tendency and peripheral neuropathy",
          emergencyContact: "Neha Kumar (+91 98765 43217)",
          notes: "Frequent glucose monitoring required. On subcutaneous insulin protocol.",
        },
      },
      {
        bedNumber: "CCU-02",
        ward: "CCU (Critical Care Unit)",
        floor: "2nd floor (West wing)",
        dailyRate: 4500,
        features: { hasOxygen: true, hasVentilator: false, isIsolation: false, hasMonitor: true },
        status: "available",
      },

      // Emergency & Trauma - Ground Floor
      {
        bedNumber: "EMG-01",
        ward: "Emergency & Trauma",
        floor: "Ground floor (Trauma center)",
        dailyRate: 2500,
        features: { hasOxygen: true, hasVentilator: true, isIsolation: false, hasMonitor: true },
        status: "available",
      },
      {
        bedNumber: "EMG-02",
        ward: "Emergency & Trauma",
        floor: "Ground floor (Trauma center)",
        dailyRate: 2500,
        features: { hasOxygen: true, hasVentilator: false, isIsolation: false, hasMonitor: true },
        status: "available",
      },
      {
        bedNumber: "EMG-03",
        ward: "Emergency & Trauma",
        floor: "Ground floor (Trauma center)",
        dailyRate: 2500,
        features: { hasOxygen: true, hasVentilator: false, isIsolation: false, hasMonitor: true },
        status: "cleaning",
      },
      {
        bedNumber: "EMG-04",
        ward: "Emergency & Trauma",
        floor: "Ground floor (Trauma center)",
        dailyRate: 2500,
        features: { hasOxygen: true, hasVentilator: false, isIsolation: true, hasMonitor: true },
        status: "maintenance",
      },

      // General Ward - 1st Floor
      {
        bedNumber: "GEN-101",
        ward: "General Ward",
        floor: "1st floor (Ward A)",
        dailyRate: 800,
        features: { hasOxygen: true, hasVentilator: false, isIsolation: false, hasMonitor: false },
        status: "available",
      },
      {
        bedNumber: "GEN-102",
        ward: "General Ward",
        floor: "1st floor (Ward A)",
        dailyRate: 800,
        features: { hasOxygen: true, hasVentilator: false, isIsolation: false, hasMonitor: false },
        status: "occupied",
        currentAdmission: {
          patient: patient2._id,
          attendingDoctor: doctor2._id,
          admittedAt: oneDayAgo,
          admissionReason: "Acute bronchial hyperresponsiveness & severe allergic flare under nebulization",
          emergencyContact: "Suresh Patel (+91 98765 43218)",
          notes: "Patient on 4-hourly salbutamol nebulizer. SpO2 stable at 98% on room air.",
        },
      },
      {
        bedNumber: "GEN-103",
        ward: "General Ward",
        floor: "1st floor (Ward A)",
        dailyRate: 800,
        features: { hasOxygen: true, hasVentilator: false, isIsolation: false, hasMonitor: false },
        status: "available",
      },
      {
        bedNumber: "GEN-104",
        ward: "General Ward",
        floor: "1st floor (Ward B)",
        dailyRate: 800,
        features: { hasOxygen: false, hasVentilator: false, isIsolation: false, hasMonitor: false },
        status: "available",
      },
      {
        bedNumber: "GEN-105",
        ward: "General Ward",
        floor: "1st floor (Ward B)",
        dailyRate: 800,
        features: { hasOxygen: false, hasVentilator: false, isIsolation: false, hasMonitor: false },
        status: "cleaning",
      },
      {
        bedNumber: "GEN-106",
        ward: "General Ward",
        floor: "1st floor (Ward B)",
        dailyRate: 800,
        features: { hasOxygen: false, hasVentilator: false, isIsolation: false, hasMonitor: false },
        status: "available",
      },

      // Pediatric Ward - 3rd Floor
      {
        bedNumber: "PED-301",
        ward: "Pediatric Ward",
        floor: "3rd floor (Maternal & Child)",
        dailyRate: 1200,
        features: { hasOxygen: true, hasVentilator: false, isIsolation: false, hasMonitor: true },
        status: "available",
      },
      {
        bedNumber: "PED-302",
        ward: "Pediatric Ward",
        floor: "3rd floor (Maternal & Child)",
        dailyRate: 1200,
        features: { hasOxygen: true, hasVentilator: false, isIsolation: false, hasMonitor: true },
        status: "available",
      },

      // Private Deluxe Room - 4th Floor
      {
        bedNumber: "PVT-201",
        ward: "Private Deluxe Room",
        floor: "4th floor (Executive block)",
        dailyRate: 3500,
        features: { hasOxygen: true, hasVentilator: false, isIsolation: true, hasMonitor: true },
        status: "available",
      },
      {
        bedNumber: "PVT-202",
        ward: "Private Deluxe Room",
        floor: "4th floor (Executive block)",
        dailyRate: 3500,
        features: { hasOxygen: true, hasVentilator: false, isIsolation: true, hasMonitor: true },
        status: "available",
      },
    ];

    await Bed.insertMany(bedsData);

    // 8. Create Clinical Vitals
    console.log("Creating clinical vitals records...");
    await Vitals.create([
      {
        patient: patient1._id,
        recordedBy: "nurse",
        recorderName: "Sister Mary Clinical Nurse",
        bloodPressureSys: 155,
        bloodPressureDia: 98,
        heartRate: 94,
        spo2: 91,
        temperature: 99.8,
        bloodSugar: 180,
        respiratoryRate: 22,
        painScore: 6,
        recordedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        notes: "Complains of mild retrosternal chest tightness. 2L O2 started via nasal cannula.",
      },
      {
        patient: patient1._id,
        recordedBy: "doctor",
        recorderName: "Dr. Rajesh Sharma",
        bloodPressureSys: 145,
        bloodPressureDia: 92,
        heartRate: 88,
        spo2: 94,
        temperature: 98.6,
        bloodSugar: 160,
        respiratoryRate: 18,
        painScore: 4,
        recordedAt: oneDayAgo,
        notes: "Inpatient admission baseline vitals.",
      },
      {
        patient: patient2._id,
        recordedBy: "nurse",
        recorderName: "Sister Mary Clinical Nurse",
        bloodPressureSys: 118,
        bloodPressureDia: 76,
        heartRate: 76,
        spo2: 98,
        temperature: 98.6,
        bloodSugar: 105,
        respiratoryRate: 16,
        painScore: 1,
        recordedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
        notes: "Post-nebulization stable. SpO2 98% on room air.",
      },
      {
        patient: patient3._id,
        recordedBy: "nurse",
        recorderName: "Sister Mary Clinical Nurse",
        bloodPressureSys: 142,
        bloodPressureDia: 90,
        heartRate: 88,
        spo2: 96,
        temperature: 100.2,
        bloodSugar: 285,
        respiratoryRate: 20,
        painScore: 4,
        recordedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
        notes: "Pre-lunch capillary hyperglycemia. High fever spike noted.",
      },
    ]);

    // 9. Create Clinical Nursing Tasks
    console.log("Creating bedside nursing tasks...");
    await NursingTask.create([
      {
        patient: patient1._id,
        assignedNurse: nurseUser._id,
        assignedNurseName: "Sister Mary Clinical Nurse",
        taskType: "Record Vitals",
        title: "Titrate O2 & Arterial Line BP Check",
        description: "Check SpO2 and record invasive BP every hour. Alert doctor if systolic > 160",
        priority: "Critical",
        dueTime: new Date(Date.now() + 30 * 60 * 1000),
        status: "Pending",
        notes: "Cardiac telemetry active",
      },
      {
        patient: patient1._id,
        assignedNurse: nurseUser._id,
        assignedNurseName: "Sister Mary Clinical Nurse",
        taskType: "IV Monitoring",
        title: "IV Labetalol Infusion Rate Verification",
        description: "Check IV site patency and verify infusion pump delivering 0.5 mg/min",
        priority: "High",
        dueTime: new Date(Date.now() + 60 * 60 * 1000),
        status: "In Progress",
      },
      {
        patient: patient2._id,
        assignedNurse: nurseUser._id,
        assignedNurseName: "Sister Mary Clinical Nurse",
        taskType: "Medication Due",
        title: "Salbutamol 2.5mg Nebulization",
        description: "Administer 4-hourly nebulization with oxygen support",
        priority: "Routine",
        dueTime: new Date(Date.now() + 120 * 60 * 1000),
        status: "Pending",
      },
      {
        patient: patient3._id,
        assignedNurse: nurseUser._id,
        assignedNurseName: "Sister Mary Clinical Nurse",
        taskType: "Record Vitals",
        title: "Sliding Scale Regular Insulin Glucose Check",
        description: "Check capillary blood glucose pre-meal and administer insulin per scale",
        priority: "High",
        dueTime: new Date(Date.now() - 25 * 60 * 1000), // Overdue
        status: "Pending",
      },
      {
        patient: patient3._id,
        assignedNurse: nurseUser._id,
        assignedNurseName: "Sister Mary Clinical Nurse",
        taskType: "Dressing Change",
        title: "Right Diabetic Foot Ulcer Sterile Dressing",
        description: "Clean with normal saline, apply betadine gauze dressing and inspect granulation",
        priority: "Moderate",
        dueTime: new Date(Date.now() + 180 * 60 * 1000),
        status: "Pending",
      },
    ]);

    // 10. Create Doctor Orders
    console.log("Creating doctor clinical orders...");
    await DoctorOrder.create([
      {
        patient: patient1._id,
        doctor: doctor1._id,
        doctorName: "Dr. Rajesh Sharma",
        orderType: "Monitoring",
        description: "Continuous arterial line BP and cardiac telemetry monitoring. Maintain MAP > 65 mmHg.",
        priority: "STAT",
        status: "Acknowledged",
        acknowledgedBy: nurseUser._id,
        acknowledgedByName: "Sister Mary Clinical Nurse",
        acknowledgedAt: new Date(Date.now() - 45 * 60 * 1000),
      },
      {
        patient: patient1._id,
        doctor: doctor1._id,
        doctorName: "Dr. Rajesh Sharma",
        orderType: "Lab Test",
        description: "Repeat Serum Troponin I and 12-Lead ECG at 14:00 hrs. Send stat report to desk.",
        priority: "Urgent",
        status: "New",
      },
      {
        patient: patient2._id,
        doctor: doctor2._id,
        doctorName: "Dr. Priya Nair",
        orderType: "Medication",
        description: "Salbutamol 2.5mg + Budesonide 0.5mg nebulization TDS. Steam inhalation BD.",
        priority: "Routine",
        status: "In Progress",
      },
      {
        patient: patient3._id,
        doctor: doctor1._id,
        doctorName: "Dr. Rajesh Sharma",
        orderType: "Diet",
        description: "Diabetic Renal Diet (1800 kcal). Restrict simple carbohydrates, low sodium.",
        priority: "Routine",
        status: "New",
      },
    ]);

    // 11. Create Clinical Nursing Notes
    console.log("Creating nursing notes...");
    await NursingNote.create([
      {
        patient: patient1._id,
        nurse: nurseUser._id,
        nurseName: "Sister Mary Clinical Nurse",
        shift: "Morning",
        category: "Critical Alert",
        note: "Patient reported retrosternal pressure at 08:30 AM. Desaturating to 91% SpO2 on room air. 2L O2 administered via nasal cannula. Attending cardiologist Dr. Sharma notified and bedside telemetry observed.",
        symptomsObserved: "Chest discomfort, mild diaphoresis",
        patientComplaints: "Pressure over mid-sternum",
        patientResponse: "Relieved partially after O2 and sublingual nitrate",
        isCritical: true,
      },
      {
        patient: patient2._id,
        nurse: nurseUser._id,
        nurseName: "Sister Mary Clinical Nurse",
        shift: "Morning",
        category: "Clinical Intervention",
        note: "Patient resting comfortably in semi-fowler position. Nebulization completed. Bilateral rhonchi reduced. Chest auscultation clearer than admission.",
        symptomsObserved: "Mild wheezing, stable cough",
        patientResponse: "Breathing easier, no dyspnea at rest",
        isCritical: false,
      },
      {
        patient: patient3._id,
        nurse: nurseUser._id,
        nurseName: "Sister Mary Clinical Nurse",
        shift: "Morning",
        category: "General Condition",
        note: "Morning capillary glucose 285 mg/dL. 6 units Regular Insulin administered per sliding scale chart. Peripheral pulse palpable. Dietary compliance explained.",
        isCritical: false,
      },
    ]);

    // 12. Create Intake / Output Records
    console.log("Creating fluid intake/output records...");
    const todayYmd = new Date().toISOString().split("T")[0];
    await IntakeOutput.create([
      {
        patient: patient1._id,
        recordedBy: nurseUser._id,
        recorderName: "Sister Mary Clinical Nurse",
        date: todayYmd,
        time: "08:00 AM",
        intakeType: "IV Fluids",
        intakeAmountMl: 500,
        intakeNotes: "Normal Saline maintenance",
        outputType: "Urine",
        outputAmountMl: 450,
        outputNotes: "Clear amber urine via Foley catheter",
      },
      {
        patient: patient1._id,
        recordedBy: nurseUser._id,
        recorderName: "Sister Mary Clinical Nurse",
        date: todayYmd,
        time: "11:30 AM",
        intakeType: "Oral Fluids",
        intakeAmountMl: 250,
        intakeNotes: "Sips of water and oral electrolyte solution",
        outputType: "Urine",
        outputAmountMl: 300,
        outputNotes: "Foley drainage",
      },
      {
        patient: patient2._id,
        recordedBy: nurseUser._id,
        recorderName: "Sister Mary Clinical Nurse",
        date: todayYmd,
        time: "09:00 AM",
        intakeType: "Oral Fluids",
        intakeAmountMl: 400,
        intakeNotes: "Warm clear vegetable soup and tea",
        outputType: "Urine",
        outputAmountMl: 350,
        outputNotes: "Voided without dysuria",
      },
      {
        patient: patient3._id,
        recordedBy: nurseUser._id,
        recorderName: "Sister Mary Clinical Nurse",
        date: todayYmd,
        time: "08:30 AM",
        intakeType: "IV Fluids",
        intakeAmountMl: 500,
        intakeNotes: "Normal Saline rehydration",
        outputType: "Urine",
        outputAmountMl: 650,
        outputNotes: "Polyuria present",
      },
    ]);

    // 13. Create Diagnostic Lab Reports
    console.log("Creating diagnostic lab reports...");
    await LabReport.create([
      {
        reportNumber: "LAB-2026-00101",
        patient: patient1._id,
        doctor: doctor1._id,
        testName: "Serum Electrolytes & Cardiac Enzymes",
        category: "Biochemistry",
        testDate: new Date(),
        status: "sample_collected",
        technicianName: "Central Pathology Desk",
        notes: "Blood sample drawn by Floor Nurse at 08:30 AM",
      },
      {
        reportNumber: "LAB-2026-00102",
        patient: patient3._id,
        doctor: doctor1._id,
        testName: "HbA1c & Fasting Lipid Profile",
        category: "Biochemistry",
        testDate: new Date(),
        status: "ordered",
        technicianName: "Central Pathology Desk",
        notes: "Fasting sample pending morning collection",
      },
    ]);

    // 14. Create Patient Transfer Request
    const genBed = await Bed.findOne({ bedNumber: "GEN-102" });
    const pvtBed = await Bed.findOne({ bedNumber: "PVT-201" });
    if (genBed && pvtBed) {
      await PatientTransfer.create({
        patient: patient2._id,
        fromBed: genBed._id,
        fromWard: genBed.ward,
        fromBedNumber: genBed.bedNumber,
        toBed: pvtBed._id,
        toWard: pvtBed.ward,
        toBedNumber: pvtBed.bedNumber,
        reason: "Patient family requested room upgrade to Private Deluxe for post-acute care",
        requestedBy: nurseUser._id,
        requestedByName: "Sister Mary Clinical Nurse",
        status: "Requested",
        notes: "Awaiting administrative and bed turnover clearance",
      });
    }

    // 15. Create Shift Handover Record
    console.log("Creating shift handover log...");
    await NurseHandover.create({
      shiftType: "Morning",
      shiftDate: todayYmd,
      ward: "ICU & General Inpatient Floors",
      outgoingNurse: nurseUser._id,
      outgoingNurseName: "Sister Mary Clinical Nurse",
      status: "Submitted",
      generalNotes: "All beds rounded. Oxygen cylinders in reserve verified. 1 critical cardiac patient under telemetry monitoring.",
      patientsSummary: [
        {
          patient: patient1._id,
          patientName: "Rahul Sharma",
          ward: "ICU (Intensive Care Unit)",
          bedNumber: "ICU-01",
          condition: "Critical",
          recentVitalsSummary: "BP 155/98 mmHg, SpO2 91% on room air -> 95% on 2L O2",
          pendingMeds: "Labetalol infusion continuous",
          pendingTasks: "Repeat Troponin I blood draw at 14:00 hrs",
          pendingInvestigations: "Cardiac enzyme panel sent to lab",
          doctorInstructions: "Dr. Sharma ordered strict bed rest & arterial monitoring",
          specialCareRequirements: "Cardiac monitor lead checks Q2H",
        },
        {
          patient: patient2._id,
          patientName: "Priya Patel",
          ward: "General Ward",
          bedNumber: "GEN-102",
          condition: "Stable",
          recentVitalsSummary: "BP 118/76 mmHg, SpO2 98%",
          pendingMeds: "Nebulization due at 14:00 hrs",
          doctorInstructions: "Evaluate for discharge tomorrow morning",
        },
        {
          patient: patient3._id,
          patientName: "Amit Kumar",
          ward: "CCU (Critical Care Unit)",
          bedNumber: "CCU-01",
          condition: "High Risk",
          recentVitalsSummary: "Sugar 285 mg/dL, Temp 100.2 °F",
          pendingMeds: "Post-lunch insulin sliding scale check",
          pendingTasks: "Right foot ulcer sterile dressing change",
        },
      ],
    });

    console.log("\n========================================================");
    console.log("Database seeded successfully with Indian healthcare data!");
    console.log("========================================================");
    console.log("\nStaff Portal Logins (http://localhost:5173/login):");
    console.log("  1. Admin:        admin@hospital.com       / admin123");
    console.log("  2. Doctor:       doctor@hospital.com      / doctor123");
    console.log("  3. Receptionist: receptionist@hospital.com / receptionist123");
    console.log("  4. Nurse:        nurse@hospital.com       / nurse123");
    console.log("  5. Pharmacist:   pharmacist@hospital.com  / pharmacist123");
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
