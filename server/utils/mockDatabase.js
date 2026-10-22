import mongoose from "mongoose";

/**
 * In-memory mock database store for seamless offline development and resilience.
 * When MongoDB is not connected (e.g. Atlas IP whitelist restrictions, network outage),
 * this mock store provides complete CRUD operations with valid ObjectIds and relations.
 */

const createObjectId = () => new mongoose.Types.ObjectId().toString();

export const demoPatients = [
  {
    _id: "65a123456789012345678901",
    name: "John Fernandes",
    email: "john@example.com",
    age: 35,
    gender: "Male",
    contactNumber: "+91 98765 43210",
    address: "123 M.G. Road, Indiranagar, Bengaluru, Karnataka - 560038",
    bloodGroup: "O+",
    abhaId: "14-8891-2345-6789",
    allergies: ["Penicillin"],
    medicalHistory: ["Primary Hypertension", "Mild Hyperlipidemia"],
    registrationDate: new Date("2025-01-15T09:00:00Z"),
    createdAt: new Date("2025-01-15T09:00:00Z"),
    updatedAt: new Date("2025-01-15T09:00:00Z"),
  },
  {
    _id: "65a123456789012345678902",
    name: "Priya Patel",
    email: "alice@example.com",
    age: 28,
    gender: "Female",
    contactNumber: "+91 98765 43211",
    address: "Flat 402, Shanti Kunj, Sector 14, Rohini, New Delhi - 110085",
    bloodGroup: "A+",
    abhaId: "14-1234-5678-9012",
    allergies: ["Dust Mites", "Sulfa Drugs"],
    medicalHistory: ["Bronchial Asthma", "Seasonal Allergic Rhinitis"],
    registrationDate: new Date("2025-02-10T11:30:00Z"),
    createdAt: new Date("2025-02-10T11:30:00Z"),
    updatedAt: new Date("2025-02-10T11:30:00Z"),
  },
  {
    _id: "65a123456789012345678903",
    name: "Amit Kumar",
    email: "amit.kumar@example.com",
    age: 42,
    gender: "Male",
    contactNumber: "+91 98765 43212",
    address: "78, Park Street, Salt Lake Sector V, Kolkata, West Bengal - 700091",
    bloodGroup: "B+",
    abhaId: "14-4321-8765-1098",
    allergies: [],
    medicalHistory: ["Type 2 Diabetes Mellitus", "Diabetic Foot Ulcer"],
    registrationDate: new Date("2025-03-01T14:15:00Z"),
    createdAt: new Date("2025-03-01T14:15:00Z"),
    updatedAt: new Date("2025-03-01T14:15:00Z"),
  },
  {
    _id: "65a123456789012345678904",
    name: "Kavita Desai",
    email: "kavita.desai@example.com",
    age: 64,
    gender: "Female",
    contactNumber: "+91 98765 43213",
    address: "B-12, Alkapuri Society, Jetalpur Road, Vadodara, Gujarat - 390007",
    bloodGroup: "AB+",
    abhaId: "14-7788-9900-1122",
    allergies: ["Aspirin", "NSAIDs"],
    medicalHistory: ["Bilateral Osteoarthritis Knee", "Osteopenia"],
    registrationDate: new Date("2025-03-12T10:00:00Z"),
    createdAt: new Date("2025-03-12T10:00:00Z"),
    updatedAt: new Date("2025-03-12T10:00:00Z"),
  },
  {
    _id: "65a123456789012345678905",
    name: "Meera Nambiar",
    email: "meera.nambiar@example.com",
    age: 31,
    gender: "Female",
    contactNumber: "+91 98765 43214",
    address: "Pranavam, Panampilly Nagar, Kochi, Kerala - 682036",
    bloodGroup: "O-",
    abhaId: "14-3344-5566-7788",
    allergies: [],
    medicalHistory: ["Primigravida (28 Weeks Gestation)", "Gestational Diabetes (Diet Controlled)"],
    registrationDate: new Date("2025-03-18T16:45:00Z"),
    createdAt: new Date("2025-03-18T16:45:00Z"),
    updatedAt: new Date("2025-03-18T16:45:00Z"),
  },
  {
    _id: "65a123456789012345678906",
    name: "Vikram Mehta",
    email: "vikram.mehta@example.com",
    age: 52,
    gender: "Male",
    contactNumber: "+91 98765 43215",
    address: "401, Sea Breeze Apartments, Bandra West, Mumbai, Maharashtra - 400050",
    bloodGroup: "B-",
    abhaId: "14-5566-7788-9900",
    allergies: ["Contrast Media (Iodine)"],
    medicalHistory: ["Coronary Artery Disease (Post-PTCA)", "Hypercholesterolemia"],
    registrationDate: new Date("2025-03-25T12:00:00Z"),
    createdAt: new Date("2025-03-25T12:00:00Z"),
    updatedAt: new Date("2025-03-25T12:00:00Z"),
  },
  {
    _id: "65a123456789012345678907",
    name: "Sanjay Gupta",
    email: "sanjay.gupta@example.com",
    age: 49,
    gender: "Male",
    contactNumber: "+91 98765 43216",
    address: "H-88, South Extension Part 2, New Delhi - 110049",
    bloodGroup: "A-",
    abhaId: "14-2233-4455-6677",
    allergies: [],
    medicalHistory: ["Chronic Kidney Disease (Stage 3)", "Renal Hypertension"],
    registrationDate: new Date("2025-04-02T15:20:00Z"),
    createdAt: new Date("2025-04-02T15:20:00Z"),
    updatedAt: new Date("2025-04-02T15:20:00Z"),
  },
  {
    _id: "65a123456789012345678908",
    name: "Deepak Chopra",
    email: "deepak.chopra@example.com",
    age: 39,
    gender: "Male",
    contactNumber: "+91 98765 43217",
    address: "C-14, Civil Lines, Jaipur, Rajasthan - 302006",
    bloodGroup: "O+",
    abhaId: "14-9988-7766-5544",
    allergies: ["Latex"],
    medicalHistory: ["Plaque Psoriasis", "Seborrheic Dermatitis"],
    registrationDate: new Date("2025-04-10T09:40:00Z"),
    createdAt: new Date("2025-04-10T09:40:00Z"),
    updatedAt: new Date("2025-04-10T09:40:00Z"),
  },
];

