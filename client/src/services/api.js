import axios from "axios";

/**
 * Shared HTTP client for all frontend API requests.
 * In development, an empty base URL lets Vite proxy /api requests to Express.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add the saved JWT to every request sent through this shared client.
// Staff token (hms_token) and patient token (patient_token) are kept separate
// so both sessions can coexist in the same browser.
api.interceptors.request.use((config) => {
  const url = config.url || "";
  const isPatientRoute = url.includes("/patient-auth") || url.includes("/patient-portal");
  const token = isPatientRoute
    ? localStorage.getItem("patient_token") || localStorage.getItem("hms_token")
    : localStorage.getItem("hms_token") || localStorage.getItem("patient_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const loginUser = async (email, password) => {
  const response = await api.post("/api/auth/login", { email, password });
  return response.data;
};

export const getPatients = async (searchQuery = "", page = 1, limit = 10) => {
  const params = { page, limit };

  if (searchQuery.trim()) {
    params.search = searchQuery.trim();
  }

  const response = await api.get("/api/patients", { params });
  return response.data;
};

export const getPatientById = async (id) => {
  const response = await api.get(`/api/patients/${id}`);
  return response.data;
};

export const createPatient = async (patientData) => {
  const response = await api.post("/api/patients", patientData);
  return response.data;
};

export const updatePatient = async (id, patientData) => {
  const response = await api.put(`/api/patients/${id}`, patientData);
  return response.data;
};

export const deletePatient = async (id) => {
  const response = await api.delete(`/api/patients/${id}`);
  return response.data;
};

export const getDoctors = async (specialization = "", department = "") => {
  const params = {};

  if (specialization) params.specialization = specialization;
  if (department) params.department = department;

  const response = await api.get("/api/doctors", { params });
  return response.data;
};

export const getMyDoctorProfile = async () => {
  const response = await api.get("/api/doctors/me");
  return response.data;
};

export const getDoctorById = async (id) => {
  const response = await api.get(`/api/doctors/${id}`);
  return response.data;
};

export const createDoctor = async (doctorData) => {
  const response = await api.post("/api/doctors", doctorData);
  return response.data;
};

export const updateDoctor = async (id, doctorData) => {
  const response = await api.put(`/api/doctors/${id}`, doctorData);
  return response.data;
};

export const deleteDoctor = async (id) => {
  const response = await api.delete(`/api/doctors/${id}`);
  return response.data;
};

export const getAppointments = async (filters = {}) => {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value)
  );
  const response = await api.get("/api/appointments", { params });
  return response.data;
};

export const getAppointmentById = async (id) => {
  const response = await api.get(`/api/appointments/${id}`);
  return response.data;
};

export const createAppointment = async (appointmentData) => {
  const response = await api.post("/api/appointments", appointmentData);
  return response.data;
};

export const updateAppointmentStatus = async (id, status) => {
  const response = await api.patch(`/api/appointments/${id}/status`, { status });
  return response.data;
};

export const updateAppointmentChecklist = async (id, prepChecklist) => {
  const response = await api.patch(`/api/appointments/${id}/checklist`, { prepChecklist });
  return response.data;
};

export const deleteAppointment = async (id) => {
  const response = await api.delete(`/api/appointments/${id}`);
  return response.data;
};

export const getBillings = async (filters = {}) => {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value)
  );
  const response = await api.get("/api/billing", { params });
  return response.data;
};

export const getBillingById = async (id) => {
  const response = await api.get(`/api/billing/${id}`);
  return response.data;
};

export const createBilling = async (billingData) => {
  const response = await api.post("/api/billing", billingData);
  return response.data;
};

export const updatePaymentStatus = async (id, statusData) => {
  const response = await api.patch(`/api/billing/${id}/payment`, statusData);
  return response.data;
};

export const getRevenueSummary = async () => {
  const response = await api.get("/api/billing/summary");
  return response.data;
};

export const sendBillingEmail = async (id) => {
  const response = await api.post(`/api/billing/${id}/send-email`);
  return response.data;
};

export const sendBillingPaymentLinkSms = async (id, phoneNumber) => {
  const response = await api.post(`/api/billing/${id}/send-sms`, phoneNumber ? { phoneNumber } : {});
  return response.data;
};


// Patient self-service auth (separate from staff auth)
export const registerPatient = async (patientData) => {
  const response = await api.post("/api/patient-auth/register", patientData);
  return response.data;
};

export const loginPatient = async (email, password) => {
  const response = await api.post("/api/patient-auth/login", { email, password });
  return response.data;
};

// Patient portal (scoped to logged-in patient, requires patient token)
export const getMyProfile = async () => {
  const response = await api.get("/api/patient-portal/me");
  return response.data;
};

export const getMyAppointments = async (filters = {}) => {
  const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
  const response = await api.get("/api/patient-portal/appointments", { params });
  return response.data;
};

export const bookMyAppointment = async (appointmentData) => {
  const response = await api.post("/api/patient-portal/appointments", appointmentData);
  return response.data;
};

export const cancelMyAppointment = async (id) => {
  const response = await api.patch(`/api/patient-portal/appointments/${id}/cancel`);
  return response.data;
};

export const getMyBillings = async () => {
  const response = await api.get("/api/patient-portal/billings");
  return response.data;
};

export const payMyBillingUpi = async (id, paymentData = {}) => {
  const response = await api.patch(`/api/patient-portal/billings/${id}/pay-upi`, paymentData);
  return response.data;
};

export const getPatientDashboardSummary = async () => {
  const response = await api.get("/api/patient-portal/dashboard");
  return response.data;
};

export const rescheduleMyAppointment = async (id, data) => {
  const response = await api.patch(`/api/patient-portal/appointments/${id}/reschedule`, data);
  return response.data;
};

export const getPatientDoctors = async (filters = {}) => {
  const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
  const response = await api.get("/api/patient-portal/doctors", { params });
  return response.data;
};

export const getPatientDoctorById = async (id) => {
  const response = await api.get(`/api/patient-portal/doctors/${id}`);
  return response.data;
};

export const getMyMedicalRecords = async (filters = {}) => {
  const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
  const response = await api.get("/api/patient-portal/records", { params });
  return response.data;
};

export const getMyMedicalTimeline = async () => {
  const response = await api.get("/api/patient-portal/timeline");
  return response.data;
};

export const getMyActiveMedicines = async () => {
  const response = await api.get("/api/patient-portal/medicines");
  return response.data;
};

export const getMyConsultations = async () => {
  const response = await api.get("/api/patient-portal/consultations");
  return response.data;
};

export const getMyConsultationSummary = async (id) => {
  const response = await api.get(`/api/patient-portal/consultations/${id}`);
  return response.data;
};

export const getMyFollowUps = async () => {
  const response = await api.get("/api/patient-portal/follow-ups");
  return response.data;
};

export const getMyReferrals = async () => {
  const response = await api.get("/api/patient-portal/referrals");
  return response.data;
};

export const getMyAdmissions = async () => {
  const response = await api.get("/api/patient-portal/admissions");
  return response.data;
};

export const getMyDocuments = async () => {
  const response = await api.get("/api/patient-portal/documents");
  return response.data;
};

export const updateMyProfile = async (profileData) => {
  const response = await api.patch("/api/patient-portal/me", profileData);
  return response.data;
};

export const submitPatientFeedback = async (feedbackData) => {
  const response = await api.post("/api/patient-portal/feedback", feedbackData);
  return response.data;
};

export const getMyFeedback = async () => {
  const response = await api.get("/api/patient-portal/feedback");
  return response.data;
};

// Prescription API helpers
export const getPrescriptions = async (filters = {}) => {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== "")
  );
  const response = await api.get("/api/prescriptions", { params });
  return response.data;
};

export const getPrescriptionById = async (id) => {
  const response = await api.get(`/api/prescriptions/${id}`);
  return response.data;
};

export const createPrescription = async (prescriptionData) => {
  const response = await api.post("/api/prescriptions", prescriptionData);
  return response.data;
};

export const updatePrescription = async (id, prescriptionData) => {
  const response = await api.put(`/api/prescriptions/${id}`, prescriptionData);
  return response.data;
};

export const deletePrescription = async (id) => {
  const response = await api.delete(`/api/prescriptions/${id}`);
  return response.data;
};

export const sendPrescriptionEmail = async (id) => {
  const response = await api.post(`/api/prescriptions/${id}/send-email`);
  return response.data;
};

export const administerMedication = async (id, adminData) => {
  const response = await api.post(`/api/prescriptions/${id}/administer`, adminData);
  return response.data;
};

export const getMyPrescriptions = async () => {
  const response = await api.get("/api/patient-portal/prescriptions");
  return response.data;
};

// Bed & Ward API helpers
export const getBeds = async (filters = {}) => {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== "")
  );
  const response = await api.get("/api/beds", { params });
  return response.data;
};

export const getBedSummary = async () => {
  const response = await api.get("/api/beds/summary");
  return response.data;
};

export const getBedById = async (id) => {
  const response = await api.get(`/api/beds/${id}`);
  return response.data;
};

export const createBed = async (bedData) => {
  const response = await api.post("/api/beds", bedData);
  return response.data;
};

export const allocateBed = async (id, allocationData) => {
  const response = await api.post(`/api/beds/${id}/allocate`, allocationData);
  return response.data;
};

export const transferBed = async (id, transferData) => {
  const response = await api.post(`/api/beds/${id}/transfer`, transferData);
  return response.data;
};

export const dischargeBed = async (id, dischargeData) => {
  const response = await api.post(`/api/beds/${id}/discharge`, dischargeData);
  return response.data;
};

export const updateBedStatus = async (id, status) => {
  const response = await api.patch(`/api/beds/${id}/status`, { status });
  return response.data;
};

export const deleteBed = async (id) => {
  const response = await api.delete(`/api/beds/${id}`);
  return response.data;
};

export const getMyBedStay = async () => {
  const response = await api.get("/api/patient-portal/bed");
  return response.data;
};

// Razorpay SDK API helpers
export const createRazorpayOrder = async (billingId) => {
  const response = await api.post("/api/razorpay/create-order", { billingId });
  return response.data;
};

export const verifyRazorpayPayment = async (paymentData) => {
  const response = await api.post("/api/razorpay/verify-payment", paymentData);
  return response.data;
};

// ── Vitals & Health Records API ─────────────────────────────────────────────
export const getPatientVitals = async (patientId) => {
  const response = await api.get(`/api/vitals/${patientId}`);
  return response.data;
};

export const recordVitals = async (vitalsData) => {
  const response = await api.post("/api/vitals", vitalsData);
  return response.data;
};
export const recordPatientVitals = recordVitals;

export const deleteVitals = async (id) => {
  const response = await api.delete(`/api/vitals/${id}`);
  return response.data;
};

export const getMyVitals = async () => {
  const response = await api.get("/api/patient-portal/vitals");
  return response.data;
};

export const recordMyVitals = async (vitalsData) => {
  const response = await api.post("/api/patient-portal/vitals", vitalsData);
  return response.data;
};

export const getRecentVitalsAlerts = async () => {
  const response = await api.get("/api/vitals/alerts/recent");
  return response.data;
};

// ── Doctor Schedule Manager API ─────────────────────────────────────────────
export const updateDoctorSchedule = async (doctorId, scheduleData) => {
  const response = await api.put(`/api/doctors/${doctorId}/schedule`, scheduleData);
  return response.data;
};

export const addDoctorLeave = async (doctorId, leaveData) => {
  const response = await api.post(`/api/doctors/${doctorId}/leaves`, leaveData);
  return response.data;
};

export const removeDoctorLeave = async (doctorId, leaveIndex) => {
  const response = await api.delete(`/api/doctors/${doctorId}/leaves/${leaveIndex}`);
  return response.data;
};

// ── Lab Reports API ─────────────────────────────────────────────────────────
export const getLabReports = async (filters = {}) => {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== "")
  );
  const response = await api.get("/api/lab-reports", { params });
  return response.data;
};

export const getLabReportById = async (id) => {
  const response = await api.get(`/api/lab-reports/${id}`);
  return response.data;
};

export const createLabReport = async (reportData) => {
  const response = await api.post("/api/lab-reports", reportData);
  return response.data;
};

export const updateLabReport = async (id, reportData) => {
  const response = await api.put(`/api/lab-reports/${id}`, reportData);
  return response.data;
};

export const deleteLabReport = async (id) => {
  const response = await api.delete(`/api/lab-reports/${id}`);
  return response.data;
};

export const getMyLabReports = async () => {
  const response = await api.get("/api/patient-portal/lab-reports");
  return response.data;
};

export const getMyLabReportById = async (id) => {
  const response = await api.get(`/api/patient-portal/lab-reports/${id}`);
  return response.data;
};

// ── Notifications API (Staff & Patient) ─────────────────────────────────────
export const getNotifications = async () => {
  const isPatient = Boolean(localStorage.getItem("patient_token"));
  const url = isPatient ? "/api/patient-portal/notifications" : "/api/notifications";
  const response = await api.get(url);
  return response.data;
};

export const markNotificationRead = async (id) => {
  const isPatient = Boolean(localStorage.getItem("patient_token"));
  const url = isPatient
    ? `/api/patient-portal/notifications/${id}/read`
    : `/api/notifications/${id}/read`;
  const response = await api.patch(url);
  return response.data;
};

export const markAllNotificationsRead = async () => {
  const isPatient = Boolean(localStorage.getItem("patient_token"));
  const url = isPatient
    ? "/api/patient-portal/notifications/read-all"
    : "/api/notifications/read-all";
  const response = await api.patch(url);
  return response.data;
};

// ── Revenue Analytics API ───────────────────────────────────────────────────
export const getRevenueAnalytics = async () => {
  const response = await api.get("/api/billing/analytics");
  return response.data;
};

// ── Clinical Nursing Station API ─────────────────────────────────────────────
export const getNurseDashboardMetrics = async () => {
  const response = await api.get("/api/nurse/dashboard-metrics");
  return response.data;
};

export const getInpatientsWithCare = async (filters = {}) => {
  const response = await api.get("/api/nurse/inpatients", { params: filters });
  return response.data;
};

export const getClinicalPatientProfile = async (patientId) => {
  const response = await api.get(`/api/nurse/patient-profile/${patientId}`);
  return response.data;
};

export const getNursingTasks = async (filters = {}) => {
  const response = await api.get("/api/nurse/tasks", { params: filters });
  return response.data;
};

export const createNursingTask = async (taskData) => {
  const response = await api.post("/api/nurse/tasks", taskData);
  return response.data;
};

export const updateNursingTaskStatus = async (id, updateData) => {
  const response = await api.patch(`/api/nurse/tasks/${id}/status`, updateData);
  return response.data;
};

export const getNursingNotes = async (filters = {}) => {
  const response = await api.get("/api/nurse/notes", { params: filters });
  return response.data;
};

export const createNursingNote = async (noteData) => {
  const response = await api.post("/api/nurse/notes", noteData);
  return response.data;
};

export const getDoctorOrders = async (filters = {}) => {
  const response = await api.get("/api/nurse/doctor-orders", { params: filters });
  return response.data;
};

export const updateDoctorOrderStatus = async (id, updateData) => {
  const response = await api.patch(`/api/nurse/doctor-orders/${id}/status`, updateData);
  return response.data;
};

export const getIntakeOutputRecords = async (filters = {}) => {
  const response = await api.get("/api/nurse/intake-output", { params: filters });
  return response.data;
};

export const createIntakeOutputRecord = async (recordData) => {
  const response = await api.post("/api/nurse/intake-output", recordData);
  return response.data;
};

export const getPatientTransfers = async () => {
  const response = await api.get("/api/nurse/transfers");
  return response.data;
};

export const createPatientTransfer = async (transferData) => {
  const response = await api.post("/api/nurse/transfers", transferData);
  return response.data;
};

export const updatePatientTransferStatus = async (id, updateData) => {
  const response = await api.patch(`/api/nurse/transfers/${id}/status`, updateData);
  return response.data;
};

export const getMyShiftInfo = async () => {
  const response = await api.get("/api/nurse/shift");
  return response.data;
};

export const getHandovers = async () => {
  const response = await api.get("/api/nurse/handovers");
  return response.data;
};

export const createHandover = async (handoverData) => {
  const response = await api.post("/api/nurse/handovers", handoverData);
  return response.data;
};

export const acknowledgeHandover = async (id) => {
  const response = await api.patch(`/api/nurse/handovers/${id}/acknowledge`);
  return response.data;
};

export const updateSampleStatus = async (id, data) => {
  const response = await api.patch(`/api/lab-reports/${id}/sample-status`, data);
  return response.data;
};

// ==========================================
// DOCTOR CLINICAL WORKSPACE API HELPERS
// ==========================================

export const getDoctorDashboardData = async () => {
  const response = await api.get("/api/doctor-workspace/dashboard");
  return response.data;
};

export const getConsultationBundle = async (appointmentId) => {
  const response = await api.get(`/api/doctor-workspace/consultation-bundle/${appointmentId}`);
  return response.data;
};

export const concludeConsultation = async (consultationData) => {
  const response = await api.post("/api/doctor-workspace/conclude-consultation", consultationData);
  return response.data;
};

export const getDoctorPatientProfile = async (patientId) => {
  const response = await api.get(`/api/doctor-workspace/patient-profile/${patientId}`);
  return response.data;
};

export const getDoctorWorkspaceOrders = async (filters = {}) => {
  const response = await api.get("/api/doctor-workspace/orders", { params: filters });
  return response.data;
};

export const createDoctorWorkspaceOrder = async (orderData) => {
  const response = await api.post("/api/doctor-workspace/orders", orderData);
  return response.data;
};

export const getSpecialistReferrals = async (filters = {}) => {
  const response = await api.get("/api/doctor-workspace/referrals", { params: filters });
  return response.data;
};

export const createSpecialistReferral = async (referralData) => {
  const response = await api.post("/api/doctor-workspace/referrals", referralData);
  return response.data;
};

export const updateSpecialistReferralStatus = async (id, updateData) => {
  const response = await api.patch(`/api/doctor-workspace/referrals/${id}/status`, updateData);
  return response.data;
};

export const getCriticalLabResults = async (filters = {}) => {
  const response = await api.get("/api/doctor-workspace/critical-labs", { params: filters });
  return response.data;
};

export const acknowledgeCriticalLabResult = async (reportId, data = {}) => {
  const response = await api.post(`/api/doctor-workspace/acknowledge-lab/${reportId}`, data);
  return response.data;
};

export const getDoctorFollowUps = async (days = 14) => {
  const response = await api.get(`/api/doctor-workspace/follow-ups?days=${days}`);
  return response.data;
};

export const getSpecialistDirectory = async () => {
  const response = await api.get("/api/doctor-workspace/specialist-directory");
  return response.data;
};

// ── ADMIN OPERATIONS API ───────────────────────────────────────────────────
export const getAdminTelemetry = async () => {
  const response = await api.get("/api/admin/telemetry");
  return response.data;
};

export const getGlobalAdminSearch = async (query = "", type = "all") => {
  const response = await api.get("/api/admin/search", { params: { query, type } });
  return response.data;
};

export const getAdminStaff = async (params = {}) => {
  const response = await api.get("/api/admin/staff", { params });
  return response.data;
};

export const createAdminStaff = async (staffData) => {
  const response = await api.post("/api/admin/staff", staffData);
  return response.data;
};

export const updateAdminStaff = async (id, staffData) => {
  const response = await api.patch(`/api/admin/staff/${id}`, staffData);
  return response.data;
};

export const getAdminDepartments = async () => {
  const response = await api.get("/api/admin/departments");
  return response.data;
};

export const createAdminDepartment = async (deptData) => {
  const response = await api.post("/api/admin/departments", deptData);
  return response.data;
};

export const getAdminCalendarEvents = async (month, year) => {
  const response = await api.get("/api/admin/calendar", { params: { month, year } });
  return response.data;
};

export const getAdminRevenueAnalytics = async (range = "month") => {
  const response = await api.get("/api/admin/revenue", { params: { range } });
  return response.data;
};

export const getAdminInventory = async (params = {}) => {
  const response = await api.get("/api/admin/inventory", { params });
  return response.data;
};

export const createAdminInventory = async (inventoryData) => {
  const response = await api.post("/api/admin/inventory", inventoryData);
  return response.data;
};

export const updateAdminInventoryStock = async (id, stockData) => {
  const response = await api.patch(`/api/admin/inventory/${id}/stock`, stockData);
  return response.data;
};

export const getAdminEquipment = async (params = {}) => {
  const response = await api.get("/api/admin/equipment", { params });
  return response.data;
};

export const getAdminMaintenanceOrders = async (params = {}) => {
  const response = await api.get("/api/admin/maintenance", { params });
  return response.data;
};

export const createAdminMaintenanceOrder = async (orderData) => {
  const response = await api.post("/api/admin/maintenance", orderData);
  return response.data;
};

export const updateAdminMaintenanceOrderStatus = async (id, statusData) => {
  const response = await api.patch(`/api/admin/maintenance/${id}/status`, statusData);
  return response.data;
};

export const getAdminStaffAttendance = async (params = {}) => {
  const response = await api.get("/api/admin/attendance", { params });
  return response.data;
};

export const getAdminStaffLeaves = async (params = {}) => {
  const response = await api.get("/api/admin/leaves", { params });
  return response.data;
};

export const reviewAdminStaffLeave = async (id, reviewData) => {
  const response = await api.patch(`/api/admin/leaves/${id}/review`, reviewData);
  return response.data;
};

export const getAdminEmergencyOperations = async () => {
  const response = await api.get("/api/admin/emergency");
  return response.data;
};

export const getAdminOperatingTheatreSchedule = async (params = {}) => {
  const response = await api.get("/api/admin/operating-theatre", { params });
  return response.data;
};

export const createAdminProcedureSchedule = async (procedureData) => {
  const response = await api.post("/api/admin/operating-theatre", procedureData);
  return response.data;
};

export const getAdminAuditLogs = async (params = {}) => {
  const response = await api.get("/api/admin/audit-logs", { params });
  return response.data;
};

export const getAdminHospitalSettings = async () => {
  const response = await api.get("/api/admin/settings");
  return response.data;
};

export const updateAdminHospitalSettings = async (settingsData) => {
  const response = await api.patch("/api/admin/settings", settingsData);
  return response.data;
};

export default api;





