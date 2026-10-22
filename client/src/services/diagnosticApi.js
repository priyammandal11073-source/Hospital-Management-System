import httpClient from "./httpClient.js";

export const getDiagnosticDashboard = async () => {
  const response = await httpClient.get("/api/diagnostics/dashboard");
  return response.data;
};

export const getDiagnosticTests = async (params = {}) => {
  const response = await httpClient.get("/api/diagnostics/tests", { params });
  return response.data;
};

export const getDiagnosticTestById = async (id) => {
  const response = await httpClient.get(`/api/diagnostics/tests/${id}`);
  return response.data;
};

export const createDiagnosticTest = async (data) => {
  const response = await httpClient.post("/api/diagnostics/tests", data);
  return response.data;
};

export const getDiagnosticRequests = async (params = {}) => {
  const response = await httpClient.get("/api/diagnostics/requests", { params });
  return response.data;
};

export const createDiagnosticRequest = async (data) => {
  const response = await httpClient.post("/api/diagnostics/requests", data);
  return response.data;
};

export const updateDiagnosticRequestStatus = async (id, data) => {
  const response = await httpClient.patch(`/api/diagnostics/requests/${id}/status`, data);
  return response.data;
};

export const getDiagnosticSamples = async (params = {}) => {
  const response = await httpClient.get("/api/diagnostics/samples", { params });
  return response.data;
};

export const collectDiagnosticSample = async (data) => {
  const response = await httpClient.post("/api/diagnostics/samples/collect", data);
  return response.data;
};

export const updateDiagnosticSampleStatus = async (id, data) => {
  const response = await httpClient.patch(`/api/diagnostics/samples/${id}/status`, data);
  return response.data;
};

export const enterDiagnosticResults = async (data) => {
  const response = await httpClient.post("/api/diagnostics/results/enter", data);
  return response.data;
};

export const getDiagnosticReports = async (params = {}) => {
  const response = await httpClient.get("/api/diagnostics/reports", { params });
  return response.data;
};

export const getDiagnosticReportById = async (id) => {
  const response = await httpClient.get(`/api/diagnostics/reports/${id}`);
  return response.data;
};

export const reviewAndApproveDiagnosticReport = async (id, data) => {
  const response = await httpClient.post(`/api/diagnostics/reports/${id}/review`, data);
  return response.data;
};

export const getCriticalDiagnosticResults = async () => {
  const response = await httpClient.get("/api/diagnostics/critical-results");
  return response.data;
};

export const acknowledgeCriticalDiagnosticResult = async (id, data = {}) => {
  const response = await httpClient.post(`/api/diagnostics/critical-results/${id}/acknowledge`, data);
  return response.data;
};

export const getDiagnosticEquipment = async () => {
  const response = await httpClient.get("/api/diagnostics/equipment");
  return response.data;
};

export const getDiagnosticInventory = async () => {
  const response = await httpClient.get("/api/diagnostics/inventory");
  return response.data;
};

export const uploadDiagnosticMedicalFile = async (formData) => {
  const response = await httpClient.post("/api/diagnostics/files/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const deleteDiagnosticMedicalFile = async (fileId) => {
  const response = await httpClient.delete(`/api/diagnostics/files/${fileId}`);
  return response.data;
};

export const getDiagnosticAuditLogs = async (params = {}) => {
  const response = await httpClient.get("/api/diagnostics/audit-logs", { params });
  return response.data;
};

export const logPrintAction = async (data) => {
  const response = await httpClient.post("/api/diagnostics/prints/log", data);
  return response.data;
};

export const getPrintHistory = async (params = {}) => {
  const response = await httpClient.get("/api/diagnostics/prints/history", { params });
  return response.data;
};

export const reprintDiagnosticReport = async (id, data) => {
  const response = await httpClient.post(`/api/diagnostics/reports/${id}/reprint`, data);
  return response.data;
};

export const amendDiagnosticReport = async (id, data) => {
  const response = await httpClient.post(`/api/diagnostics/reports/${id}/amend`, data);
  return response.data;
};

export const publishDiagnosticReport = async (id) => {
  const response = await httpClient.patch(`/api/diagnostics/reports/${id}/publish`);
  return response.data;
};

export const getRadiologyStudyDetails = async (studyId) => {
  const response = await httpClient.get(`/api/diagnostics/radiology/studies/${studyId}`);
  return response.data;
};

export const getPathologyRecordDetails = async (recordId) => {
  const response = await httpClient.get(`/api/diagnostics/pathology/records/${recordId}`);
  return response.data;
};

export const downloadDiagnosticReportPdfBlob = async (id) => {
  const response = await httpClient.get(`/api/diagnostics/reports/${id}/pdf`, {
    responseType: "blob",
  });
  return response.data;
};

export const generateRadiologyFilmPdfBlob = async (data) => {
  const response = await httpClient.post("/api/diagnostics/films/generate-pdf", data, {
    responseType: "blob",
  });
  return response.data;
};

export const createWalkInDiagnostic = async (data) => {
  const response = await httpClient.post("/api/receptionist/walk-in-diagnostic", data);
  return response.data;
};