export const demoDoctors = [
  {
    _id: "65b123456789012345678901",
    name: "Dr. Rajesh Sharma",
    email: "doctor@hospital.com",
    specialization: "Cardiology",
    department: "Cardiology",
    contactNumber: "+91 98765 43210",
    availableDays: ["Monday", "Wednesday", "Friday"],
    availableTimeSlots: ["09:00 AM", "10:30 AM", "02:00 PM", "04:00 PM"],
    yearsOfExperience: 16,
    consultationFee: 800,
    status: "active",
    createdAt: new Date("2024-01-01T00:00:00Z"),
  },
  {
    _id: "65b123456789012345678902",
    name: "Dr. Priya Nair",
    email: "dr.nair@hospital.com",
    specialization: "Pediatrics",
    department: "Pediatrics",
    contactNumber: "+91 98765 43211",
    availableDays: ["Tuesday", "Thursday", "Saturday"],
    availableTimeSlots: ["10:00 AM", "12:00 PM", "03:00 PM"],
    yearsOfExperience: 11,
    consultationFee: 700,
    status: "active",
    createdAt: new Date("2024-01-01T00:00:00Z"),
  },
  {
    _id: "65b123456789012345678903",
    name: "Dr. Vikram Patel",
    email: "dr.patel@hospital.com",
    specialization: "Neurology",
    department: "Neurology",
    contactNumber: "+91 98765 43212",
    availableDays: ["Monday", "Tuesday", "Thursday"],
    availableTimeSlots: ["09:30 AM", "11:30 AM", "02:30 PM"],
    yearsOfExperience: 14,
    consultationFee: 900,
    status: "active",
    createdAt: new Date("2024-01-01T00:00:00Z"),
  },
  {
    _id: "65b123456789012345678904",
    name: "Dr. Arvind Verma",
    email: "dr.verma@hospital.com",
    specialization: "General Medicine",
    department: "General Medicine",
    contactNumber: "+91 98765 43213",
    availableDays: ["Monday", "Wednesday", "Friday", "Saturday"],
    availableTimeSlots: ["10:00 AM", "01:00 PM", "05:00 PM"],
    yearsOfExperience: 15,
    consultationFee: 500,
    status: "active",
    createdAt: new Date("2024-01-01T00:00:00Z"),
  },
  {
    _id: "65b123456789012345678905",
    name: "Dr. Sunita Rao",
    email: "dr.rao@hospital.com",
    specialization: "Gynecology & Obstetrics",
    department: "Gynecology",
    contactNumber: "+91 98765 43214",
    availableDays: ["Monday", "Tuesday", "Thursday", "Friday"],
    availableTimeSlots: ["10:00 AM", "02:00 PM", "04:30 PM"],
    yearsOfExperience: 18,
    consultationFee: 850,
    status: "active",
    createdAt: new Date("2024-01-01T00:00:00Z"),
  },
  {
    _id: "65b123456789012345678906",
    name: "Dr. Kabir Mehta",
    email: "dr.mehta@hospital.com",
    specialization: "Orthopedic Surgery",
    department: "Orthopedics",
    contactNumber: "+91 98765 43215",
    availableDays: ["Wednesday", "Thursday", "Saturday"],
    availableTimeSlots: ["09:00 AM", "11:00 AM", "03:00 PM"],
    yearsOfExperience: 13,
    consultationFee: 800,
    status: "active",
    createdAt: new Date("2024-01-01T00:00:00Z"),
  },
];

