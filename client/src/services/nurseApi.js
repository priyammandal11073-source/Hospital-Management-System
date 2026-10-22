import httpClient from "./httpClient.js";

export const getNurseDashboardMetrics = async () => {
  const response = await httpClient.get("/api/nurse/dashboard-metrics");
  return response.data;
};

export const getInpatientsWithCare = async (filters = {}) => {
  const response = await httpClient.get("/api/nurse/inpatients", { params: filters });
  return response.data;
};

export const getClinicalPatientProfile = async (patientId) => {
  const response = await httpClient.get(`/api/nurse/patient-profile/${patientId}`);
  return response.data;
};

export const getNursingTasks = async (filters = {}) => {
  const response = await httpClient.get("/api/nurse/tasks", { params: filters });
  return response.data;
};

export const createNursingTask = async (taskData) => {
  const response = await httpClient.post("/api/nurse/tasks", taskData);
  return response.data;
};

export const updateNursingTaskStatus = async (id, updateData) => {
  const response = await httpClient.patch(`/api/nurse/tasks/${id}/status`, updateData);
  return response.data;
};

export const getNursingNotes = async (filters = {}) => {
  const response = await httpClient.get("/api/nurse/notes", { params: filters });
  return response.data;
};

export const createNursingNote = async (noteData) => {
  const response = await httpClient.post("/api/nurse/notes", noteData);
  return response.data;
};

export const getDoctorOrders = async (filters = {}) => {
  const response = await httpClient.get("/api/nurse/doctor-orders", { params: filters });
  return response.data;
};

export const updateDoctorOrderStatus = async (id, updateData) => {
  const response = await httpClient.patch(`/api/nurse/doctor-orders/${id}/status`, updateData);
  return response.data;
};

export const getIntakeOutputRecords = async (filters = {}) => {
  const response = await httpClient.get("/api/nurse/intake-output", { params: filters });
  return response.data;
};

export const createIntakeOutputRecord = async (recordData) => {
  const response = await httpClient.post("/api/nurse/intake-output", recordData);
  return response.data;
};

export const getPatientTransfers = async () => {
  const response = await httpClient.get("/api/nurse/transfers");
  return response.data;
};

export const createPatientTransfer = async (transferData) => {
  const response = await httpClient.post("/api/nurse/transfers", transferData);
  return response.data;
};

export const updatePatientTransferStatus = async (id, updateData) => {
  const response = await httpClient.patch(`/api/nurse/transfers/${id}/status`, updateData);
  return response.data;
};

export const getMyShiftInfo = async () => {
  const response = await httpClient.get("/api/nurse/shift");
  return response.data;
};

export const getHandovers = async () => {
  const response = await httpClient.get("/api/nurse/handovers");
  return response.data;
};

export const createHandover = async (handoverData) => {
  const response = await httpClient.post("/api/nurse/handovers", handoverData);
  return response.data;
};

export const acknowledgeHandover = async (id) => {
  const response = await httpClient.patch(`/api/nurse/handovers/${id}/acknowledge`);
  return response.data;
};

export const updateSampleStatus = async (id, data) => {
  const response = await httpClient.patch(`/api/lab-reports/${id}/sample-status`, data);
  return response.data;
};
