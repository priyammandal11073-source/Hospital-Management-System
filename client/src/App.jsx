import { Navigate, Route, Routes } from "react-router-dom";
import DashboardLayout from "./components/DashboardLayout.jsx";
import PatientLayout from "./components/PatientLayout.jsx";
import PatientProtectedRoute from "./components/PatientProtectedRoute.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Appointments from "./pages/Appointments.jsx";
import Billing from "./pages/Billing.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Doctors from "./pages/Doctors.jsx";
import Login from "./pages/Login.jsx";
import Patients from "./pages/Patients.jsx";
import PaymentPage from "./pages/PaymentPage.jsx";
import Reports from "./pages/Reports.jsx";
import Prescriptions from "./pages/Prescriptions.jsx";
import Beds from "./pages/Beds.jsx";
import BookAppointment from "./pages/patient/BookAppointment.jsx";
import MyAppointments from "./pages/patient/MyAppointments.jsx";
import MyBillings from "./pages/patient/MyBillings.jsx";
import MyPrescriptions from "./pages/patient/MyPrescriptions.jsx";
import PatientDashboard from "./pages/patient/PatientDashboard.jsx";
import PatientLogin from "./pages/patient/PatientLogin.jsx";
import PatientRegister from "./pages/patient/PatientRegister.jsx";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/patient/login" element={<PatientLogin />} />
      <Route path="/patient/register" element={<PatientRegister />} />
      {/* Public payment link — no auth required, accessible via SMS */}
      <Route path="/pay/:billingId" element={<PaymentPage />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Patient branch — separate from staff, uses PatientAuthContext */}
      <Route element={<PatientProtectedRoute />}>
        <Route element={<PatientLayout />}>
          <Route path="/patient/dashboard" element={<PatientDashboard />} />
          <Route path="/patient/appointments" element={<MyAppointments />} />
          <Route path="/patient/appointments/book" element={<BookAppointment />} />
          <Route path="/patient/billings" element={<MyBillings />} />
          <Route path="/patient/prescriptions" element={<MyPrescriptions />} />
        </Route>
      </Route>

      {/* Staff branch — uses AuthContext */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/patients" element={<Patients />} />
          <Route path="/doctors" element={<Doctors />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/prescriptions" element={<Prescriptions />} />
          <Route path="/beds" element={<Beds />} />
          <Route path="/reports" element={<Reports />} />
        </Route>
      </Route>
      {/* Fallback — render 404 instead of blindly redirecting to /dashboard (which then bounces to /login for unauthed users) */}
      <Route
        path="*"
        element={
          <div className="p-8 text-center text-slate-600">
            <p>404 — Page not found.</p>
            <a href="/patient/login" className="mr-3 text-blue-600 hover:underline">
              Patient login
            </a>
            |
            <a href="/login" className="ml-3 text-blue-600 hover:underline">
              Staff login
            </a>
          </div>
        }
      />
    </Routes>
  );
}

export default App;