export const demoPrescriptions = [
  {
    _id: "65c123456789012345678901",
    prescriptionNumber: "RX-2026-1042",
    patient: {
      _id: "65a123456789012345678901",
      name: "John Fernandes",
      email: "john@example.com",
      age: 35,
      gender: "Male",
      contactNumber: "+91 98765 43210",
      abhaId: "14-8891-2345-6789",
      bloodGroup: "O+",
      address: "123 M.G. Road, Indiranagar, Bengaluru, Karnataka - 560038",
      allergies: ["Penicillin"],
      medicalHistory: ["Primary Hypertension", "Mild Hyperlipidemia"],
    },
    doctor: {
      _id: "65b123456789012345678901",
      name: "Dr. Rajesh Sharma",
      specialization: "Cardiology",
      department: "Cardiology",
      contactNumber: "+91 98765 43210",
      email: "doctor@hospital.com",
      yearsOfExperience: 16,
    },
    diagnosis: "Stage 2 Essential Hypertension & Dyslipidemia",
    symptoms: ["Occipital headache in early mornings", "Mild bilateral pedal edema", "Palpitations on exertion"],
    vitals: {
      bloodPressure: "152/96 mmHg",
      pulseRate: "82 bpm",
      temperature: "98.4 °F",
      weight: "78 kg",
      spo2: "99%",
    },
    medications: [
      {
        name: "Telmisartan",
        dosage: "40 mg",
        strength: "40mg",
        route: "Oral",
        frequency: "1-0-0",
        timing: "After food",
        duration: "30 days",
        instructions: "Take once daily in the morning after breakfast. Monitor BP weekly.",
      },
      {
        name: "Amlodipine",
        dosage: "5 mg",
        strength: "5mg",
        route: "Oral",
        frequency: "0-0-1",
        timing: "After food",
        duration: "30 days",
        instructions: "Take once daily at bedtime. Report if pedal edema worsens.",
      },
      {
        name: "Atorvastatin",
        dosage: "20 mg",
        strength: "20mg",
        route: "Oral",
        frequency: "0-0-1",
        timing: "At bedtime",
        duration: "30 days",
        instructions: "Take at bedtime with water.",
      },
    ],
    labTestsRecommended: ["Lipid Profile (Fasting 12h)", "Serum Creatinine & eGFR", "ECG 12-Lead"],
    advice: "Low sodium diet (<2.5g/day). 30 minutes brisk walking 5 days a week. Maintain a BP log twice weekly.",
    followUpDate: new Date("2026-11-20T10:00:00Z"),
    digitalSignature: {
      signedByName: "Dr. Rajesh Sharma, MD (Cardiology)",
      designation: "Cardiology (Cardiology)",
      signedAt: new Date("2026-10-18T10:45:00Z"),
    },
    status: "Active",
    dispensingStatus: "dispensed",
    administrations: [],
    createdAt: new Date("2026-10-18T10:45:00Z"),
    updatedAt: new Date("2026-10-18T10:45:00Z"),
  },
  {
    _id: "65c123456789012345678902",
    prescriptionNumber: "RX-2026-2189",
    patient: {
      _id: "65a123456789012345678902",
      name: "Priya Patel",
      email: "alice@example.com",
      age: 28,
      gender: "Female",
      contactNumber: "+91 98765 43211",
      abhaId: "14-1234-5678-9012",
      bloodGroup: "A+",
      address: "Flat 402, Shanti Kunj, Sector 14, Rohini, New Delhi - 110085",
      allergies: ["Dust Mites", "Sulfa Drugs"],
      medicalHistory: ["Bronchial Asthma", "Seasonal Allergic Rhinitis"],
    },
    doctor: {
      _id: "65b123456789012345678904",
      name: "Dr. Arvind Verma",
      specialization: "General Medicine",
      department: "General Medicine",
      contactNumber: "+91 98765 43213",
      email: "dr.verma@hospital.com",
      yearsOfExperience: 15,
    },
    diagnosis: "Acute Exacerbation of Bronchial Asthma with Allergic Bronchospasm",
    symptoms: ["Nocturnal dry cough", "Bilateral expiratory wheeze", "Chest tightness during temperature changes"],
    vitals: {
      bloodPressure: "118/76 mmHg",
      pulseRate: "90 bpm",
      temperature: "98.6 °F",
      weight: "58 kg",
      spo2: "96%",
    },
    medications: [
      {
        name: "Budesonide + Formoterol Inhaler",
        dosage: "200/6 mcg",
        strength: "200/6mcg",
        route: "Inhalation",
        frequency: "1-0-1",
        timing: "Before food",
        duration: "30 days",
        instructions: "2 puffs twice daily with spacer. Rinse mouth with water after each use.",
      },
      {
        name: "Montelukast + Levocetirizine",
        dosage: "10mg / 5mg",
        strength: "10mg/5mg",
        route: "Oral",
        frequency: "0-0-1",
        timing: "At bedtime",
        duration: "15 days",
        instructions: "Take 1 tablet every night at bedtime.",
      },
      {
        name: "Salbutamol Inhaler (SOS)",
        dosage: "100 mcg",
        strength: "100mcg",
        route: "Inhalation",
        frequency: "1-0-1",
        timing: "As needed (SOS)",
        duration: "30 days",
        instructions: "Use 2 puffs only during acute shortness of breath or cough spasms.",
      },
    ],
    labTestsRecommended: ["Peak Expiratory Flow Rate (PEFR) Record", "Complete Blood Count (CBC with Absolute Eosinophil Count)"],
    advice: "Avoid cold beverages, damp environments, and aerosol sprays. Keep rescue inhaler accessible at all times.",
    followUpDate: new Date("2026-11-15T11:00:00Z"),
    digitalSignature: {
      signedByName: "Dr. Arvind Verma, MBBS, MD",
      designation: "General Medicine (General Medicine)",
      signedAt: new Date("2026-10-19T11:20:00Z"),
    },
    status: "Active",
    dispensingStatus: "ready",
    administrations: [],
    createdAt: new Date("2026-10-19T11:20:00Z"),
    updatedAt: new Date("2026-10-19T11:20:00Z"),
  },
  {
    _id: "65c123456789012345678903",
    prescriptionNumber: "RX-2026-3351",
    patient: {
      _id: "65a123456789012345678903",
      name: "Amit Kumar",
      email: "amit.kumar@example.com",
      age: 42,
      gender: "Male",
      contactNumber: "+91 98765 43212",
      abhaId: "14-4321-8765-1098",
      bloodGroup: "B+",
      address: "78, Park Street, Salt Lake Sector V, Kolkata, West Bengal - 700091",
      allergies: [],
      medicalHistory: ["Type 2 Diabetes Mellitus", "Diabetic Foot Ulcer"],
    },
    doctor: {
      _id: "65b123456789012345678904",
      name: "Dr. Arvind Verma",
      specialization: "General Medicine",
      department: "General Medicine",
      contactNumber: "+91 98765 43213",
      email: "dr.verma@hospital.com",
      yearsOfExperience: 15,
    },
    diagnosis: "Uncontrolled Type 2 Diabetes Mellitus with Neuropathic Foot Ulcer (Wagner Grade 1)",
    symptoms: ["Paresthesias in both feet", "Right plantar heel ulceration (non-healing)", "Polyuria and polydipsia"],
    vitals: {
      bloodPressure: "134/86 mmHg",
      pulseRate: "78 bpm",
      temperature: "98.8 °F",
      weight: "82 kg",
      spo2: "98%",
    },
    medications: [
      {
        name: "Metformin Extended Release",
        dosage: "1000 mg",
        strength: "1000mg",
        route: "Oral",
        frequency: "1-0-1",
        timing: "With food",
        duration: "30 days",
        instructions: "Take twice daily immediately after principal meals.",
      },
      {
        name: "Glimepiride",
        dosage: "2 mg",
        strength: "2mg",
        route: "Oral",
        frequency: "1-0-0",
        timing: "Before food",
        duration: "30 days",
        instructions: "Take 15 minutes before breakfast.",
      },
      {
        name: "Pregabalin + Methylcobalamin",
        dosage: "75mg / 1500mcg",
        strength: "75mg/1500mcg",
        route: "Oral",
        frequency: "0-0-1",
        timing: "At bedtime",
        duration: "30 days",
        instructions: "Take 1 capsule at night for diabetic neuropathy relief.",
      },
    ],
    labTestsRecommended: ["HbA1c", "Fasting & Post-Prandial Blood Sugar", "Urine Microalbumin/Creatinine Ratio"],
    advice: "Daily sterile dressing of right foot ulcer. Strict offloading footwear. Fasting sugar target 90-130 mg/dL.",
    followUpDate: new Date("2026-11-05T09:30:00Z"),
    digitalSignature: {
      signedByName: "Dr. Arvind Verma, MBBS, MD",
      designation: "General Medicine (General Medicine)",
      signedAt: new Date("2026-10-20T09:15:00Z"),
    },
    status: "Active",
    dispensingStatus: "processing",
    administrations: [],
    createdAt: new Date("2026-10-20T09:15:00Z"),
    updatedAt: new Date("2026-10-20T09:15:00Z"),
  },
  {
    _id: "65c123456789012345678904",
    prescriptionNumber: "RX-2026-4412",
    patient: {
      _id: "65a123456789012345678904",
      name: "Kavita Desai",
      email: "kavita.desai@example.com",
      age: 64,
      gender: "Female",
      contactNumber: "+91 98765 43213",
      abhaId: "14-7788-9900-1122",
      bloodGroup: "AB+",
      address: "B-12, Alkapuri Society, Jetalpur Road, Vadodara, Gujarat - 390007",
      allergies: ["Aspirin", "NSAIDs"],
      medicalHistory: ["Bilateral Osteoarthritis Knee", "Osteopenia"],
    },
    doctor: {
      _id: "65b123456789012345678906",
      name: "Dr. Kabir Mehta",
      specialization: "Orthopedic Surgery",
      department: "Orthopedics",
      contactNumber: "+91 98765 43215",
      email: "dr.mehta@hospital.com",
      yearsOfExperience: 13,
    },
    diagnosis: "Severe Bilateral Knee Osteoarthritis (Kellgren-Lawrence Grade III)",
    symptoms: ["Severe weight-bearing knee pain", "Morning joint stiffness > 30 minutes", "Crepitus on flexion"],
    vitals: {
      bloodPressure: "128/82 mmHg",
      pulseRate: "74 bpm",
      temperature: "98.2 °F",
      weight: "66 kg",
      spo2: "99%",
    },
    medications: [
      {
        name: "Paracetamol Sustained Release",
        dosage: "1000 mg",
        strength: "1000mg",
        route: "Oral",
        frequency: "1-0-1",
        timing: "After food",
        duration: "14 days",
        instructions: "Take with full glass of water after food. (Patient has NSAID allergy).",
      },
      {
        name: "Diacerein + Glucosamine Sulfate",
        dosage: "50mg / 750mg",
        strength: "50/750mg",
        route: "Oral",
        frequency: "1-0-1",
        timing: "With food",
        duration: "60 days",
        instructions: "Cartilage protective agent. Take with lunch and dinner.",
      },
      {
        name: "Calcium Carbonate + Vitamin D3",
        dosage: "500mg / 250IU",
        strength: "500mg/250IU",
        route: "Oral",
        frequency: "0-1-0",
        timing: "After food",
        duration: "60 days",
        instructions: "Take once daily after afternoon meal.",
      },
    ],
    labTestsRecommended: ["Serum 25-Hydroxy Vitamin D", "Serum Uric Acid", "Digital X-Ray Bilateral Knees (Standing AP/Lateral)"],
    advice: "Quadriceps strengthening exercises. Avoid squatting and cross-legged sitting. Use knee cap while walking.",
    followUpDate: new Date("2026-11-25T14:00:00Z"),
    digitalSignature: {
      signedByName: "Dr. Kabir Mehta, MS (Ortho), DNB",
      designation: "Orthopedic Surgery (Orthopedics)",
      signedAt: new Date("2026-10-21T14:30:00Z"),
    },
    status: "Active",
    dispensingStatus: "pending",
    administrations: [],
    createdAt: new Date("2026-10-21T14:30:00Z"),
    updatedAt: new Date("2026-10-21T14:30:00Z"),
  },
];

