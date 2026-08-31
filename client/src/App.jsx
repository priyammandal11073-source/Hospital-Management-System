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
import Reports from "./pages/Reports.jsx";
import BookAppointment from "./pages/patient/BookAppointment.jsx";
import MyAppointments from "./pages/patient/MyAppointments.jsx";
import MyBillings from "./pages/patient/MyBillings.jsx";
import PatientDashboard from "./pages/patient/PatientDashboard.jsx";
import PatientLogin from "./pages/patient/PatientLogin.jsx";
import PatientRegister from "./pages/patient/PatientRegister.jsx";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/patient/login" element={<PatientLogin />} />
      <Route path="/patient/register" element={<PatientRegister />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Patient branch — separate from staff, uses PatientAuthContext */}
      <Route element={<PatientProtectedRoute />}>
        <Route element={<PatientLayout />}>
          <Route path="/patient/dashboard" element={<PatientDashboard />} />
          <Route path="/patient/appointments" element={<MyAppointments />} />
          <Route path="/patient/appointments/book" element={<BookAppointment />} />
          <Route path="/patient/billings" element={<MyBillings />} />
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
          <Route path="/reports" element={<Reports />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
