/**
 * Nivora Care HMS — API Facade / Aggregator
 *
 * All domain-specific API calls have been refactored into modular services:
 * - authApi.js        → Staff & patient authentication
 * - patientApi.js     → Patient CRUD & patient portal
 * - doctorApi.js      → Doctors & clinical workspace
 * - appointmentApi.js → Appointments scheduling
 * - billingApi.js     → Invoices, payments, Razorpay, revenue
 * - prescriptionApi.js→ Prescriptions & e-prescriptions
 * - bedApi.js         → Beds & ward occupancy
 * - vitalsApi.js      → Patient vitals & alerts
 * - labReportApi.js   → Clinical lab reports
 * - notificationApi.js→ Notifications & alerts
 * - nurseApi.js       → Nursing station & handovers
 * - adminApi.js       → Hospital admin, telemetry, staff, settings
 * - receptionApi.js   → Front desk & queue management
 * - pharmacyApi.js    → Pharmacy inventory, dispensing & suppliers
 * - diagnosticApi.js  → Pathology, radiology, films & reports
 * - emergencyApi.js   → ER triage, encounters & emergency queue
 *
 * This file re-exports all endpoints for complete backward compatibility.
 */

export { default } from "./httpClient.js";
export { default as api } from "./httpClient.js";

export * from "./authApi.js";
export * from "./patientApi.js";
export * from "./doctorApi.js";
export * from "./appointmentApi.js";
export * from "./billingApi.js";
export * from "./prescriptionApi.js";
export * from "./bedApi.js";
export * from "./vitalsApi.js";
export * from "./labReportApi.js";
export * from "./notificationApi.js";
export * from "./nurseApi.js";
export * from "./adminApi.js";
export * from "./receptionApi.js";
export * from "./pharmacyApi.js";
export * from "./diagnosticApi.js";
export * from "./emergencyApi.js";
