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
import LabReports from "./pages/LabReports.jsx";
import MyPatients from "./pages/nurse/MyPatients.jsx";
import PatientMonitoring from "./pages/nurse/PatientMonitoring.jsx";
import VitalSignsPage from "./pages/nurse/VitalSignsPage.jsx";
import NursingNotesPage from "./pages/nurse/NursingNotesPage.jsx";
import NursingTasksPage from "./pages/nurse/NursingTasksPage.jsx";
import MedicationsPage from "./pages/nurse/MedicationsPage.jsx";
import IntakeOutputPage from "./pages/nurse/IntakeOutputPage.jsx";
import DoctorOrdersPage from "./pages/nurse/DoctorOrdersPage.jsx";
import PatientTransfersPage from "./pages/nurse/PatientTransfersPage.jsx";
import AdmissionDischargePage from "./pages/nurse/AdmissionDischargePage.jsx";
import MyShiftPage from "./pages/nurse/MyShiftPage.jsx";
import NurseHandoverPage from "./pages/nurse/NurseHandoverPage.jsx";
import ConsultationWorkspace from "./pages/doctor/ConsultationWorkspace.jsx";
import DoctorWorkspaceOrdersPage from "./pages/doctor/DoctorOrdersPage.jsx";
import DoctorReferralsPage from "./pages/doctor/DoctorReferralsPage.jsx";
import CriticalLabResultsPage from "./pages/doctor/CriticalLabResultsPage.jsx";
import DoctorFollowUpsPage from "./pages/doctor/DoctorFollowUpsPage.jsx";
import SpecialistDirectoryPage from "./pages/doctor/SpecialistDirectoryPage.jsx";
import BookAppointment from "./pages/patient/BookAppointment.jsx";
import MyAppointments from "./pages/patient/MyAppointments.jsx";
import MyBillings from "./pages/patient/MyBillings.jsx";
import MyPrescriptions from "./pages/patient/MyPrescriptions.jsx";
import MyVitals from "./pages/patient/MyVitals.jsx";
import MyLabReports from "./pages/patient/MyLabReports.jsx";
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
          <Route path="/patient/vitals" element={<MyVitals />} />
          <Route path="/patient/lab-reports" element={<MyLabReports />} />
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
          <Route path="/lab-reports" element={<LabReports />} />
          <Route path="/reports" element={<Reports />} />

          {/* Clinical Nursing Station Routes */}
          <Route path="/nurse/patients" element={<MyPatients />} />
          <Route path="/nurse/monitoring" element={<PatientMonitoring />} />
          <Route path="/nurse/vitals" element={<VitalSignsPage />} />
          <Route path="/nurse/notes" element={<NursingNotesPage />} />
          <Route path="/nurse/tasks" element={<NursingTasksPage />} />
          <Route path="/nurse/medications" element={<MedicationsPage />} />
          <Route path="/nurse/intake-output" element={<IntakeOutputPage />} />
          <Route path="/nurse/doctor-orders" element={<DoctorOrdersPage />} />
          <Route path="/nurse/transfers" element={<PatientTransfersPage />} />
          <Route path="/nurse/admission-discharge" element={<AdmissionDischargePage />} />
          <Route path="/nurse/shift" element={<MyShiftPage />} />
          <Route path="/nurse/handover" element={<NurseHandoverPage />} />

          {/* Doctor Clinical Workspace Routes */}
          <Route path="/doctor/consultation/:appointmentId" element={<ConsultationWorkspace />} />
          <Route path="/doctor/orders" element={<DoctorWorkspaceOrdersPage />} />
          <Route path="/doctor/referrals" element={<DoctorReferralsPage />} />
          <Route path="/doctor/critical-labs" element={<CriticalLabResultsPage />} />
          <Route path="/doctor/follow-ups" element={<DoctorFollowUpsPage />} />
          <Route path="/specialist-directory" element={<SpecialistDirectoryPage />} />
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
