# 🏛️ Nivora Care HMS — Codebase Architecture & Structure Guide

This document serves as the definitive reference guide for developers, architects, and AI pair programmers working on the Nivora Care Hospital Management System (HMS).

---

## 1. Directory Tree & Architectural Responsibilities

The codebase follows a strictly decoupled, domain-driven structure dividing the client single-page application from the backend Node.js API server.

```
Hospital-Management-System/
├── client/                     # React 19 + Vite 7 Frontend SPA
│   ├── public/                 # Static public assets, logos, and favicons
│   ├── src/
│   │   ├── assets/             # Bundled SVG/PNG image assets
│   │   ├── components/         # Modular UI Component Library
│   │   │   ├── auth/           # Route guards & auth panels (ProtectedRoute, AuthBrandPanel)
│   │   │   ├── beds/           # Bed allocation, transfer, and discharge modals
│   │   │   ├── billing/        # Invoices, universal payment modal, UPI/Card/Razorpay boxes
│   │   │   ├── clinical/       # Clinical workflow modals (Vitals, Prescriptions, Orders)
│   │   │   ├── common/         # Cross-cutting UI (ErrorBoundary, PrintModal)
│   │   │   ├── dashboard/      # Role-specific KPI charts & telemetry cards
│   │   │   ├── diagnostic/     # Radiology workbench, lab equipment, report tools
│   │   │   ├── doctor/         # Doctor patient charts, consultation modals
│   │   │   ├── forms/          # Entity forms (PatientForm, DoctorForm, AppointmentForm)
│   │   │   ├── layout/         # BaseLayout, DashboardLayout, Header, Footer
│   │   │   ├── mobile/         # MobileBottomNav, MobileMenuSheet, touch navigation icons
│   │   │   ├── nurse/          # Inpatient care, vitals trackers, clinical handover
│   │   │   ├── ui/             # Reusable design primitives (Button, Card, DataTable, Modal)
│   │   │   └── index.js        # Central component library barrel
│   │   ├── config/             # Client environment & navigation configuration
│   │   │   ├── env.js          # Unified environment resolver (Web & Capacitor Android)
│   │   │   └── navigationConfig.jsx # 8-portal RBAC navigation configuration
│   │   ├── context/            # React State Contexts
│   │   │   ├── AuthContext.jsx         # Staff authentication & active session state
│   │   │   ├── PatientAuthContext.jsx  # Patient self-service portal auth state
│   │   │   ├── NotificationContext.jsx # Real-time alerts & unread notification sync
│   │   │   └── PrintModalContext.jsx   # Clinical printing & PDF generation modal
│   │   ├── hooks/              # Custom React Hooks (Business Logic Extraction)
│   │   │   ├── useAppointments.js      # Scheduling, status changes & doctor filters
│   │   │   ├── useBeds.js              # Ward occupancy, bed transfers & admissions
│   │   │   ├── useBilling.js           # Invoice generation, payment gateways & totals
│   │   │   ├── useDebounce.js          # Input debouncing for live data tables & search
│   │   │   ├── useMediaQuery.js        # Responsive breakpoint detection (isMobile, etc.)
│   │   │   ├── useNotifications.js     # Real-time notifications & browser push alerts
│   │   │   ├── usePatients.js          # Patient directory, registration & mutations
│   │   │   ├── useVitals.js            # Vital signs telemetry & STAT critical alerts
│   │   │   └── index.js                # Central hooks barrel
│   │   ├── pages/              # Portal Views & Screens (8 Distinct Roles)
│   │   │   ├── admin/          # Hospital administration, executive KPIs, staff audit
│   │   │   ├── diagnostic/     # Pathology labs, radiology PACS, auto-verification
│   │   │   ├── doctor/         # Consultation workspace, orders, telemedicine
│   │   │   ├── emergency/      # ER triage, STAT admissions, trauma encounters
│   │   │   ├── nurse/          # Inpatient nursing station, vitals, MAR, shift handover
│   │   │   ├── patient/        # Patient self-service, booking, records, invoices
│   │   │   ├── pharmacy/       # Inventory, batch tracker, dispensing, supplier POs
│   │   │   └── reception/      # Front desk work queue, walk-in registration, OPD
│   │   ├── services/           # Scalable API Services (Single-Responsibility Domain Clients)
│   │   │   ├── httpClient.js   # Base Axios client with JWT isolation & sanitization
│   │   │   ├── api.js          # Central API Facade re-exporting all modular endpoints
│   │   │   ├── authApi.js      # Authentication & session verification
│   │   │   ├── billingApi.js   # Invoices, settlements, refunds, and financial summaries
│   │   │   ├── patientApi.js   # Patient demographics & EMR access
│   │   │   ├── doctorApi.js    # Doctor clinical consultations & appointments
│   │   │   ├── pharmacyApi.js  # Drug catalog, inventory, and dispensing
│   │   │   ├── diagnosticApi.js# Lab orders, test catalog, and specimen collection
│   │   │   └── ...             # Bed, Vitals, Nurse, Reception, Emergency APIs
│   │   ├── utils/              # Pure Utility Functions
│   │   │   ├── errorHandler.js # Standardized Axios & network error message extraction
│   │   │   ├── toast.js        # Non-blocking clinical toast notification store
│   │   │   ├── doctorName.js   # Medical title normalization & cleaning
│   │   │   └── printUtils.js   # ABHA QR & thermal prescription print formatters
│   │   ├── App.jsx             # Top-level routing hierarchy & providers
│   │   ├── main.jsx            # Application bootstrap with ErrorBoundary & React 19 root
│   │   └── index.css           # Tailwind base styles, safe-area insets & craft tokens
│   ├── index.html              # HTML shell with viewport-fit=cover & dual theme-color
│   └── package.json
│
├── server/                     # Express.js 5 + Node.js 18+ Backend REST API
│   ├── config/                 # Environment validation & DB connection pooling
│   │   ├── db.js               # MongoDB connection mutex lock & auto-reconnect
│   │   └── env.js              # Strict schema-validated process.env configuration
│   ├── controllers/            # Request Handlers & Business Logic (20 Controllers)
│   ├── middleware/             # Express Middlewares
│   │   ├── authMiddleware.js   # JWT authentication & RBAC portal authorization
│   │   ├── errorMiddleware.js  # Global centralized exception handling & 404s
│   │   └── rateLimiters.js     # IP rate limiting & brute-force defense
│   ├── models/                 # Mongoose 8 Document Schemas (43 Domain Models)
│   ├── routes/                 # Express REST Endpoints (20 Modular Routers)
│   ├── services/               # Background Services (PDF generation, OTP, Email)
│   ├── utils/                  # Server-side helpers & asyncHandler
│   ├── app.js                  # Express app factory with middleware pipeline
│   ├── server.js               # Entrypoint: DB connection & HTTP listener
│   └── package.json
└── docs/                       # Architectural & Technical Documentation
```

