# Hospital Management System

A full-stack web application for managing hospital operations — including patient records, doctor schedules, appointments, billing, and admin reports. Built as a solo college project to demonstrate end-to-end full-stack development skills.

This system enables receptionists to register patients and book appointments, doctors to view their schedules and update statuses, and administrators to manage staff, generate revenue reports, and track financial performance. All sensitive routes are protected with JWT authentication and role-based access control.

---

## Features

- **Authentication**: Register & login with bcrypt-hashed passwords, JWT tokens (7-day expiry), role-based access (admin / doctor / receptionist)
- **Patient Management**: Full CRUD — create, read, update, delete patients with search and pagination
- **Doctor Management**: CRUD for doctors with specialization/department filtering; admin-only create/update/delete
- **Appointment Scheduling**: Book appointments with double‑booking prevention (application-level check + compound DB index); status tracking (pending / confirmed / completed / cancelled); inline status updates
- **Billing**: Itemized charges with auto-calculated totals via pre‑save hook; payment status tracking (pending / paid / partially_paid); revenue summary via MongoDB aggregation
- **Reports & Dashboard**: Admin‑only dashboard with summary cards, revenue charts (recharts), and busiest‑doctors table; visual design consistent across all pages
- **OPD Auto‑Billing**: When an appointment is booked, a billing record with a default ₹500 fee is automatically generated.
- **Payment Methods**: Cash, UPI, Card, and Insurance options are now supported throughout the UI (appointment booking, billing, and payment).
- **Public Payment Page**: `/pay/:billingId` provides a secure, unauthenticated payment flow via a link sent by SMS.
- **SMS Payment Links**: Receptionists can send payment‑link SMS directly from the billing screen using a free email‑to‑SMS gateway.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React.js + Vite + TailwindCSS |
| **Backend** | Node.js + Express.js |
| **Database** | MongoDB with Mongoose |
| **Auth** | JWT + bcrypt |
| **Charts** | recharts (Reports page) |
| **Other** | Axios, react-router-dom, dotenv, nodemon |

---

## Project Structure

```
hospital-management-system/
├── client/                 (React + Vite frontend)
│   ├── src/
│   │   ├── components/     (Button, Card, Badge, Input, Modal, Navbar, DashboardLayout)
│   │   ├── pages/          (Login, Dashboard, Patients, Doctors, Appointments, Billing, Reports)
│   │   ├── services/api.js (Axios instance with auto-attached auth token)
│   │   ├── context/AuthContext.jsx
│   │   └── App.jsx
│   ├── tailwind.config.js  (design system: color palette, typography, spacing)
│   ├── vite.config.js      (Vite dev server with /api proxy to Express)
│   └── index.html
├── server/
│   ├── models/             (User, Patient, Doctor, Appointment, Billing — Mongoose schemas with pre-save hooks)
│   ├── controllers/        (authController, patientController, doctorController, appointmentController, billingController)
│   ├── routes/             (authRoutes, patientRoutes, doctorRoutes, appointmentRoutes, billingRoutes)
│   ├── middleware/         (authMiddleware — protect, restrictTo)
│   ├── config/db.js        (MongoDB connection)
│   ├── server.js           (Express app, health check, CORS, body‑parser)
│   └── .env.example
└── README.md               (this file)
```

---

## Setup Instructions

### Prerequisites

- **Node.js** >= 18 (LTS)
- **MongoDB** — either local MongoDB running on `mongodb://127.0.0.1:27017` or a MongoDB Atlas cluster connection string
- **npm** or **yarn** (v8+ recommended)

### 1. Clone the repo

```bash
git clone https://github.com/priyammandal11073-source/Hospital-Management-System.git
cd Hospital-Management-System
```

### 2. Install dependencies

You can install all dependencies from the root directory:

```bash
npm install
npm run install:all
```

Or individually:

```bash
# Root
npm install

# Backend
cd server && npm install

# Frontend
cd ../client && npm install
```

### 3. Set up environment variables

Ensure `.env` exists in both `server/` and `client/` (see `.env.example` files):

**server/.env:**
```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/hospital-db
JWT_SECRET=super-secret-key-change-this-in-production
```

> **Note on MongoDB**: If you do not have a local MongoDB service running, you can create a free MongoDB Atlas cluster and set `MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/hospital-db`.

