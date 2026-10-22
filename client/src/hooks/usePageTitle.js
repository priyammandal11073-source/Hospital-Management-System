import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Route-to-Page-Title mapping for all 8 hospital departments and patient portals.
 */
const ROUTE_TITLES = {
  "/": "Portal Gateway",
  "/login": "Sign In — Staff Portals",
  "/dashboard": "Clinical & Operational Overview",
  "/patients": "Patient Registry & Directory",
  "/doctors": "Doctor Directory & Consultations",
  "/appointments": "Consultations & OPD Schedule",
  "/prescriptions": "Electronic Prescriptions (Rx)",
  "/beds": "Ward Bed Occupancy & Transfers",
  "/billing": "Central Invoicing & Billing Ledger",
  "/reports": "Hospital Analytics & Reports",
  "/lab-reports": "Laboratory & Diagnostic Reports",
  "/ward-map": "Interactive Ward & Bed Map",
  "/payment": "Universal Payment Gateway",

  // Administrator Operations
  "/admin/dashboard": "Executive Leadership Dashboard",
  "/admin/staff": "Staff Directory & Access Control",
  "/admin/departments": "Clinical Departments Directory",
  "/admin/calendar": "Master Hospital Operations Calendar",
  "/admin/revenue": "Financial Revenue & Billing Analytics",
  "/admin/inventory": "Pharmacy & Surgical Supply Inventory",
  "/admin/equipment": "Biomedical Equipment Maintenance",
  "/admin/shifts": "Staff Shifts & Attendance",
  "/admin/admissions": "Inpatient Admissions & Discharges",
  "/admin/emergency": "Emergency Operations Overview",
  "/admin/operating-theatre": "Operating Theatre Management",
  "/admin/audit": "HIPAA & ABDM Regulatory Audit Trail",
  "/admin/settings": "Hospital System Configuration",
  "/admin/claims": "TPA & Insurance Claims Ledger",
  "/admin/feedback": "Patient Care Feedback & Quality Review",
  "/admin/supply-chain": "Supply Chain Goods Received (GRN)",
  "/admin/transfers": "Inter-Store Inventory Transfers",

  // Doctor Clinical Workspace
  "/doctor/consultation": "Doctor Clinical Workspace & EHR",
  "/doctor/orders": "Diagnostic Orders & Clinical Tasks",
  "/doctor/referrals": "Inter-Department Specialist Referrals",
  "/doctor/critical-results": "Critical Laboratory Results Inbox",
  "/doctor/follow-ups": "Patient Follow-Up Care Schedule",
  "/doctor/specialists": "Hospital Specialist Directory",
  "/doctor/mobile": "Doctor Mobile Clinical Pocket",

  // Nursing Station
  "/nurse/patients": "Nursing Station Inpatient Ward List",
  "/nurse/monitoring": "Inpatient Continuous Monitoring",
  "/nurse/vitals": "Patient Vital Signs Monitor",
  "/nurse/notes": "Nursing Clinical Documentation & SOAP",
  "/nurse/tasks": "Nursing Shift Worklist & Care Tasks",
  "/nurse/medications": "Medication Administration Record (MAR)",
  "/nurse/intake-output": "Fluid Balance Intake & Output Tracker",
  "/nurse/doctor-orders": "Doctor Orders Verification Queue",
  "/nurse/transfers": "Patient Bed & Ward Transfers",
  "/nurse/admission-discharge": "Patient Bedside Discharge Coordination",
  "/nurse/shift": "My Nursing Shift & Patient Assignment",
  "/nurse/handover": "Nursing Shift Handover SBAR Report",

  // Reception & Front Desk
  "/reception/waiting-room": "Front Desk Waiting Room Queue",
  "/reception/opd-calendar": "OPD Doctor Schedule Calendar",
  "/reception/online-bookings": "Online Appointment Booking Requests",
  "/reception/queue": "Front Desk Check-In & Triage Queue",
  "/reception/discharge": "Discharge Clearance Coordination",
  "/reception/emergency": "Emergency Care Desk & Fast-Track Intake",
  "/reception/reminders": "Automated SMS Appointment Reminders",
  "/reception/handover": "Front Desk Shift Handover Ledger",
  "/reception/reports": "Front Desk Registration Analytics",
  "/reception/refunds": "Billing Adjustments & Refund Approvals",

  // Pharmacy & Inventory
  "/pharmacy/queue": "Pharmacy Prescription Dispensing Queue",
  "/pharmacy/dispense": "Prescription Dispense & Barcode Verification",
  "/pharmacy/history": "Prescription Dispensing History & Audit",
  "/pharmacy/verification": "Pharmacist Drug Interaction Verification",
  "/pharmacy/inventory": "Medicine Inventory & Formulations",
  "/pharmacy/stock": "Stock Management & Reorders",
  "/pharmacy/batches": "Batch Numbers & Expiry Tracking",
  "/pharmacy/expiry": "Expiry Date Auditing & Quarantine",
  "/pharmacy/alerts": "Low Stock Automated Reorder Alerts",
  "/pharmacy/suppliers": "Pharmaceutical Vendors & Suppliers",
  "/pharmacy/purchase-orders": "Purchase Orders & Procurement",
  "/pharmacy/returns": "Medicine Returns & Damage Quarantine",
  "/pharmacy/patients": "Patient Prescription Medication History",
  "/pharmacy/billing": "Pharmacy Direct Invoicing & Receipts",
  "/pharmacy/analytics": "Pharmacy Sales & Stock Analytics",
  "/pharmacy/staff": "Pharmacy Duty Shifts & Pharmacist Roster",

  // Diagnostic Services (Pathology & Radiology)
  "/diagnostic/requests": "Diagnostic Test Orders & Requisitions",
  "/diagnostic/samples": "Phlebotomy & Sample Barcode Collection",
  "/diagnostic/workbench": "Laboratory Technician Workspace",
  "/diagnostic/auto-verify": "Auto-Verification Delta Check Rules",
  "/diagnostic/radiology": "Radiology Imaging Worklist",
  "/diagnostic/radiology-workbench": "Radiology DICOM Reporting Workbench",
  "/diagnostic/review": "Pathologist & Specialist Report Verification",
  "/diagnostic/reports": "Diagnostic Reports Center",
  "/diagnostic/critical": "Critical Value Red Flag Alerts",
  "/diagnostic/catalog": "Diagnostic Test Master Catalog & Tariffs",
  "/diagnostic/equipment": "Diagnostic Analyzer Equipment Maintenance",
  "/diagnostic/inventory": "Laboratory Reagents & Consumables",
  "/diagnostic/billing": "Diagnostic Invoicing & Cashier Receipts",
  "/diagnostic/audit": "Laboratory NABL Audit Trail",
  "/diagnostic/print-center": "Diagnostic Report Print & Dispatch Center",

  // Emergency & Trauma Care
  "/emergency/dashboard": "Emergency & Trauma Operations Command",
  "/emergency/queue": "Emergency Triage Queue",
  "/emergency/register": "Emergency Fast-Track Registration",
  "/emergency/beds": "Emergency Resuscitation & Observation Beds",
  "/emergency/reports": "Emergency Department Census & Metrics",

  // Patient Self-Service Portal
  "/patient/dashboard": "Patient Care Hub",
  "/patient/login": "Patient Login & OTP Verification",
  "/patient/register": "New Patient Registration",
  "/patient/forgot-password": "Reset Patient Access Password",
  "/patient/appointments": "My Scheduled Consultations",
  "/patient/book": "Book Specialist Doctor Visit",
  "/patient/doctors": "Find Specialist Physicians",
  "/patient/prescriptions": "My Digital Prescriptions (Rx)",
  "/patient/medicines": "My Current Medications & Refills",
  "/patient/lab-reports": "My Diagnostic & Pathology Reports",
  "/patient/vitals": "My Health Metrics & Vital Signs",
  "/patient/medical-records": "My Electronic Health Records",
  "/patient/timeline": "My Lifelong Clinical Timeline",
  "/patient/consultations": "My Consultation Summaries",
  "/patient/referrals": "My Specialist Referrals",
  "/patient/follow-ups": "My Follow-Up Appointments",
  "/patient/admissions": "My Hospital Admission History",
  "/patient/documents": "My Clinical Documents & Uploads",
  "/patient/billing": "My Invoices & Payment Receipts",
  "/patient/payments": "Payment History & Receipts",
  "/patient/profile": "Patient Profile & ABHA Identity",
  "/patient/notifications": "Patient Clinical Notifications",
  "/patient/help-support": "Patient Helpdesk & Emergency Contacts",
  "/patient/feedback": "Rate Your Hospital Care Experience",
  "/patient/telemedicine": "Telemedicine Virtual Consultations",
};

/**
 * Automatically updates document.title whenever the browser URL changes.
 */
export function usePageTitle(customTitle) {
  const location = useLocation();

  useEffect(() => {
    let title = customTitle;

    if (!title) {
      const pathname = location.pathname;
      if (ROUTE_TITLES[pathname]) {
        title = ROUTE_TITLES[pathname];
      } else {
        // Handle dynamic patterns like /diagnostic/reports/new/:id or /pharmacy/dispense/:id
        for (const [pattern, patternTitle] of Object.entries(ROUTE_TITLES)) {
          if (pattern !== "/" && pathname.startsWith(pattern)) {
            title = patternTitle;
            break;
          }
        }
      }
    }

    const brand = "Nivora Care Hospital";
    document.title = title ? `${title} | ${brand}` : `${brand} — Enterprise Healthcare Management System`;
  }, [location.pathname, customTitle]);
}

export default usePageTitle;
