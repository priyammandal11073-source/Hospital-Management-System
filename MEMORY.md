# 🧠 Nivora Care Hospital Management System — Project Context & Decisions (MEMORY)

> **Document Version**: 2.0.0  
> **Status**: Verified Persistent Context  
> **Purpose**: Factual repository memory, architectural decisions, and critical constraints for future AI sessions.  

---

## 1. Project Overview

**Nivora Care Hospital** is an enterprise-grade full-stack Hospital Operating System connecting **8 specialized portals**:
- Executive Administration
- Clinical Consultations (Doctor Workspace)
- Inpatient Nursing (Ward Monitoring & eMAR)
- Reception & Front Desk Logistics
- Pharmacy & Inventory
- Diagnostic Services (Pathology Lab & Radiology PACS)
- Emergency Department
- Patient Self-Service Portal

The project is structured as an npm multi-package monorepo containing a root workspace, `server/` (Express 5 + MongoDB), and `client/` (React 19 + Vite 7 + TailwindCSS 3).

---

## 2. Key Architectural Decisions & Rationale

### ADR-01: Centralized, Immutable Environment Config
- **Decision**: All environment variables are validated at boot in [`server/config/env.js`](file:///c:/Users/priya/OneDrive/Documents/Default%20Project/Hospital-Management-System/server/config/env.js) and frozen via `Object.freeze()`. The duplicate root `.env` was deleted; only `server/.env` is used.
- **Rationale**: Prevents cryptic runtime crashes due to undefined secrets. Any missing mandatory variable (`MONGO_URI`, `JWT_SECRET`) immediately halts startup with a clear troubleshooting guide.

### ADR-02: Domain API Service Extraction with Canonical Barrel Aggregator
- **Decision**: The former monolithic `api.js` (1,377 lines) was decomposed into 13 modular domain service files under `client/src/services/` (`authApi.js`, `patientApi.js`, `doctorApi.js`, `appointmentApi.js`, `billingApi.js`, `prescriptionApi.js`, `bedApi.js`, `vitalsApi.js`, `labReportApi.js`, `nurseApi.js`, `adminApi.js`, `pharmacyApi.js`, `diagnosticApi.js`, `emergencyApi.js`), with a unified Axios instance in `httpClient.js`. [`client/src/services/api.js`](file:///c:/Users/priya/OneDrive/Documents/Default%20Project/Hospital-Management-System/client/src/services/api.js) was retained as a backward-compatible barrel aggregator.
- **Rationale**: Guarantees zero breakage across 89 page components while providing clean, testable domain interfaces for future development.

### ADR-03: Operational Error Handling with `asyncHandler` & `AppError`
- **Decision**: Express routes are wrapped in [`asyncHandler`](file:///c:/Users/priya/OneDrive/Documents/Default%20Project/Hospital-Management-System/server/middleware/asyncHandler.js). Errors are raised using `throw new AppError(message, statusCode)`. [`errorMiddleware.js`](file:///c:/Users/priya/OneDrive/Documents/Default%20Project/Hospital-Management-System/server/middleware/errorMiddleware.js) handles CastError, ValidationError, DuplicateKey (11000), and JWT expiration.
- **Rationale**: Replaces hundreds of repetitive `try/catch` and manual `sendDatabaseError` blocks with standard operational error handling.

### ADR-04: Reusable Accessible UI Primitives
- **Decision**: Created [`ConfirmDialog.jsx`](file:///c:/Users/priya/OneDrive/Documents/Default%20Project/Hospital-Management-System/client/src/components/ui/ConfirmDialog.jsx), [`PageHeader.jsx`](file:///c:/Users/priya/OneDrive/Documents/Default%20Project/Hospital-Management-System/client/src/components/ui/PageHeader.jsx), and [`DataTable.jsx`](file:///c:/Users/priya/OneDrive/Documents/Default%20Project/Hospital-Management-System/client/src/components/ui/DataTable.jsx) under `client/src/components/ui/`. Replaced blocking browser `window.confirm()` calls across all core pages (`Appointments`, `Beds`, `Patients`, `Doctors`, `Prescriptions`).
- **Rationale**: Eliminates browser dialog blocking, elevates accessibility with ARIA attributes, and ensures seamless mobile touch usability.

### ADR-06: Liquid Glass Design System & Apple HIG Mobile/iPad Architecture
- **Decision**: 
  1. Built a cohesive Liquid Glass token system (`liquid-glass-elevated`, `liquid-glass-pill`, `liquid-glass-subtle`, `liquid-glass-nav`, `liquid-glass-sidebar`) using CSS backdrop-filter, subtle borders (`border-white/40`), and rich contrast.
  2. Adopted Apple Human Interface Guidelines and Emil Kowalski design engineering principles across mobile (`< md`), iPad portrait (`768px-1024px`), and desktop:
     - `viewport-fit=cover` in `index.html` with `--sat`, `--sar`, `--sab`, `--sal` safe area variables.
     - Header padding via `env(safe-area-inset-top)` to prevent collision with iPhone Dynamic Island / camera notch.
     - Shell & docked sidebar split moved to `md` (768px) so iPad portrait displays the desktop docked sidebar (`md:w-56 lg:w-64`) instead of mobile hamburger view.
     - Direct-manipulation edge swipe gesture (`touchstart` < 28px) to slide open navigation drawers on touch devices.
     - `<Modal />` responsive bottom sheet on `< md` with Apple HIG drag handle and safe-area padding.
     - Tailored mobile card view fallbacks for high-traffic data tables (`Appointments`, `Patients`, `Doctors`, `MyPatients`, `WaitingRoomPage`).
     - Kept drawer mounted with CSS transitions (`pointer-events-none`) for 60fps interruptible exit animations.
- **Rationale**: Elevates the platform to feel like an installed native application on iPhone and iPad, eliminating horizontal scrolling, unreachable touch targets, and keyboard obstruction on mobile.

---

## 3. Important File & Directory Locations

| Path | Purpose |
|---|---|
| `server/config/env.js` | Centralized, validated backend environment configuration |
| `server/app.js` | Express application factory (routes & middleware registration) |
| `server/server.js` | Server bootstrapper & MongoDB Atlas connection handler |
| `server/models/` | 43 Mongoose domain schemas |
| `server/routes/` | 20 Express route definitions |
| `server/validators/` | Zod validation schemas for request bodies |
| `client/src/config/env.js` | Centralized frontend environment configuration |
| `client/src/services/` | Domain API services + `httpClient.js` + `api.js` barrel |
| `client/src/components/ui/` | Standardized UI component catalog (`Modal`, `ConfirmDialog`, `PageHeader`, `DataTable`, etc.) |
| `client/src/components/mobile/` | Native mobile navigation primitives (`MobileBottomNav`, `MobileMenuSheet`, `MobileNavIcons`) |
| `client/src/pages/` | 89 portal and operational screens |
| `client/src/index.css` | Editorial styling, Liquid Glass tokens, safe-area variables, and animations |

---

## 4. Known Technical Debt & Gotchas

1. **Windows Line Endings (CRLF vs LF)**: When editing JSX or JavaScript files on Windows systems using multiline replacements, CRLF line endings can cause target content mismatches. Normalize to LF (`\n`) if regex/replacement errors occur.
2. **Express Route Ordering**: In routes with dynamic parameters (e.g., `billingRoutes.js`), static routes like `/summary`, `/revenue-summary`, and `/analytics` **must** precede `/:id` to avoid being matched as MongoDB ObjectIds.
3. **Bulky Admin Controllers**: [`adminController.js`](file:///c:/Users/priya/OneDrive/Documents/Default%20Project/Hospital-Management-System/server/controllers/adminController.js) (55 KB) and [`patientPortalController.js`](file:///c:/Users/priya/OneDrive/Documents/Default%20Project/Hospital-Management-System/server/controllers/patientPortalController.js) (66 KB) contain multiple sub-domains and should eventually be broken into dedicated controllers (`staffController`, `equipmentController`, `departmentController`).

---

## 5. Current Verification State

- **Server Test Suite**: 65/65 passing (Vitest 5.0.0)
- **Client Test Suite**: 15/15 passing (Vitest 5.0.0)
- **Client Production Build**: `npm run build` succeeds cleanly in ~10.13s with 0 errors across 179 code-split chunks
- **Zero Regressions**: 100% backward compatibility maintained across all routes and API exports.

