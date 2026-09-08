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

export default api;


