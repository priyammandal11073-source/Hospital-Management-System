import httpClient from "./httpClient.js";

export const getPrescriptions = async (filters = {}) => {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== "")
  );
  const response = await httpClient.get("/api/prescriptions", { params });
  return response.data;
};

export const getPrescriptionById = async (id) => {
  const response = await httpClient.get(`/api/prescriptions/${id}`);
  return response.data;
};

export const createPrescription = async (prescriptionData) => {
  const response = await httpClient.post("/api/prescriptions", prescriptionData);
  return response.data;
};

export const updatePrescription = async (id, prescriptionData) => {
  const response = await httpClient.put(`/api/prescriptions/${id}`, prescriptionData);
  return response.data;
};

export const deletePrescription = async (id) => {
  const response = await httpClient.delete(`/api/prescriptions/${id}`);
  return response.data;
};

export const sendPrescriptionEmail = async (id) => {
  const response = await httpClient.post(`/api/prescriptions/${id}/send-email`);
  return response.data;
};

export const administerMedication = async (id, adminData) => {
  const response = await httpClient.post(`/api/prescriptions/${id}/administer`, adminData);
  return response.data;
};
