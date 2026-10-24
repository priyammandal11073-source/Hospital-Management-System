import React, { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
const DashboardLayout = lazy(() => import("./components/DashboardLayout.jsx"));
const PatientLayout = lazy(() => import("./components/PatientLayout.jsx"));
import PatientProtectedRoute from "./components/PatientProtectedRoute.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import PageLoader from "./components/ui/PageLoader.jsx";
import Toaster from "./components/ui/Toaster.jsx";
import { PrintModalProvider } from "./context/PrintModalContext.jsx";
import usePageTitle from "./hooks/usePageTitle.js";

// Core Staff & Common Pages (Lazy Loaded)
const Appointments = lazy(() => import("./pages/Appointments.jsx"));
const Billing = lazy(() => import("./pages/Billing.jsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.jsx"));
const Doctors = lazy(() => import("./pages/Doctors.jsx"));
const Login = lazy(() => import("./pages/Login.jsx"));
const Patients = lazy(() => import("./pages/Patients.jsx"));
const PaymentPage = lazy(() => import("./pages/PaymentPage.jsx"));
const Reports = lazy(() => import("./pages/Reports.jsx"));
const Prescriptions = lazy(() => import("./pages/Prescriptions.jsx"));
const Beds = lazy(() => import("./pages/Beds.jsx"));
const LabReports = lazy(() => import("./pages/LabReports.jsx"));

// Clinical Nursing Station Pages (Lazy Loaded)
const MyPatients = lazy(() => import("./pages/nurse/MyPatients.jsx"));
const PatientMonitoring = lazy(() => import("./pages/nurse/PatientMonitoring.jsx"));
const VitalSignsPage = lazy(() => import("./pages/nurse/VitalSignsPage.jsx"));
const NursingNotesPage = lazy(() => import("./pages/nurse/NursingNotesPage.jsx"));
const NursingTasksPage = lazy(() => import("./pages/nurse/NursingTasksPage.jsx"));
const MedicationsPage = lazy(() => import("./pages/nurse/MedicationsPage.jsx"));
const IntakeOutputPage = lazy(() => import("./pages/nurse/IntakeOutputPage.jsx"));
const DoctorOrdersPage = lazy(() => import("./pages/nurse/DoctorOrdersPage.jsx"));
const PatientTransfersPage = lazy(() => import("./pages/nurse/PatientTransfersPage.jsx"));
const AdmissionDischargePage = lazy(() => import("./pages/nurse/AdmissionDischargePage.jsx"));
const MyShiftPage = lazy(() => import("./pages/nurse/MyShiftPage.jsx"));
const NurseHandoverPage = lazy(() => import("./pages/nurse/NurseHandoverPage.jsx"));

// Doctor Clinical Workspace Pages (Lazy Loaded)
const ConsultationWorkspace = lazy(() => import("./pages/doctor/ConsultationWorkspace.jsx"));
const DoctorWorkspaceOrdersPage = lazy(() => import("./pages/doctor/DoctorOrdersPage.jsx"));
const DoctorReferralsPage = lazy(() => import("./pages/doctor/DoctorReferralsPage.jsx"));
const CriticalLabResultsPage = lazy(() => import("./pages/doctor/CriticalLabResultsPage.jsx"));
const DoctorFollowUpsPage = lazy(() => import("./pages/doctor/DoctorFollowUpsPage.jsx"));
const SpecialistDirectoryPage = lazy(() => import("./pages/doctor/SpecialistDirectoryPage.jsx"));
const TelemedicineDoctorPage = lazy(() => import("./pages/doctor/TelemedicineDoctorPage.jsx"));

// Patient Self-Service Portal Pages (Lazy Loaded)
const BookAppointment = lazy(() => import("./pages/patient/BookAppointment.jsx"));
const MyAppointments = lazy(() => import("./pages/patient/MyAppointments.jsx"));
const MyBillings = lazy(() => import("./pages/patient/MyBillings.jsx"));
const MyPrescriptions = lazy(() => import("./pages/patient/MyPrescriptions.jsx"));
const MyVitals = lazy(() => import("./pages/patient/MyVitals.jsx"));
const MyLabReports = lazy(() => import("./pages/patient/MyLabReports.jsx"));
const PatientDashboard = lazy(() => import("./pages/patient/PatientDashboard.jsx"));
const PatientLogin = lazy(() => import("./pages/patient/PatientLogin.jsx"));
const PatientRegister = lazy(() => import("./pages/patient/PatientRegister.jsx"));
const ForgotPassword = lazy(() => import("./pages/patient/ForgotPassword.jsx"));
const FindDoctorsPage = lazy(() => import("./pages/patient/FindDoctorsPage.jsx"));
const MyMedicalRecords = lazy(() => import("./pages/patient/MyMedicalRecords.jsx"));
const MyMedicalTimeline = lazy(() => import("./pages/patient/MyMedicalTimeline.jsx"));
const MyMedicines = lazy(() => import("./pages/patient/MyMedicines.jsx"));
const MyConsultations = lazy(() => import("./pages/patient/MyConsultations.jsx"));
const MyReferrals = lazy(() => import("./pages/patient/MyReferrals.jsx"));
const MyFollowUps = lazy(() => import("./pages/patient/MyFollowUps.jsx"));
const MyAdmissions = lazy(() => import("./pages/patient/MyAdmissions.jsx"));
const MyDocuments = lazy(() => import("./pages/patient/MyDocuments.jsx"));
const PaymentHistory = lazy(() => import("./pages/patient/PaymentHistory.jsx"));
const PatientProfilePage = lazy(() => import("./pages/patient/PatientProfilePage.jsx"));
const HelpSupportPage = lazy(() => import("./pages/patient/HelpSupportPage.jsx"));
const PatientFeedbackPage = lazy(() => import("./pages/patient/PatientFeedbackPage.jsx"));
const PatientNotificationsPage = lazy(() => import("./pages/patient/PatientNotificationsPage.jsx"));
const TelemedicinePage = lazy(() => import("./pages/patient/TelemedicinePage.jsx"));
const TeleconsultRoom = lazy(() => import("./pages/TeleconsultRoom.jsx"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage.jsx"));
const WardMapPage = lazy(() => import("./pages/WardMapPage.jsx"));
const ExecutiveDashboard = lazy(() => import("./pages/admin/ExecutiveDashboard.jsx"));
const PharmacistVerificationWorkbench = lazy(() => import("./pages/pharmacy/PharmacistVerificationWorkbench.jsx"));
const LabAutoVerificationDashboard = lazy(() => import("./pages/diagnostic/LabAutoVerificationDashboard.jsx"));
const RadiologyWorkbench = lazy(() => import("./pages/diagnostic/RadiologyWorkbench.jsx"));
const PatientHealthTimeline = lazy(() => import("./pages/patient/HealthTimelinePage.jsx"));
const DoctorMobileDashboard = lazy(() => import("./pages/doctor/DoctorMobileDashboard.jsx"));
const SupplyChainGRNPage = lazy(() => import("./pages/admin/SupplyChainGRNPage.jsx"));
const InterStoreTransferPage = lazy(() => import("./pages/admin/InterStoreTransferPage.jsx"));
const EmergencyDashboard = lazy(() => import("./pages/emergency/EmergencyDashboard.jsx"));
const EmergencyQueuePage = lazy(() => import("./pages/emergency/EmergencyQueuePage.jsx"));
const EmergencyRegistrationPage = lazy(() => import("./pages/emergency/EmergencyRegistrationPage.jsx"));
const EmergencyPatientProfilePage = lazy(() => import("./pages/emergency/EmergencyPatientProfilePage.jsx"));
const EmergencyBedsPage = lazy(() => import("./pages/emergency/EmergencyBedsPage.jsx"));
const EmergencyReportsPage = lazy(() => import("./pages/emergency/EmergencyReportsPage.jsx"));

// Hospital Administrator Operations Pages (Lazy Loaded)
const StaffManagementPage = lazy(() => import("./pages/admin/StaffManagementPage.jsx"));
const DepartmentsPage = lazy(() => import("./pages/admin/DepartmentsPage.jsx"));
const HospitalCalendarPage = lazy(() => import("./pages/admin/HospitalCalendarPage.jsx"));
const AdmissionsManagementPage = lazy(() => import("./pages/admin/AdmissionsManagementPage.jsx"));
const RevenueAnalyticsPage = lazy(() => import("./pages/admin/RevenueAnalyticsPage.jsx"));
const InventoryPharmacyPage = lazy(() => import("./pages/admin/InventoryPharmacyPage.jsx"));
const EquipmentMaintenancePage = lazy(() => import("./pages/admin/EquipmentMaintenancePage.jsx"));
const StaffAttendanceShiftsPage = lazy(() => import("./pages/admin/StaffAttendanceShiftsPage.jsx"));
const EmergencyOperationsPage = lazy(() => import("./pages/admin/EmergencyOperationsPage.jsx"));
const OperatingTheatrePage = lazy(() => import("./pages/admin/OperatingTheatrePage.jsx"));
const AuditLogPage = lazy(() => import("./pages/admin/AuditLogPage.jsx"));
const HospitalSettingsPage = lazy(() => import("./pages/admin/HospitalSettingsPage.jsx"));
const InsuranceClaimsPage = lazy(() => import("./pages/admin/InsuranceClaimsPage.jsx"));
const FeedbackReviewPage = lazy(() => import("./pages/admin/FeedbackReviewPage.jsx"));

// Receptionist & Front Desk Pages (Lazy Loaded)
const WaitingRoomPage = lazy(() => import("./pages/reception/WaitingRoomPage.jsx"));
const OPDCalendarPage = lazy(() => import("./pages/reception/OPDCalendarPage.jsx"));
const OnlineBookingsPage = lazy(() => import("./pages/reception/OnlineBookingsPage.jsx"));
const DischargeCoordinationPage = lazy(() => import("./pages/reception/DischargeCoordinationPage.jsx"));
const EmergencyDeskPage = lazy(() => import("./pages/reception/EmergencyDeskPage.jsx"));
const AppointmentRemindersPage = lazy(() => import("./pages/reception/AppointmentRemindersPage.jsx"));
const DeskHandoverPage = lazy(() => import("./pages/reception/DeskHandoverPage.jsx"));
const ReceptionReportsPage = lazy(() => import("./pages/reception/ReceptionReportsPage.jsx"));
const FrontDeskWorkQueuePage = lazy(() => import("./pages/reception/FrontDeskWorkQueuePage.jsx"));
const RefundsManagementPage = lazy(() => import("./pages/reception/RefundsManagementPage.jsx"));

// Pharmacy & Dispensing Pages (Lazy Loaded)
const PharmacyQueuePage = lazy(() => import("./pages/pharmacy/PharmacyQueuePage.jsx"));
const PrescriptionDispensePage = lazy(() => import("./pages/pharmacy/PrescriptionDispensePage.jsx"));
const PrescriptionHistoryPage = lazy(() => import("./pages/pharmacy/PrescriptionHistoryPage.jsx"));
const MedicineInventoryPage = lazy(() => import("./pages/pharmacy/MedicineInventoryPage.jsx"));
const StockManagementPage = lazy(() => import("./pages/pharmacy/StockManagementPage.jsx"));
const BatchManagementPage = lazy(() => import("./pages/pharmacy/BatchManagementPage.jsx"));
const ExpiryManagementPage = lazy(() => import("./pages/pharmacy/ExpiryManagementPage.jsx"));
const LowStockAlertsPage = lazy(() => import("./pages/pharmacy/LowStockAlertsPage.jsx"));
const SuppliersManagementPage = lazy(() => import("./pages/pharmacy/SuppliersManagementPage.jsx"));
const PurchaseOrdersPage = lazy(() => import("./pages/pharmacy/PurchaseOrdersPage.jsx"));
const PharmacyReturnsPage = lazy(() => import("./pages/pharmacy/PharmacyReturnsPage.jsx"));
const PharmacyPatientsPage = lazy(() => import("./pages/pharmacy/PharmacyPatientsPage.jsx"));
const PharmacyBillingPage = lazy(() => import("./pages/pharmacy/PharmacyBillingPage.jsx"));
const PharmacyAnalyticsPage = lazy(() => import("./pages/pharmacy/PharmacyAnalyticsPage.jsx"));
const PharmacyStaffPage = lazy(() => import("./pages/pharmacy/PharmacyStaffPage.jsx"));

// Diagnostic Services (Pathology & Radiology) Pages (Lazy Loaded)
const TestRequestsPage = lazy(() => import("./pages/diagnostic/TestRequestsPage.jsx"));
const SampleCollectionPage = lazy(() => import("./pages/diagnostic/SampleCollectionPage.jsx"));
const TechnicianWorkspacePage = lazy(() => import("./pages/diagnostic/TechnicianWorkspacePage.jsx"));
const RadiologyImagingPage = lazy(() => import("./pages/diagnostic/RadiologyImagingPage.jsx"));
const SpecialistReviewPage = lazy(() => import("./pages/diagnostic/SpecialistReviewPage.jsx"));
const DiagnosticReportsPage = lazy(() => import("./pages/diagnostic/DiagnosticReportsPage.jsx"));
const CriticalResultsPage = lazy(() => import("./pages/diagnostic/CriticalResultsPage.jsx"));
const DiagnosticCatalogPage = lazy(() => import("./pages/diagnostic/DiagnosticCatalogPage.jsx"));
const DiagnosticEquipmentPage = lazy(() => import("./pages/diagnostic/DiagnosticEquipmentPage.jsx"));
const DiagnosticInventoryPage = lazy(() => import("./pages/diagnostic/DiagnosticInventoryPage.jsx"));
const DiagnosticBillingPage = lazy(() => import("./pages/diagnostic/DiagnosticBillingPage.jsx"));
const DiagnosticAuditLogsPage = lazy(() => import("./pages/diagnostic/DiagnosticAuditLogsPage.jsx"));
const DiagnosticPrintCenterPage = lazy(() => import("./pages/diagnostic/DiagnosticPrintCenterPage.jsx"));
const PathologyReportGeneratorPage = lazy(() => import("./pages/diagnostic/PathologyReportGeneratorPage.jsx"));
const RadiologyStudyPage = lazy(() => import("./pages/diagnostic/RadiologyStudyPage.jsx"));

function App() {
  usePageTitle();

  return (
    <PrintModalProvider>
      <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/patient/login" element={<PatientLogin />} />
        <Route path="/patient/register" element={<PatientRegister />} />
        <Route path="/patient/forgot-password" element={<ForgotPassword />} />
        {/* Public payment link — no auth required, accessible via SMS */}
        <Route path="/pay/:billingId" element={<PaymentPage />} />
        <Route path="/teleconsult/:joinCode" element={<TeleconsultRoom />} />
        <Route path="/teleconsult" element={<Navigate to="/doctor/telemedicine" replace />} />
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
            <Route path="/patient/help-support" element={<Navigate to="/patient/support" replace />} />
            <Route path="/patient/feedback" element={<PatientFeedbackPage />} />
            <Route path="/patient/notifications" element={<PatientNotificationsPage />} />
            <Route path="/patient/telemedicine" element={<TelemedicinePage />} />
            <Route path="/patient/health-timeline" element={<PatientHealthTimeline />} />
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
            <Route path="/doctor/consultation" element={<Navigate to="/appointments" replace />} />
            <Route path="/doctor/orders" element={<DoctorWorkspaceOrdersPage />} />
            <Route path="/doctor/referrals" element={<DoctorReferralsPage />} />
            <Route path="/doctor/critical-labs" element={<CriticalLabResultsPage />} />
            <Route path="/doctor/follow-ups" element={<DoctorFollowUpsPage />} />
            <Route path="/doctor/telemedicine" element={<TelemedicineDoctorPage />} />
            <Route path="/doctor/mobile" element={<DoctorMobileDashboard />} />
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
            <Route path="/admin/insurance-claims" element={<InsuranceClaimsPage />} />
            <Route path="/admin/feedback" element={<FeedbackReviewPage />} />
            <Route path="/admin/executive-dashboard" element={<ExecutiveDashboard />} />
            <Route path="/admin/supply-chain/grn" element={<SupplyChainGRNPage />} />
            <Route path="/admin/supply-chain/transfers" element={<InterStoreTransferPage />} />
            <Route path="/admin/settings" element={<HospitalSettingsPage />} />

            {/* Emergency Department — Integrated Hospital-Wide */}
            <Route path="/emergency/dashboard" element={<EmergencyDashboard />} />
            <Route path="/emergency/queue" element={<EmergencyQueuePage />} />
            <Route path="/emergency/register" element={<EmergencyRegistrationPage />} />
            <Route path="/emergency/patients/:id" element={<EmergencyPatientProfilePage />} />
            <Route path="/emergency/beds" element={<EmergencyBedsPage />} />
            <Route path="/emergency/reports" element={<EmergencyReportsPage />} />
            <Route path="/emergency" element={<EmergencyDashboard />} />

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
            <Route path="/reception/admissions" element={<AdmissionsManagementPage />} />

            {/* Pharmacy & Dispensing Operations Routes */}
<Route path="/pharmacy/queue" element={<PharmacyQueuePage />} />
              <Route path="/pharmacy/dispense/:id?" element={<PrescriptionDispensePage />} />
              <Route path="/pharmacy/history" element={<PrescriptionHistoryPage />} />
              <Route path="/pharmacy/verification" element={<PharmacistVerificationWorkbench />} />
              <Route path="/pharmacy/inventory" element={<MedicineInventoryPage />} />
              <Route path="/pharmacy/stock" element={<StockManagementPage />} />
              <Route path="/pharmacy/batches" element={<BatchManagementPage />} />
              <Route path="/pharmacy/expiry" element={<ExpiryManagementPage />} />
              <Route path="/pharmacy/alerts" element={<LowStockAlertsPage />} />
              <Route path="/pharmacy/suppliers" element={<SuppliersManagementPage />} />
              <Route path="/pharmacy/purchase-orders" element={<PurchaseOrdersPage />} />
              <Route path="/pharmacy/returns" element={<PharmacyReturnsPage />} />
              <Route path="/pharmacy/patients" element={<PharmacyPatientsPage />} />
              <Route path="/pharmacy/billing" element={<PharmacyBillingPage />} />
              <Route path="/pharmacy/analytics" element={<PharmacyAnalyticsPage />} />
              <Route path="/pharmacy/staff" element={<PharmacyStaffPage />} />

            {/* Diagnostic Services (Pathology & Radiology) Routes */}
            <Route path="/diagnostic/requests" element={<TestRequestsPage />} />
            <Route path="/diagnostic/samples" element={<SampleCollectionPage />} />
            <Route path="/diagnostic/workbench" element={<TechnicianWorkspacePage />} />
            <Route path="/diagnostic/auto-verify" element={<LabAutoVerificationDashboard />} />
            <Route path="/diagnostic/radiology" element={<RadiologyImagingPage />} />
            <Route path="/diagnostic/radiology/:id" element={<RadiologyWorkbench />} />
            <Route path="/diagnostic/radiology-workbench" element={<RadiologyWorkbench />} />
            <Route path="/diagnostic/review" element={<SpecialistReviewPage />} />
            <Route path="/diagnostic/reports" element={<DiagnosticReportsPage />} />
            <Route path="/diagnostic/critical" element={<CriticalResultsPage />} />
            <Route path="/diagnostic/catalog" element={<DiagnosticCatalogPage />} />
            <Route path="/diagnostic/equipment" element={<DiagnosticEquipmentPage />} />
            <Route path="/diagnostic/inventory" element={<DiagnosticInventoryPage />} />
            <Route path="/diagnostic/billing" element={<DiagnosticBillingPage />} />
            <Route path="/diagnostic/audit" element={<DiagnosticAuditLogsPage />} />
            <Route path="/diagnostic/print-center" element={<DiagnosticPrintCenterPage />} />
            <Route path="/diagnostic/reports/new/:orderId" element={<PathologyReportGeneratorPage />} />
            <Route path="/diagnostic/study/:studyId" element={<RadiologyStudyPage />} />

            {/* Backward-Compatible Route Aliases to Prevent Broken Links */}
            <Route path="/pharmacy/dispense" element={<PrescriptionDispensePage />} />
            <Route path="/pharmacy/prescriptions-history" element={<Navigate to="/pharmacy/history" replace />} />
            <Route path="/pharmacy/low-stock" element={<Navigate to="/pharmacy/alerts" replace />} />
            <Route path="/pharmacy/stock-receiving" element={<Navigate to="/pharmacy/stock" replace />} />
            <Route path="/pharmacy/patient-history" element={<Navigate to="/pharmacy/patients" replace />} />
            <Route path="/pharmacy/receipts" element={<Navigate to="/pharmacy/billing" replace />} />
            <Route path="/pharmacy/refunds" element={<Navigate to="/pharmacy/returns" replace />} />
            <Route path="/pharmacy/reports" element={<Navigate to="/pharmacy/analytics" replace />} />
            <Route path="/pharmacy/stock-ledger" element={<Navigate to="/pharmacy/batches" replace />} />
            <Route path="/pharmacy/shifts" element={<Navigate to="/pharmacy/staff" replace />} />

            <Route path="/diagnostics" element={<Navigate to="/diagnostic/requests" replace />} />
            <Route path="/diagnostic/appointments" element={<Navigate to="/diagnostic/requests" replace />} />
            <Route path="/diagnostic/walk-in" element={<Navigate to="/diagnostic/samples" replace />} />
            <Route path="/diagnostic/lab-workstation" element={<Navigate to="/diagnostic/workbench" replace />} />
            <Route path="/diagnostic/specialist-review" element={<Navigate to="/diagnostic/review" replace />} />
            <Route path="/diagnostic/critical-alerts" element={<Navigate to="/diagnostic/critical" replace />} />
            <Route path="/diagnostic/audit-logs" element={<Navigate to="/diagnostic/audit" replace />} />
          </Route>
        </Route>

        <Route path="/ward-map" element={<WardMapPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
    <Toaster />
  </PrintModalProvider>
  );
}

export default App;
