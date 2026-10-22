import httpClient from "./httpClient.js";

export const getPatientVitals = async (patientId) => {
  const response = await httpClient.get(`/api/vitals/${patientId}`);
  return response.data;
};

export const recordVitals = async (vitalsData) => {
  const response = await httpClient.post("/api/vitals", vitalsData);
  return response.data;
};

export const recordPatientVitals = recordVitals;

export const deleteVitals = async (id) => {
  const response = await httpClient.delete(`/api/vitals/${id}`);
  return response.data;
};

export const getRecentVitalsAlerts = async () => {
  const response = await httpClient.get("/api/vitals/alerts/recent");
  return response.data;
};