**client/.env:**
```
VITE_API_BASE_URL=http://localhost:5000
```

### 4. Seed sample test accounts (Optional)

Once MongoDB is running or connected via Atlas, run the seed script to populate sample accounts, appointments, and doctors:

```bash
npm run seed
```

**Seed Credentials:**
- **Admin**: `admin@hospital.com` / `admin123`
- **Doctor**: `doctor@hospital.com` / `doctor123`
- **Receptionist**: `receptionist@hospital.com` / `receptionist123`
- **Patient**: `john@example.com` / `patient123`

### 5. Run the application

To run both backend and frontend concurrently from the root directory:

```bash
npm run dev
```

Or run them individually:

```bash
# Backend (http://localhost:5000)
npm run server

# Frontend (http://localhost:5173)
npm run client
```

Open `http://localhost:5173` in your browser.

---

## User Roles

| Role | Capabilities |
|------|-------------|
| **Admin** | Full access: manage users, patients, doctors, appointments, billing, and reports. Can create/update/delete any record. |
| **Doctor** | View own appointments and patient details; update appointment status (pending → confirmed → completed); view own profile. All CRUD operations are restricted to admin only — doctors can only read. |
| **Receptionist** | Register patients, book appointments, view patient lists, process billing, mark payments as paid, and **exclusive management of Ward & Bed allocations** (create beds, admit patients, ward transfers, patient discharge & room tariff invoicing, bed maintenance). Cannot create doctors or manage staff. |

All role-based permissions are enforced independently at the **backend** (middleware `protect` + `restrictTo`). Frontend UI visibility (hiding buttons/links) is treated as UX only — the API always checks permissions.

---

## API Overview

| Module | Method | Route | Description |
|--------|--------|-------|-------------|
| **Auth** | POST | `/api/auth/register` | Register new user with bcrypt password hashing |
| | POST | `/api/auth/login` | Login; returns JWT token (7-day expiry, contains user id + role) |
| **Patients** | GET | `/api/patients` | List patients with optional search & pagination |
| | POST | `/api/patients` | Create new patient |
| | GET | `/api/patients/:id` | Get patient by ID |
| | PUT | `/api/patients/:id` | Update patient |
| | DELETE | `/api/patients/:id` | Delete patient |
| **Doctors** | GET | `/api/doctors` | List doctors with optional specialization/department filter |
| | POST | `/api/doctors` | Create doctor (admin only) |
| | GET | `/api/doctors/:id` | Get doctor by ID |
| | PUT | `/api/doctors/:id` | Update doctor (admin only) |
| | DELETE | `/api/doctors/:id` | Delete doctor (admin only) |
| **Appointments** | GET | `/api/appointments` | List appointments with status/doctor/date filters |
| | POST | `/api/appointments` | Book appointment (double‑booking prevented) |
| | PATCH | `/api/appointments/:id/status` | Update appointment status (admin/doctor) |
| | GET | `/api/appointments/:id` | Get appointment with populated patient/doctor |
| **Billing** | GET | `/api/billing` | List bills with optional search |
| | POST | `/api/billing` | Create new bill |
| | GET | `/api/billing/revenue-summary` | Admin-only: total paid vs pending (MongoDB $group + $sum) |

---

## Key Design Decisions

- **Double‑booking prevention**: Before creating an appointment, the backend queries existing appointments for the same doctor + date + timeSlot (excluding cancelled). If a conflict exists, a `409` is returned. A compound MongoDB index on `{doctor: 1, appointmentDate: 1, timeSlot: 1}` serves as a backup constraint at the database level.
- **Auto‑calculated billing totals**: The Billing model uses a pre‑save hook that sums `itemizedCharges` into `totalAmount` automatically — no manual calculation needed when adding/removing charge items.
- **Role enforcement at both layers**: Backend middleware (`protect` + `restrictTo`) is the actual security boundary. Frontend role checks (hiding buttons, conditional rendering) are UX-only; the API independently validates permissions on every request, so disabling a button in the UI doesn't bypass server-side security.

---

## Future Improvements

