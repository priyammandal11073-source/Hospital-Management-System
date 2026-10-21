import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";

// Load models
import Appointment from "./models/Appointment.js";
import AuditLog from "./models/AuditLog.js";
import Bed from "./models/Bed.js";
import Billing from "./models/Billing.js";
import ClinicalNote from "./models/ClinicalNote.js";
import Department from "./models/Department.js";
import DeskHandover from "./models/DeskHandover.js";
import Doctor from "./models/Doctor.js";
import DoctorOrder from "./models/DoctorOrder.js";
import Equipment from "./models/Equipment.js";
import Feedback from "./models/Feedback.js";
import FrontDeskTask from "./models/FrontDeskTask.js";
import HospitalSetting from "./models/HospitalSetting.js";
import IntakeOutput from "./models/IntakeOutput.js";
import Inventory from "./models/Inventory.js";
import LabReport from "./models/LabReport.js";
import MaintenanceOrder from "./models/MaintenanceOrder.js";
import MedicineBatch from "./models/MedicineBatch.js";
import Notification from "./models/Notification.js";
import NurseHandover from "./models/NurseHandover.js";
import NursingNote from "./models/NursingNote.js";
import NursingTask from "./models/NursingTask.js";
import Patient from "./models/Patient.js";
import PatientTransfer from "./models/PatientTransfer.js";
import PharmacyDispensing from "./models/PharmacyDispensing.js";
import PharmacyReturn from "./models/PharmacyReturn.js";
import Prescription from "./models/Prescription.js";
import ProcedureSchedule from "./models/ProcedureSchedule.js";
import PurchaseOrder from "./models/PurchaseOrder.js";
import Referral from "./models/Referral.js";
import StaffAttendance from "./models/StaffAttendance.js";
import StaffLeave from "./models/StaffLeave.js";
import StockTransaction from "./models/StockTransaction.js";
import Supplier from "./models/Supplier.js";
import User from "./models/User.js";
import Vitals from "./models/Vitals.js";
import EmergencyEncounter from "./models/EmergencyEncounter.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env"), override: true });

const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/hospital-db";

