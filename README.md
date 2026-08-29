# Hospital Management System

A full-stack web application for managing hospital operations — built as a solo college project. Covers the complete patient journey: registration, doctor appointments, billing, and admin reporting. All sensitive routes are protected with JWT authentication and role-based access control (admin / doctor / receptionist).

---

## 📖 Overview

This system enables receptionists to register patients and book appointments, doctors to view their schedules and update appointment statuses, and administrators to manage staff, generate revenue reports, and track financial performance. The frontend is responsive and themed with a cohesive design system (primary indigo, teal accents, status-based badges). The backend enforces permissions independently — frontend UI visibility is UX-only, never a security boundary.

---

## ✨ Features

- **Authentication**: Register & login with bcrypt-hashed passwords, JWT tokens (7-day expiry, contains user id + role), role-based access
- **Patient Management**: Full CRUD — create, read, update, delete patients with search by name/email and pagination
- **Doctor Management**: CRUD for doctors with specialization/department filtering; admin-only create/update/delete
- **Appointment Scheduling**: Book appointments with double‑booking prevention (application-level check + compound MongoDB index as backup); status tracking (pending / confirmed / completed / cancelled); inline status updates via PATCH
- **Billing**: Itemized charges with auto-calculated totals via Mongoose pre‑save hook; payment status (pending / paid / partially_paid); revenue summary via MongoDB aggregation (`$group`, `$sum`)
- **Reports & Dashboard**: Admin‑only dashboard with summary cards, recharts bar chart (appointments by status), and busiest‑doctors table; consistent visual design across all pages

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19 + Vite + TailwindCSS |
| **Backend** | Node.js + Express.js |
| **Database** | MongoDB with Mongoose |
| **Auth** | JWT + bcrypt |
| **Charts** | recharts (Reports page) |
| **Other** | Axios, react-router-dom, dotenv, nodemon, date-fns |

---

## 📁 Project Structure

```
hospital-management-system/
├── client/                     # React + Vite frontend
│   ├── src/
│   │   ├── components/         # UI building blocks (Button, Card, Badge, Input, Modal, Navbar, DashboardLayout)
│   │   ├── pages/              # All 7 screens: Login, Dashboard, Patients, Doctors, Appointments, Billing, Reports
│   │   ├── services/api.js     # Axios instance with auto-attached auth token
│   │   ├── context/AuthContext.jsx  # Auth state + token management
│   │   └── App.jsx             # Router + route registration
│   ├── tailwind.config.js      # Design system: palette, typography, spacing, status colors
│   ├── vite.config.js          # Vite dev server; proxies /api → http://localhost:5000
│   └── index.html
├── server/
│   ├── models/                 # Mongoose schemas with pre-save hooks (User, Patient, Doctor, Appointment, Billing)
│   ├── controllers/            # Route logic (auth, patient, doctor, appointment, billing)
│   ├── routes/                 # API route definitions (auth, patient, doctor, appointment, billing)
│   ├── middleware/             # protect (JWT verify), restrictTo (role check)
│   ├── config/db.js            # MongoDB connection
│   ├── server.js               # Express app, CORS, body‑parser, health check
│   └── .env.example
└── README.md                   # This file
```

---

## 🚀 Setup Instructions

### Prerequisites

- **Node.js** >= 18 (LTS)
- **MongoDB** — either local (`mongodb://127.0.0.1:27017/hospital-db`) or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster connection string
- **npm** or **yarn** (v8+)

### 1. Clone the repository

```bash
git clone https://github.com/priyammandal11073-source/Hospital-Management-System.git
cd Hospital-Management-System
```

### 2. Install dependencies (client + server separately)

```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

### 3. Set up environment variables

Create `.env` files in both `server/` and `client/` (see `.env.example` files below).

**server/.env:**
```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/hospital-db
JWT_SECRET=super-secret-key-change-this-in-production
```

**client/.env:**
```
VITE_API_BASE_URL=http://localhost:5000
```

### 4. Run the backend

```bash
cd server
npm run dev   # or: npm start
```

The API will be available at `http://localhost:5000`. Verify with: `GET /api/health` → `{ message: "Hospital Management API is running" }`

### 5. Run the frontend

```bash
cd client
npm run dev   # Vite dev server; proxy forwards /api to http://localhost:5000
```

Open `http://localhost:5173` in your browser. Log in with registered credentials or visit `/login`.