- Email notifications for appointment confirmations and payment receipts
- Patient self‑service portal (view own records, cancel/reschedule appointments)
- Prescription management module attached to appointments
- Deployment to production (Vercel/Netlify front end, Railway/Render back end, custom domain)
- Advanced filtering and export features for reports (CSV/Excel download)
- SMS reminders for upcoming appointments

---

## Author

**Priyam Mandal** — College sophomore project. Built as a full-stack web application using React, Node.js, Express, and MongoDB.

---

## Detailed Documentation

The following sections provide exhaustive information about the Hospital Management System, covering the newly added payment infrastructure, SMS link generation, and UI components.

### Payment Infrastructure
- **OPD Auto‑Billing**: When an appointment is created, a billing record is automatically generated with a default fee defined by the `OPD_FEE` environment variable (₹500 by default). This logic resides in `server/controllers/appointmentController.js` where a `Billing.create` call is made after successfully saving an appointment.
- **Supported Payment Methods**: Cash, UPI, Card, and Insurance. The payment method is stored in the `Billing` model (`paymentMethod` field) and can be updated via the `PATCH /api/billing/:id` endpoint.
- **Public Payment Page**: Implemented in `client/src/pages/PaymentPage.jsx` and served by the backend route `GET /pay/:billingId`. This page is accessible without authentication and allows patients to settle their bills using any supported method.
- **SMS Payment Links**: Receptionists can trigger an SMS containing a direct payment link from the billing view. The endpoint `POST /api/billing/:id/send-sms` in `billingController.js` uses `services/smsService.js`, which leverages Nodemailer to send an email to the carrier’s email‑to‑SMS gateway (e.g., `1234567890@sms.vodafone.in`).

### UI Components Overview
- **`PaymentMethodSelect.jsx`**: A reusable card‑style selector that displays icons for each payment option. Integrated into `AppointmentForm.jsx`, `BookAppointment.jsx`, and `Billing.jsx`.
- **`UpiPaymentBox.jsx`**: Renders a QR code using `react-qr-code` for UPI transactions and handles the submission of the transaction ID.
- **`PaymentPage.jsx`**: Public page that fetches billing details via `GET /api/billing/:id` and renders the payment options without requiring a logged‑in session.
- **`Billing.jsx` Enhancements**:
  - Added **Send SMS Link** button which opens a modal to input a phone number.
  - Updated **Mark as Paid** modal to allow selecting the payment method via `PaymentMethodSelect`.
- **`MyBillings.jsx`**: Unpaid invoices now show a **Pay Now** button linking to the public payment page (`/pay/:billingId`).

### Environment Variables Explained
| Variable | Purpose |
|----------|---------|
| `OPD_FEE` | Base fee for automatically generated OPD billing records.
| `CLIENT_URL` | Base URL of the frontend used to construct payment links sent via SMS.
| `SMTP_USER` / `SMTP_PASS` | Credentials for Nodemailer to send emails (used for email‑to‑SMS). |
| `SMS_GATEWAY_DOMAIN` | Domain of the carrier’s SMS gateway (e.g., `sms.vodafone.in`). |
| `PORT` | Port on which the Express server runs.
| `MONGO_URI` | MongoDB connection string.
| `JWT_SECRET` | Secret key for signing JWT tokens.

### Deployment Considerations
- **CORS**: The backend is configured to allow requests from `http://localhost:5173` (development) and should be updated to the production domain in `server/config/corsOptions.js`.
- **Static Assets**: In production, `client/dist` is served by Express (`server.js`), and the API routes are prefixed with `/api`.
- **HTTPS**: For secure payment handling, deploy behind an HTTPS reverse proxy (e.g., Nginx) and ensure JWT cookies are set with `secure` and `httpOnly` flags.

### Testing Strategy
- **Unit Tests**: Backend route handlers can be tested with Jest and Supertest. Example: test that `POST /api/appointments` creates both an appointment and a billing record.
- **Integration Tests**: Use Cypress to simulate a user booking an appointment, receiving the SMS link (mocked), and completing payment via the public page.
- **Manual QA**: Verify that:
  1. Booking an appointment auto‑creates a billing entry.
  2. Payment method selection updates the billing record correctly.
  3. SMS link contains a valid URL (`${CLIENT_URL}/pay/${billingId}`).
  4. The public payment page processes payments without authentication.

---

## License

MIT License – see `LICENSE` file for details.

---