export const seedDatabase = async () => {
  try {
    console.log(`Connecting to MongoDB at: ${mongoUri.replace(/:([^:@]{4})[^:@]*@/, ":****@")}`);
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 8000 });
    console.log("Connected to MongoDB successfully.");

    // Clean existing data
    console.log("Clearing existing collections...");
    await Promise.all([
      User.deleteMany({}),
      Doctor.deleteMany({}),
      Patient.deleteMany({}),
      Department.deleteMany({}),
      Bed.deleteMany({}),
      Appointment.deleteMany({}),
      Billing.deleteMany({}),
      Prescription.deleteMany({}),
      ClinicalNote.deleteMany({}),
      Referral.deleteMany({}),
      ProcedureSchedule.deleteMany({}),
      Vitals.deleteMany({}),
      NursingTask.deleteMany({}),
      DoctorOrder.deleteMany({}),
      NursingNote.deleteMany({}),
      IntakeOutput.deleteMany({}),
      PatientTransfer.deleteMany({}),
      NurseHandover.deleteMany({}),
      LabReport.deleteMany({}),
      Inventory.deleteMany({}),
      MedicineBatch.deleteMany({}),
      Supplier.deleteMany({}),
      PurchaseOrder.deleteMany({}),
      PharmacyDispensing.deleteMany({}),
      PharmacyReturn.deleteMany({}),
      StockTransaction.deleteMany({}),
      FrontDeskTask.deleteMany({}),
      DeskHandover.deleteMany({}),
      Equipment.deleteMany({}),
      MaintenanceOrder.deleteMany({}),
      StaffAttendance.deleteMany({}),
      StaffLeave.deleteMany({}),
      HospitalSetting.deleteMany({}),
      Notification.deleteMany({}),
      Feedback.deleteMany({}),
      EmergencyEncounter.deleteMany({}),
      AuditLog.deleteMany({}),
    ]);
    console.log("Existing collections cleared.");

    // ──────────────────────────────────────────────────────────────────────────
    // 1. CREATE STAFF & PORTAL USERS
    // ──────────────────────────────────────────────────────────────────────────
    console.log("1. Creating staff & portal user accounts...");
    const adminUser = await User.create({
      name: "Nivora Care Admin",
      email: "admin@hospital.com",
      password: "admin123",
      role: "admin",
      designation: "Chief Administrative Officer",
      department: "Executive Hospital Administration",
      status: "active",
    });

    const doctorUser1 = await User.create({
      name: "Dr. Rajesh Sharma",
      email: "doctor@hospital.com",
      password: "doctor123",
      role: "doctor",
      designation: "Senior Consultant Cardiologist",
      department: "Cardiology",
      status: "active",
    });

    const doctorUser2 = await User.create({
      name: "Dr. Priya Nair",
      email: "dr.nair@hospital.com",
      password: "doctor123",
      role: "doctor",
      designation: "Consultant Pediatrician",
      department: "Pediatrics",
      status: "active",
    });

    const doctorUser3 = await User.create({
      name: "Dr. Vikram Patel",
      email: "dr.patel@hospital.com",
      password: "doctor123",
      role: "doctor",
      designation: "Consultant Neurologist",
      department: "Neurology",
      status: "active",
    });

    const doctorUser4 = await User.create({
      name: "Dr. Arvind Verma",
      email: "dr.verma@hospital.com",
      password: "doctor123",
      role: "doctor",
      designation: "Chief Physician & Diabetologist",
      department: "General Medicine",
      status: "active",
    });

    const doctorUser5 = await User.create({
      name: "Dr. Ramesh Iyer",
      email: "dr.iyer@hospital.com",
      password: "doctor123",
      role: "doctor",
      designation: "Senior Orthopedic Surgeon",
      department: "Orthopedics",
      status: "active",
    });

    const doctorUser6 = await User.create({
      name: "Dr. Ananya Sen",
      email: "dr.sen@hospital.com",
      password: "doctor123",
      role: "doctor",
      designation: "Consultant Dermatologist",
      department: "Dermatology",
      status: "active",
    });

    const doctorUser7 = await User.create({
      name: "Dr. Sunita Reddy",
      email: "dr.reddy@hospital.com",
      password: "doctor123",
      role: "doctor",
      designation: "Senior Obstetrician & Gynecologist",
      department: "Obstetrics & Gynecology",
      status: "active",
    });

    const doctorUser8 = await User.create({
      name: "Dr. Rohan Kapoor",
      email: "dr.kapoor@hospital.com",
      password: "doctor123",
      role: "doctor",
      designation: "Consultant ENT Surgeon",
      department: "ENT (Otolaryngology)",
      status: "active",
    });

    const receptionistUser = await User.create({
      name: "Sunita Desk Officer",
      email: "receptionist@hospital.com",
      password: "receptionist123",
      role: "receptionist",
      designation: "Front Desk & Admissions Officer",
      department: "Front Desk & Cashier",
      status: "active",
    });

    const nurseUser1 = await User.create({
      name: "Sister Mary Clinical Nurse",
      email: "nurse@hospital.com",
      password: "nurse123",
      role: "nurse",
      designation: "Head Inpatient Ward Nurse",
      department: "Clinical Nursing Station",
      status: "active",
    });

    const nurseUser2 = await User.create({
      name: "Nurse Priya Singh",
      email: "nurse.singh@hospital.com",
      password: "nurse123",
      role: "nurse",
      designation: "Critical Care Staff Nurse",
      department: "ICU & Critical Care Nursing",
      status: "active",
    });

    const pharmacistUser = await User.create({
      name: "Ananya Deshmukh",
      email: "pharmacist@hospital.com",
      password: "pharmacist123",
      role: "pharmacist",
      designation: "Chief Pharmacist & Formulary Head",
      department: "Pharmacy & Medication Services",
      status: "active",
    });

    const emergencyUser = await User.create({
      name: "Dr. Emergency Coordinator",
      email: "emergency@hospital.com",
      password: "emergency123",
      role: "emergency",
      designation: "Emergency Department Coordinator",
      department: "Emergency & Trauma",
      status: "active",
    });

    const diagnosticAdminUser = await User.create({
      name: "Diagnostic Admin",
      email: "diagnostics@hospital.com",
      password: "diagnostic123",
      role: "diagnostic_admin",
      designation: "Diagnostic Center Administrator",
      department: "Diagnostics",
      status: "active",
    });

    // ──────────────────────────────────────────────────────────────────────────
    // 2. CREATE DOCTOR CLINICAL PROFILES (8 DEPARTMENTS)
    // ──────────────────────────────────────────────────────────────────────────
    console.log("2. Creating clinical doctor profiles...");
    const doctorDocs = await Doctor.create([
      {
        name: "Dr. Rajesh Sharma",
        email: "doctor@hospital.com",
        specialization: "Cardiology",
        department: "Cardiology",
        contactNumber: "+91 98765 43210",
        availableDays: ["Monday", "Wednesday", "Friday"],
        availableTimeSlots: ["09:00 AM", "10:30 AM", "02:00 PM", "04:00 PM"],
        yearsOfExperience: 16,
        consultationFee: 800,
      },
      {
        name: "Dr. Priya Nair",
        email: "dr.nair@hospital.com",
        specialization: "Pediatrics",
        department: "Pediatrics",
        contactNumber: "+91 98765 43211",
        availableDays: ["Tuesday", "Thursday", "Saturday"],
        availableTimeSlots: ["10:00 AM", "12:00 PM", "03:00 PM"],
        yearsOfExperience: 11,
        consultationFee: 700,
      },
      {
        name: "Dr. Vikram Patel",
        email: "dr.patel@hospital.com",
        specialization: "Neurology",
        department: "Neurology",
        contactNumber: "+91 98765 43212",
        availableDays: ["Monday", "Tuesday", "Thursday"],
        availableTimeSlots: ["09:30 AM", "11:30 AM", "02:30 PM"],
        yearsOfExperience: 14,
        consultationFee: 900,
      },
      {
        name: "Dr. Arvind Verma",
        email: "dr.verma@hospital.com",
        specialization: "General Medicine",
        department: "General Medicine",
        contactNumber: "+91 98765 43213",
        availableDays: ["Monday", "Wednesday", "Friday", "Saturday"],
        availableTimeSlots: ["10:00 AM", "01:00 PM", "05:00 PM"],
        yearsOfExperience: 15,
        consultationFee: 500,
      },
      {
        name: "Dr. Ramesh Iyer",
        email: "dr.iyer@hospital.com",
        specialization: "Orthopedics",
        department: "Orthopedics",
        contactNumber: "+91 98765 43214",
        availableDays: ["Tuesday", "Wednesday", "Friday"],
        availableTimeSlots: ["09:00 AM", "11:00 AM", "03:00 PM"],
        yearsOfExperience: 18,
        consultationFee: 850,
      },
      {
        name: "Dr. Ananya Sen",
        email: "dr.sen@hospital.com",
        specialization: "Dermatology",
        department: "Dermatology",
        contactNumber: "+91 98765 43215",
        availableDays: ["Monday", "Wednesday", "Saturday"],
        availableTimeSlots: ["11:00 AM", "02:00 PM", "04:30 PM"],
        yearsOfExperience: 9,
        consultationFee: 650,
      },
      {
        name: "Dr. Sunita Reddy",
        email: "dr.reddy@hospital.com",
        specialization: "Gynecology & Obstetrics",
        department: "Obstetrics & Gynecology",
        contactNumber: "+91 98765 43216",
        availableDays: ["Tuesday", "Thursday", "Saturday"],
        availableTimeSlots: ["09:30 AM", "11:30 AM", "02:00 PM"],
        yearsOfExperience: 13,
        consultationFee: 750,
      },
      {
        name: "Dr. Rohan Kapoor",
        email: "dr.kapoor@hospital.com",
        specialization: "ENT",
        department: "ENT (Otolaryngology)",
        contactNumber: "+91 98765 43217",
        availableDays: ["Monday", "Thursday", "Friday"],
        availableTimeSlots: ["10:00 AM", "01:00 PM", "04:00 PM"],
        yearsOfExperience: 10,
        consultationFee: 600,
      },
    ]);

    const [docCardio, docPed, docNeuro, docMed, docOrtho, docDerm, docObgyn, docEnt] = doctorDocs;

    // Link doctor profiles back to User documents
    doctorUser1.doctor = docCardio._id; await doctorUser1.save();
    doctorUser2.doctor = docPed._id; await doctorUser2.save();
    doctorUser3.doctor = docNeuro._id; await doctorUser3.save();
    doctorUser4.doctor = docMed._id; await doctorUser4.save();
    doctorUser5.doctor = docOrtho._id; await doctorUser5.save();
    doctorUser6.doctor = docDerm._id; await doctorUser6.save();
    doctorUser7.doctor = docObgyn._id; await doctorUser7.save();
    doctorUser8.doctor = docEnt._id; await doctorUser8.save();

    // ──────────────────────────────────────────────────────────────────────────
    // 3. CREATE DEPARTMENTS
    // ──────────────────────────────────────────────────────────────────────────
    console.log("3. Creating clinical departments...");
    await Department.create([
      { name: "Cardiology", code: "CARD", headOfDepartment: docCardio._id, floor: "2nd Floor (East)", contactExtension: "201", operatingHours: "24 Hours Emergency • OPD 09:00 - 17:00", description: "Comprehensive interventional & non-invasive adult cardiology" },
      { name: "Pediatrics", code: "PED", headOfDepartment: docPed._id, floor: "3rd Floor (Maternal)", contactExtension: "301", operatingHours: "08:00 AM - 06:00 PM", description: "Pediatric outpatient, neonatal intensive care & adolescent health" },
      { name: "Neurology", code: "NEUR", headOfDepartment: docNeuro._id, floor: "2nd Floor (West)", contactExtension: "202", operatingHours: "09:00 AM - 05:00 PM", description: "Comprehensive neurology, stroke unit, EEG & neurophysiology" },
      { name: "General Medicine", code: "MED", headOfDepartment: docMed._id, floor: "1st Floor (OPD A)", contactExtension: "101", operatingHours: "08:00 AM - 08:00 PM", description: "Internal medicine, diabetic clinic, infectious disease & wellness" },
      { name: "Orthopedics", code: "ORTH", headOfDepartment: docOrtho._id, floor: "1st Floor (OPD B)", contactExtension: "102", operatingHours: "09:00 AM - 05:00 PM", description: "Joint replacements, trauma, arthroscopy & spine center" },
      { name: "Dermatology", code: "DERM", headOfDepartment: docDerm._id, floor: "Ground Floor (Clinic 4)", contactExtension: "104", operatingHours: "10:00 AM - 05:00 PM", description: "Clinical dermatology, allergy patch testing & dermatopathology" },
      { name: "Obstetrics & Gynecology", code: "OBGYN", headOfDepartment: docObgyn._id, floor: "3rd Floor (Wing B)", contactExtension: "302", operatingHours: "24 Hours Maternity • OPD 09:00 - 17:00", description: "High-risk pregnancy, fetal medicine & minimally invasive gynecology" },
      { name: "ENT (Otolaryngology)", code: "ENT", headOfDepartment: docEnt._id, floor: "Ground Floor (Clinic 6)", contactExtension: "106", operatingHours: "09:00 AM - 05:00 PM", description: "Head & neck surgery, endoscopy, audiology & sinus center" },
    ]);

    // ──────────────────────────────────────────────────────────────────────────
    // 4. CREATE PATIENTS (REALISTIC INDIAN DEMOGRAPHICS & ABHA IDs)
    // ──────────────────────────────────────────────────────────────────────────
    console.log("4. Creating patient population...");
    const patients = await Patient.create([
      {
        name: "Rahul Sharma",
        email: "john@example.com",
        password: "patient123",
        age: 35,
        gender: "Male",
        contactNumber: "+91 98765 43210",
        address: "123 M.G. Road, Indiranagar, Bengaluru, Karnataka - 560038",
        bloodGroup: "O+",
        abhaId: "14-8891-2345-6789",
        allergies: ["Penicillin"],
        medicalHistory: ["Primary Hypertension", "Mild Hyperlipidemia"],
      },
      {
        name: "Priya Patel",
        email: "alice@example.com",
        password: "patient123",
        age: 28,
        gender: "Female",
        contactNumber: "+91 98765 43211",
        address: "Flat 402, Shanti Kunj, Sector 14, Rohini, New Delhi - 110085",
        bloodGroup: "A+",
        abhaId: "14-1234-5678-9012",
        allergies: ["Dust Mites", "Sulfa Drugs"],
        medicalHistory: ["Bronchial Asthma", "Seasonal Allergic Rhinitis"],
      },
      {
        name: "Amit Kumar",
        email: "amit.kumar@example.com",
        password: "patient123",
        age: 42,
        gender: "Male",
        contactNumber: "+91 98765 43212",
        address: "78, Park Street, Salt Lake Sector V, Kolkata, West Bengal - 700091",
        bloodGroup: "B+",
        abhaId: "14-4321-8765-1098",
        allergies: [],
        medicalHistory: ["Type 2 Diabetes Mellitus", "Diabetic Foot Ulcer"],
      },
      {
        name: "Kavita Desai",
        email: "kavita.desai@example.com",
        password: "patient123",
        age: 64,
        gender: "Female",
        contactNumber: "+91 98765 43213",
        address: "B-12, Alkapuri Society, Jetalpur Road, Vadodara, Gujarat - 390007",
        bloodGroup: "AB+",
        abhaId: "14-7788-9900-1122",
        allergies: ["Aspirin", "NSAIDs"],
        medicalHistory: ["Bilateral Osteoarthritis Knee", "Osteopenia"],
      },
      {
        name: "Meera Nambiar",
        email: "meera.nambiar@example.com",
        password: "patient123",
        age: 31,
        gender: "Female",
        contactNumber: "+91 98765 43214",
        address: "Pranavam, Panampilly Nagar, Kochi, Kerala - 682036",
        bloodGroup: "O-",
        abhaId: "14-3344-5566-7788",
        allergies: [],
        medicalHistory: ["Primigravida (28 Weeks Gestation)", "Gestational Diabetes (Diet Controlled)"],
      },
      {
        name: "Vikram Mehta",
        email: "vikram.mehta@example.com",
        password: "patient123",
        age: 52,
        gender: "Male",
        contactNumber: "+91 98765 43215",
        address: "401, Sea Breeze Apartments, Bandra West, Mumbai, Maharashtra - 400050",
        bloodGroup: "B-",
        abhaId: "14-5566-7788-9900",
        allergies: ["Contrast Media (Iodine)"],
        medicalHistory: ["Coronary Artery Disease (Post-PTCA)", "Hypercholesterolemia"],
      },
      {
        name: "Sanjay Gupta",
        email: "sanjay.gupta@example.com",
        password: "patient123",
        age: 49,
        gender: "Male",
        contactNumber: "+91 98765 43216",
        address: "H-88, South Extension Part 2, New Delhi - 110049",
        bloodGroup: "A-",
        abhaId: "14-2233-4455-6677",
        allergies: [],
        medicalHistory: ["Chronic Kidney Disease (Stage 3)", "Renal Hypertension"],
      },
      {
        name: "Deepak Chopra",
        email: "deepak.chopra@example.com",
        password: "patient123",
        age: 39,
        gender: "Male",
        contactNumber: "+91 98765 43217",
        address: "C-14, Civil Lines, Jaipur, Rajasthan - 302006",
        bloodGroup: "O+",
        abhaId: "14-9988-7766-5544",
        allergies: ["Latex"],
        medicalHistory: ["Plaque Psoriasis", "Seborrheic Dermatitis"],
      },
    ]);

    const [pRahul, pPriya, pAmit, pKavita, pMeera, pVikram, pSanjay, pDeepak] = patients;

    // ──────────────────────────────────────────────────────────────────────────
    // 5. CREATE HOSPITAL WARDS & BEDS
    // ──────────────────────────────────────────────────────────────────────────
    console.log("5. Creating ward beds with admissions...");
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);

    const beds = await Bed.create([
      // ICU - 2nd Floor
      {
        bedNumber: "ICU-01",
        ward: "ICU (Intensive Care Unit)",
        floor: "2nd floor (East wing)",
        dailyRate: 5000,
        features: { hasOxygen: true, hasVentilator: true, isIsolation: false, hasMonitor: true },
        status: "occupied",
        currentAdmission: {
          patient: pRahul._id,
          attendingDoctor: docCardio._id,
          admittedAt: twoDaysAgo,
          admissionReason: "Acute Hypertensive Urgency with Sub-sternal Chest Heaviness & Continuous Telemetry",
          emergencyContact: "Anjali Sharma (+91 98765 43219)",
          notes: "Patient on IV labetalol infusion. Telemetry showing stable sinus rhythm. Arterial MAP maintained > 65.",
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

      // CCU - 2nd Floor
      {
        bedNumber: "CCU-01",
        ward: "CCU (Critical Care Unit)",
        floor: "2nd floor (West wing)",
        dailyRate: 4500,
        features: { hasOxygen: true, hasVentilator: true, isIsolation: false, hasMonitor: true },
        status: "occupied",
        currentAdmission: {
          patient: pAmit._id,
          attendingDoctor: docMed._id,
          admittedAt: threeDaysAgo,
          admissionReason: "Uncontrolled Hyperglycemic Hyperosmolar State with Infected Right Foot Ulcer",
          emergencyContact: "Neha Kumar (+91 98765 43217)",
          notes: "Capillary blood sugar monitoring Q2H. Sliding scale IV insulin active. Surgical debridement completed.",
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
          patient: pPriya._id,
          attendingDoctor: docPed._id,
          admittedAt: oneDayAgo,
          admissionReason: "Severe Acute Asthma Exacerbation requiring 4-hourly nebulization therapy",
          emergencyContact: "Suresh Patel (+91 98765 43218)",
          notes: "Bronchodilator nebulization Q4H. SpO2 maintained at 98% on room air. Family requested transfer to Private Deluxe.",
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
    ]);

    // ──────────────────────────────────────────────────────────────────────────
    // 6. CREATE REALISTIC APPOINTMENTS ACROSS DATES & DOCTORS
    // ──────────────────────────────────────────────────────────────────────────
    console.log("6. Creating appointments across all workflow stages...");
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const pastDate1 = new Date(today); pastDate1.setDate(pastDate1.getDate() - 4);
    const pastDate2 = new Date(today); pastDate2.setDate(pastDate2.getDate() - 2);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const in3Days = new Date(today); in3Days.setDate(in3Days.getDate() + 3);
    const in5Days = new Date(today); in5Days.setDate(in5Days.getDate() + 5);

    const appointments = await Appointment.create([
      // Past completed visits
      {
        patient: pRahul._id,
        doctor: docCardio._id,
        appointmentDate: pastDate1,
        timeSlot: "09:00 AM",
        status: "completed",
        reasonForVisit: "Routine cardiology consultation & blood pressure review",
        bookedBy: "staff",
        diagnosis: "Essential Hypertension (Stage 2)",
      },
      {
        patient: pPriya._id,
        doctor: docPed._id,
        appointmentDate: pastDate2,
        timeSlot: "10:00 AM",
        status: "completed",
        reasonForVisit: "Seasonal wheezing & allergic rhinoconjunctivitis check",
        bookedBy: "patient",
        diagnosis: "Moderate Persistent Asthma with Acute Rhinitis",
      },
      {
        patient: pVikram._id,
        doctor: docCardio._id,
        appointmentDate: pastDate2,
        timeSlot: "11:30 AM",
        status: "completed",
        reasonForVisit: "Post-angioplasty 6-month clinical review & lipid assessment",
        bookedBy: "staff",
        diagnosis: "Stable Ischemic Heart Disease Status-Post Stenting",
      },

      // Today's clinic visits in waiting, in_consultation, and confirmed states
      {
        patient: pRahul._id,
        doctor: docCardio._id,
        appointmentDate: today,
        timeSlot: "09:00 AM",
        status: "waiting",
        reasonForVisit: "Morning telemetry cardiology review & discharge planning",
        bookedBy: "staff",
      },
      {
        patient: pKavita._id,
        doctor: docOrtho._id,
        appointmentDate: today,
        timeSlot: "11:00 AM",
        status: "in_consultation",
        reasonForVisit: "Severe bilateral knee joint pain & difficulty bearing weight",
        bookedBy: "staff",
      },
      {
        patient: pDeepak._id,
        doctor: docDerm._id,
        appointmentDate: today,
        timeSlot: "02:00 PM",
        status: "confirmed",
        reasonForVisit: "Erythematous scaly plaques over extensor surfaces & elbows",
        bookedBy: "staff",
      },
      {
        patient: pMeera._id,
        doctor: docObgyn._id,
        appointmentDate: today,
        timeSlot: "03:30 PM",
        status: "confirmed",
        reasonForVisit: "Third trimester routine antenatal checkup & anomaly ultrasound review",
        bookedBy: "patient",
      },

      // Tomorrow's appointments
      {
        patient: pAmit._id,
        doctor: docMed._id,
        appointmentDate: tomorrow,
        timeSlot: "10:00 AM",
        status: "confirmed",
        reasonForVisit: "Post-CCU glycemic control review & renal function panel",
        bookedBy: "staff",
      },
      {
        patient: pSanjay._id,
        doctor: docNeuro._id,
        appointmentDate: tomorrow,
        timeSlot: "11:30 AM",
        status: "confirmed",
        reasonForVisit: "Chronic tension headache & peripheral neuropathic tingling",
        bookedBy: "patient",
      },
      {
        patient: pPriya._id,
        doctor: docEnt._id,
        appointmentDate: tomorrow,
        timeSlot: "01:00 PM",
        status: "pending",
        reasonForVisit: "Recurrent maxillary sinus tenderness & chronic post-nasal drip",
        bookedBy: "patient",
      },

      // Future bookings
      {
        patient: pKavita._id,
        doctor: docOrtho._id,
        appointmentDate: in3Days,
        timeSlot: "09:00 AM",
        status: "confirmed",
        reasonForVisit: "Pre-operative PAC evaluation for Total Knee Arthroplasty",
        bookedBy: "staff",
      },
      {
        patient: pVikram._id,
        doctor: docCardio._id,
        appointmentDate: in5Days,
        timeSlot: "10:30 AM",
        status: "pending",
        reasonForVisit: "Treadmill stress test (TMT) & echocardiography follow-up",
        bookedBy: "patient",
      },

      // Cancelled appointment
      {
        patient: pDeepak._id,
        doctor: docMed._id,
        appointmentDate: pastDate1,
        timeSlot: "05:00 PM",
        status: "cancelled",
        reasonForVisit: "Routine annual executive health checkup",
        bookedBy: "patient",
        notes: "Patient rescheduled due to official travel.",
      },
    ]);

    const [apptPast1, apptPast2, apptPast3, apptToday1, apptToday2, apptToday3] = appointments;

    // ──────────────────────────────────────────────────────────────────────────
    // 7. CREATE BILLING & INVOICES (VARIOUS PAYMENT STATES & ITEMIZATIONS)
    // ──────────────────────────────────────────────────────────────────────────
    console.log("7. Creating itemized billing & revenue records...");
    await Billing.create([
      // Fully paid bills
      {
        patient: pRahul._id,
        appointment: apptPast1._id,
        itemizedCharges: [
          { description: "Specialist OPD Consultation (Cardiology)", cost: 800 },
          { description: "12-Lead Resting Digital ECG", cost: 600 },
          { description: "Arterial Blood Pressure & SpO2 Monitoring", cost: 100 },
        ],
        totalAmount: 1500,
        paymentStatus: "paid",
        paymentMethod: "upi",
        paymentDate: pastDate1,
        invoiceNumber: "INV-2026-1001",
      },
      {
        patient: pPriya._id,
        appointment: apptPast2._id,
        itemizedCharges: [
          { description: "Pediatric Specialist Consultation", cost: 700 },
          { description: "Nebulization Session (Oxygen Driven)", cost: 350 },
          { description: "Peak Flow Spirometry Measurement", cost: 450 },
        ],
        totalAmount: 1500,
        paymentStatus: "paid",
        paymentMethod: "card",
        paymentDate: pastDate2,
        invoiceNumber: "INV-2026-1002",
      },
      {
        patient: pVikram._id,
        appointment: apptPast3._id,
        itemizedCharges: [
          { description: "Senior Cardiologist Consultation", cost: 800 },
          { description: "Transthoracic 2D Echocardiography", cost: 2200 },
          { description: "Fasting Blood Sugar & Lipid Panel", cost: 850 },
        ],
        totalAmount: 3850,
        paymentStatus: "paid",
        paymentMethod: "cash",
        paymentDate: pastDate2,
        invoiceNumber: "INV-2026-1003",
      },

      // Pending bills
      {
        patient: pRahul._id,
        appointment: apptToday1._id,
        itemizedCharges: [
          { description: "ICU Day Care Room Charges (2 Days)", cost: 10000 },
          { description: "Arterial Line BP & Cardiac Telemetry", cost: 2400 },
          { description: "IV Labetalol & Emergency Infusions", cost: 1250 },
          { description: "Daily Consultant Round Charges", cost: 1600 },
        ],
        totalAmount: 15250,
        paymentStatus: "pending",
        invoiceNumber: "INV-2026-1004",
      },
      {
        patient: pAmit._id,
        itemizedCharges: [
          { description: "CCU Ward Bed Charges (3 Days)", cost: 13500 },
          { description: "Wound Debridement & Foot Dressing", cost: 3500 },
          { description: "Daily Glycemic Profile & Lab Panels", cost: 1800 },
        ],
        totalAmount: 18800,
        paymentStatus: "partially_paid",
        paidAmount: 10000,
        balanceDue: 8800,
        paymentMethod: "upi",
        paymentDate: oneDayAgo,
        invoiceNumber: "INV-2026-1005",
      },
      {
        patient: pKavita._id,
        appointment: apptToday2._id,
        itemizedCharges: [
          { description: "Orthopedic Surgeon Consultation", cost: 850 },
          { description: "Digital Bilateral Knee X-Ray (AP/Lat)", cost: 900 },
        ],
        totalAmount: 1750,
        paymentStatus: "pending",
        invoiceNumber: "INV-2026-1006",
      },
      {
        patient: pDeepak._id,
        appointment: apptToday3._id,
        itemizedCharges: [
          { description: "Dermatology Consultation", cost: 650 },
          { description: "Skin Biopsy & Histopathology Evaluation", cost: 1800 },
        ],
        totalAmount: 2450,
        paymentStatus: "pending",
        invoiceNumber: "INV-2026-1007",
      },
    ]);

    // ──────────────────────────────────────────────────────────────────────────
    // 8. CREATE DIGITAL PRESCRIPTIONS
    // ──────────────────────────────────────────────────────────────────────────
    console.log("8. Creating digital prescriptions with medication schedules...");
    const rx1 = await Prescription.create({
      prescriptionNumber: "RX-2026-1042",
      patient: pRahul._id,
      doctor: docCardio._id,
      appointment: apptPast1._id,
      diagnosis: "Essential Hypertension with Exertional Palpitations",
      symptoms: ["Retrosternal heaviness", "Morning throbbing headache", "Occasional dizziness"],
      vitals: { bloodPressure: "142/92 mmHg", pulseRate: "88 bpm", temperature: "98.4 °F", weight: "74 kg", spo2: "99%" },
      medications: [
        { name: "Telmisartan 40mg (Telma 40)", dosage: "1 tablet", frequency: "1-0-0", timing: "Before food", duration: "30 days", instructions: "Take morning with a full glass of water." },
        { name: "Metoprolol Succinate 25mg (Betaloc)", dosage: "1 tablet", frequency: "0-0-1", timing: "After food", duration: "15 days", instructions: "Take at bedtime. Do not skip doses." },
        { name: "Paracetamol 650mg (Dolo 650)", dosage: "1 tablet", frequency: "SOS", timing: "After food", duration: "3 days", instructions: "Only if severe headache occurs." },
      ],
      labTestsRecommended: ["Serum Electrolytes & Creatinine", "Lipid Profile Fasting", "Repeat 12-Lead ECG"],
      advice: "Restrict dietary sodium (< 2g/day). Engage in 30 mins brisk walking daily. Avoid tobacco and excess caffeine. Log BP readings twice weekly.",
      followUpDate: in5Days,
      dispensingStatus: "dispensed",
      dispensedAt: pastDate1,
      digitalSignature: { signedByName: "Dr. Rajesh Sharma", designation: "Specialist in Cardiology", signedAt: pastDate1 },
    });

    const rx2 = await Prescription.create({
      prescriptionNumber: "RX-2026-2189",
      patient: pPriya._id,
      doctor: docPed._id,
      appointment: apptPast2._id,
      diagnosis: "Moderate Persistent Asthma with Acute Seasonal Rhinitis",
      symptoms: ["Nocturnal dry cough", "Bilateral nasal congestion", "Wheezing on exertion"],
      vitals: { bloodPressure: "118/76 mmHg", pulseRate: "76 bpm", temperature: "98.6 °F", weight: "56 kg", spo2: "98%" },
      medications: [
        { name: "Montelukast 10mg + Levocetirizine 5mg (Montair-LC)", dosage: "1 tablet", frequency: "0-0-1", timing: "At bedtime", duration: "15 days", instructions: "Take every night before sleep." },
        { name: "Fluticasone Furoate Nasal Spray (Flomist)", dosage: "2 sprays per nostril", frequency: "1-0-1", timing: "After food", duration: "21 days", instructions: "Gently clear nose before spraying." },
        { name: "Salbutamol 100mcg Inhaler (Asthalin)", dosage: "2 puffs", frequency: "SOS", timing: "As needed (SOS)", duration: "30 days", instructions: "Inhale when sudden shortness of breath occurs." },
      ],
      labTestsRecommended: ["Complete Blood Count (CBC) with Absolute Eosinophil Count"],
      advice: "Avoid dust, cold air drafts, and pollen exposure. Clean bedding with hot water. Rinse mouth after inhaler use.",
      followUpDate: in3Days,
      dispensingStatus: "dispensed",
      dispensedAt: pastDate2,
      digitalSignature: { signedByName: "Dr. Priya Nair", designation: "Consultant Pediatrician", signedAt: pastDate2 },
    });

    const rx3 = await Prescription.create({
      prescriptionNumber: "RX-2026-3351",
      patient: pAmit._id,
      doctor: docMed._id,
      diagnosis: "Type 2 Diabetes with Peripheral Neuropathy & Foot Ulcer",
      symptoms: ["Burning dysesthesia in feet", "Polydipsia", "Delayed wound healing"],
      vitals: { bloodPressure: "134/86 mmHg", pulseRate: "82 bpm", temperature: "99.1 °F", weight: "78 kg", spo2: "97%" },
      medications: [
        { name: "Metformin 500mg (Glycomet)", dosage: "1 tablet", frequency: "1-0-1", timing: "With food", duration: "30 days", instructions: "Take during or immediately after meals." },
        { name: "Glimepiride 2mg (Amaryl)", dosage: "1 tablet", frequency: "1-0-0", timing: "Before food", duration: "30 days", instructions: "Do not skip breakfast after taking." },
        { name: "Pregabalin 75mg (Pregalin)", dosage: "1 capsule", frequency: "0-0-1", timing: "At bedtime", duration: "20 days", instructions: "For peripheral neuropathic foot pain." },
      ],
      labTestsRecommended: ["HbA1c Glycated Hemoglobin", "Urine Albumin-to-Creatinine Ratio (UACR)"],
      advice: "Strict diabetic renal diet (1800 kcal). Inspect feet daily for cracks or blisters. Keep wound dressing dry and sterile.",
      followUpDate: in5Days,
      dispensingStatus: "pending",
      digitalSignature: { signedByName: "Dr. Arvind Verma", designation: "Chief Physician & Diabetologist", signedAt: oneDayAgo },
    });

    const rx4 = await Prescription.create({
      prescriptionNumber: "RX-2026-4412",
      patient: pKavita._id,
      doctor: docOrtho._id,
      diagnosis: "Severe Bilateral Osteoarthritis Knee (Grade IV)",
      symptoms: ["Severe joint crepitus", "Restricted flexion", "Night pain"],
      vitals: { bloodPressure: "128/82 mmHg", pulseRate: "74 bpm", temperature: "98.4 °F", weight: "68 kg", spo2: "98%" },
      medications: [
        { name: "Aceclofenac 100mg + Paracetamol 325mg (Zerodol-P)", dosage: "1 tablet", frequency: "1-0-1", timing: "After food", duration: "7 days", instructions: "Take after full meal." },
        { name: "Pantoprazole 40mg (Pan 40)", dosage: "1 tablet", frequency: "1-0-0", timing: "Before food", duration: "10 days", instructions: "30 mins before morning breakfast." },
        { name: "Calcium Carbonate 500mg + Vitamin D3 (Shelcal 500)", dosage: "1 tablet", frequency: "0-1-0", timing: "After food", duration: "30 days", instructions: "Take daily with water." },
      ],
      labTestsRecommended: ["Serum Uric Acid", "Serum Calcium & Alkaline Phosphatase"],
      advice: "Avoid squatting, sitting cross-legged, or climbing stairs. Use knee brace during ambulation. Apply cold pack for 15 mins post-walk.",
      followUpDate: in3Days,
      dispensingStatus: "pending",
      digitalSignature: { signedByName: "Dr. Ramesh Iyer", designation: "Senior Orthopedic Surgeon", signedAt: today },
    });

    // ──────────────────────────────────────────────────────────────────────────
    // 9. CREATE CLINICAL NOTES (SOAP FORMAT)
    // ──────────────────────────────────────────────────────────────────────────
    console.log("9. Creating clinical SOAP notes...");
    await ClinicalNote.create([
      {
        patient: pRahul._id,
        doctor: docCardio._id,
        doctorName: "Dr. Rajesh Sharma",
        appointment: apptPast1._id,
        noteType: "Consultation",
        chiefComplaint: "Recurrent morning headaches with retrosternal chest tightening for 2 weeks",
        clinicalHistory: "35-year-old male with 3-year history of poorly controlled hypertension. Not compliant with salt restriction.",
        examination: "Pulse 88 bpm regular, BP 155/98 mmHg left arm supine, S1 S2 heard normally, no murmurs, chest clear bilaterally.",
        assessment: "Primary Hypertension Grade 2 with autonomic hyper-reactivity. No overt signs of acute heart failure.",
        diagnosis: "Essential Hypertension with Sub-acute Symptoms",
        treatmentPlan: "Titrate Telmisartan to 40mg daily. Add Metoprolol 25mg at night. Advise ambulatory BP monitoring.",
        followUpInstructions: "Follow up in OPD after 14 days with home BP log.",
      },
      {
        patient: pPriya._id,
        doctor: docPed._id,
        doctorName: "Dr. Priya Nair",
        appointment: apptPast2._id,
        noteType: "Consultation",
        chiefComplaint: "Wheezing fits triggered by cold weather and night cough",
        clinicalHistory: "Known asthmatic on intermittent inhalers. Recent viral URI triggered a prolonged flare.",
        examination: "Bilateral end-expiratory rhonchi present over lung bases. Throat congested. SpO2 96% on room air.",
        assessment: "Acute asthma flare secondary to seasonal allergic allergen exposure.",
        diagnosis: "Moderate Persistent Bronchial Asthma Flare",
        treatmentPlan: "Nebulization in clinic. Prescribe Montair-LC, Flomist nasal spray, and regular Asthalin inhaler.",
        followUpInstructions: "Review in 2 weeks or immediately if peak expiratory flow drops below 70%.",
      },
      {
        patient: pAmit._id,
        doctor: docMed._id,
        doctorName: "Dr. Arvind Verma",
        noteType: "Progress",
        chiefComplaint: "Inpatient daily round: Capillary blood glucose fluctuating between 220-285 mg/dL",
        clinicalHistory: "Admitted to CCU with diabetic ketoacidotic tendency and right plantar ulcer.",
        examination: "Wound bed clean post-saline debridement, minimal serosanguinous discharge, peripheral dorsalis pedis palpable.",
        assessment: "Diabetic foot ulcer improving, glycemic response stabilizing under subcutaneous sliding scale insulin.",
        diagnosis: "Type 2 DM with Healing Neuro-ischemic Plantar Ulcer",
        treatmentPlan: "Continue IV Ceftriaxone 1g BD. Daily sterile betadine dressing. Shift to subcutaneous glargine at bedtime.",
        followUpInstructions: "Consult orthopedic surgeon if deeper fascial plane involvement is suspected.",
      },
    ]);

    // ──────────────────────────────────────────────────────────────────────────
    // 10. CREATE SPECIALIST REFERRALS
    // ──────────────────────────────────────────────────────────────────────────
    console.log("10. Creating specialist referrals...");
    await Referral.create([
      {
        patient: pRahul._id,
        referringDoctor: docMed._id,
        referringDoctorName: "Dr. Arvind Verma",
        specialistDoctor: docCardio._id,
        specialistDoctorName: "Dr. Rajesh Sharma",
        department: "Cardiology",
        reason: "Refractory hypertension despite dual therapy; evaluate for secondary renal artery stenosis or LVH.",
        clinicalSummary: "Patient exhibits resting diastolic BP consistently > 95 mmHg. Requires 2D Echo and renal Doppler review.",
        priority: "Urgent",
        status: "Accepted",
      },
      {
        patient: pPriya._id,
        referringDoctor: docPed._id,
        referringDoctorName: "Dr. Priya Nair",
        specialistDoctor: docEnt._id,
        specialistDoctorName: "Dr. Rohan Kapoor",
        department: "ENT (Otolaryngology)",
        reason: "Recurrent sinus tenderness and mouth breathing; evaluate for adenoid hypertrophy or nasal polyposis.",
        clinicalSummary: "Frequent allergic exacerbations with clear signs of hypertrophied inferior turbinates on rhinoscopy.",
        priority: "Routine",
        status: "Requested",
      },
      {
        patient: pKavita._id,
        referringDoctor: docMed._id,
        referringDoctorName: "Dr. Arvind Verma",
        specialistDoctor: docOrtho._id,
        specialistDoctorName: "Dr. Ramesh Iyer",
        department: "Orthopedics",
        reason: "Severe bilateral knee degenerative changes refractory to conservative analgesia and physiotherapy.",
        clinicalSummary: "Severe medial compartment joint space narrowing with osteophytes. Candidate for arthroplasty.",
        priority: "Routine",
        status: "Accepted",
      },
    ]);

    // ──────────────────────────────────────────────────────────────────────────
    // 11. CREATE OPERATING THEATRE / PROCEDURE SCHEDULES
    // ──────────────────────────────────────────────────────────────────────────
    console.log("11. Creating operating theatre surgical schedules...");
    await ProcedureSchedule.create([
      {
        procedureName: "Diagnostic Coronary Angiography (CAG)",
        procedureCode: "PR-CARD-01",
        patient: pVikram._id,
        leadSurgeon: docCardio._id,
        anesthetist: "Dr. Meenakshi Sundaram (Cardiac Anesthesia)",
        operatingRoom: "OT Suite 2 (Cardiac & Thoracic)",
        scheduledDate: tomorrow,
        startTime: "09:00 AM",
        durationMinutes: 60,
        status: "scheduled",
        preOpInstructions: "NPO after midnight. Verify PT/INR and serum creatinine. Shave right groin/radial access site.",
      },
      {
        procedureName: "Bilateral Total Knee Replacement (TKR) - Stage 1",
        procedureCode: "PR-ORTHO-04",
        patient: pKavita._id,
        leadSurgeon: docOrtho._id,
        anesthetist: "Dr. S. K. Gupta (Senior Anesthesiologist)",
        operatingRoom: "OT Suite 3 (Orthopedics & Trauma)",
        scheduledDate: in3Days,
        startTime: "10:30 AM",
        durationMinutes: 120,
        status: "scheduled",
        preOpInstructions: "NPO 8 hours prior. Cross-match 2 units PRBC. Complete pre-anesthetic checkup clearance.",
      },
      {
        procedureName: "Right Foot Debridement & Negative Pressure Wound Therapy",
        procedureCode: "PR-SURG-08",
        patient: pAmit._id,
        leadSurgeon: docOrtho._id,
        anesthetist: "Dr. Meenakshi Sundaram",
        operatingRoom: "Minor Procedure Room",
        scheduledDate: pastDate2,
        startTime: "02:00 PM",
        durationMinutes: 45,
        status: "completed",
        postOpNotes: "Debridement completed successfully with clean bleeding margins. Vacuum sponge applied at -125 mmHg continuous.",
      },
    ]);

    // ──────────────────────────────────────────────────────────────────────────
    // 12. CREATE INPATIENT CLINICAL CARE (VITALS, TASKS, ORDERS, NOTES, I/O)
    // ──────────────────────────────────────────────────────────────────────────
    console.log("12. Creating inpatient care flowsheet, nursing tasks & doctor orders...");
    await Vitals.create([
      {
        patient: pRahul._id,
        recordedBy: "nurse",
        recorderName: "Sister Mary Clinical Nurse",
        bloodPressureSys: 148,
        bloodPressureDia: 92,
        heartRate: 84,
        spo2: 97,
        temperature: 98.6,
        bloodSugar: 128,
        respiratoryRate: 18,
        painScore: 2,
        recordedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        notes: "Resting in ICU bed. IV labetalol maintaining target systolic < 150. Telemetry clean.",
      },
      {
        patient: pRahul._id,
        recordedBy: "doctor",
        recorderName: "Dr. Rajesh Sharma",
        bloodPressureSys: 155,
        bloodPressureDia: 98,
        heartRate: 92,
        spo2: 94,
        temperature: 99.2,
        bloodSugar: 140,
        respiratoryRate: 20,
        painScore: 4,
        recordedAt: oneDayAgo,
        notes: "Admission baseline vitals in ICU. Mild diaphoresis present.",
      },
      {
        patient: pPriya._id,
        recordedBy: "nurse",
        recorderName: "Sister Mary Clinical Nurse",
        bloodPressureSys: 118,
        bloodPressureDia: 76,
        heartRate: 76,
        spo2: 98,
        temperature: 98.4,
        bloodSugar: 98,
        respiratoryRate: 16,
        painScore: 1,
        recordedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
        notes: "Post-nebulization stable. SpO2 98% on room air. Lungs auscultating clear.",
      },
      {
        patient: pAmit._id,
        recordedBy: "nurse",
        recorderName: "Nurse Priya Singh",
        bloodPressureSys: 138,
        bloodPressureDia: 88,
        heartRate: 86,
        spo2: 96,
        temperature: 99.8,
        bloodSugar: 242,
        respiratoryRate: 20,
        painScore: 3,
        recordedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
        notes: "Capillary blood sugar 242 mg/dL pre-lunch. Administered 4 units regular insulin per sliding scale.",
      },
    ]);

    await NursingTask.create([
      {
        patient: pRahul._id,
        assignedNurse: nurseUser1._id,
        assignedNurseName: "Sister Mary Clinical Nurse",
        taskType: "Record Vitals",
        title: "Arterial Line BP & Telemetry Check",
        description: "Check invasive BP & heart rhythm every hour. Alert Dr. Sharma if systolic > 160 or diastolic > 100.",
        priority: "Critical",
        dueTime: new Date(Date.now() + 30 * 60 * 1000),
        status: "Pending",
        notes: "Target MAP > 65 mmHg.",
      },
      {
        patient: pRahul._id,
        assignedNurse: nurseUser1._id,
        assignedNurseName: "Sister Mary Clinical Nurse",
        taskType: "IV Monitoring",
        title: "IV Labetalol Infusion Rate Verification",
        description: "Confirm infusion pump rate set to 0.5 mg/min and verify peripheral site patency.",
        priority: "High",
        dueTime: new Date(Date.now() + 60 * 60 * 1000),
        status: "In Progress",
      },
      {
        patient: pPriya._id,
        assignedNurse: nurseUser1._id,
        assignedNurseName: "Sister Mary Clinical Nurse",
        taskType: "Medication Due",
        title: "Salbutamol 2.5mg Nebulization",
        description: "Administer 4-hourly nebulization with oxygen support and auscultate lungs post-session.",
        priority: "Routine",
        dueTime: new Date(Date.now() + 120 * 60 * 1000),
        status: "Pending",
      },
      {
        patient: pAmit._id,
        assignedNurse: nurseUser2._id,
        assignedNurseName: "Nurse Priya Singh",
        taskType: "Record Vitals",
        title: "Sliding Scale Capillary Blood Glucose",
        description: "Pre-dinner blood glucose check and administer insulin per protocol.",
        priority: "High",
        dueTime: new Date(Date.now() + 180 * 60 * 1000),
        status: "Pending",
      },
      {
        patient: pAmit._id,
        assignedNurse: nurseUser2._id,
        assignedNurseName: "Nurse Priya Singh",
        taskType: "Dressing Change",
        title: "Sterile Foot Ulcer Dressing Change",
        description: "Inspect vacuum sponge seal, clean margins with normal saline, and record exudate volume.",
        priority: "Moderate",
        dueTime: new Date(Date.now() + 240 * 60 * 1000),
        status: "Pending",
      },
    ]);

    await DoctorOrder.create([
      {
        patient: pRahul._id,
        doctor: docCardio._id,
        doctorName: "Dr. Rajesh Sharma",
        orderType: "Monitoring",
        description: "Continuous arterial line BP and cardiac telemetry monitoring. Alert if MAP < 65 or > 110.",
        priority: "STAT",
        status: "Acknowledged",
        acknowledgedBy: nurseUser1._id,
        acknowledgedByName: "Sister Mary Clinical Nurse",
        acknowledgedAt: new Date(Date.now() - 45 * 60 * 1000),
      },
      {
        patient: pRahul._id,
        doctor: docCardio._id,
        doctorName: "Dr. Rajesh Sharma",
        orderType: "Lab Test",
        description: "Repeat High-Sensitivity Troponin I and 12-Lead ECG at 16:00 hrs. Send stat report to desk.",
        priority: "Urgent",
        status: "New",
      },
      {
        patient: pPriya._id,
        doctor: docPed._id,
        doctorName: "Dr. Priya Nair",
        orderType: "Medication",
        description: "Salbutamol 2.5mg + Budesonide 0.5mg nebulization TDS. Evaluate for discharge tomorrow morning.",
        priority: "Routine",
        status: "In Progress",
      },
      {
        patient: pAmit._id,
        doctor: docMed._id,
        doctorName: "Dr. Arvind Verma",
        orderType: "Diet",
        description: "Diabetic Renal Diet (1800 kcal). Strict sodium restriction (<2g/day).",
        priority: "Routine",
        status: "New",
      },
    ]);

    await NursingNote.create([
      {
        patient: pRahul._id,
        nurse: nurseUser1._id,
        nurseName: "Sister Mary Clinical Nurse",
        shift: "Morning",
        category: "Critical Alert",
        note: "Patient reported mild retrosternal pressure at 08:30 AM. Telemetry monitored continuously. Relieved following sublingual nitrate.",
        symptomsObserved: "Chest heaviness, mild diaphoresis",
        patientResponse: "Pain score reduced from 4/10 to 1/10 post nitrate. BP 148/92 mmHg.",
        isCritical: true,
      },
      {
        patient: pPriya._id,
        nurse: nurseUser1._id,
        nurseName: "Sister Mary Clinical Nurse",
        shift: "Morning",
        category: "Clinical Intervention",
        note: "Patient resting comfortably in semi-fowler position. Nebulization completed at 10:00 AM. Breathing unlabored on room air.",
        symptomsObserved: "Mild expiratory wheeze on exertion, stable at rest",
        patientResponse: "Breathing freely, no accessory muscle retractions.",
        isCritical: false,
      },
      {
        patient: pAmit._id,
        nurse: nurseUser2._id,
        nurseName: "Nurse Priya Singh",
        shift: "Morning",
        category: "General Condition",
        note: "Morning capillary glucose 242 mg/dL. Administered 4 units regular insulin. Negative pressure wound sponge seal intact.",
        isCritical: false,
      },
    ]);

    const todayYmd = new Date().toISOString().split("T")[0];
    await IntakeOutput.create([
      {
        patient: pRahul._id,
        recordedBy: nurseUser1._id,
        recorderName: "Sister Mary Clinical Nurse",
        date: todayYmd,
        time: "08:00 AM",
        intakeType: "IV Fluids",
        intakeAmountMl: 500,
        intakeNotes: "Normal Saline maintenance infusion",
        outputType: "Urine",
        outputAmountMl: 450,
        outputNotes: "Clear amber urine via Foley catheter",
      },
      {
        patient: pRahul._id,
        recordedBy: nurseUser1._id,
        recorderName: "Sister Mary Clinical Nurse",
        date: todayYmd,
        time: "12:00 PM",
        intakeType: "Oral Fluids",
        intakeAmountMl: 250,
        intakeNotes: "Sips of oral electrolyte solution",
        outputType: "Urine",
        outputAmountMl: 320,
        outputNotes: "Foley output clear",
      },
      {
        patient: pPriya._id,
        recordedBy: nurseUser1._id,
        recorderName: "Sister Mary Clinical Nurse",
        date: todayYmd,
        time: "09:30 AM",
        intakeType: "Oral Fluids",
        intakeAmountMl: 350,
        intakeNotes: "Warm clear vegetable broth & water",
        outputType: "Urine",
        outputAmountMl: 300,
        outputNotes: "Voided normally without dysuria",
      },
      {
        patient: pAmit._id,
        recordedBy: nurseUser2._id,
        recorderName: "Nurse Priya Singh",
        date: todayYmd,
        time: "08:30 AM",
        intakeType: "IV Fluids",
        intakeAmountMl: 500,
        intakeNotes: "Normal Saline rehydration",
        outputType: "Urine",
        outputAmountMl: 600,
        outputNotes: "Adequate hourly diuresis",
      },
    ]);

    // Patient transfer request
    const genBed = await Bed.findOne({ bedNumber: "GEN-102" });
    const pvtBed = await Bed.findOne({ bedNumber: "PVT-201" });
    if (genBed && pvtBed) {
      await PatientTransfer.create({
        patient: pPriya._id,
        fromBed: genBed._id,
        fromWard: genBed.ward,
        fromBedNumber: genBed.bedNumber,
        toBed: pvtBed._id,
        toWard: pvtBed.ward,
        toBedNumber: pvtBed.bedNumber,
        reason: "Patient family requested room upgrade to Private Deluxe for post-acute recovery",
        requestedBy: nurseUser1._id,
        requestedByName: "Sister Mary Clinical Nurse",
        status: "Requested",
        notes: "Awaiting administrative turnover and sanitized bed readiness.",
      });
    }

    // Nurse shift handover
    await NurseHandover.create({
      shiftType: "Morning",
      shiftDate: todayYmd,
      ward: "ICU & General Inpatient Floors",
      outgoingNurse: nurseUser1._id,
      outgoingNurseName: "Sister Mary Clinical Nurse",
      status: "Submitted",
      generalNotes: "All inpatient wards rounded. Central O2 manifold pressure verified. 1 critical cardiac patient under telemetry monitoring.",
      patientsSummary: [
        {
          patient: pRahul._id,
          patientName: "Rahul Sharma",
          ward: "ICU (Intensive Care Unit)",
          bedNumber: "ICU-01",
          condition: "Critical",
          recentVitalsSummary: "BP 148/92 mmHg, HR 84 bpm, SpO2 97%",
          pendingMeds: "Labetalol infusion continuous at 0.5 mg/min",
          pendingTasks: "Repeat Troponin I blood draw at 16:00 hrs",
          doctorInstructions: "Dr. Sharma ordered strict bed rest & telemetry",
        },
        {
          patient: pPriya._id,
          patientName: "Priya Patel",
          ward: "General Ward",
          bedNumber: "GEN-102",
          condition: "Stable",
          recentVitalsSummary: "BP 118/76 mmHg, SpO2 98% on room air",
          pendingMeds: "Nebulization due at 14:00 hrs",
          doctorInstructions: "Evaluate for discharge tomorrow morning",
        },
        {
          patient: pAmit._id,
          patientName: "Amit Kumar",
          ward: "CCU (Critical Care Unit)",
          bedNumber: "CCU-01",
          condition: "High Risk",
          recentVitalsSummary: "Blood sugar 242 mg/dL, Temp 99.8 °F",
          pendingMeds: "Pre-dinner insulin sliding scale",
          pendingTasks: "Foot ulcer negative pressure dressing inspection",
        },
      ],
    });

    // ──────────────────────────────────────────────────────────────────────────
    // 13. CREATE DIAGNOSTIC LAB REPORTS
    // ──────────────────────────────────────────────────────────────────────────
    console.log("13. Creating diagnostic laboratory reports...");
    await LabReport.create([
      {
        reportNumber: "LAB-2026-00101",
        patient: pRahul._id,
        doctor: docCardio._id,
        testName: "High-Sensitivity Troponin I & Cardiac Enzymes",
        category: "Biochemistry",
        testDate: new Date(),
        status: "completed",
        isCritical: false,
        doctorReviewStatus: "reviewed",
        reviewedByDoctor: docCardio._id,
        reviewedAt: new Date(),
        technicianName: "Central Pathology Desk",
        testResults: [
          { parameter: "Troponin I (hs-cTnI)", result: "14.2", unit: "pg/mL", referenceRange: "< 26.2 pg/mL", status: "normal" },
          { parameter: "CK-MB", result: "18", unit: "U/L", referenceRange: "< 25 U/L", status: "normal" },
        ],
        notes: "Cardiac enzyme levels within normal reference ranges. Excludes acute transmural infarction.",
      },
      {
        reportNumber: "LAB-2026-00102",
        patient: pAmit._id,
        doctor: docMed._id,
        testName: "HbA1c & Fasting Lipid Profile",
        category: "Biochemistry",
        testDate: new Date(),
        status: "completed",
        isCritical: true,
        doctorReviewStatus: "pending",
        technicianName: "Central Pathology Desk",
        testResults: [
          { parameter: "HbA1c Glycated Hemoglobin", result: "10.4", unit: "%", referenceRange: "< 5.7 %", status: "critical" },
          { parameter: "Fasting Blood Sugar", result: "248", unit: "mg/dL", referenceRange: "70-99 mg/dL", status: "critical" },
          { parameter: "Serum Triglycerides", result: "290", unit: "mg/dL", referenceRange: "< 150 mg/dL", status: "high" },
        ],
        notes: "Markedly elevated glycated hemoglobin reflecting poor glycemic control over preceding trimester.",
      },
      {
        reportNumber: "LAB-2026-00103",
        patient: pPriya._id,
        doctor: docPed._id,
        testName: "Complete Blood Count (CBC) with Absolute Eosinophil Count",
        category: "Hematology",
        testDate: new Date(),
        status: "completed",
        isCritical: false,
        doctorReviewStatus: "reviewed",
        reviewedByDoctor: docPed._id,
        reviewedAt: new Date(),
        technicianName: "Central Pathology Desk",
        testResults: [
          { parameter: "Hemoglobin", result: "13.2", unit: "g/dL", referenceRange: "12.0 - 15.5 g/dL", status: "normal" },
          { parameter: "Total Leukocyte Count (TLC)", result: "8400", unit: "/cumm", referenceRange: "4000 - 11000", status: "normal" },
          { parameter: "Absolute Eosinophil Count (AEC)", result: "680", unit: "/cumm", referenceRange: "40 - 450", status: "high" },
        ],
        notes: "Elevated AEC consistent with seasonal allergic airway diathesis.",
      },
      {
        reportNumber: "LAB-2026-00104",
        patient: pSanjay._id,
        doctor: docMed._id,
        testName: "Renal Function Panel & Serum Electrolytes",
        category: "Biochemistry",
        testDate: new Date(),
        status: "sample_collected",
        technicianName: "Central Pathology Desk",
        notes: "Serum sample received in central lab at 10:15 AM. Centrifugation in progress.",
      },
    ]);

    // ──────────────────────────────────────────────────────────────────────────
    // 14. CREATE PHARMACY FORMULARY & INVENTORY (30+ ITEMS)
    // ──────────────────────────────────────────────────────────────────────────
    console.log("14. Creating comprehensive pharmacy medication inventory...");
    const inventoryData = [
      // Medications
      { name: "Telmisartan 40mg (Telma 40)", category: "Medication", itemCode: "MED-TEL-40", quantity: 450, unit: "Tablets", minThreshold: 50, reorderQuantity: 200, unitPrice: 8.5, supplier: "SunCare Pharmaceuticals", batchNumber: "TEL2601", status: "in_stock" },
      { name: "Metoprolol Succinate 25mg (Betaloc)", category: "Medication", itemCode: "MED-MET-25", quantity: 380, unit: "Tablets", minThreshold: 40, reorderQuantity: 150, unitPrice: 7.2, supplier: "Cipla Healthcare Logistics", batchNumber: "MET2603", status: "in_stock" },
      { name: "Paracetamol 650mg (Dolo 650)", category: "Medication", itemCode: "MED-DOL-650", quantity: 820, unit: "Tablets", minThreshold: 100, reorderQuantity: 500, unitPrice: 3.0, supplier: "SunCare Pharmaceuticals", batchNumber: "DOL2605", status: "in_stock" },
      { name: "Montelukast 10mg + Levocetirizine 5mg (Montair-LC)", category: "Medication", itemCode: "MED-MON-LC", quantity: 240, unit: "Tablets", minThreshold: 30, reorderQuantity: 100, unitPrice: 12.0, supplier: "Cipla Healthcare Logistics", batchNumber: "MON2602", status: "in_stock" },
      { name: "Fluticasone Furoate Nasal Spray (Flomist)", category: "Medication", itemCode: "MED-FLO-NAS", quantity: 85, unit: "Bottles", minThreshold: 15, reorderQuantity: 50, unitPrice: 340.0, supplier: "Cipla Healthcare Logistics", batchNumber: "FLO2601", status: "in_stock" },
      { name: "Salbutamol 100mcg Inhaler (Asthalin)", category: "Medication", itemCode: "MED-AST-INH", quantity: 110, unit: "Inhalers", minThreshold: 20, reorderQuantity: 60, unitPrice: 165.0, supplier: "Cipla Healthcare Logistics", batchNumber: "AST2604", status: "in_stock" },
      { name: "Metformin 500mg (Glycomet 500)", category: "Medication", itemCode: "MED-GLY-500", quantity: 600, unit: "Tablets", minThreshold: 80, reorderQuantity: 300, unitPrice: 4.5, supplier: "Zydus Distribution Hub", batchNumber: "GLY2601", status: "in_stock" },
      { name: "Glimepiride 2mg (Amaryl 2)", category: "Medication", itemCode: "MED-AMA-02", quantity: 310, unit: "Tablets", minThreshold: 40, reorderQuantity: 150, unitPrice: 6.8, supplier: "Zydus Distribution Hub", batchNumber: "AMA2602", status: "in_stock" },
      { name: "Human Regular Insulin 100IU/ml (Huminsulin)", category: "Medication", itemCode: "MED-HUM-REG", quantity: 45, unit: "Vials", minThreshold: 15, reorderQuantity: 40, unitPrice: 180.0, supplier: "Zydus Distribution Hub", batchNumber: "HUM2601", status: "in_stock" },
      { name: "Aceclofenac 100mg + Paracetamol (Zerodol-P)", category: "Medication", itemCode: "MED-ZER-P", quantity: 420, unit: "Tablets", minThreshold: 50, reorderQuantity: 200, unitPrice: 5.5, supplier: "SunCare Pharmaceuticals", batchNumber: "ZER2601", status: "in_stock" },
      { name: "Pantoprazole 40mg (Pan 40)", category: "Medication", itemCode: "MED-PAN-40", quantity: 580, unit: "Tablets", minThreshold: 60, reorderQuantity: 250, unitPrice: 9.0, supplier: "SunCare Pharmaceuticals", batchNumber: "PAN2603", status: "in_stock" },
      { name: "Amoxicillin 500mg + Clavulanic Acid (Augmentin 625)", category: "Medication", itemCode: "MED-AUG-625", quantity: 280, unit: "Tablets", minThreshold: 40, reorderQuantity: 120, unitPrice: 22.5, supplier: "Apollo MedSupply", batchNumber: "AUG2601", status: "in_stock" },
      { name: "Azithromycin 500mg (Azee 500)", category: "Medication", itemCode: "MED-AZE-500", quantity: 190, unit: "Tablets", minThreshold: 30, reorderQuantity: 100, unitPrice: 24.0, supplier: "Cipla Healthcare Logistics", batchNumber: "AZE2602", status: "in_stock" },
      { name: "Atorvastatin 20mg (Atorva 20)", category: "Medication", itemCode: "MED-ATO-20", quantity: 340, unit: "Tablets", minThreshold: 40, reorderQuantity: 150, unitPrice: 14.0, supplier: "Zydus Distribution Hub", batchNumber: "ATO2603", status: "in_stock" },
      { name: "Ceftriaxone 1g Injection (Monocef)", category: "Medication", itemCode: "MED-MON-1G", quantity: 85, unit: "Vials", minThreshold: 20, reorderQuantity: 60, unitPrice: 58.0, supplier: "Apollo MedSupply", batchNumber: "MON2604", status: "in_stock" },

      // Low-stock & Out-of-stock items (to demonstrate pharmacy alerts)
      { name: "Labetalol 20mg/4ml Injection", category: "Medication", itemCode: "MED-LAB-20", quantity: 8, unit: "Ampoules", minThreshold: 15, reorderQuantity: 30, unitPrice: 95.0, supplier: "SunCare Pharmaceuticals", batchNumber: "LAB2601", status: "low_stock" },
      { name: "Enoxaparin 40mg/0.4ml Prefilled Syringe (Clexane)", category: "Medication", itemCode: "MED-CLE-40", quantity: 5, unit: "Syringes", minThreshold: 12, reorderQuantity: 25, unitPrice: 480.0, supplier: "Apollo MedSupply", batchNumber: "CLE2601", status: "low_stock" },
      { name: "Adrenaline 1mg/1ml Injection", category: "Emergency Supplies", itemCode: "EMG-ADR-01", quantity: 0, unit: "Ampoules", minThreshold: 20, reorderQuantity: 50, unitPrice: 25.0, supplier: "Apollo MedSupply", batchNumber: "ADR2501", status: "out_of_stock" },

      // Medical Supplies & Consumables
      { name: "Sterile Disposable Syringes 5ml with Needle", category: "Consumables", itemCode: "CON-SYR-05", quantity: 1200, unit: "Pieces", minThreshold: 200, reorderQuantity: 1000, unitPrice: 4.5, supplier: "Apollo MedSupply", batchNumber: "SYR2601", status: "in_stock" },
      { name: "IV Infusion Set with Air Vent & Microfilter", category: "Consumables", itemCode: "CON-IVS-01", quantity: 650, unit: "Sets", minThreshold: 100, reorderQuantity: 500, unitPrice: 28.0, supplier: "Apollo MedSupply", batchNumber: "IVS2602", status: "in_stock" },
      { name: "Normal Saline 0.9% 500ml IV Infusion", category: "Medical Supplies", itemCode: "SUP-NS-500", quantity: 420, unit: "Bottles", minThreshold: 60, reorderQuantity: 300, unitPrice: 32.0, supplier: "Apollo MedSupply", batchNumber: "NS2601", status: "in_stock" },
      { name: "Dextrose Normal Saline (DNS) 500ml", category: "Medical Supplies", itemCode: "SUP-DNS-500", quantity: 310, unit: "Bottles", minThreshold: 50, reorderQuantity: 200, unitPrice: 34.0, supplier: "Apollo MedSupply", batchNumber: "DNS2602", status: "in_stock" },
      { name: "Sterile Surgical Gloves Size 7.5", category: "Consumables", itemCode: "CON-GLV-75", quantity: 850, unit: "Pairs", minThreshold: 150, reorderQuantity: 600, unitPrice: 18.0, supplier: "Apollo MedSupply", batchNumber: "GLV2601", status: "in_stock" },
      { name: "N95 Medical Protective Respirator Masks", category: "Consumables", itemCode: "CON-MSK-N95", quantity: 450, unit: "Masks", minThreshold: 80, reorderQuantity: 300, unitPrice: 35.0, supplier: "Apollo MedSupply", batchNumber: "MSK2601", status: "in_stock" },
      { name: "Negative Pressure Wound Therapy Dressing Kit", category: "Medical Supplies", itemCode: "SUP-NPWT-KIT", quantity: 14, unit: "Kits", minThreshold: 5, reorderQuantity: 20, unitPrice: 2400.0, supplier: "Apollo MedSupply", batchNumber: "NPWT2601", status: "in_stock" },
      { name: "Troponin I High Sensitivity Rapid Test Cassette", category: "Diagnostic Reagents", itemCode: "DIA-TROP-CAS", quantity: 60, unit: "Tests", minThreshold: 15, reorderQuantity: 50, unitPrice: 320.0, supplier: "SunCare Pharmaceuticals", batchNumber: "TRP2601", status: "in_stock" },
    ];

    const inventoryDocs = await Inventory.create(inventoryData);

    // ──────────────────────────────────────────────────────────────────────────
    // 15. CREATE PHARMACY SUPPLIERS, BATCHES & PURCHASE ORDERS
    // ──────────────────────────────────────────────────────────────────────────
    console.log("15. Creating pharma suppliers, medicine batches & procurement orders...");
    const suppliers = await Supplier.create([
      { name: "SunCare Pharmaceuticals", contactPerson: "Rajiv Malhotra", email: "rajiv@suncarepharma.in", phone: "+91 98765 11223", city: "Mumbai", gstNumber: "27AAACS1234F1Z5", drugLicenseNumber: "MH-TZ1-140221", paymentTerms: "Net 30", rating: 5 },
      { name: "Cipla Healthcare Logistics", contactPerson: "Vikram Singhania", email: "orders@ciplalogistics.com", phone: "+91 98765 22334", city: "Bengaluru", gstNumber: "29AABCC4567G1Z8", drugLicenseNumber: "KA-BLR-889900", paymentTerms: "Net 30", rating: 5 },
      { name: "Zydus Distribution Hub", contactPerson: "Nilesh Dave", email: "ndave@zydusdist.com", phone: "+91 98765 33445", city: "Ahmedabad", gstNumber: "24AADCE7890H1Z2", drugLicenseNumber: "GJ-AHM-554433", paymentTerms: "Net 15", rating: 4 },
      { name: "Apollo MedSupply Logistics", contactPerson: "Kavita Rao", email: "kavita.rao@apollomedsupply.in", phone: "+91 98765 44556", city: "Chennai", gstNumber: "33AABCA9988J1Z3", drugLicenseNumber: "TN-CHN-667788", paymentTerms: "Net 30", rating: 4 },
    ]);

    // Medicine batches (including near-expiry batch for alert generation)
    const telmaItem = inventoryDocs.find((i) => i.itemCode === "MED-TEL-40");
    const doloItem = inventoryDocs.find((i) => i.itemCode === "MED-DOL-650");
    const labetalolItem = inventoryDocs.find((i) => i.itemCode === "MED-LAB-20");

    const batchExpirySoon = new Date();
    batchExpirySoon.setDate(batchExpirySoon.getDate() + 18); // Expires in 18 days!

    const batchFuture = new Date();
    batchFuture.setFullYear(batchFuture.getFullYear() + 2);

    const batches = await MedicineBatch.create([
      {
        medicine: telmaItem._id,
        medicineName: telmaItem.name,
        batchNumber: "TEL2601",
        manufacturer: "Glenmark Pharmaceuticals",
        manufacturingDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        expiryDate: batchFuture,
        quantity: 450,
        unit: "Tablets",
        purchasePrice: 5.5,
        sellingPrice: 8.5,
        supplier: "SunCare Pharmaceuticals",
        status: "active",
      },
      {
        medicine: doloItem._id,
        medicineName: doloItem.name,
        batchNumber: "DOL2605",
        manufacturer: "Micro Labs Ltd",
        manufacturingDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
        expiryDate: batchFuture,
        quantity: 820,
        unit: "Tablets",
        purchasePrice: 1.8,
        sellingPrice: 3.0,
        supplier: "SunCare Pharmaceuticals",
        status: "active",
      },
      {
        medicine: labetalolItem._id,
        medicineName: labetalolItem.name,
        batchNumber: "LAB2601",
        manufacturer: "Samarth Life Sciences",
        manufacturingDate: new Date(Date.now() - 340 * 24 * 60 * 60 * 1000),
        expiryDate: batchExpirySoon, // Near expiry!
        quantity: 8,
        unit: "Ampoules",
        purchasePrice: 65.0,
        sellingPrice: 95.0,
        supplier: "SunCare Pharmaceuticals",
        status: "active",
      },
    ]);

    // Purchase Order
    await PurchaseOrder.create({
      poNumber: "PO-2026-1001",
      supplier: suppliers[0]._id,
      supplierName: suppliers[0].name,
      items: [
        { medicine: telmaItem._id, medicineName: telmaItem.name, quantity: 200, unitPrice: 5.5, totalPrice: 1100, receivedQuantity: 200, batchNumber: "TEL2601", expiryDate: batchFuture },
        { medicine: doloItem._id, medicineName: doloItem.name, quantity: 500, unitPrice: 1.8, totalPrice: 900, receivedQuantity: 500, batchNumber: "DOL2605", expiryDate: batchFuture },
      ],
      totalAmount: 2000,
      orderDate: twoDaysAgo,
      expectedDelivery: oneDayAgo,
      receivedDate: oneDayAgo,
      status: "received",
      createdBy: pharmacistUser._id,
      createdByName: pharmacistUser.name,
      receivedBy: pharmacistUser._id,
      receivedByName: pharmacistUser.name,
      notes: "Stock received in excellent condition and ledger updated.",
    });

    // Dispensing receipts
    await PharmacyDispensing.create([
      {
        receiptNumber: "DISP-2026-0001",
        prescription: rx1._id,
        prescriptionNumber: rx1.prescriptionNumber,
        patient: pRahul._id,
        patientName: pRahul.name,
        doctor: docCardio._id,
        doctorName: docCardio.name,
        dispensedBy: pharmacistUser._id,
        dispensedByName: pharmacistUser.name,
        items: [
          { medicineName: "Telmisartan 40mg (Telma 40)", inventoryItem: telmaItem._id, batchNumber: "TEL2601", requestedQuantity: 30, dispensedQuantity: 30, unitPrice: 8.5, totalPrice: 255 },
          { medicineName: "Paracetamol 650mg (Dolo 650)", inventoryItem: doloItem._id, batchNumber: "DOL2605", requestedQuantity: 10, dispensedQuantity: 10, unitPrice: 3.0, totalPrice: 30 },
        ],
        totalAmount: 285,
        paymentStatus: "paid",
        paymentMethod: "upi",
        allergyCheckAcknowledged: true,
        notes: "Dispensed with instruction leaflet for low-sodium regimen.",
      },
    ]);

    // Stock Transaction Ledger
    await StockTransaction.create([
      {
        medicine: telmaItem._id,
        medicineName: telmaItem.name,
        batchNumber: "TEL2601",
        type: "purchase",
        quantity: 200,
        previousStock: 280,
        newStock: 480,
        unitPrice: 5.5,
        referenceType: "PurchaseOrder",
        referenceId: "PO-2026-1001",
        performedBy: pharmacistUser._id,
        performedByName: pharmacistUser.name,
        reason: "Received shipment from SunCare Pharmaceuticals",
      },
      {
        medicine: telmaItem._id,
        medicineName: telmaItem.name,
        batchNumber: "TEL2601",
        type: "dispensing",
        quantity: 30,
        previousStock: 480,
        newStock: 450,
        unitPrice: 8.5,
        referenceType: "Prescription",
        referenceId: rx1.prescriptionNumber,
        performedBy: pharmacistUser._id,
        performedByName: pharmacistUser.name,
        reason: "Dispensed for patient Rahul Sharma (RX-2026-1042)",
      },
    ]);

    // Pharmacy Return
    await PharmacyReturn.create({
      returnNumber: "RET-2026-0001",
      returnType: "damaged_stock",
      medicine: doloItem._id,
      medicineName: doloItem.name,
      batchNumber: "DOL2599",
      quantity: 10,
      refundAmount: 30,
      reason: "Outer blister packaging damaged during warehouse unboxing",
      supplier: suppliers[0]._id,
      supplierName: suppliers[0].name,
      status: "approved",
      processedBy: pharmacistUser._id,
      processedByName: pharmacistUser.name,
    });

    // ──────────────────────────────────────────────────────────────────────────
    // 16. CREATE FRONT DESK TASKS & RECEPTION SHIFT HANDOVER
    // ──────────────────────────────────────────────────────────────────────────
    console.log("16. Creating front desk queue items & desk shift handovers...");
    await FrontDeskTask.create([
      {
        patient: pRahul._id,
        patientName: pRahul.name,
        taskTitle: "Collect Cashier Deposit for Inpatient ICU Admission",
        category: "payment",
        priority: "Urgent",
        status: "Pending",
        notes: "Insurance pre-authorization form pending family signature.",
        actionLink: "/billing",
      },
      {
        patient: pKavita._id,
        patientName: pKavita.name,
        taskTitle: "Issue Token & Send to Ortho Clinic 2",
        category: "waiting_checkin",
        priority: "Normal",
        status: "In Progress",
        notes: "Patient using wheelchair; escort requested.",
        actionLink: "/reception/waiting-room",
      },
      {
        patient: pPriya._id,
        patientName: pPriya.name,
        taskTitle: "Coordinate Bed Transfer to Private Deluxe Room",
        category: "admission",
        priority: "Normal",
        status: "Pending",
        notes: "Housekeeping clearing PVT-201 on 4th floor.",
        actionLink: "/beds",
      },
      {
        patient: pAmit._id,
        patientName: pAmit.name,
        taskTitle: "Discharge Summary Verification & Gate Pass",
        category: "discharge_admin",
        priority: "Normal",
        status: "Pending",
        notes: "Awaiting final clearance from Dr. Verma.",
        actionLink: "/reception/discharges",
      },
    ]);

    await DeskHandover.create({
      shiftType: "Morning",
      shiftDate: todayYmd,
      deskNumber: "Desk 1 - Main Hospital Reception",
      outgoingStaff: receptionistUser._id,
      outgoingStaffName: receptionistUser.name,
      pendingAdmissionsCount: 1,
      unsettledPaymentsTotal: 15250,
      waitingPatientsCount: 2,
      unconfirmedOnlineBookings: 1,
      administrativeNotes: "Morning OPD rush managed smoothly. 1 patient family requesting deluxe room upgrade. Cash register tally balanced at ₹ 4,500.",
      status: "Submitted",
    });

    // ──────────────────────────────────────────────────────────────────────────
    // 17. CREATE BIOMEDICAL EQUIPMENT & MAINTENANCE ORDERS
    // ──────────────────────────────────────────────────────────────────────────
    console.log("17. Creating biomedical equipment assets & maintenance records...");
    const eqVent = await Equipment.create({
      name: "Hamilton C6 Intensive Care Ventilator",
      equipmentId: "EQ-VENT-01",
      category: "Ventilator",
      department: "ICU (Intensive Care Unit)",
      location: "ICU Bed 01 Bay",
      manufacturer: "Hamilton Medical",
      modelNumber: "C6-ICU-2024",
      purchaseDate: new Date("2024-03-15"),
      lastServiceDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      nextServiceDate: new Date(Date.now() + 135 * 24 * 60 * 60 * 1000),
      status: "operational",
    });

    const eqEcg = await Equipment.create({
      name: "GE MAC 2000 12-Lead Diagnostic ECG",
      equipmentId: "EQ-ECG-02",
      category: "ECG Machine",
      department: "Cardiology",
      location: "OPD Consultation Room 1",
      manufacturer: "GE Healthcare",
      modelNumber: "MAC-2000-HD",
      purchaseDate: new Date("2023-08-10"),
      lastServiceDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      nextServiceDate: new Date(Date.now() + 150 * 24 * 60 * 60 * 1000),
      status: "operational",
    });

    const eqMon = await Equipment.create({
      name: "Mindray BeneVision N12 Multi-Para Monitor",
      equipmentId: "EQ-MON-04",
      category: "Patient Monitor",
      department: "Emergency & Trauma",
      location: "Trauma Bay 2",
      manufacturer: "Mindray",
      modelNumber: "N12-TP",
      purchaseDate: new Date("2023-11-20"),
      lastServiceDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      status: "under_maintenance",
    });

    await Equipment.create([
      {
        name: "Philips HeartStart XL+ Defibrillator",
        equipmentId: "EQ-DEF-01",
        category: "Defibrillator",
        department: "Emergency & Trauma",
        location: "Crash Cart 1",
        manufacturer: "Philips Healthcare",
        modelNumber: "HeartStart-XL+",
        status: "operational",
      },
      {
        name: "Fresenius 4008S Hemodialysis System",
        equipmentId: "EQ-DIA-03",
        category: "Dialysis Unit",
        department: "General Medicine",
        location: "Dialysis Suite",
        manufacturer: "Fresenius Medical Care",
        modelNumber: "4008S-V10",
        status: "operational",
      },
    ]);

    await MaintenanceOrder.create([
      {
        orderNumber: "MO-1001",
        equipment: eqMon._id,
        equipmentName: eqMon.name,
        ward: "Emergency & Trauma",
        room: "Trauma Bay 2",
        issue: "NIBP cuff deflation valve sticking intermittently during auto-cycle measurement",
        priority: "high",
        reportedBy: "Nurse Priya Singh",
        assignedTo: "Biomedical Engineering Team",
        status: "in_progress",
      },
      {
        orderNumber: "MO-0994",
        equipment: eqEcg._id,
        equipmentName: eqEcg.name,
        ward: "Cardiology",
        room: "Room 101",
        issue: "Thermal printer paper feeder roller replacement",
        priority: "medium",
        reportedBy: "Dr. Rajesh Sharma",
        assignedTo: "Biomedical Team",
        status: "resolved",
        resolutionNotes: "Thermal printhead cleaned and feeder roller replaced. Test rhythm strip printed clearly.",
        resolvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
    ]);

    // ──────────────────────────────────────────────────────────────────────────
    // 18. CREATE STAFF ATTENDANCE & LEAVE TRACKING
    // ──────────────────────────────────────────────────────────────────────────
    console.log("18. Creating staff shift attendance & leave records...");
    await StaffAttendance.create([
      { user: adminUser._id, employeeName: adminUser.name, role: "admin", department: "Administration", date: today, shift: "General (09:00 - 17:00)", checkIn: "08:50 AM", status: "present" },
      { user: doctorUser1._id, employeeName: doctorUser1.name, role: "doctor", department: "Cardiology", date: today, shift: "Morning (07:00 - 15:00)", checkIn: "08:15 AM", status: "present" },
      { user: doctorUser2._id, employeeName: doctorUser2.name, role: "doctor", department: "Pediatrics", date: today, shift: "General (09:00 - 17:00)", checkIn: "09:05 AM", status: "present" },
      { user: receptionistUser._id, employeeName: receptionistUser.name, role: "receptionist", department: "Front Desk", date: today, shift: "Morning (07:00 - 15:00)", checkIn: "06:55 AM", status: "present" },
      { user: nurseUser1._id, employeeName: nurseUser1.name, role: "nurse", department: "Nursing Station", date: today, shift: "Morning (07:00 - 15:00)", checkIn: "06:45 AM", status: "present" },
      { user: pharmacistUser._id, employeeName: pharmacistUser.name, role: "pharmacist", department: "Pharmacy", date: today, shift: "General (09:00 - 17:00)", checkIn: "08:45 AM", status: "present" },
    ]);

    await StaffLeave.create([
      {
        user: doctorUser3._id,
        employeeName: doctorUser3.name,
        role: "doctor",
        department: "Neurology",
        leaveType: "Conference / Training",
        startDate: in3Days,
        endDate: in5Days,
        totalDays: 3,
        reason: "Attending Indian Academy of Neurology Annual National Symposium (IANCON 2026)",
        status: "approved",
        reviewedBy: adminUser._id,
        reviewerNotes: "Approved. Dr. Verma will cover emergency stroke calls.",
        reviewedAt: yesterday(1),
      },
      {
        user: nurseUser2._id,
        employeeName: nurseUser2.name,
        role: "nurse",
        department: "Nursing Station",
        leaveType: "Casual Leave",
        startDate: in5Days,
        endDate: in5Days,
        totalDays: 1,
        reason: "Family wedding commitment",
        status: "pending",
      },
    ]);

    function yesterday(d) {
      const dt = new Date(); dt.setDate(dt.getDate() - d); return dt;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // 19. CREATE INSTITUTIONAL SETTINGS, NOTIFICATIONS, FEEDBACK & AUDIT LOGS
    // ──────────────────────────────────────────────────────────────────────────
    console.log("19. Creating institutional settings, notifications & audit records...");
    await HospitalSetting.create({
      hospitalName: "Nivora Care Hospital",
      tagline: "Center for Clinical Excellence & Patient Governance",
      accreditation: "NABH Accredited • Ayushman Bharat (ABDM) Connected",
      emergencyHelpline: "108 / 112",
      hospitalPhone: "+91 98765 43210",
      hospitalEmail: "admin@nivoracare.com",
      address: "Plot 42, Health City Avenue, Sector 12",
      city: "New Delhi, Delhi - 110001",
      opdConsultationFee: 500,
      operatingHours: "24 Hours Emergency • OPD 08:00 AM - 08:00 PM",
      tpaDeskContact: "+91 98765 43215",
      notificationEmailAlerts: true,
      systemMaintenanceMode: false,
    });

    await Notification.create([
      { recipientType: "patient", patient: pRahul._id, title: "Cardiology Follow-up Scheduled", message: "Your consultation with Dr. Rajesh Sharma has been recorded for discharge review.", type: "appointment_confirmed", link: "/patient/appointments" },
      { recipientType: "patient", patient: pRahul._id, title: "Lab Investigation Results Ready", message: "Your High-Sensitivity Troponin I report is now available in your health records.", type: "lab_report_ready", link: "/patient/lab-reports" },
      { recipientType: "patient", patient: pPriya._id, title: "Prescription Dispensed", message: "Your prescription RX-2026-2189 has been fulfilled by Nivora Central Pharmacy.", type: "general", link: "/patient/prescriptions" },
      { recipientType: "staff", user: adminUser._id, title: "Bed Turnover Clearance Needed", message: "Housekeeping cleaning completed on ICU-04 and GEN-105.", type: "general", link: "/beds" },
      { recipientType: "staff", user: doctorUser1._id, title: "New Specialist Inbound Referral", message: "Dr. Arvind Verma has referred patient Rahul Sharma for cardiac evaluation.", type: "general", link: "/doctor/referrals" },
    ]);

    await Feedback.create([
      { patient: pRahul._id, doctor: docCardio._id, appointment: apptPast1._id, rating: 5, category: "Doctor Consultation", comments: "Dr. Rajesh Sharma explained my hypertension and medication plan with great clarity and patience." },
      { patient: pPriya._id, doctor: docPed._id, appointment: apptPast2._id, rating: 5, category: "Nursing & Emergency Care", comments: "Sister Mary and the nursing team were very compassionate during my acute asthma nebulization." },
      { patient: pVikram._id, doctor: docCardio._id, appointment: apptPast3._id, rating: 4, category: "Hospital Cleanliness & Facilities", comments: "Clean hospital environment, punctual doctor consultation and seamless digital prescription." },
    ]);

    await AuditLog.create([
      { user: adminUser._id, userName: adminUser.name, role: "admin", action: "DATABASE_INITIALIZATION_AND_DEMO_SEED", module: "settings", details: "Hospital Management System seeded with full relational Indian healthcare dataset.", ipAddress: "127.0.0.1" },
      { user: doctorUser1._id, userName: doctorUser1.name, role: "doctor", action: "CONCLUDE_CONSULTATION", module: "prescriptions", details: "Prescription RX-2026-1042 issued for patient Rahul Sharma", ipAddress: "127.0.0.1" },
      { user: pharmacistUser._id, userName: pharmacistUser.name, role: "pharmacist", action: "DISPENSE_MEDICATION", module: "inventory", details: "Dispensed prescription RX-2026-1042 (Receipt: DISP-2026-0001)", ipAddress: "127.0.0.1" },
    ]);

    // ──────────────────────────────────────────────────────────────────────────
    // 20. EMERGENCY DEPARTMENT DEMO ENCOUNTERS (7 realistic scenarios)
    // ──────────────────────────────────────────────────────────────────────────
    console.log("20. Seeding Emergency Department encounters...");
    const erNow = new Date();
    const er1hAgo = new Date(erNow.getTime() - 60 * 60 * 1000);
    const er2hAgo = new Date(erNow.getTime() - 2 * 60 * 60 * 1000);
    const er3hAgo = new Date(erNow.getTime() - 3 * 60 * 60 * 1000);

    // Ensure emergency beds have at least some available; reuse existing beds
    await EmergencyEncounter.create([
      {
        emergencyId: `ER-${erNow.getFullYear()}-000001`,
        tokenNumber: "ER-T001",
        patient: pVikram._id,
        arrivalTime: er1hAgo,
        arrivalMode: "ambulance",
        chiefComplaint: "Acute chest pain radiating to left arm, diaphoresis",
        priority: "critical",
        triageStatus: "triaged",
        triage: { chiefComplaint: "Acute chest pain", symptoms: "Retrosternal pressure, SOB, sweating", bloodPressureSys: 92, bloodPressureDia: 60, heartRate: 118, respiratoryRate: 24, spo2: 88, temperature: 99.1, consciousnessLevel: "Alert", painScore: 9, relevantHistory: "CAD post-PTCA", triageNotes: "Immediate resuscitation bay, ECG shows ST elevation", triagedByName: "Sister Mary", triagedAt: er1hAgo },
        status: "under_treatment",
        location: "ER Resuscitation Bay 1",
        assignedDoctor: docCardio._id,
        assignedDoctorName: docCardio.name,
        assignedNurseName: nurseUser1.name,
        vitalsHistory: [{ bloodPressureSys: 92, bloodPressureDia: 60, heartRate: 118, respiratoryRate: 24, spo2: 88, temperature: 99.1, painScore: 9, consciousnessLevel: "Alert", recordedBy: "Sister Mary", notes: "Triage" }],
        clinicalNotes: [{ note: "STEMI suspected, loaded Aspirin 325mg, Clopidogrel 600mg, Heparin bolus. Cardiology alerted. Cath lab on standby.", byName: docCardio.name, byRole: "doctor", at: er1hAgo }],
        timeline: [{ event: "Emergency arrival", details: "Ambulance", by: "Emergency Desk", at: er1hAgo }, { event: "Triage completed", details: "Critical, Pain 9/10", by: "Sister Mary", at: er1hAgo }],
        knownAllergies: pVikram.allergies,
        knownConditions: pVikram.medicalHistory,
        emergencyContact: pVikram.emergencyContact || { name: "Anjali Mehta", phone: "+91 98765 43219", relationship: "Spouse" },
        createdBy: emergencyUser._id,
        createdByName: emergencyUser.name,
      },
      {
        emergencyId: `ER-${erNow.getFullYear()}-000002`,
        tokenNumber: "ER-T002",
        patient: pSanjay._id,
        arrivalTime: er2hAgo,
        arrivalMode: "walk_in",
        chiefComplaint: "Severe headache, slurred speech, left side weakness",
        priority: "critical",
        triageStatus: "awaiting_triage",
        status: "awaiting_triage",
        location: "ER Triage Bay",
        knownAllergies: [],
        knownConditions: pSanjay.medicalHistory,
        timeline: [{ event: "Emergency arrival", details: "Walk-in", by: "Reception", at: er2hAgo }],
        createdBy: receptionistUser._id,
        createdByName: receptionistUser.name,
      },
      {
        emergencyId: `ER-${erNow.getFullYear()}-000003`,
        tokenNumber: "ER-T003",
        patient: pKavita._id,
        arrivalTime: er2hAgo,
        arrivalMode: "ambulance",
        chiefComplaint: "Fall from height, severe knee pain, deformity",
        priority: "urgent",
        triageStatus: "triaged",
        triage: { chiefComplaint: "Trauma fall", symptoms: "Bilateral knee pain, swelling", bloodPressureSys: 128, bloodPressureDia: 82, heartRate: 92, respiratoryRate: 18, spo2: 97, temperature: 98.4, consciousnessLevel: "Alert", painScore: 7, triageNotes: "Immobilized, X-ray pending", triagedByName: "Nurse Priya Singh", triagedAt: er2hAgo },
        status: "awaiting_doctor",
        location: "ER Bay 2",
        vitalsHistory: [{ bloodPressureSys: 128, bloodPressureDia: 82, heartRate: 92, respiratoryRate: 18, spo2: 97, temperature: 98.4, painScore: 7, consciousnessLevel: "Alert", recordedBy: "Nurse Priya Singh" }],
        timeline: [{ event: "Emergency arrival", details: "Ambulance", by: "ER Desk", at: er2hAgo }, { event: "Triage completed", details: "Urgent", by: "Nurse Priya Singh", at: er2hAgo }],
        createdBy: emergencyUser._id,
        createdByName: emergencyUser.name,
      },
      {
        emergencyId: `ER-${erNow.getFullYear()}-000004`,
        tokenNumber: "ER-T004",
        patient: pPriya._id,
        arrivalTime: er3hAgo,
        arrivalMode: "walk_in",
        chiefComplaint: "Acute exacerbation asthma, wheeze, SpO2 89%",
        priority: "urgent",
        triageStatus: "triaged",
        triage: { chiefComplaint: "Asthma exacerbation", symptoms: "Wheeze, cough", bloodPressureSys: 118, bloodPressureDia: 76, heartRate: 102, respiratoryRate: 28, spo2: 89, temperature: 100.2, consciousnessLevel: "Alert", painScore: 3, triageNotes: "Nebulization started", triagedByName: "Sister Mary", triagedAt: er3hAgo },
        status: "under_treatment",
        location: "ER Bay 3",
        assignedDoctor: docPed._id,
        assignedDoctorName: docPed.name,
        vitalsHistory: [{ bloodPressureSys: 118, bloodPressureDia: 76, heartRate: 102, respiratoryRate: 28, spo2: 89, temperature: 100.2, painScore: 3, consciousnessLevel: "Alert", recordedBy: "Sister Mary" }],
        timeline: [{ event: "Emergency arrival", details: "Walk-in", by: "ER Desk", at: er3hAgo }, { event: "Triage completed", details: "Urgent", by: "Sister Mary", at: er3hAgo }, { event: "Doctor assigned", details: docPed.name, by: "ER Coordinator", at: er2hAgo }],
        createdBy: receptionistUser._id,
        createdByName: receptionistUser.name,
      },
      {
        emergencyId: `ER-${erNow.getFullYear()}-000005`,
        tokenNumber: "ER-T005",
        patient: pAmit._id,
        arrivalTime: er2hAgo,
        arrivalMode: "transfer",
        chiefComplaint: "High grade fever, chills, hypotension 88/60",
        priority: "urgent",
        triageStatus: "triaged",
        triage: { chiefComplaint: "Sepsis suspected", symptoms: "Fever, chills, foot ulcer", bloodPressureSys: 88, bloodPressureDia: 60, heartRate: 110, respiratoryRate: 22, spo2: 93, temperature: 101.8, consciousnessLevel: "Verbal", painScore: 5, triageNotes: "Septic workup, blood cultures", triagedByName: "Dr. Arvind Verma", triagedAt: er2hAgo },
        status: "awaiting_diagnostics",
        location: "ER Bay 4",
        assignedDoctor: docMed._id,
        assignedDoctorName: docMed.name,
        timeline: [{ event: "Emergency arrival", details: "Transfer from General Ward", by: "Ward Nurse", at: er2hAgo }],
        createdBy: emergencyUser._id,
        createdByName: emergencyUser.name,
      },
      {
        emergencyId: `ER-${erNow.getFullYear()}-000006`,
        tokenNumber: "ER-T006",
        patient: pMeera._id,
        arrivalTime: er3hAgo,
        arrivalMode: "walk_in",
        chiefComplaint: "Lower abdominal pain, vaginal spotting at 30 weeks",
        priority: "less_urgent",
        triageStatus: "triaged",
        triage: { chiefComplaint: "AP pain pregnancy", symptoms: "Mild cramping, spotting", bloodPressureSys: 110, bloodPressureDia: 72, heartRate: 88, respiratoryRate: 18, spo2: 98, temperature: 98.6, consciousnessLevel: "Alert", painScore: 4, triageNotes: "Fetal heart present, USG ordered", triagedByName: "Dr. Sunita Reddy", triagedAt: er3hAgo },
        status: "under_observation",
        location: "ER Observation Bay 1",
        assignedDoctor: docObgyn._id,
        assignedDoctorName: docObgyn.name,
        observation: { notes: "Continuous FHR monitoring, IV fluids, steroid cover", startedAt: er2hAgo, status: "active" },
        timeline: [{ event: "Emergency arrival", details: "Walk-in", by: "ER Desk", at: er3hAgo }, { event: "Observation started", details: "FHR monitoring", by: docObgyn.name, at: er2hAgo }],
        createdBy: emergencyUser._id,
        createdByName: emergencyUser.name,
      },
      {
        emergencyId: `ER-${erNow.getFullYear()}-000007`,
        tokenNumber: "ER-T007",
        patient: pDeepak._id,
        arrivalTime: new Date(erNow.getTime() - 4 * 60 * 60 * 1000),
        arrivalMode: "police",
        chiefComplaint: "Road traffic accident, laceration forearm, bleeding controlled",
        priority: "non_urgent",
        triageStatus: "awaiting_triage",
        status: "registered",
        location: "ER Triage Bay",
        createdBy: receptionistUser._id,
        createdByName: receptionistUser.name,
      },
    ]);

    console.log("\n========================================================");
    console.log("Database seeded successfully with complete relational healthcare data!");
    console.log("========================================================");
    console.log("\nStaff Portal Logins (http://localhost:5173/login):");
    console.log("  1. Admin:        admin@hospital.com       / admin123");
    console.log("  2. Cardiologist: doctor@hospital.com      / doctor123");
    console.log("  3. Pediatrician: dr.nair@hospital.com     / doctor123");
    console.log("  4. Neurologist:  dr.patel@hospital.com    / doctor123");
    console.log("  5. General Med:  dr.verma@hospital.com    / doctor123");
    console.log("  6. Orthopedic:   dr.iyer@hospital.com     / doctor123");
    console.log("  7. Dermatologist dr.sen@hospital.com      / doctor123");
    console.log("  8. Gynecologist: dr.reddy@hospital.com    / doctor123");
    console.log("  9. ENT Surgeon:  dr.kapoor@hospital.com   / doctor123");
    console.log("  10. Receptionist:receptionist@hospital.com/ receptionist123");
    console.log("  11. Nurse:       nurse@hospital.com       / nurse123");
    console.log("  12. Pharmacist:  pharmacist@hospital.com  / pharmacist123");
    console.log("  13. Emergency:   emergency@hospital.com   / emergency123");
    console.log("\nPatient Portal Logins (http://localhost:5173/patient/login):");
    console.log("  1. Rahul Sharma: john@example.com         / patient123 (Hypertension/Cardiac)");
    console.log("  2. Priya Patel:  alice@example.com        / patient123 (Asthma/Allergy)");
    console.log("========================================================\n");

    await mongoose.connection.close();
    console.log("Database connection closed cleanly.");
    process.exit(0);
  } catch (error) {
    console.error(`\n[!] Seeding failed: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
};

seedDatabase();
