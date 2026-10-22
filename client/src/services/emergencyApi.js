import httpClient from "./httpClient.js";

export const searchPatientsForEmergency = async (q) => {
  const response = await httpClient.get("/api/emergency/search-patients", { params: { q } });
  return response.data;
};

export const createEmergencyEncounter = async (data) => {
  const response = await httpClient.post("/api/emergency", data);
  return response.data;
};

export const getEmergencyDashboard = async () => {
  const response = await httpClient.get("/api/emergency/dashboard");
  return response.data;
};

export const getEmergencyQueue = async (params = {}) => {
  const response = await httpClient.get("/api/emergency", { params });
  return response.data;
};

export const getEmergencyById = async (id) => {
  const response = await httpClient.get(`/api/emergency/${id}`);
  return response.data;
};

export const updateEmergencyTriage = async (id, data) => {
  const response = await httpClient.post(`/api/emergency/${id}/triage`, data);
  return response.data;
};

export const addEmergencyVitals = async (id, data) => {
  const response = await httpClient.post(`/api/emergency/${id}/vitals`, data);
  return response.data;
};

export const addEmergencyNote = async (id, data) => {
  const response = await httpClient.post(`/api/emergency/${id}/notes`, data);
  return response.data;
};

export const assignEmergencyDoctor = async (id, doctorId) => {
  const response = await httpClient.patch(`/api/emergency/${id}/assign-doctor`, { doctorId });
  return response.data;
};

export const assignEmergencyNurse = async (id, data) => {
  const response = await httpClient.patch(`/api/emergency/${id}/assign-nurse`, data);
  return response.data;
};

export const updateEmergencyStatus = async (id, data) => {
  const response = await httpClient.patch(`/api/emergency/${id}/status`, data);
  return response.data;
};

export const createEmergencyDiagnosticOrder = async (id, data) => {
  const response = await httpClient.post(`/api/emergency/${id}/orders`, data);
  return response.data;
};

export const createEmergencyPrescription = async (id, data) => {
  const response = await httpClient.post(`/api/emergency/${id}/prescription`, data);
  return response.data;
};

export const updateEmergencyObservation = async (id, data) => {
  const response = await httpClient.post(`/api/emergency/${id}/observation`, data);
  return response.data;
};

export const addEmergencyProcedure = async (id, data) => {
  const response = await httpClient.post(`/api/emergency/${id}/procedures`, data);
  return response.data;
};

export const admitEmergencyPatient = async (id, data) => {
  const response = await httpClient.post(`/api/emergency/${id}/admit`, data);
  return response.data;
};

export const transferEmergencyPatient = async (id, data) => {
  const response = await httpClient.post(`/api/emergency/${id}/transfer`, data);
  return response.data;
};

export const dischargeEmergencyPatient = async (id, data) => {
  const response = await httpClient.post(`/api/emergency/${id}/discharge`, data);
  return response.data;
};

export const getEmergencyBeds = async () => {
  const response = await httpClient.get("/api/emergency/beds");
  return response.data;
};

export const getEmergencyReports = async () => {
  const response = await httpClient.get("/api/emergency/reports/summary");
  return response.data;
};