---

## 👥 User Roles

| Role | Capabilities |
|------|-------------|
| **Admin** | Full access: manage users, patients, doctors, appointments, billing, and reports. Can create/update/delete any record. |
| **Doctor** | View own appointments and associated patient details; update appointment status (pending → confirmed → completed). All CRUD operations are restricted to admin only — doctors can only read. |
| **Receptionist** | Register patients, book appointments, view patient lists, process billing, mark payments as paid. Cannot create doctors or manage other staff. |

**Permission enforcement**: Backend middleware (`protect` + `restrictTo`) is the actual security boundary. Frontend UI visibility (hiding buttons/links) is treated as UX only — the API independently validates permissions on every request.

---

## 🔌 API Overview

| Module | Method | Route | Description |
|--------|--------|-------|-------------|
| **Auth** | POST | `/api/auth/register` | Register new user; bcrypt hashes password via pre-save hook |
| | POST | `/api/auth/login` | Login; returns JWT token (7-day expiry, payload: `{ id, role }`) |
| **Patients** | GET | `/api/patients` | List patients with optional search (`name`/`email`) and pagination |
| | POST | `/api/patients` | Create new patient |
| | GET | `/api/patients/:id` | Get patient by ID (populated fields) |
| | PUT | `/api/patients/:id` | Update patient |
| | DELETE | `/api/patients/:id` | Delete patient |
| **Doctors** | GET | `/api/doctors` | List doctors; filter by specialization or department |
| | POST | `/api/doctors` | Create doctor (admin only) |
| | GET | `/api/doctors/:id` | Get doctor by ID |
| | PUT | `/api/doctors/:id` | Update doctor (admin only) |
| | DELETE | `/api/doctors/:id` | Delete doctor (admin only) |
| **Appointments** | GET | `/api/appointments` | List appointments with filters: status / doctor / date |
| | POST | `/api/appointments` | Book appointment; double‑booking prevented (409 conflict) |
| | PATCH | `/api/appointments/:id/status` | Update status (admin/doctor) |
| | GET | `/api/appointments/:id` | Get appointment with populated patient + doctor |
| **Billing** | GET | `/api/billing` | List bills; search by patient name or payment status |
| | POST | `/api/billing` | Create new bill (itemized charges, auto-calculated total) |
| | GET | `/api/billing/revenue-summary` | Admin-only: total paid vs pending (MongoDB `$group` + `$sum`) |

---

## 💡 Key Design Decisions

| Decision | Why |
|----------|-----|
| **Double‑booking prevention** | Before creating an appointment, the backend queries existing appointments for the same doctor + date + timeSlot (excluding cancelled). If a conflict exists, a `409` is returned. A compound MongoDB index on `{doctor: 1, appointmentDate: 1, timeSlot: 1}` serves as a database‑level backup constraint. |
| **Auto‑calculated billing totals** | The Billing model uses a Mongoose pre‑save hook that sums `itemizedCharges` into `totalAmount` — no manual calculation needed when adding/removing charge items. |
| **Role enforcement at both layers** | Backend middleware (`protect` + `restrictTo`) is the real security boundary. Frontend role checks (hiding buttons, conditional rendering) are UX-only; the API independently validates permissions on every request, so disabling a button in the UI doesn’t bypass server-side security. |
| **Design system in Tailwind config** | All colors, fonts, spacing, and status-brand colors are defined once in `tailwind.config.js` and reused across components — no hardcoded hex values scattered across pages. |

---

## 🛠 Future Improvements

- Email notifications for appointment confirmations and payment receipts (using SendGrid/Nodemailer)
- Patient self‑service portal (view own records, cancel/reschedule appointments, view invoices)
- Prescription management module attached to appointments
- Deployment to production (Vercel/Netlify front end, Railway/Render back end, custom domain)
- Advanced reporting: CSV/Excel export, date‑range filters, per‑doctor revenue breakdown
- SMS reminders for upcoming appointments (using Twilio)

---

## 👨‍💻 Author

**Priya Mandal** — College sophomore project. Built as a full-stack web application using React, Node.js, Express, and MongoDB. Demonstrates end‑to‑end development: database schema design, API development, authentication, role-based access, responsive frontend, and themed UI.

---

## 📜 License

This project is for educational purposes as a college assignment. No commercial license is claimed.