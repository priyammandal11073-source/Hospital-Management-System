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
import FindDoctorsPage from "./pages/patient/FindDoctorsPage.jsx";
import MyMedicalRecords from "./pages/patient/MyMedicalRecords.jsx";
import MyMedicalTimeline from "./pages/patient/MyMedicalTimeline.jsx";
import MyMedicines from "./pages/patient/MyMedicines.jsx";
import MyConsultations from "./pages/patient/MyConsultations.jsx";
import MyReferrals from "./pages/patient/MyReferrals.jsx";
import MyFollowUps from "./pages/patient/MyFollowUps.jsx";
import MyAdmissions from "./pages/patient/MyAdmissions.jsx";
import MyDocuments from "./pages/patient/MyDocuments.jsx";
import PaymentHistory from "./pages/patient/PaymentHistory.jsx";
import PatientProfilePage from "./pages/patient/PatientProfilePage.jsx";
import HelpSupportPage from "./pages/patient/HelpSupportPage.jsx";
import PatientFeedbackPage from "./pages/patient/PatientFeedbackPage.jsx";
import PatientNotificationsPage from "./pages/patient/PatientNotificationsPage.jsx";
import StaffManagementPage from "./pages/admin/StaffManagementPage.jsx";
import DepartmentsPage from "./pages/admin/DepartmentsPage.jsx";
import HospitalCalendarPage from "./pages/admin/HospitalCalendarPage.jsx";
import AdmissionsManagementPage from "./pages/admin/AdmissionsManagementPage.jsx";
import RevenueAnalyticsPage from "./pages/admin/RevenueAnalyticsPage.jsx";
import InventoryPharmacyPage from "./pages/admin/InventoryPharmacyPage.jsx";
import EquipmentMaintenancePage from "./pages/admin/EquipmentMaintenancePage.jsx";
import StaffAttendanceShiftsPage from "./pages/admin/StaffAttendanceShiftsPage.jsx";
import EmergencyOperationsPage from "./pages/admin/EmergencyOperationsPage.jsx";
import OperatingTheatrePage from "./pages/admin/OperatingTheatrePage.jsx";
import AuditLogPage from "./pages/admin/AuditLogPage.jsx";
import HospitalSettingsPage from "./pages/admin/HospitalSettingsPage.jsx";

// Receptionist & Front Desk Pages
import WaitingRoomPage from "./pages/reception/WaitingRoomPage.jsx";
import OPDCalendarPage from "./pages/reception/OPDCalendarPage.jsx";
import OnlineBookingsPage from "./pages/reception/OnlineBookingsPage.jsx";
import DischargeCoordinationPage from "./pages/reception/DischargeCoordinationPage.jsx";
import EmergencyDeskPage from "./pages/reception/EmergencyDeskPage.jsx";
import AppointmentRemindersPage from "./pages/reception/AppointmentRemindersPage.jsx";
import DeskHandoverPage from "./pages/reception/DeskHandoverPage.jsx";
import ReceptionReportsPage from "./pages/reception/ReceptionReportsPage.jsx";
import FrontDeskWorkQueuePage from "./pages/reception/FrontDeskWorkQueuePage.jsx";
import RefundsManagementPage from "./pages/reception/RefundsManagementPage.jsx";

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
          <Route path="/patient/consultations" element={<MyConsultations />} />
          <Route path="/patient/doctors" element={<FindDoctorsPage />} />
          <Route path="/patient/records" element={<MyMedicalRecords />} />
          <Route path="/patient/timeline" element={<MyMedicalTimeline />} />
          <Route path="/patient/medicines" element={<MyMedicines />} />
          <Route path="/patient/vitals" element={<MyVitals />} />
          <Route path="/patient/lab-reports" element={<MyLabReports />} />
          <Route path="/patient/billings" element={<MyBillings />} />
          <Route path="/patient/payments" element={<PaymentHistory />} />
          <Route path="/patient/prescriptions" element={<MyPrescriptions />} />
          <Route path="/patient/referrals" element={<MyReferrals />} />
          <Route path="/patient/follow-ups" element={<MyFollowUps />} />
          <Route path="/patient/admissions" element={<MyAdmissions />} />
          <Route path="/patient/documents" element={<MyDocuments />} />
          <Route path="/patient/profile" element={<PatientProfilePage />} />
          <Route path="/patient/support" element={<HelpSupportPage />} />
          <Route path="/patient/feedback" element={<PatientFeedbackPage />} />
          <Route path="/patient/notifications" element={<PatientNotificationsPage />} />
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

          {/* Hospital Administrator Operations Routes */}
          <Route path="/admin/staff" element={<StaffManagementPage />} />
          <Route path="/admin/departments" element={<DepartmentsPage />} />
          <Route path="/admin/calendar" element={<HospitalCalendarPage />} />
          <Route path="/admin/admissions" element={<AdmissionsManagementPage />} />
          <Route path="/admin/revenue" element={<RevenueAnalyticsPage />} />
          <Route path="/admin/inventory" element={<InventoryPharmacyPage />} />
          <Route path="/admin/equipment" element={<EquipmentMaintenancePage />} />
          <Route path="/admin/attendance" element={<StaffAttendanceShiftsPage />} />
          <Route path="/admin/emergency" element={<EmergencyOperationsPage />} />
          <Route path="/admin/operating-theatre" element={<OperatingTheatrePage />} />
          <Route path="/admin/audit-logs" element={<AuditLogPage />} />
          <Route path="/admin/settings" element={<HospitalSettingsPage />} />

          {/* Receptionist & Front Desk Operations Routes */}
          <Route path="/reception/waiting-room" element={<WaitingRoomPage />} />
          <Route path="/reception/calendar" element={<OPDCalendarPage />} />
          <Route path="/reception/online-bookings" element={<OnlineBookingsPage />} />
          <Route path="/reception/discharges" element={<DischargeCoordinationPage />} />
          <Route path="/reception/emergency" element={<EmergencyDeskPage />} />
          <Route path="/reception/reminders" element={<AppointmentRemindersPage />} />
          <Route path="/reception/handover" element={<DeskHandoverPage />} />
          <Route path="/reception/reports" element={<ReceptionReportsPage />} />
          <Route path="/reception/work-queue" element={<FrontDeskWorkQueuePage />} />
          <Route path="/reception/refunds" element={<RefundsManagementPage />} />
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
