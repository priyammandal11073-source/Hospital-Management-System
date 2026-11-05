/**
 * Nivora Care HMS — Central Component Library Barrel
 *
 * Organized by architectural domains:
 * - /ui        → Base primitives (Button, Card, Input, Modal, DataTable, etc.)
 * - /layout    → Structural shells (BaseLayout, DashboardLayout, Header, Footer)
 * - /billing   → Financial workflows (UniversalPaymentModal, Invoices, Payment Boxes)
 * - /beds      → Inpatient ward management (Allocate, Transfer, Discharge, Create)
 * - /clinical  → Clinical workflows (Vitals, Prescriptions, Nursing Checklist)
 * - /forms     → Standardized entity forms (Patient, Doctor, Appointment, Prescription)
 * - /auth      → Session and access guards (ProtectedRoute, AuthBrandPanel)
 * - /common    → Cross-cutting utilities (ErrorBoundary, PrintModal)
 * - /mobile    → Phone navigation, drawer sheets, and touch icons
 */

export * from "./ui/index.js";
export * from "./layout/index.js";
export * from "./billing/index.js";
export * from "./beds/index.js";
export * from "./clinical/index.js";
export * from "./forms/index.js";
export * from "./auth/index.js";