export const demoAppointments = [
  {
    _id: "65d123456789012345678901",
    patient: demoPatients[0],
    doctor: demoDoctors[0],
    appointmentDate: new Date("2026-10-22T00:00:00Z"),
    timeSlot: "09:00 AM",
    reasonForVisit: "Hypertension 3-month review and medication adjustment",
    status: "confirmed",
    bookedBy: "patient",
    paymentStatus: "paid",
    createdAt: new Date("2026-10-20T08:00:00Z"),
  },
  {
    _id: "65d123456789012345678902",
    patient: demoPatients[1],
    doctor: demoDoctors[3],
    appointmentDate: new Date("2026-10-22T00:00:00Z"),
    timeSlot: "10:00 AM",
    reasonForVisit: "Asthma inhaler technique check and seasonal allergy review",
    status: "in_consultation",
    bookedBy: "staff",
    paymentStatus: "paid",
    createdAt: new Date("2026-10-20T09:30:00Z"),
  },
  {
    _id: "65d123456789012345678903",
    patient: demoPatients[2],
    doctor: demoDoctors[3],
    appointmentDate: new Date("2026-10-22T00:00:00Z"),
    timeSlot: "01:00 PM",
    reasonForVisit: "Diabetic foot ulcer dressing and blood sugar log review",
    status: "waiting",
    bookedBy: "staff",
    paymentStatus: "paid",
    createdAt: new Date("2026-10-21T07:15:00Z"),
  },
  {
    _id: "65d123456789012345678904",
    patient: demoPatients[3],
    doctor: demoDoctors[5],
    appointmentDate: new Date("2026-10-23T00:00:00Z"),
    timeSlot: "09:00 AM",
    reasonForVisit: "Knee osteoarthritis follow-up and intra-articular injection consultation",
    status: "confirmed",
    bookedBy: "patient",
    paymentStatus: "pending",
    createdAt: new Date("2026-10-21T11:00:00Z"),
  },
];

