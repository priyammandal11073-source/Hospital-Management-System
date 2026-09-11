# Hospital-Management-System
A full-stack Hospital Management System developed as a solo college project using **React.js, Node.js, Express.js, and MongoDB**. The system is designed to manage common hospital operations such as patient records, doctors/staff, appointments, and billing through a centralized web application.

## Current slice: Patient registry
This first learning feature lets staff register a patient and search the registry by name, phone, or department.

Patient data is saved in `server/data/patients.json` so the app runs without installing MongoDB. The store is a small module, so swapping it for Mongoose later is a natural next step.

### Run locally
```bash
npm install
npm run install:all
npm run dev
```

Then open http://localhost:5174. The API lives at http://localhost:5001 (5000 is left free if another hospital API is already running).
