import httpClient from "./httpClient.js";

export const getLabReports = async (filters = {}) => {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== "")
  );
  const response = await httpClient.get("/api/lab-reports", { params });
  return response.data;
};

export const getLabReportById = async (id) => {
  const response = await httpClient.get(`/api/lab-reports/${id}`);
  return response.data;
};

export const createLabReport = async (reportData) => {
  const response = await httpClient.post("/api/lab-reports", reportData);
  return response.data;
};

export const updateLabReport = async (id, reportData) => {
  const response = await httpClient.put(`/api/lab-reports/${id}`, reportData);
  return response.data;
};

export const deleteLabReport = async (id) => {
  const response = await httpClient.delete(`/api/lab-reports/${id}`);
  return response.data;
};