export const demoBeds = [
  {
    _id: "65e123456789012345678901",
    bedNumber: "ICU-01",
    ward: "ICU (Intensive Care Unit)",
    floor: "2nd floor (East wing)",
    dailyRate: 4500,
    features: { hasOxygen: true, hasVentilator: true, isIsolation: false, hasMonitor: true },
    status: "occupied",
    currentAdmission: {
      patient: demoPatients[0],
      attendingDoctor: demoDoctors[0],
      admittedAt: new Date(Date.now() - 86400000 * 2),
      admissionReason: "Severe Hypertensive Emergency with Acute Left Ventricular Strain",
      emergencyContact: "Mary Fernandes (+91 98765 43210)",
      notes: "Arterial line in situ. Continuous sodium nitroprusside infusion titrated to MAP 95.",
    },
  },
  {
    _id: "65e123456789012345678902",
    bedNumber: "ICU-02",
    ward: "ICU (Intensive Care Unit)",
    floor: "2nd floor (East wing)",
    dailyRate: 4500,
    features: { hasOxygen: true, hasVentilator: true, isIsolation: false, hasMonitor: true },
    status: "available",
  },
  {
    _id: "65e123456789012345678903",
    bedNumber: "GEN-101",
    ward: "General Ward",
    floor: "1st floor (North wing)",
    dailyRate: 1200,
    features: { hasOxygen: true, hasVentilator: false, isIsolation: false, hasMonitor: false },
    status: "occupied",
    currentAdmission: {
      patient: demoPatients[2],
      attendingDoctor: demoDoctors[3],
      admittedAt: new Date(Date.now() - 86400000 * 3),
      admissionReason: "Diabetic Foot Ulcer with Cellulitis",
      emergencyContact: "Neha Kumar (+91 98765 43212)",
      notes: "IV antibiotics and daily debridement.",
    },
  },
  {
    _id: "65e123456789012345678904",
    bedNumber: "GEN-102",
    ward: "General Ward",
    floor: "1st floor (North wing)",
    dailyRate: 1200,
    features: { hasOxygen: true, hasVentilator: false, isIsolation: false, hasMonitor: false },
    status: "available",
  },
];

