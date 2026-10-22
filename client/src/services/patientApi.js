import httpClient from "./httpClient.js";

// ── Staff Patient CRUD ──────────────────────────────────────────────────────
export const getPatients = async (searchQuery = "", page = 1, limit = 10) => {
  const params = { page, limit };
  if (searchQuery.trim()) {
    params.search = searchQuery.trim();
  }
  const response = await httpClient.get("/api/patients", { params });
  return response.data;
};

export const getPatientById = async (id) => {
  const response = await httpClient.get(`/api/patients/${id}`);
  return response.data;
};

export const createPatient = async (patientData) => {
  const response = await httpClient.post("/api/patients", patientData);
  return response.data;
};

export const updatePatient = async (id, patientData) => {
  const response = await httpClient.put(`/api/patients/${id}`, patientData);
  return response.data;
};

export const deletePatient = async (id) => {
  const response = await httpClient.delete(`/api/patients/${id}`);
  return response.data;
};

// ── Patient Self-Service Portal ─────────────────────────────────────────────
export const getMyProfile = async () => {
  const response = await httpClient.get("/api/patient-portal/me");
  return response.data;
};

export const getMyAppointments = async (filters = {}) => {
  const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
  const response = await httpClient.get("/api/patient-portal/appointments", { params });
  return response.data;
};

export const getMyPatients = async () => {
  const response = await httpClient.get("/api/doctor/patients");
  return response.data;
};

export const bookMyAppointment = async (appointmentData) => {
  const response = await httpClient.post("/api/patient-portal/appointments", appointmentData);
  return response.data;
};

export const cancelMyAppointment = async (id) => {
  const response = await httpClient.patch(`/api/patient-portal/appointments/${id}/cancel`);
  return response.data;
};

export const getMyBillings = async () => {
  const response = await httpClient.get("/api/patient-portal/billings");
  return response.data;
};

export const payMyBillingUpi = async (id, paymentData = {}) => {
  const response = await httpClient.patch(`/api/patient-portal/billings/${id}/pay-upi`, paymentData);
  return response.data;
};

export const getPatientDashboardSummary = async () => {
  const response = await httpClient.get("/api/patient-portal/dashboard");
  return response.data;
};

export const rescheduleMyAppointment = async (id, data) => {
  const response = await httpClient.patch(`/api/patient-portal/appointments/${id}/reschedule`, data);
  return response.data;
};

export const getPatientDoctors = async (filters = {}) => {
  const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
  const response = await httpClient.get("/api/patient-portal/doctors", { params });
  return response.data;
};

export const getPatientDoctorById = async (id) => {
  const response = await httpClient.get(`/api/patient-portal/doctors/${id}`);
  return response.data;
};

export const getMyMedicalRecords = async (filters = {}) => {
  const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
  const response = await httpClient.get("/api/patient-portal/records", { params });
  return response.data;
};

export const getMyMedicalTimeline = async () => {
  const response = await httpClient.get("/api/patient-portal/timeline");
  return response.data;
};

export const getMyActiveMedicines = async () => {
  const response = await httpClient.get("/api/patient-portal/medicines");
  return response.data;
};

export const getMyConsultations = async () => {
  const response = await httpClient.get("/api/patient-portal/consultations");
  return response.data;
};

export const getMyConsultationSummary = async (id) => {
  const response = await httpClient.get(`/api/patient-portal/consultations/${id}`);
  return response.data;
};

export const getMyFollowUps = async () => {
  const response = await httpClient.get("/api/patient-portal/follow-ups");
  return response.data;
};

export const getMyReferrals = async () => {
  const response = await httpClient.get("/api/patient-portal/referrals");
  return response.data;
};

export const getMyAdmissions = async () => {
  const response = await httpClient.get("/api/patient-portal/admissions");
  return response.data;
};

export const getMyDocuments = async () => {
  const response = await httpClient.get("/api/patient-portal/documents");
  return response.data;
};

export const updateMyProfile = async (profileData) => {
  const response = await httpClient.patch("/api/patient-portal/me", profileData);
  return response.data;
};

export const submitPatientFeedback = async (feedbackData) => {
  const response = await httpClient.post("/api/patient-portal/feedback", feedbackData);
  return response.data;
};

export const getMyFeedback = async () => {
  const response = await httpClient.get("/api/patient-portal/feedback");
  return response.data;
};

export const getMyPrescriptions = async () => {
  const response = await httpClient.get("/api/patient-portal/prescriptions");
  return response.data;
};

export const getMyBedStay = async () => {
  const response = await httpClient.get("/api/patient-portal/bed");
  return response.data;
};

export const getMyVitals = async () => {
  const response = await httpClient.get("/api/patient-portal/vitals");
  return response.data;
};

export const recordMyVitals = async (vitalsData) => {
  const response = await httpClient.post("/api/patient-portal/vitals", vitalsData);
  return response.data;
};

export const getMyLabReports = async () => {
  const response = await httpClient.get("/api/patient-portal/lab-reports");
  return response.data;
};

export const getMyLabReportById = async (id) => {
  const response = await httpClient.get(`/api/patient-portal/lab-reports/${id}`);
  return response.data;
};

export const getMyTelemedicine = async () => {
  const response = await httpClient.get("/api/patient-portal/telemedicine");
  return response.data;
};