---

## 2. Separation of Concerns: The 4-Tier Client Architecture

To prevent components from becoming bloated monoliths, all client features must adhere to the 4-tier layer pattern:

```
┌────────────────────────────────────────────────────────┐
│                   1. UI PRESENTATION                   │
│   Pages & Pure Components (JSX only, no direct fetch)  │
└───────────────────────────┬────────────────────────────┘
                            │ Calls
                            ▼
┌────────────────────────────────────────────────────────┐
│                   2. BUSINESS LOGIC                    │
│   Custom Hooks (`usePatients`, `useBilling`, etc.)     │
│   Manages React state, memoization, debounce & toasts  │
└───────────────────────────┬────────────────────────────┘
                            │ Invokes
                            ▼
┌────────────────────────────────────────────────────────┐
│                   3. SERVICE CLIENT                    │
│   Modular API Endpoints (`patientApi.js`, etc.)        │
│   Stateless HTTP calls returning typed payload data    │
└───────────────────────────┬────────────────────────────┘
                            │ Sends via
                            ▼
┌────────────────────────────────────────────────────────┐
│                   4. HTTP TRANSPORT                    │
│   `httpClient.js` (Axios Interceptors & Auth Tokens)   │
└────────────────────────────────────────────────────────┘
```

---

## 3. Consistent Naming Conventions