// Helper methods for offline CRUD operations
export const mockDatabase = {
  // ── Patients ─────────────────────────────────────────────────────────────
  getPatients({ search = "", page = 1, limit = 10 } = {}) {
    let filtered = [...demoPatients];
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.contactNumber?.toLowerCase().includes(q) ||
          p.abhaId?.toLowerCase().includes(q) ||
          p.email?.toLowerCase().includes(q)
      );
    }
    const totalPatients = filtered.length;
    const startIndex = (page - 1) * limit;
    const paginatedPatients = filtered.slice(startIndex, startIndex + limit);

    return {
      patients: paginatedPatients,
      totalPatients,
      totalPages: Math.ceil(totalPatients / limit) || 1,
      page,
      limit,
    };
  },

  getPatientById(id) {
    if (!id) return null;
    return demoPatients.find((p) => p._id === id || p._id === id.toString()) || null;
  },

  createPatient(data) {
    const newPatient = {
      _id: createObjectId(),
      ...data,
      registrationDate: data.registrationDate || new Date(),
      allergies: Array.isArray(data.allergies) ? data.allergies : [],
      medicalHistory: Array.isArray(data.medicalHistory) ? data.medicalHistory : [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    demoPatients.unshift(newPatient);
    return newPatient;
  },

  updatePatient(id, data) {
    const index = demoPatients.findIndex((p) => p._id === id || p._id === id.toString());
    if (index === -1) return null;
    demoPatients[index] = {
      ...demoPatients[index],
      ...data,
      updatedAt: new Date(),
    };
    return demoPatients[index];
  },

  deletePatient(id) {
    const index = demoPatients.findIndex((p) => p._id === id || p._id === id.toString());
    if (index === -1) return false;
    demoPatients.splice(index, 1);
    return true;
  },

  // ── Prescriptions ────────────────────────────────────────────────────────
  getPrescriptions({ search = "", patient = "", doctor = "" } = {}) {
    let filtered = [...demoPrescriptions];

    if (patient) {
      filtered = filtered.filter(
        (rx) => rx.patient?._id === patient || rx.patient?._id === patient.toString()
      );
    }

    if (doctor) {
      filtered = filtered.filter(
        (rx) => rx.doctor?._id === doctor || rx.doctor?._id === doctor.toString()
      );
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(
        (rx) =>
          rx.prescriptionNumber?.toLowerCase().includes(q) ||
          rx.diagnosis?.toLowerCase().includes(q) ||
          rx.patient?.name?.toLowerCase().includes(q) ||
          rx.patient?.contactNumber?.toLowerCase().includes(q) ||
          rx.patient?.abhaId?.toLowerCase().includes(q)
      );
    }

    return filtered;
  },

  getPrescriptionById(id) {
    if (!id) return null;
    return (
      demoPrescriptions.find((rx) => rx._id === id || rx._id === id.toString()) ||
      demoPrescriptions[0] // Fallback to first rich demo prescription for deep inspection
    );
  },

  createPrescription(data) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const year = new Date().getFullYear();
    const rxNumber = `RX-${year}-${randomSuffix}`;

    const patientRecord = this.getPatientById(data.patient) || demoPatients[0];
    const doctorRecord = this.getDoctorById(data.doctor) || demoDoctors[0];

    const newRx = {
      _id: createObjectId(),
      prescriptionNumber: rxNumber,
      patient: patientRecord,
      doctor: doctorRecord,
      diagnosis: data.diagnosis,
      symptoms: Array.isArray(data.symptoms) ? data.symptoms : [],
      vitals: data.vitals || {},
      medications: Array.isArray(data.medications) ? data.medications : [],
      labTestsRecommended: Array.isArray(data.labTestsRecommended) ? data.labTestsRecommended : [],
      advice: data.advice || "",
      followUpDate: data.followUpDate || null,
      digitalSignature: {
        signedByName: doctorRecord.name,
        designation: `${doctorRecord.specialization} (${doctorRecord.department})`,
        signedAt: new Date(),
      },
      status: "Active",
      dispensingStatus: "pending",
      administrations: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    demoPrescriptions.unshift(newRx);
    return newRx;
  },

  updatePrescription(id, data) {
    const index = demoPrescriptions.findIndex((rx) => rx._id === id || rx._id === id.toString());
    if (index === -1) return null;
    demoPrescriptions[index] = {
      ...demoPrescriptions[index],
      ...data,
      updatedAt: new Date(),
    };
    return demoPrescriptions[index];
  },

  deletePrescription(id) {
    const index = demoPrescriptions.findIndex((rx) => rx._id === id || rx._id === id.toString());
    if (index === -1) return false;
    demoPrescriptions.splice(index, 1);
    return true;
  },

  // ── Doctors ──────────────────────────────────────────────────────────────
  getDoctors({ specialization = "", department = "" } = {}) {
    let list = [...demoDoctors];
    if (specialization?.trim()) {
      const q = specialization.trim().toLowerCase();
      list = list.filter((d) => d.specialization?.toLowerCase().includes(q));
    }
    if (department?.trim()) {
      const q = department.trim().toLowerCase();
      list = list.filter((d) => d.department?.toLowerCase().includes(q));
    }
    return list;
  },

  getDoctorById(id) {
    if (!id) return null;
    return demoDoctors.find((d) => d._id === id || d._id === id.toString()) || null;
  },

  // ── Appointments ─────────────────────────────────────────────────────────
  getAppointments({ status = "", doctor = "", page = 1, limit = 50 } = {}) {
    let list = [...demoAppointments];
    if (status) {
      list = list.filter((a) => a.status === status);
    }
    if (doctor) {
      list = list.filter((a) => a.doctor?._id === doctor || a.doctor?._id === doctor.toString());
    }
    return list;
  },

  // ── Beds ─────────────────────────────────────────────────────────────────
  getBeds({ ward = "", status = "", search = "" } = {}) {
    let list = [...demoBeds];
    if (ward) {
      list = list.filter((b) => b.ward === ward);
    }
    if (status) {
      list = list.filter((b) => b.status === status);
    }
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (b) =>
          b.bedNumber?.toLowerCase().includes(q) ||
          b.ward?.toLowerCase().includes(q) ||
          b.currentAdmission?.patient?.name?.toLowerCase().includes(q)
      );
    }
    return list;
  },
};
