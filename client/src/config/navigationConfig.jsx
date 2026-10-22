// Nivora Care Hospital Operating System - Centralized Navigation Configuration
// Supports both Desktop Sidebars and Optimized Native-grade Mobile Menus & Bottom Bars

export const getNavigationForRole = (role, user = null) => {
  const normalizedRole = role || "admin";

  // =========================================================================
  // 1. DOCTOR NAVIGATION
  // =========================================================================
  if (normalizedRole === "doctor") {
    return {
      roleTitle: "Consultant Physician",
      department: "Clinical Medicine & OPD",
      themeColor: "blue",
      bottomTabs: [
        { label: "Dashboard", to: "/dashboard", iconName: "home" },
        { label: "Consults", to: "/appointments", iconName: "calendar" },
        { label: "Prescribe", to: "/prescriptions", iconName: "prescription" },
        { label: "Patients", to: "/patients", iconName: "patients" },
      ],
      quickActions: [
        { label: "Write Rx", to: "/prescriptions", iconName: "prescription", color: "blue" },
        { label: "Critical Labs", to: "/doctor/critical-labs", iconName: "alert", color: "rose" },
        { label: "Orders", to: "/doctor/orders", iconName: "clipboard", color: "teal" },
      ],
      categories: [
        {
          id: "clinical",
          name: "Clinical Practice",
          items: [
            { label: "Clinical Dashboard", to: "/dashboard", desc: "OPD load, pending consults & metrics", iconName: "home" },
            { label: "My Consultations", to: "/appointments", desc: "Scheduled OPD visits & video consults", iconName: "calendar" },
            { label: "My Patients", to: "/patients", desc: "Active patient directory & history", iconName: "patients" },
            { label: "Digital Prescriptions (Rx)", to: "/prescriptions", desc: "Issue e-prescriptions & regimens", iconName: "prescription" },
          ],
        },
        {
          id: "directives",
          name: "Clinical Directives",
          items: [
            { label: "Doctor Orders", to: "/doctor/orders", desc: "Medication & care instructions for nurses", iconName: "clipboard" },
            { label: "Specialist Referrals", to: "/doctor/referrals", desc: "In-hospital specialist referrals", iconName: "referral" },
            { label: "Critical Lab Reviews", to: "/doctor/critical-labs", desc: "Urgent abnormal diagnostic findings", iconName: "alert", badge: "Urgent" },
            { label: "Follow-ups Due", to: "/doctor/follow-ups", desc: "Patients scheduled for follow-up review", iconName: "clock" },
            { label: "Telemedicine Doctor Desk", to: "/doctor/telemedicine", desc: "Remote video consultations & chat", iconName: "video" },
          ],
        },
        {
          id: "resources",
          name: "Hospital Resources",
          items: [
            { label: "Lab & Diagnostics", to: "/lab-reports", desc: "Diagnostic lab findings & PACS studies", iconName: "flask" },
            { label: "My Schedule & Availability", to: "/doctors", desc: "Duty shifts, leave & OPD clinic hours", iconName: "clock" },
            { label: "Specialist Directory", to: "/specialist-directory", desc: "Consultants, on-call doctors & paging", iconName: "users" },
          ],
        },
      ],
    };
  }

  // =========================================================================
  // 2. NURSE NAVIGATION
  // =========================================================================
  if (normalizedRole === "nurse") {
    return {
      roleTitle: "Clinical Care Nurse",
      department: "Inpatient Wards & Nursing Station",
      themeColor: "teal",
      bottomTabs: [
        { label: "Station", to: "/dashboard", iconName: "home" },
        { label: "My Patients", to: "/nurse/patients", iconName: "patients" },
        { label: "Vitals", to: "/nurse/vitals", iconName: "heart" },
        { label: "Beds", to: "/beds", iconName: "bed" },
      ],
      quickActions: [
        { label: "Log Vitals", to: "/nurse/vitals", iconName: "heart", color: "teal" },
        { label: "Doctor Orders", to: "/nurse/doctor-orders", iconName: "clipboard", color: "blue" },
        { label: "Medication Admin", to: "/nurse/medications", iconName: "pill", color: "emerald" },
      ],
      categories: [
        {
          id: "station",
          name: "Nursing Station",
          items: [
            { label: "Station Dashboard", to: "/dashboard", desc: "Ward census, active alerts & tasks", iconName: "home" },
            { label: "My Shift & Assignment", to: "/nurse/shift", desc: "Duty roster, assigned beds & handover", iconName: "clock" },
            { label: "Nurse Handover Report", to: "/nurse/handover", desc: "End-of-shift handover summary", iconName: "clipboard" },
          ],
        },
        {
          id: "care",
          name: "Inpatients & Care",
          items: [
            { label: "My Inpatients", to: "/nurse/patients", desc: "Admitted ward patient profiles", iconName: "patients" },
            { label: "Patient Monitoring", to: "/nurse/monitoring", desc: "Continuous observation & ICU monitoring", iconName: "activity" },
            { label: "Vital Signs Tracker", to: "/nurse/vitals", desc: "Record BP, Temp, SpO2 & pulse", iconName: "heart" },
            { label: "Nursing Clinical Notes", to: "/nurse/notes", desc: "Shift progress notes & observations", iconName: "notes" },
            { label: "Nursing Tasks & MAR", to: "/nurse/tasks", desc: "Hourly task checklist & routines", iconName: "check" },
            { label: "Medication Administration", to: "/nurse/medications", desc: "eMAR drug dispensing log", iconName: "pill" },
            { label: "Intake & Output (I/O)", to: "/nurse/intake-output", desc: "Fluid balance, IV & urine output", iconName: "droplet" },
          ],
        },
        {
          id: "coordination",
          name: "Clinical Coordination",
          items: [
            { label: "Doctor Orders", to: "/nurse/doctor-orders", desc: "Active orders pending nurse execution", iconName: "clipboard" },
            { label: "Lab & Diagnostics", to: "/lab-reports", desc: "Ward test requests & lab status", iconName: "flask" },
            { label: "Patient Transfers", to: "/nurse/transfers", desc: "Inter-ward and ICU bed transfers", iconName: "switch" },
            { label: "Admission & Discharge", to: "/nurse/admission-discharge", desc: "Discharge summaries & intake", iconName: "document" },
            { label: "Beds & Wards Map", to: "/beds", desc: "Real-time occupancy & bed statuses", iconName: "bed" },
            { label: "Ward Doctors Directory", to: "/doctors", desc: "On-call specialists & resident doctors", iconName: "users" },
          ],
        },
      ],
    };
  }

  // =========================================================================
  // 3. RECEPTIONIST NAVIGATION
  // =========================================================================
  if (normalizedRole === "receptionist") {
    return {
      roleTitle: "Front Desk & Admissions",
      department: "Hospital Admissions & Billing",
      themeColor: "amber",
      bottomTabs: [
        { label: "Front Desk", to: "/dashboard", iconName: "home" },
        { label: "Appointments", to: "/appointments", iconName: "calendar" },
        { label: "Registration", to: "/patients", iconName: "patients" },
        { label: "Billing", to: "/billing", iconName: "credit-card" },
      ],
      quickActions: [
        { label: "New Patient", to: "/patients", iconName: "patients", color: "amber" },
        { label: "Book OPD", to: "/appointments", iconName: "calendar", color: "blue" },
        { label: "Create Bill", to: "/billing", iconName: "credit-card", color: "emerald" },
      ],
      categories: [
        {
          id: "desk",
          name: "Front Desk Operations",
          items: [
            { label: "Front Desk Overview", to: "/dashboard", desc: "Daily admissions, OPD queue & revenue", iconName: "home" },
            { label: "Front Desk Work Queue", to: "/reception/work-queue", desc: "Real-time check-in and token triage", iconName: "activity" },
            { label: "Waiting Room Display", to: "/reception/waiting-room", desc: "Live TV token display & announcements", iconName: "monitor" },
            { label: "Desk Handover Log", to: "/reception/handover", desc: "Shift cash balance & notes", iconName: "clipboard" },
          ],
        },
        {
          id: "registration",
          name: "Patient Flow & Visits",
          items: [
            { label: "Patient Registration", to: "/patients", desc: "Enroll new patients & create ABHA ID", iconName: "patients" },
            { label: "OPD Appointments", to: "/appointments", desc: "Schedule, reschedule & cancel slots", iconName: "calendar" },
            { label: "Online Web Bookings", to: "/reception/online-bookings", desc: "Incoming patient portal appointments", iconName: "globe" },
            { label: "Admissions & Discharges", to: "/reception/admissions", desc: "IPD intake, bed allocation & release", iconName: "document" },
            { label: "Bed Availability Map", to: "/beds", desc: "Real-time occupancy across all wards", iconName: "bed" },
            { label: "Emergency Desk Intake", to: "/reception/emergency", desc: "Fast-track red triage admissions", iconName: "alert", badge: "Priority" },
          ],
        },
        {
          id: "billing",
          name: "Revenue & Cashiering",
          items: [
            { label: "Patient Billing & POS", to: "/billing", desc: "Generate invoices, UPI/card payment", iconName: "credit-card" },
            { label: "Insurance Desk", to: "/admin/insurance-claims", desc: "TPA pre-auth & cashless claims", iconName: "shield" },
            { label: "Refunds & Adjustments", to: "/reception/refunds", desc: "Process deposit refunds & ledger notes", iconName: "cash" },
            { label: "Reception Shift Reports", to: "/reception/reports", desc: "Daily cash register & collection summary", iconName: "chart" },
            { label: "Doctor Duty Rosters", to: "/doctors", desc: "Doctor clinic hours & OPD availability", iconName: "users" },
          ],
        },
      ],
    };
  }

  // =========================================================================
  // 4. PHARMACIST NAVIGATION
  // =========================================================================
  if (normalizedRole === "pharmacist") {
    return {
      roleTitle: "Chief Pharmacist",
      department: "Hospital Pharmacy Operations",
      themeColor: "emerald",
      bottomTabs: [
        { label: "Pharmacy", to: "/dashboard", iconName: "home" },
        { label: "Dispense", to: "/pharmacy/dispense", iconName: "pill" },
        { label: "Inventory", to: "/pharmacy/inventory", iconName: "box" },
        { label: "Queue", to: "/pharmacy/queue", iconName: "clock" },
      ],
      quickActions: [
        { label: "Dispense Rx", to: "/pharmacy/dispense", iconName: "pill", color: "emerald" },
        { label: "Verification", to: "/pharmacy/verification", iconName: "check", color: "blue" },
        { label: "Low Stock", to: "/pharmacy/alerts", iconName: "alert", color: "amber" },
      ],
      categories: [
        {
          id: "dispensing",
          name: "Dispensing & Verification",
          items: [
            { label: "Pharmacy Dashboard", to: "/dashboard", desc: "Prescription backlog & daily sales", iconName: "home" },
            { label: "Dispensing Workbench", to: "/pharmacy/dispense", desc: "Fill digital Rx & print drug labels", iconName: "pill" },
            { label: "Prescription Queue", to: "/pharmacy/queue", desc: "Live OPD & IPD order dispensing queue", iconName: "clock" },
            { label: "Pharmacist Verification", to: "/pharmacy/verification", desc: "Double-check clinical dosage & interactions", iconName: "check" },
            { label: "Prescription History", to: "/pharmacy/history", desc: "Dispensed audit records & batches", iconName: "document" },
          ],
        },
        {
          id: "inventory",
          name: "Inventory & Supply Chain",
          items: [
            { label: "Medicine Inventory", to: "/pharmacy/inventory", desc: "Stock levels, formulation & pricing", iconName: "box" },
            { label: "Stock Management", to: "/pharmacy/stock", desc: "Stock in, stock out & adjustments", iconName: "clipboard" },
            { label: "Batch & Expiry Tracker", to: "/pharmacy/batches", desc: "Near-expiry drugs & lot numbers", iconName: "calendar" },
            { label: "Low Stock Alerts", to: "/pharmacy/alerts", desc: "Re-order levels & threshold warnings", iconName: "alert", badge: "Stock" },
            { label: "Suppliers & Vendors", to: "/pharmacy/suppliers", desc: "Wholesalers, distributors & contacts", iconName: "users" },
            { label: "Purchase Orders (PO)", to: "/pharmacy/purchase-orders", desc: "Procurement orders & vendor invoices", iconName: "document" },
          ],
        },
        {
          id: "finance",
          name: "Billing & Reports",
          items: [
            { label: "Pharmacy POS Billing", to: "/pharmacy/billing", desc: "Cash counter & OTC medicines", iconName: "credit-card" },
            { label: "Returns & Refunds", to: "/pharmacy/returns", desc: "Expired stock return & credit notes", iconName: "cash" },
            { label: "Pharmacy Analytics", to: "/pharmacy/analytics", desc: "Sales, fast-moving drugs & revenue", iconName: "chart" },
            { label: "Pharmacy Staff & Shifts", to: "/pharmacy/staff", desc: "Duty rosters & dispenser assignments", iconName: "users" },
          ],
        },
      ],
    };
  }

  // =========================================================================
  // 5. DIAGNOSTICS & LABORATORY (Pathologist, Radiologist, Lab Tech, Rad Tech)
  // =========================================================================
  if (
    [
      "diagnostic_admin",
      "pathologist",
      "radiologist",
      "lab_technician",
      "radiology_technician",
    ].includes(normalizedRole)
  ) {
    return {
      roleTitle:
        normalizedRole === "pathologist"
          ? "Consultant Pathologist"
          : normalizedRole === "radiologist"
          ? "Consultant Radiologist"
          : normalizedRole === "lab_technician"
          ? "Laboratory Technologist"
          : normalizedRole === "radiology_technician"
          ? "Radiology Technologist"
          : "Diagnostic Administrator",
      department: "Pathology & Medical Imaging (RIS/PACS)",
      themeColor: "indigo",
      bottomTabs: [
        { label: "Hub", to: "/dashboard", iconName: "home" },
        { label: "Requests", to: "/diagnostic/requests", iconName: "clipboard" },
        { label: "Workbench", to: "/diagnostic/workbench", iconName: "flask" },
        { label: "Reports", to: "/diagnostic/reports", iconName: "document" },
      ],
      quickActions: [
        { label: "Workbench", to: "/diagnostic/workbench", iconName: "flask", color: "indigo" },
        { label: "Imaging PACS", to: "/diagnostic/radiology", iconName: "monitor", color: "sky" },
        { label: "Sign-Off", to: "/diagnostic/review", iconName: "check", color: "teal" },
      ],
      categories: [
        {
          id: "worklist",
          name: "Requests & Samples",
          items: [
            { label: "Diagnostic Command Hub", to: "/dashboard", desc: "Turnaround times, criticals & test volume", iconName: "home" },
            { label: "Test Order Requests", to: "/diagnostic/requests", desc: "Physician diagnostic orders queue", iconName: "clipboard" },
            { label: "Sample Collection (Phlebotomy)", to: "/diagnostic/samples", desc: "Barcode vacutainers & accessioning", iconName: "droplet" },
            { label: "Critical Alert Desk", to: "/diagnostic/critical", desc: "Panic-value notification to physicians", iconName: "alert", badge: "Critical" },
          ],
        },
        {
          id: "pathology",
          name: "Laboratory & Pathology",
          items: [
            { label: "Technician Workbench", to: "/diagnostic/workbench", desc: "Analyzer entry, QC verification & flags", iconName: "flask" },
            { label: "Pathology Test Directory", to: "/diagnostic/catalog?department=Pathology", desc: "Reference ranges & clinical parameters", iconName: "notes" },
            { label: "Auto-Verification Dashboard", to: "/diagnostic/auto-verify", desc: "Rules-based automated validation", iconName: "check" },
          ],
        },
        {
          id: "radiology",
          name: "Radiology & PACS Imaging",
          items: [
            { label: "Imaging Worklist & Viewer", to: "/diagnostic/radiology", desc: "DICOM viewer, X-Ray, CT & MRI studies", iconName: "monitor" },
            { label: "Radiology Modality Catalog", to: "/diagnostic/catalog?department=Radiology", desc: "Protocols, contrast & exposure guides", iconName: "settings" },
          ],
        },
        {
          id: "reports",
          name: "Verification & Release",
          items: [
            { label: "Specialist Review & Sign-Off", to: "/diagnostic/review", desc: "Doctor digital signature & report release", iconName: "check" },
            { label: "Finalized Diagnostic Reports", to: "/diagnostic/reports", desc: "Official patient test results repository", iconName: "document" },
            { label: "Print Center & Film Bureau", to: "/diagnostic/print-center", desc: "Laser film print & watermarked reports", iconName: "print" },
            { label: "Biomedical Equipment", to: "/diagnostic/equipment", desc: "Calibration, maintenance & downtime log", iconName: "settings" },
            { label: "Reagents & Lab Supplies", to: "/diagnostic/inventory", desc: "Stains, control kits & reagents stock", iconName: "box" },
          ],
        },
      ],
    };
  }

  // =========================================================================
  // 6. EMERGENCY DEPARTMENT
  // =========================================================================
  if (normalizedRole === "emergency") {
    return {
      roleTitle: "Emergency & Trauma Team",
      department: "Emergency Department (ER / Level 1 Trauma)",
      themeColor: "rose",
      bottomTabs: [
        { label: "ER Desk", to: "/emergency/dashboard", iconName: "home" },
        { label: "Triage", to: "/emergency/queue", iconName: "alert" },
        { label: "Register", to: "/emergency/register", iconName: "patients" },
        { label: "Beds", to: "/beds", iconName: "bed" },
      ],
      quickActions: [
        { label: "Red Triage", to: "/emergency/queue", iconName: "alert", color: "rose" },
        { label: "ER Bed Map", to: "/beds", iconName: "bed", color: "indigo" },
        { label: "Call 108", to: "tel:108", iconName: "phone", color: "rose" },
      ],
      categories: [
        {
          id: "triage",
          name: "Emergency Command",
          items: [
            { label: "ER Command Center", to: "/emergency/dashboard", desc: "Live triage census & resuscitation bays", iconName: "home" },
            { label: "Triage Queue (Red/Yellow/Green)", to: "/emergency/queue", desc: "Urgent prioritization & vital alerts", iconName: "alert", badge: "ER" },
            { label: "Emergency Fast-Registration", to: "/emergency/register", desc: "Immediate intake for trauma & unconscious", iconName: "patients" },
            { label: "Emergency Bed Status", to: "/beds", desc: "Trauma bay, resuscitation & triage beds", iconName: "bed" },
          ],
        },
        {
          id: "clinical",
          name: "Trauma & Operations",
          items: [
            { label: "Patients Directory", to: "/patients", desc: "Hospital-wide patient lookup", iconName: "patients" },
            { label: "Emergency Lab Reports", to: "/lab-reports", desc: "Stat arterial blood gas & rapid troponin", iconName: "flask" },
            { label: "Emergency Shift Reports", to: "/emergency/reports", desc: "Admissions, mortality & resuscitation log", iconName: "chart" },
            { label: "Operating Theatre Status", to: "/admin/operating-theatre", desc: "Emergency surgical theatre readiness", iconName: "activity" },
          ],
        },
      ],
    };
  }

  // =========================================================================
  // 7. PATIENT HEALTH PORTAL
  // =========================================================================
  if (normalizedRole === "patient") {
    return {
      roleTitle: "Verified Patient",
      department: "Personal Health Gateway",
      themeColor: "rose",
      bottomTabs: [
        { label: "Health Hub", to: "/patient/dashboard", iconName: "home" },
        { label: "Visits", to: "/patient/appointments", iconName: "calendar" },
        { label: "Prescriptions", to: "/patient/prescriptions", iconName: "prescription" },
        { label: "Lab Reports", to: "/patient/lab-reports", iconName: "flask" },
      ],
      quickActions: [
        { label: "Book Doctor", to: "/patient/appointments/book", iconName: "calendar", color: "rose" },
        { label: "My Records", to: "/patient/records", iconName: "document", color: "blue" },
        { label: "Pay Bills", to: "/patient/billings", iconName: "credit-card", color: "emerald" },
      ],
      categories: [
        {
          id: "health",
          name: "My Health",
          items: [
            { label: "My Health Hub", to: "/patient/dashboard", desc: "Health summary, vitals & upcoming visits", iconName: "home" },
            { label: "Medical Records", to: "/patient/records", desc: "Clinical notes, allergies & diagnosis history", iconName: "document" },
            { label: "Health Timeline", to: "/patient/health-timeline", desc: "Chronological medical history & milestones", iconName: "activity" },
            { label: "My Vital Signs", to: "/patient/vitals", desc: "Track BP, heart rate, weight & blood sugar", iconName: "heart" },
            { label: "Uploaded Documents", to: "/patient/documents", desc: "Scans, discharge slips & test reports", iconName: "document" },
          ],
        },
        {
          id: "care",
          name: "Clinical Care & Visits",
          items: [
            { label: "Book Specialist Visit", to: "/patient/appointments/book", desc: "Select department, doctor & time slot", iconName: "calendar" },
            { label: "My Scheduled Visits", to: "/patient/appointments", desc: "Upcoming appointments & tokens", iconName: "calendar" },
            { label: "Consultation History", to: "/patient/consultations", desc: "Past doctor visits & summary notes", iconName: "notes" },
            { label: "Video Teleconsultations", to: "/patient/telemedicine", desc: "Join secure virtual doctor video calls", iconName: "video" },
            { label: "Find a Hospital Doctor", to: "/patient/doctors", desc: "Browse doctors, qualifications & reviews", iconName: "users" },
          ],
        },
        {
          id: "pharmacy",
          name: "Medicines & Diagnostic Tests",
          items: [
            { label: "My Prescriptions", to: "/patient/prescriptions", desc: "Active doctor prescriptions & dosage instructions", iconName: "prescription" },
            { label: "My Medications", to: "/patient/medicines", desc: "Ongoing course medicines & refills", iconName: "pill" },
            { label: "My Lab & Diagnostic Reports", to: "/patient/lab-reports", desc: "Download verified blood tests & scan reports", iconName: "flask" },
          ],
        },
        {
          id: "billing",
          name: "Billing, Admissions & Account",
          items: [
            { label: "Invoices & Receipts", to: "/patient/billings", desc: "Pay hospital bills online via UPI/Card", iconName: "credit-card" },
            { label: "Payment History", to: "/patient/payments", desc: "Past transaction receipts & tax invoices", iconName: "cash" },
            { label: "Hospital Admissions", to: "/patient/admissions", desc: "Inpatient stay records & discharge slips", iconName: "bed" },
            { label: "My Referrals & Follow-ups", to: "/patient/referrals", desc: "Referral letters & follow-up dates", iconName: "referral" },
            { label: "Patient Profile & ABHA", to: "/patient/profile", desc: "Personal info, emergency contact & ABHA ID", iconName: "users" },
            { label: "Help & Support Desk", to: "/patient/support", desc: "Frequently asked questions & 24/7 care desk", iconName: "phone" },
            { label: "Hospital Experience Feedback", to: "/patient/feedback", desc: "Rate doctor, nurses & hospital service", iconName: "star" },
          ],
        },
      ],
    };
  }

  // =========================================================================
  // 8. ADMIN / SUPER ADMIN NAVIGATION (Default)
  // =========================================================================
  return {
    roleTitle: "Hospital Administrator",
    department: "Executive Governance & Operations",
    themeColor: "indigo",
    bottomTabs: [
      { label: "Executive", to: "/dashboard", iconName: "home" },
      { label: "Staff", to: "/admin/staff", iconName: "users" },
      { label: "Operations", to: "/admin/emergency", iconName: "activity" },
      { label: "Reports", to: "/reports", iconName: "chart" },
    ],
    quickActions: [
      { label: "Executive Hub", to: "/admin/executive-dashboard", iconName: "home", color: "indigo" },
      { label: "Bed Census", to: "/beds", iconName: "bed", color: "teal" },
      { label: "Billing Audit", to: "/billing", iconName: "credit-card", color: "emerald" },
    ],
    categories: [
      {
        id: "governance",
        name: "Command & Governance",
        items: [
          { label: "Executive Dashboard", to: "/dashboard", desc: "Key operational KPIs, bed census & revenue", iconName: "home" },
          { label: "Executive Strategic Hub", to: "/admin/executive-dashboard", desc: "High-level hospital performance metrics", iconName: "chart" },
          { label: "Hospital Departments", to: "/admin/departments", desc: "Clinical & administrative department units", iconName: "settings" },
          { label: "Master Hospital Calendar", to: "/admin/calendar", desc: "Events, conferences, shifts & audits", iconName: "calendar" },
          { label: "Hospital System Settings", to: "/admin/settings", desc: "Hospital branding, NABH & API config", iconName: "settings" },
        ],
      },
      {
        id: "clinical_ops",
        name: "Clinical & Inpatient Operations",
        items: [
          { label: "Patients Master Directory", to: "/patients", desc: "Hospital-wide patient census & search", iconName: "patients" },
          { label: "Doctors & Specialists", to: "/doctors", desc: "Physician profiles, credentials & OPD slots", iconName: "users" },
          { label: "Bed Occupancy & Wards", to: "/beds", desc: "Real-time bed allocation & occupancy map", iconName: "bed" },
          { label: "Admissions Management", to: "/admin/admissions", desc: "IPD admission flow & bed occupancy", iconName: "document" },
          { label: "Emergency Operations Hub", to: "/admin/emergency", desc: "Disaster readiness & emergency flow", iconName: "alert" },
          { label: "Operating Theatres (OT)", to: "/admin/operating-theatre", desc: "Surgery schedule & theatre readiness", iconName: "activity" },
        ],
      },
      {
        id: "workforce",
        name: "Workforce & Facilities",
        items: [
          { label: "Hospital Staff Directory", to: "/admin/staff", desc: "Nurses, technicians, admin & doctors", iconName: "users" },
          { label: "Staff Attendance & Shifts", to: "/admin/attendance", desc: "Biometric attendance & duty scheduling", iconName: "clock" },
          { label: "Biomedical Equipment", to: "/admin/equipment", desc: "Medical machinery maintenance & calibration", iconName: "settings" },
          { label: "Supply Chain & GRN", to: "/admin/supply-chain/grn", desc: "Goods Receipt Notes & warehouse intake", iconName: "box" },
          { label: "Inter-Store Transfers", to: "/admin/supply-chain/transfers", desc: "Stock movement between departments", iconName: "switch" },
        ],
      },
      {
        id: "finance_analytics",
        name: "Finance, Billing & Analytics",
        items: [
          { label: "Billing & Cashiering Desk", to: "/billing", desc: "Hospital billing ledger & payments", iconName: "credit-card" },
          { label: "Revenue Analytics", to: "/admin/revenue", desc: "Departmental revenue & financial health", iconName: "chart" },
          { label: "Insurance Claims & TPA", to: "/admin/insurance-claims", desc: "Cashless claims, approvals & disputes", iconName: "shield" },
          { label: "Pharmacy Operations & Stock", to: "/admin/inventory", desc: "Medication sales & inventory oversight", iconName: "box" },
          { label: "Enterprise Analytics Reports", to: "/reports", desc: "Clinical audits, NABH & regulatory reports", iconName: "chart" },
          { label: "Patient Feedback & Reviews", to: "/admin/feedback", desc: "Patient satisfaction, complaints & NPS", iconName: "star" },
          { label: "System Security Audit Logs", to: "/admin/audit-logs", desc: "User access logs, logins & role changes", iconName: "shield" },
        ],
      },
    ],
  };
};