| Entity | Pattern | Examples |
|---|---|---|
| **React Components** | `PascalCase.jsx` | `UniversalPaymentModal.jsx`, `BaseLayout.jsx`, `DataTable.jsx` |
| **Custom Hooks** | `camelCase.js` (`use*`) | `usePatients.js`, `useBilling.js`, `useDebounce.js` |
| **Service APIs** | `camelCase.js` (`*Api.js`)| `patientApi.js`, `billingApi.js`, `doctorApi.js` |
| **Utilities** | `camelCase.js` | `errorHandler.js`, `doctorName.js`, `toast.js` |
| **Server Models** | `PascalCase.js` | `Patient.js`, `Billing.js`, `Doctor.js`, `Bed.js` |
| **Server Controllers** | `camelCase.js` (`*Controller.js`)| `billingController.js`, `patientController.js` |
| **Server Routes** | `camelCase.js` (`*Routes.js`)| `billingRoutes.js`, `patientRoutes.js` |
| **API Endpoints** | Lowercase kebab-case | `/api/patient-portal/invoices`, `/api/billing/settle` |

---

## 4. Error Handling Contract

1. **Client-Side**:
   - Every user-triggered operation should catch errors and use `getErrorMessage(err)` from `src/utils/errorHandler.js` to extract human-friendly messages before displaying via `toast.error(msg)`.
   - Never let an unhandled render exception crash the window into a white screen; the top-level `ErrorBoundary.jsx` intercepts UI runtime errors and offers a one-click page reload and component stack trace.

2. **Server-Side**:
   - Every async controller function is wrapped in `asyncHandler(...)` from `server/utils/asyncHandler.js`.
   - Unhandled exceptions are automatically forwarded to `errorHandler` in `server/middleware/errorMiddleware.js`.
   - Production responses NEVER leak internal stack traces to clients, returning structured JSON:
     ```json
     {
       "success": false,
       "message": "User-friendly description of the failure"
     }
     ```

---

## 5. State Management Blueprint

1. **Global Auth State**: Managed by `AuthContext.jsx` (staff) and `PatientAuthContext.jsx` (patients).
2. **Notification & Alert State**: Managed by `NotificationContext.jsx`, providing real-time sync between headers, mobile sheets, and widgets.
3. **Toast Notifications**: Managed by `src/utils/toast.js` and rendered via `src/components/ui/Toaster.jsx`.
4. **Domain State**: Extracted into modular custom hooks (`usePatients`, `useAppointments`, `useBilling`, `useBeds`, `useVitals`) which manage their own local caching, loading indicators, and mutation triggers.

---

## 6. How to Add a New Feature in 6 Steps

1. **Database Schema**: Define the Mongoose model in `server/models/NewFeature.js` with indexes and validation.
2. **Backend Controller**: Create business logic in `server/controllers/newFeatureController.js` wrapped with `asyncHandler`.
3. **Backend Routes**: Wire HTTP methods in `server/routes/newFeatureRoutes.js` with `protect` and `authorizeRoles` middlewares, and mount in `server/app.js`.
4. **Client API Service**: Add endpoint functions in `client/src/services/newFeatureApi.js` and export in `client/src/services/api.js`.
5. **Business Logic Hook**: Create `client/src/hooks/useNewFeature.js` to manage fetching, state, errors, and mutations.
6. **UI Component / Page**: Build the UI page in `client/src/pages/<domain>/` consuming the custom hook and reusable primitives from `src/components/ui/`.

