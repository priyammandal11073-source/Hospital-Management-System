<a id="top"></a>

<div align="center">

**NHMS · ENTERPRISE HOSPITAL OPERATING SYSTEM**

# 🏥 Nivora Care Hospital

### Next-Generation Unified Enterprise Hospital Management System (HMS)

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-5.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas%20%2F%20Mongoose-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![React](https://img.shields.io/badge/React-19.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.x-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](#author-license)

<br/>

> A mission-critical, end-to-end full-stack healthcare operating system that connects **7 specialized portals** — Administration, Doctors, Nursing, Reception, Pharmacy, Diagnostic Services (Pathology &amp; Radiology), and Patient Self-Service — into one event-driven, role-isolated platform.

<br/>

<img src="./docs/screenshots/LOGIN_gateway_updated.png" alt="Nivora Care Hospital Unified Healthcare Gateway" width="920" style="border-radius: 10px; box-shadow: 0 8px 30px rgba(0,0,0,0.18);"/>

<p><em>Unified Healthcare Gateway — a single responsive entry point providing role-isolated access to every clinical and administrative department.</em></p>

</div>

---

## Table of Contents

| | Section | Description |
|---|---|---|
| 📚 | [Project Documentation](#project-documentation) | Core architectural specifications, PRD, design system, AI rules & tracking |
| 🏥 | [Overview](#overview) | System objectives, the architectural problem solved, and key value drivers |
| ⚡ | [System Highlights](#system-highlights) | At-a-glance capability matrix across all 8 hospital departments |
| 🏢 | [Hospital Portals](#hospital-portals) | In-depth feature, workflow and screen breakdown per portal |
| 🔄 | [Cross-Portal Workflows](#cross-portal-workflows) | Event-driven data synchronization across clinical & financial departments |
| 🔁 | [Real-World Workflows](#real-world-workflows) | Step-by-step lifecycles for Pathology, Radiology CT and Medication MAR |
| 🏗️ | [Architecture](#architecture) | Full-stack architecture — React 19 + Express + MongoDB Atlas |
| 🗄️ | [Database Schema & Indexing](#database-schema) | High-performance compound & partial index configurations |
| 📁 | [Medical File Storage](#medical-file-storage) | Dynamic PDF reports, thermal film generator & static asset CDN |
| 🔒 | [Security & Access Control](#security-access-control) | RBAC middleware, JWT auth, IDOR guards & rejection tests |
| 🖼️ | [Screenshot Gallery](#complete-screenshot-gallery) | Collapsible visual catalog of all 8 portals |
| 🔐 | [Portal Login Pages](#portal-logins) | Dedicated sign-in screens for every staff role plus the patient portal |
| ⚙️ | [Installation & Setup](#installation-setup) | Prerequisites and step-by-step start commands |
| 🔑 | [Environment Variables](#environment-variables) | Complete `.env` guide for client and server |
| 🧪 | [Automated Tests & CI](#automated-tests-ci) | Vitest unit/integration suites plus GitHub Actions checks |
| 🐳 | [Docker & Deployment](#docker-deployment) | Full-stack `docker-compose` setup and Procfile |
| 📱 | [Android Mobile Application (Capacitor)](#android-mobile-app) | Capacitor Android application, Studio setup, testing, signed APK & Google Play AAB |
| 🧪 | [Demo Test Accounts](#demo-test-accounts) | Pre-seeded credentials for instant testing across all roles |
| 🧪 | [Automated System Diagnostics](#verification-diagnostics) | 24-point optimization & security verification suite |
| 📂 | [Project Structure](#project-structure) | Tree map of frontend, backend and documentation |
| 🔮 | [Future Improvements](#future-improvements) | Roadmap — FHIR/HL7, AI screening, telemedicine, IoT |
| 👨‍💻 | [Author & License](#author-license) | Project creator, GitHub profile and MIT license |

---

## <a id="project-documentation"></a>📚 Project Documentation & Vibe-Coding Workflow

Nivora Care includes comprehensive, living architectural specifications and development workflow documents:

| Document | Purpose & Contents |
|---|---|
| [**`PRD.md`**](./PRD.md) | **Product Requirements Document**: User personas, feature capabilities across all 8 portals, non-functional requirements, clinical workflows, and acceptance criteria. |
| [**`ARCHITECTURE.md`**](./ARCHITECTURE.md) | **System Architecture**: High-level component diagrams, N-tier request pipeline, 43 Mongoose domain models, security authorization flows, and build infrastructure. |
| [**`DESIGN.md`**](./DESIGN.md) | **Design System**: Editorial clinical aesthetic, color palette, Fraunces serif typography, touch targets, and reusable UI components (`ConfirmDialog`, `PageHeader`, `DataTable`). |
| [**`RULES.md`**](./RULES.md) | **AI Coding Rules & Workflows**: Guidelines for future AI development sessions, error handling standards, pre-change checklist, and post-change checklist. |
| [**`MEMORY.md`**](./MEMORY.md) | **Project Context & Decisions**: Concise architectural decision records (ADRs), critical file paths, Windows line-ending handling, and active technical context. |
| [**`TRACKER.md`**](./TRACKER.md) | **Development Progress Tracker**: Verified completed milestones, active in-progress tasks, future roadmap, and test verification health metrics. |

---

## <a id="overview"></a>🏥 Overview

Modern clinical operations fail when data remains trapped in departmental silos. **Nivora Care Hospital** solves this fragmentation with a real-time, event-driven architecture — patient admission, clinical diagnosis, nursing care, lab orders, pharmacy dispensing and financial ledgering are tightly synchronized from the moment a patient walks in.

### Core Value Drivers

- **Zero Information Loss** — A doctor's prescription instantaneously populates both the **Pharmacy Dispensing Queue** and the **Patient Prescription Portal**.
- **Integrated Diagnostics &amp; PACS** — Lab test orders flow directly to Phlebotomy and Laboratory workbenches, while Radiology orders render DICOM-grade imaging with film layout engines (**1-Up, 4-Up, 9-Up**).
- **Financial Ledgering** — OPD consultations, nursing bed tariffs, pharmacy medications and diagnostic investigations auto-aggregate into unified patient invoices.
- **Strict Role Isolation** — Server-enforced Role-Based Access Control (RBAC) protects medical record privacy and blocks access across departmental boundaries.

---

## <a id="system-highlights"></a>⚡ System Highlights

| Module | Core Purpose & Operations | Supported Capabilities |
|---|---|---|
| **🧑‍💼 Admin** | Operational Oversight & Governance | Revenue analytics, staff management, department/equipment tracking, audit trail logs, bed capacity metrics. |
| **👨‍⚕️ Doctor** | Clinical Workspace & Consultations | Patient consultation, SOAP note recording, Rx prescription writing, diagnostic ordering, critical result alerts. |
| **👩‍⚕️ Nurse** | Inpatient Monitoring & Nursing Care | Real-time vital sign recording, MAR medication administration, fluid intake/output balance, shift handover notes. |
| **🧾 Receptionist** | Front Desk & Queue Logistics | Patient registration, walk-in tokens, doctor schedule booking, inpatient bed admissions, cashier payment settlement. |
| **💊 Pharmacy** | Inventory & Medication Dispensing | Real-time prescription fulfillment queue, batch/expiry tracking, low-stock reorder triggers, supplier PO management. |
| **🧪 Diagnostics** | Pathology Labs & Radiology DICOM | Phlebotomy sample barcode tracking, laboratory result entry, PACS radiology DICOM viewer, film sheet generator. |
| **👤 Patient** | Patient Self-Service Portal | Online appointment scheduling, digital prescription downloads, lab result portal sync, invoice payments. |

---

## <a id="hospital-portals"></a>🏢 Hospital Portals

### <a id="admin-portal"></a>🧑‍💼 Admin Portal

**Overview** — The **Admin Portal** is the command center for hospital executive leadership, delivering real-time financial tracking, audit logging, facility management and human-resource oversight.

| Feature | Technical Description | Operational Impact |
|---|---|---|
| **Executive Dashboard & KPIs** | Live MongoDB aggregations for occupancy, daily revenue, and active clinical cases. | Instant visibility into hospital throughput and revenue streams. |
| **Staff & Doctor Directory** | Full CRUD controls for personnel, credentials and departmental mapping. | Controls employee directory and system authentication access. |
| **Department & Equipment Tracker** | Equipment maintenance schedules, status flags and asset utilization logs. | Prevents critical biomedical equipment downtime. |
| **Bed & Ward Occupancy** | Real-time matrix of General, ICU, Ventilator and Private ward availability. | Maximizes bed turnover efficiency and emergency triage. |
| **System Audit Trail** | Immutable log of every login, record modification and payment transaction. | Guarantees compliance and NABH security auditing. |

**Screenshots**

<div align="center">

**Admin Executive Dashboard & Financial Analytics**
<img src="./docs/screenshots/ADM_01_admin_dashboard.png" alt="Admin Dashboard" width="850"/>
> *Macro operational analytics, departmental breakdown, bed occupancy statistics and quick navigation actions.*

<br/>

**Hospital Staff & Personnel Directory**
<img src="./docs/screenshots/ADM_page_staff.png" alt="Admin Staff Directory" width="850"/>
> *Clinical staff onboarding, role permissions and active employment status management.*

</div>

<p align="right"><a href="#top">⬆ Back to Top</a></p>

---

### <a id="doctor-portal"></a>👨‍⚕️ Doctor Portal

**Overview** — Built for high-speed clinical environments, the **Doctor Portal** streamlines consultation workspaces, electronic health record (EHR) review, instant prescription writing and diagnostic investigation requests.

| Feature | Technical Description | Operational Impact |
|---|---|---|
| **Appointments Queue** | Filterable queue showing pending, checked-in and completed consultations for the day. | Optimizes OPD throughput and reduces patient wait times. |
| **Consultation Workspace** | Integrated interface with patient medical history, past vitals and current complaints. | Centralizes patient EHR data during face-to-face consultations. |
| **Prescription Builder** | Structured drug form with dosage, frequency, duration and food instructions. | Eliminates handwritten prescription ambiguity and feeds the Pharmacy queue. |
| **Diagnostic Test Orders** | Dual-type orders for Pathology (Blood/Urine) and Radiology (X-Ray/CT/MRI). | Initiates cross-portal diagnostic processing without paperwork. |
| **Critical Result Alerts** | High-priority banner alerts for abnormal panic lab values. | Accelerates urgent clinical interventions for critical patients. |

**Screenshots**

<div align="center">

**Doctor Clinical Dashboard & Today's Schedule**
<img src="./docs/screenshots/DOC_01_doctor_dashboard.png" alt="Doctor Dashboard" width="850"/>
> *Daily appointment queues, quick patient lookups and recent clinical activities.*

<br/>

**Consultation & Electronic Health Record Workspace**
<img src="./docs/screenshots/DOC_03_consultation_workspace.png" alt="Doctor Consultation Workspace" width="850"/>
> *Inspect vitals history, record diagnostic findings and generate prescriptions in one screen.*

</div>

<p align="right"><a href="#top">⬆ Back to Top</a></p>

---

### <a id="nurse-portal"></a>👩‍⚕️ Nurse Portal

**Overview** — The **Nurse Portal** equips bedside teams with real-time patient monitoring, vital signs entry, medication administration records (MAR), intake/output tracking and structured shift handovers.

| Feature | Technical Description | Operational Impact |
|---|---|---|
| **Nursing Station Dashboard** | Overview of admitted ward patients, pending vitals and active nursing alerts. | Keeps shift nurses synchronized on inpatient care tasks. |
| **Vital Signs Recorder** | Input for BP, Heart Rate, SpO2, Temperature, Respiratory Rate and Pain Scale. | Tracks trend graphs and alerts doctors to clinical deterioration. |
| **Medication Administration (MAR)** | Timed medication schedule auto-populated from doctor prescriptions. | Prevents missed or duplicate drug doses for ward inpatients. |
| **Intake & Output Balance** | Fluid balance calculator logging oral/IV intake vs. urine/drainage output. | Essential for nephrology, ICU and post-surgical recovery. |
| **Shift Handover Log** | Structured notes transferring care responsibility between shifts. | Ensures continuous, error-free patient handovers. |

**Screenshots**

<div align="center">

**Nursing Station Dashboard & Inpatient Care Overview**
<img src="./docs/screenshots/NUR_01_nurse_dashboard.png" alt="Nurse Dashboard" width="850"/>
> *Assigned ward beds, pending nursing tasks and current patient vital statuses.*

<br/>

**Bedside Vital Signs Recorder**
<img src="./docs/screenshots/NUR_02_vitals_page.png" alt="Nurse Vitals Page" width="850"/>
> *Vital sign recording, body metric calculation and abnormal reading detection.*

</div>

<p align="right"><a href="#top">⬆ Back to Top</a></p>

---

### <a id="receptionist-portal"></a>🧾 Receptionist Portal

**Overview** — The **Receptionist Portal** manages patient entry, OPD registration, waiting-room token queues, doctor schedule booking, inpatient bed allocation and multi-channel billing settlement.

| Feature | Technical Description | Operational Impact |
|---|---|---|
| **Patient Registration** | Comprehensive demographic capture with unique MRN generation. | Establishes the master patient index across all departments. |
| **OPD Token & Queue Manager** | Real-time token generator assigning patients to doctor waiting rooms. | Reduces waiting-hall congestion through structured token numbering. |
| **Ward & Bed Allocations** | Matrix for admitting patients, room transfers and discharges. | Manages physical bed assets and room tariff calculations. |
| **Cashier & Billing Desk** | Invoice settlement via Cash, UPI QR, Card, Insurance TPA and NetBanking. | Ensures immediate collection and transparent patient receipts. |
| **SMS Payment Link Dispenser** | SMS gateway dispatch of remote payment links to patient phones. | Enables contactless payments for families or remote settlement. |

**Screenshots**

<div align="center">

**Front Desk Reception Dashboard & Operations**
<img src="./docs/screenshots/REC_01_reception_dashboard.png" alt="Reception Dashboard" width="850"/>
> *Daily registrations, OPD token statuses and cashier desk metrics.*

<br/>

**Waiting Room OPD Token Management**
<img src="./docs/screenshots/REC_03_waiting_room_tokens.png" alt="Reception OPD Waiting Tokens" width="850"/>
> *Active consultations, waiting patients and doctor availability in real time.*

</div>

<p align="right"><a href="#top">⬆ Back to Top</a></p>

---

### <a id="pharmacy-portal"></a>💊 Pharmacy Portal

**Overview** — The **Pharmacy Portal** controls medication inventory, batch tracking, prescription fulfillment queues, supplier purchase orders and automated stock reordering.

| Feature | Technical Description | Operational Impact |
|---|---|---|
| **Prescription Fulfillment Queue** | Real-time queue auto-populated when a doctor signs a digital prescription. | Enables instant dispensing without paper prescriptions. |
| **Batch & Expiry Management** | FEFO (First-Expired, First-Out) tracking by batch number and expiry date. | Prevents expiry-related stock loss and protects patient safety. |
| **Inventory Stock Control** | Itemized drug database with stock levels, reorder thresholds and category tags. | Automates low-stock alerts and purchase requests. |
| **Supplier & Purchase Orders** | PO creation, stock receipt logging and vendor management. | Streamlines procurement and vendor billing. |
| **Direct Dispense Billing** | Automatic drug quantity calculation synced with the Cashier. | Feeds pharmacy sales directly into the master financial ledger. |

**Screenshots**

<div align="center">

**Pharmacy Inventory & Fulfillment Dashboard**
<img src="./docs/screenshots/PHA_01_pharmacy_dashboard.png" alt="Pharmacy Dashboard" width="850"/>
> *Pending prescription count, low-stock warnings and daily sales metrics.*

<br/>

**Prescription Dispensing Queue**
<img src="./docs/screenshots/PHA_03_dispensing_queue.png" alt="Pharmacy Dispensing Queue" width="850"/>
> *Fulfilling incoming prescriptions, allocating drug batches and completing orders.*

</div>

<p align="right"><a href="#top">⬆ Back to Top</a></p>

---

### <a id="diagnostic-services-portal"></a>🧪 Diagnostic Services Portal

**Overview** — A dual-subsystem platform combining **Pathology / Laboratory Medicine** with **Radiology / Medical Imaging (PACS)**, governing the complete diagnostic life cycle from doctor order to final report distribution.

```
🧪 DIAGNOSTIC SERVICES PORTAL
            │
   ┌────────┴────────┐
   ▼                 ▼
🧪 PATHOLOGY                     📷 RADIOLOGY / IMAGING
• Phlebotomy Sample Collection   • Worklist Queue (X-Ray/CT/MRI/USG)
• Barcode Tracking & Rack Maps   • PACS DICOM Imaging Viewer
• Lab Workbench (Hemo/Biochem)   • Findings & Impression Entry
• Pathologist Review & Approval  • Laser Film Sheet Generator (1/4/9-Up)
• PDF Pathology Reports          • Formal Radiology Report Printing
```

| Diagnostic Domain | Sub-Module | Key Operational Capabilities |
|---|---|---|
| **Phlebotomy & Sample Lab** | **Sample Collection** | Barcode generation, container tracking (EDTA, Serum, Fluoride), timestamping and rack placement. |
| | **Lab Workbench** | Numerical result entry for Hematology, Biochemistry and Microbiology with automatic high/low panic flags. |
| | **Pathologist Review** | Senior-pathologist workflow that verifies abnormal readings before report authorization. |
| **Radiology & PACS Imaging** | **Imaging Worklist** | Modality filtering across X-Ray, CT, MRI, Ultrasound and Mammography. |
| | **DICOM Visualizer** | Web-based medical imaging viewer with zoom, pan, contrast and measurement overlays. |
| | **Radiology Reporting** | Structured editor for Clinical Indications, Imaging Findings and Diagnostic Impressions. |
| | **Film Sheet Generator** | Print engine rendering DICOM series into **1-Up, 4-Up, 9-Up** laser film layouts. |
| **Administrative & Safety** | **Critical Panic Alerts** | Instant dispatch of critical lab/radiology results to attending doctors. |
| | **Diagnostic Inventory** | Reagent and film stock tracking with automated per-test consumption. |
| | **Print Center & Audit** | Centralized logging of every printout, reprint request and PDF download. |

**Screenshots**

<div align="center">

**Diagnostic Services Master Gateway**
<img src="./docs/screenshots/DIAG_01_gateway_1280px.png" alt="Diagnostic Gateway" width="850"/>
> *Entry point for diagnostic staff selecting specialized sub-roles (Phlebotomist, Lab Tech, Radiologist, Pathologist).*

<br/>

**PACS Radiology Imaging & DICOM Viewer**
<img src="./docs/screenshots/EV_DIAG_PRINT_007_radiology_study_xray_viewer.png" alt="Radiology Viewer" width="850"/>
> *Chest X-ray viewing with zoom controls, measurement overlays and a diagnostic report panel.*

<br/>

**Laser Radiology Film Sheet Generator (4-Up Layout)**
<img src="./docs/screenshots/EV_DIAG_PRINT_012_ct_film_4up.png" alt="Radiology 4-Up Film Generator" width="850"/>
> *4-Up CT slice layout rendered for thermal laser film printing.*

</div>

<p align="right"><a href="#top">⬆ Back to Top</a></p>

---

### <a id="patient-portal"></a>👤 Patient Portal

**Overview** — The **Patient Portal** puts patients in control of their healthcare journey with self-service appointment booking, prescription access, diagnostic report downloads and invoice payments.

| Feature | Description |
|---|---|
| **Patient Dashboard** | Personal health summary: upcoming appointments, active prescriptions and recent lab tests. |
| **Book Appointment** | Self-service booking with doctor specialization selection and real-time slot availability. |
| **Digital Prescriptions** | All active and past prescriptions with dosage details and downloadable PDFs. |
| **Diagnostic Reports** | Instant access to finalized Pathology reports and Radiology studies once approved. |
| **Invoice & Payments** | Outstanding-bill overview with direct UPI, Card or NetBanking payment. |

**Screenshots**

<div align="center">

**Patient Self-Service Dashboard**
<img src="./docs/screenshots/PAT_01_patient_dashboard.png" alt="Patient Dashboard" width="850"/>
> *Health timeline, upcoming visits, active medications and quick action buttons.*

<br/>

**Patient Self-Service Appointment Booking**
<img src="./docs/screenshots/PAT_03_book_appointment.png" alt="Patient Booking" width="850"/>
> *Select departments, doctors and available time slots.*

</div>

<p align="right"><a href="#top">⬆ Back to Top</a></p>

---

## <a id="cross-portal-workflows"></a>🔄 Cross-Portal Workflows & Integration

Data recorded in one portal instantly propagates to every relevant department — no manual re-entry.

```mermaid
flowchart LR
    A[🧾 Receptionist<br/>Registers Patient] --> B[📅 Booking<br/>Assigns OPD Doctor]
    B --> C[👨‍⚕️ Doctor<br/>Conducts Consultation]
    C --> D[💊 Writes Prescription]
    C --> E[🧪 Orders Diagnostic Test]
    D --> F[💊 Pharmacy<br/>Fulfills & Dispenses]
    E --> G[🧪 Diagnostics<br/>Samples & Scans]
    G --> H[👨‍⚕️ Pathologist/Radiologist<br/>Approves Report]
    H --> I[👤 Patient & Doctor<br/>Receives Final Report]
    F --> J[🧾 Cashier / Billing<br/>Consolidates Ledger]
    H --> J
    J --> K[📊 Admin Analytics<br/>Updates Financial KPI]
```

---

## <a id="real-world-workflows"></a>🔁 Real-World Workflow Examples

### Workflow 1 — Pathology Investigation Cycle
```
1. 👨‍⚕️ Doctor orders "Complete Blood Count (CBC)" during consultation.
   │
   ▼
2. 🧾 System auto-generates Diagnostic Order & creates a pending billing entry.
   │
   ▼
3. 🧪 Phlebotomist views the order in Sample Collection -> Collects blood -> Scans EDTA Barcode.
   │
   ▼
4. 🧪 Lab Technician runs the sample -> Enters Hemoglobin, WBC, Platelet values in Workbench.
   │
   ▼
5. 👨‍⚕️ Senior Pathologist reviews abnormal flags -> Clicks "Approve & Sign Report".
   │
   ▼
6. 📲 Finalized PDF syncs to the Patient Portal + Attending Doctor receives an instant notification.
```

### Workflow 2 — Radiology CT Scan & Laser Film Printing
```
1. 👨‍⚕️ Doctor orders "CT Thorax Contrast" for a trauma patient.
   │
   ▼
2. 🧪 Radiology Worklist receives the order -> Radiographer performs the scan -> Uploads DICOM series.
   │
   ▼
3. 👨‍⚕️ Radiologist opens the PACS Viewer -> Inspects axial slices -> Writes Findings & Impression.
   │
   ▼
4. 🧪 Film Print Center generates a 4-Up Laser Film Sheet -> Sends to the thermal DICOM printer.
   │
   ▼
5. 📄 Formal Radiology Report & Laser Film dispatched to the ward; PDF attached to the patient EHR.
```

### Workflow 3 — Inpatient Medication & MAR Cycle
```
1. 👨‍⚕️ Doctor prescribes IV Antibiotics for an admitted ward patient.
   │
   ▼
2. 💊 Pharmacy receives the order -> Verifies batch expiry -> Dispenses drug to the ward station.
   │
   ▼
3. 👩‍⚕️ Nurse receives the medication -> Opens the MAR Schedule -> Administers the dose -> Logs timestamp.
   │
   ▼
4. 🧾 Billing Ledger auto-adds the drug cost to the patient's daily IPD invoice.
```

---

## <a id="architecture"></a>🏗️ Architecture

A modern decoupled architecture separating presentation, business logic, persistence and static object storage.

```mermaid
flowchart TD
    subgraph Frontend ["Client Layer (React 19 + Vite + TailwindCSS)"]
        UI[Responsive SPA Interface]
        State[React Context & Auth State]
        Routes[React-Router-Dom Lazy Routes]
        UI --> State
        State --> Routes
    end

    subgraph Backend ["Server Layer (Node.js + Express REST API)"]
        Auth[JWT & Bcrypt Auth Middleware]
        Controllers[Controller Logic Layer]
        Services[DiagnosticSync & PDF Services]

        Routes --> Auth
        Auth --> Controllers
        Controllers --> Services
    end

    subgraph Database ["Persistence Layer"]
        Mongo[(MongoDB Atlas Database)]
        Indexes[Compound & Partial Indexes]
        Mongo --- Indexes
        Controllers --> Mongo
    end

    subgraph Storage ["Medical File & PACS Storage"]
        DiskStorage[Local Object Storage / Disk]
        PDFGen[PDF Auto-Report Engine]
        Services --> DiskStorage
        Services --> PDFGen
    end
```

---

## <a id="database-schema"></a>🗄️ Database Schema & Indexing

The backend uses **Mongoose** over **MongoDB Atlas**. All core collections use compound and partial indexes to eliminate collection scans (`COLLSCAN`) under heavy concurrent load.

```javascript
// Appointment — compound double-booking prevention index
AppointmentSchema.index(
  { doctorId: 1, appointmentDate: 1, timeSlot: 1 },
  { unique: true, partialFilterExpression: { status: { $ne: "cancelled" } } }
);

// Billing — patient invoice lookup index
BillingSchema.index({ patientId: 1, createdAt: -1 });

// Notification — unread-alert index
NotificationSchema.index({ userId: 1, isRead: 1 });

// Patient — fast MRN & name search indexes
PatientSchema.index({ mrn: 1 }, { unique: true });
PatientSchema.index({ lastName: 1, firstName: 1 });
```

---

## <a id="medical-file-storage"></a>📁 Medical File & Laser Film Storage

Diagnostic scans, PDF reports and radiology film prints are managed by a dedicated storage service (`server/services/storageService.js` and `pdfReportService.js`).

- **File Path Routing** — Scans are stored under `server/storage/medical_files/` and exposed via secure static endpoints (`/medical_scans/`).
- **PDF Report Generation** — Clinical reports are compiled into official hospital PDFs with header, QR verification code, pathologist signature and reference ranges.
- **DICOM & Film Sheet Engine** — Multi-slice grid export (**1-Up, 4-Up, 9-Up**) formatted for laser film printing.

---

## <a id="security-access-control"></a>🔒 Security & Access Control

Multi-layered security enforced across both backend APIs and frontend UI routes:

1. **JWT Authentication** — 7-day signed tokens carrying user identity and explicit role payloads.
2. **Bcrypt Password Hashing** — Passwords salted and hashed with 10 salt rounds before persistence.
3. **IDOR Guarding** — API endpoints (e.g., `diagnosticController.js`) enforce ownership checks so patients can only access their own records.
4. **Server-Side RBAC Middleware**:
   ```javascript
   // Backend role guard example
   router.post('/doctors', protect, restrictTo('admin'), createDoctor);
   ```
5. **Security Isolation Verification**:

<div align="center">

**Role-Based Access Control Barrier (Unauthorized Access Blocked)**
<img src="./docs/screenshots/SEC_01_patient_admin_rejected.png" alt="Security RBAC Rejection" width="800"/>
> *Server-side rejection (403 Forbidden) when a lower-privileged role attempts admin access.*

</div>

---

## <a id="complete-screenshot-gallery"></a>🖼️ Complete Screenshot Gallery

<details>
<summary><b>🔍 Click to Expand Complete Screenshot Gallery (All 7 Portals)</b></summary>

<br/>

### 1. Unified Gateway & Authentication
| Gateway Desktop (1280px) | Sub-Role Selector Gateway |
|---|---|
| <img src="./docs/screenshots/DIAG_01_gateway_1280px.png" width="400"/> | <img src="./docs/screenshots/DIAG_01_subrole_selector.png" width="400"/> |

### 2. Admin Portal Screenshots
| Dashboard Overview | Patient Directory | Ward Bed Occupancy |
|---|---|---|
| <img src="./docs/screenshots/ADM_01_admin_dashboard.png" width="270"/> | <img src="./docs/screenshots/ADM_03_patients_directory.png" width="270"/> | <img src="./docs/screenshots/ADM_page_beds.png" width="270"/> |

### 3. Doctor Portal Screenshots
| Doctor Dashboard | Consultation Workspace | Lab Order Request |
|---|---|---|
| <img src="./docs/screenshots/DOC_01_doctor_dashboard.png" width="270"/> | <img src="./docs/screenshots/DOC_03_consultation_workspace.png" width="270"/> | <img src="./docs/screenshots/DOC_05_lab_orders_page.png" width="270"/> |

### 4. Nurse Portal Screenshots
| Nursing Station | Bedside Vitals Recorder | Nursing Task List |
|---|---|---|
| <img src="./docs/screenshots/NUR_01_nurse_dashboard.png" width="270"/> | <img src="./docs/screenshots/NUR_02_vitals_page.png" width="270"/> | <img src="./docs/screenshots/NUR_03_nursing_tasks.png" width="270"/> |

### 5. Receptionist Portal Screenshots
| Reception Dashboard | Waiting Room Tokens | Cashier & Billing Desk |
|---|---|---|
| <img src="./docs/screenshots/REC_01_reception_dashboard.png" width="270"/> | <img src="./docs/screenshots/REC_03_waiting_room_tokens.png" width="270"/> | <img src="./docs/screenshots/REC_04_cashier_billing.png" width="270"/> |

### 6. Pharmacy Portal Screenshots
| Pharmacy Overview | Dispensing Queue | Medicine Inventory |
|---|---|---|
| <img src="./docs/screenshots/PHA_01_pharmacy_dashboard.png" width="270"/> | <img src="./docs/screenshots/PHA_03_dispensing_queue.png" width="270"/> | <img src="./docs/screenshots/PHA_02_inventory_page.png" width="270"/> |

### 7. Diagnostic Services Screenshots
| PACS DICOM Viewer | 4-Up Radiology Film Sheet | Formal Report Generator |
|---|---|---|
| <img src="./docs/screenshots/EV_DIAG_PRINT_007_radiology_study_xray_viewer.png" width="270"/> | <img src="./docs/screenshots/EV_DIAG_PRINT_012_ct_film_4up.png" width="270"/> | <img src="./docs/screenshots/EV_DIAG_PRINT_002_pathology_report_page.png" width="270"/> |

### 8. Patient Portal Screenshots
| Patient Dashboard | My Appointments | My Billing Invoices |
|---|---|---|
| <img src="./docs/screenshots/PAT_01_patient_dashboard.png" width="270"/> | <img src="./docs/screenshots/PAT_02_my_appointments.png" width="270"/> | <img src="./docs/screenshots/PAT_05_my_billings.png" width="270"/> |

</details>

---

## <a id="portal-logins"></a>🔐 Portal Login Pages

Every staff role signs in through the unified gateway; each view pre-configures the matching credentials and, for Diagnostics, the specialization pills. Patients use their own dedicated rose-themed sign-in.

| Admin | Doctor | Nursing |
|---|---|---|
| <img src="./docs/screenshots/LOGIN_admin.png" width="400"/> | <img src="./docs/screenshots/LOGIN_doctor.png" width="400"/> | <img src="./docs/screenshots/LOGIN_nurse.png" width="400"/> |

| Reception | Pharmacy | Diagnostics |
|---|---|---|
| <img src="./docs/screenshots/LOGIN_reception.png" width="400"/> | <img src="./docs/screenshots/LOGIN_pharmacy.png" width="400"/> | <img src="./docs/screenshots/LOGIN_diagnostics.png" width="400"/> |

| Patient |
|---|
| <img src="./docs/screenshots/LOGIN_patient.png" width="400"/> |

---

## <a id="installation-setup"></a>⚙️ Installation & Setup

### Prerequisites

- **Node.js** — v18.0.0 or higher
- **MongoDB** — local instance at `mongodb://127.0.0.1:27017`, or a MongoDB Atlas cluster URI
- **npm** — v8.0.0 or higher

### Step 1 — Clone the Repository
```bash
git clone https://github.com/priyammandal11073-source/Hospital-Management-System.git
cd Hospital-Management-System
```

### Step 2 — Install Dependencies
```bash
# Root + client + server dependencies
npm run install:all
```

<details>
<summary><b>Manual install (equivalent steps)</b></summary>

```bash
npm install
cd server && npm install
cd ../client && npm install
cd ..
```

</details>

### Step 3 — Configure Environment Variables
Create `.env` files in both `server/` and `client/` using the [Environment Variables](#environment-variables) guide.

### Step 4 — Seed the Database (Optional but Recommended)
Populates test accounts, doctors, patients, wards, inventory and the diagnostic test catalog:
```bash
npm run seed
```

### Step 5 — Start the Application
```bash
npm run dev
```

- **Frontend App:** http://localhost:5173
- **Backend API:** http://localhost:5000

---

## <a id="environment-variables"></a>🔑 Environment Variables

Both packages ship a documented example file you copy into place:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

### Server Configuration (`server/.env`)
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/hospital-db
JWT_SECRET=your-secure-jwt-secret-key-min-32-chars
NODE_ENV=development
CLIENT_URL=http://localhost:5173
OPD_FEE=300
OTP_TTL_MS=300000
SMS_GATEWAY_DOMAIN=
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=Hospital Management <no-reply@example.com>
SMTP_SECURE=false
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
```

| Variable | Purpose | Default |
|---|---|---|
| `PORT` | HTTP port for the Express API | `5000` |
| `MONGO_URI` | MongoDB connection string | — |
| `JWT_SECRET` | Signs JSON Web Tokens (use a long random string) | — |
| `NODE_ENV` | `development` / `production` / `test` | `development` |
| `CLIENT_URL` | Frontend origin allowed by CORS | `http://localhost:5173` |
| `OPD_FEE` | Default OPD consultation charge | `300` |
| `OTP_TTL_MS` | Patient OTP lifetime in milliseconds | `300000` |
| `SMS_GATEWAY_DOMAIN` | SMS gateway for OTP texts; empty → OTPs logged to console | empty |
| `SMTP_*` | Nodemailer transport; empty → e-mails logged to console | empty |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Razorpay test keypair | empty |
| `RAZORPAY_WEBHOOK_SECRET` | Verifies `payment.captured` webhooks | empty |

> When integration credentials are unset the server runs in **offline demo mode**: authentication falls back to the seeded demo accounts, payment signatures are optional, and OTPs/e-mails are printed to the server console instead of being delivered.

### Client Configuration (`client/.env`)
```env
VITE_API_BASE_URL=http://localhost:5000
```

---

## <a id="automated-tests-ci"></a>🧪 Automated Tests & CI

Both packages are covered by **Vitest**, and a **GitHub Actions** pipeline runs lint, tests and builds on every push/PR to `main` (`.github/workflows/node-ci.yml`).

### Running tests locally
```bash
# Server — 65 automated tests across 5 Vitest suites (HTTP integration tests,
# auth middleware, role-based protection, OTP service, Zod request validators,
# offline demo fallbacks, and error handling pipeline).
cd server && npm test

# Client — 15 automated tests across 3 Vitest suites (portal-selection,
# doctor title prefix formatting, print service, and credentials-flow).
cd client && npm test
```

### Full Verification Commands
```bash
npm run test:all    # Runs both server (65 tests) and client (15 tests)
npm run lint:all    # ESLint flat checks across server and client
npm run build --prefix client  # Validates React 19 production bundle
```

### Linting
```bash
cd server && npm run lint   # ESLint flat config (Node.js / ESM)
cd client && npm run lint   # ESLint flat config (React + React Hooks)
```

The CI workflow also confirms every server `.js` file parses via `node --check`.

---

## <a id="docker-deployment"></a>🐳 Docker & Deployment

The root `docker-compose.yml` runs the complete stack — **MongoDB**, the **Express API** and the **nginx-served React build**:

```bash
docker compose up --build
```

| Service | Address |
|---|---|
| Web app | http://localhost:8080 (nginx proxies `/api` → `server:5000`) |
| REST API | http://localhost:5000 |
| MongoDB | localhost:27017 |

Persistent volumes keep MongoDB data and generated PDFs (`server/storage/`) across restarts. Optional integrations are passed through the environment before `up`:

```bash
JWT_SECRET=change-me RAZORPAY_KEY_ID=... RAZORPAY_KEY_SECRET=... docker compose up --build
```

For worker-style platforms (Render, Railway, Heroku) the root `Procfile` starts the API as the web process: `web: cd server && npm start`.

---

## <a id="android-mobile-app"></a>📱 Android Mobile Application (Capacitor)

The **Nivora Care Hospital** web application is wrapped into a native Android application using **Capacitor 8.x**.

- **Application ID:** `com.nivora.care`
- **Application Name:** `Nivora Care Hospital`
- **Android Project Directory:** [`client/android/`](./client/android/)
- **Configuration File:** [`client/capacitor.config.ts`](./client/capacitor.config.ts)
- **Target Backend:** Connects directly to production backend at `https://nivora-care-hospital.onrender.com/api` without relying on browser proxy rewrites.
- **Web / Vercel Compatibility:** Browser and Vercel production deployments continue using standard relative `/api` paths seamlessly through environment-based detection.

---

### 1. Prerequisites & Windows Setup

#### Step 1.1 — Install Android Studio
1. Download **Android Studio** (Koala / Ladybug or later) from [developer.android.com/studio](https://developer.android.com/studio).
2. Run the installer (`android-studio-*.exe`) and select:
   - **Android Studio**
   - **Android Virtual Device (AVD)**
3. Complete the initial setup wizard selecting the **Standard** installation.

#### Step 1.2 — Install SDK Components via SDK Manager
1. Open Android Studio → **More Actions** (or **Tools**) → **SDK Manager**.
2. Under the **SDK Platforms** tab, ensure the following is checked:
   - **Android 14.0 ("UpsideDownCake")** or **Android 15 / 16** (API Level 34–36)
3. Under the **SDK Tools** tab, verify and install:
   - **Android SDK Build-Tools** (latest)
   - **Android SDK Command-line Tools (latest)**
   - **Android Emulator**
   - **Android SDK Platform-Tools**
4. Click **Apply** to download and install.

#### Step 1.3 — Configure Windows Environment Variables
Set up `ANDROID_HOME` in Windows System Environment Variables:
1. Press `Win + R`, type `sysdm.cpl`, and press **Enter**.
2. Click the **Advanced** tab → **Environment Variables...**.
3. Under **User variables** (or System variables), click **New...**:
   - **Variable name:** `ANDROID_HOME`
   - **Variable value:** `C:\Users\<YourUsername>\AppData\Local\Android\Sdk`
4. Select the `Path` variable, click **Edit...**, and add two new entries:
   - `%ANDROID_HOME%\platform-tools`
   - `%ANDROID_HOME%\emulator`
5. Click **OK** to save and apply.

---

### 2. Android Build & Sync Scripts

From the repository root or inside `client/`, run:

```powershell
# Option A — From Workspace Root:
npm run android:build      # Builds Vite web app in Android mode & syncs Capacitor assets
npm run android:open       # Launches Android Studio with the client/android project
npm run android:run        # Builds and runs directly on connected device/emulator

# Option B — Inside client/ Directory:
cd client
npm run build:android      # Runs "vite build --mode android && cap sync android"
npm run android:open       # Runs "cap open android"
npm run android:run        # Runs "cap run android"
```

---

### 3. Testing on Emulator or Physical Android Phone

#### Method A — Running on an Android Emulator
1. In Android Studio, click **Tools** → **Device Manager**.
2. Click **Create Device**, choose a device profile (e.g., **Pixel 8** or **Pixel 9**), and click **Next**.
3. Select an Android system image (e.g., API 34+ x86_64), download if prompted, and click **Finish**.
4. In the top toolbar, select your virtual device in the target dropdown.
5. Click the green **Run 'app'** button (`Shift + F10`) or press `Ctrl + R`.

#### Method B — Running on a Physical Android Phone
1. On your Android phone, enable **Developer Options**:
   - Open **Settings** → **About Phone**.
   - Tap **Build Number** 7 times until you see *"You are now a developer!"*.
2. Enable USB Debugging:
   - Open **Settings** → **System** → **Developer Options**.
   - Toggle on **USB Debugging**.
3. Connect your phone to your Windows PC with a high-speed USB data cable.
4. On your phone screen, tap **Allow USB debugging** (check "Always allow from this computer").
5. In Android Studio, your device model will appear in the target device dropdown.
6. Click **Run 'app'** (`Shift + F10`) to deploy and launch the app directly on your phone.

---

### 4. Generating a Signed Release APK (Direct Installation)

To generate an `.apk` file that can be distributed directly to patients or staff phones without Google Play:

1. Open the project in Android Studio (`client/android`).
2. In the top menu, go to **Build** → **Generate Signed Bundle / APK...**.
3. Select **APK** and click **Next**.
4. **Keystore Configuration**:
   - If you already have a key, click **Choose existing...** and locate your `.jks` file.
   - If creating a new key, click **Create new...**:
     - **Key store path:** Choose a secure location outside the repository (e.g., `C:\keystores\nivora-release.jks`).
     - **Password:** Enter a strong password for the keystore.
     - **Alias:** e.g., `nivoracare`.
     - **Password:** Enter key password.
     - **Validity (years):** At least `25`.
     - Fill in Certificate details (First and Last Name, Organization: `Nivora Care Hospital`). Click **OK**.
5. Click **Next**.
6. **Destination & Build Variant**:
   - **Build Variants:** Select `release`.
   - **Signature Versions:** Ensure both **V1 (Jar Signature)** and **V2 (Full APK Signature)** are checked.
7. Click **Create** (or **Finish**).
8. Gradle will assemble the release APK. Once complete, click the notification **locate** link, or find the file at:
   ```
   client/android/app/release/app-release.apk
   ```
9. Transfer `app-release.apk` to any Android phone via USB, Google Drive, or WhatsApp to install.

---

### 5. Generating a Signed .AAB (Google Play Store Upload)

Google Play requires the **Android App Bundle (.aab)** format for all new app releases:

1. In Android Studio, go to **Build** → **Generate Signed Bundle / APK...**.
2. Select **Android App Bundle** and click **Next**.
3. Select your release keystore (`.jks`), enter the passwords and key alias, and click **Next**.
4. Select the **release** destination folder.
5. Check **Export encrypted key for enrolling in Play App Signing** (recommended by Google Play).
6. Click **Create** (or **Finish**).
7. Once the build completes, the signed bundle is ready at:
   ```
   client/android/app/release/app-release.aab
   ```
8. Go to the [Google Play Console](https://play.google.com/console):
   - Navigate to your App → **Production** (or **Internal testing**).
   - Click **Create new release**.
   - Drag and drop `app-release.aab`.
   - Add release notes and click **Save** → **Review release** → **Start rollout**.

---

## <a id="demo-test-accounts"></a>🧪 Demo Test Accounts

These credentials work after running `npm run seed`:

| Role | Email Address | Password | Primary Access Portal |
|---|---|---|---|
| **🧑‍💼 Admin** | `admin@hospital.com` | `admin123` | Master Hospital Command & Management |
| **👨‍⚕️ Doctor** | `doctor@hospital.com` | `doctor123` | Doctor Consultation Workspace |
| **👩‍⚕️ Nurse** | `nurse@hospital.com` | `nurse123` | Nursing Station & Bedside Care |
| **🧾 Receptionist** | `receptionist@hospital.com` | `receptionist123` | Front Desk, Registration & Billing |
| **💊 Pharmacist** | `pharmacist@hospital.com` | `pharmacist123` | Pharmacy Dispensing & Inventory |
| **🧪 Diagnostics Admin** | `diagnostics@hospital.com` | `diagnostic123` | Pathology Labs & Radiology PACS |
| **🧪 Pathologist** | `pathologist@hospital.com` | `pathologist123` | Specialist Report Review & Approval |
| **🧪 Radiologist** | `radiologist@hospital.com` | `radiologist123` | PACS Viewer & Imaging Reports |
| **🧪 Lab Technician** | `labtech@hospital.com` | `labtech123` | Phlebotomy & Lab Workbench |
| **🧪 Radiology Technician** | `radtech@hospital.com` | `radtech123` | Sample Collection & Scan Worklist |
| **👤 Patient** | `john@example.com` | `patient123` | Patient Self-Service Portal |

---

## <a id="verification-diagnostics"></a>🧪 Automated System Diagnostics

An automated verification suite ships at `server/scratch/verify_system_optimization.js`:

```bash
cd server
node scratch/verify_system_optimization.js
```

### Verification Checks

- ✅ **Database Index Verification** — Confirms all compound indexes exist and optimize queries via `IXSCAN`.
- ✅ **Route Bundle Analysis** — Verifies zero dynamic bundle errors across all lazy routes.
- ✅ **RBAC Endpoint Protection** — Tests unauthorized request rejection across all portal roles.
- ✅ **IDOR Security Verification** — Verifies ownership restrictions on diagnostic and patient endpoints.
- ✅ **CSS Cursor Reset Rule** — Validates the global `cursor: default` and text/pointer element overrides.

---

## <a id="project-structure"></a>📂 Project Structure

```
Hospital-Management-System/
├── client/                         # React 19 + Vite Frontend Application
│   ├── public/                     # Static assets & medical DICOM scan samples
│   ├── src/
│   │   ├── components/             # Reusable UI component library
│   │   │   ├── ui/                 # Core design tokens (Button, Badge, Modal, Card, Input)
│   │   │   └── diagnostic/         # PACS Viewer, Film Sheet Modal, Reprint Modal
│   │   ├── pages/                  # Portal Pages
│   │   │   ├── admin/              # Admin analytics, staff, beds, reports
│   │   │   ├── doctor/             # Consultations, EHR, prescriptions, lab orders
│   │   │   ├── nurse/              # Vitals, MAR, nursing tasks, handovers
│   │   │   ├── reception/          # Front desk, tokens, check-in, cashier
│   │   │   ├── pharmacy/           # Dispensing queue, batch inventory, POs
│   │   │   ├── diagnostic/         # Pathology workbench, PACS Radiology, Print Center
│   │   │   └── patient/            # Dashboard, booking, reports, billings
│   │   ├── services/               # Axios API client with auth interceptors
│   │   ├── index.css               # Global Tailwind CSS & cursor styling
│   │   └── App.jsx                 # Lazy-loaded route router with Suspense
│   ├── tailwind.config.js          # Nivora Care design system configuration
│   └── vite.config.js              # Vite bundler config
│
├── server/                         # Node.js + Express REST API Backend
│   ├── config/                     # Database connection & CORS settings
│   ├── controllers/                # Business logic controllers for all 7 portals
│   ├── middleware/                 # JWT Auth & RBAC (protect/restrictTo)
│   ├── models/                     # Mongoose Schemas (User, Patient, Doctor, Appointment, Billing, Diagnostic*)
│   ├── routes/                     # REST API Endpoint Routers
│   ├── services/                   # DiagnosticSync, PDF Generator, Storage Service
│   ├── storage/                    # Object storage for diagnostic scans & PDF reports
│   ├── seed.js                     # Master database seeder script
│   └── server.js                   # Express application entry point
│
├── docs/                           # Documentation resources & screenshots
│   └── screenshots/                # Comprehensive operational screenshot gallery
│
├── PRD.md                          # Product Requirements Document & Portal Matrix
├── ARCHITECTURE.md                 # System Architecture, Schemas & Request Pipeline
├── DESIGN.md                       # Design System, Theme Tokens & Reusable UI Components
├── RULES.md                        # AI Development Rules, Guardrails & Pre/Post Checklists
├── MEMORY.md                       # Architectural Decisions (ADRs), Tech Debt & Context
├── TRACKER.md                      # Development Progress Tracker & Verification Metrics
└── README.md                       # Project Setup, Operations & Portal Catalog
```

---

## <a id="future-improvements"></a>🔮 Future Improvements

- [ ] **HL7 / FHIR Integration** — Standardized clinical data exchange with external healthcare networks.
- [ ] **AI-Assisted Diagnostic Screening** — Machine-learning pre-screening for chest X-ray abnormality detection.
- [ ] **Telemedicine Video Consultations** — WebRTC video calling embedded in Doctor and Patient portals.
- [ ] **Multi-Language Support** — i18n localization for regional medical staff and patients.
- [ ] **IoT Bedside Vitals Sync** — Automatic ingestion of telemetry data from Bluetooth/Wi-Fi patient monitors.

---

## <a id="author-license"></a>👨‍💻 Author & License

### Author

**Priyam Mandal** — Full-Stack Software Engineer & Healthcare Systems Developer  
*GitHub:* [@priyammandal11073-source](https://github.com/priyammandal11073-source)

### 📜 License

This project is licensed under the **MIT License** — see the `LICENSE` file for details. Built for educational, hackathon and healthcare software portfolio demonstrations.

<p align="right"><a href="#top">⬆ Back to Top</a></p>