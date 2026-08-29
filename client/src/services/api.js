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
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("hms_token");

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

export default api;
