import httpClient from "./httpClient.js";

export const getAdminTelemetry = async () => {
  const response = await httpClient.get("/api/admin/telemetry");
  return response.data;
};

export const getGlobalAdminSearch = async (query = "", type = "all") => {
  const response = await httpClient.get("/api/admin/search", { params: { query, type } });
  return response.data;
};

export const getAdminStaff = async (params = {}) => {
  const response = await httpClient.get("/api/admin/staff", { params });
  return response.data;
};

export const createAdminStaff = async (staffData) => {
  const response = await httpClient.post("/api/admin/staff", staffData);
  return response.data;
};

export const updateAdminStaff = async (id, staffData) => {
  const response = await httpClient.patch(`/api/admin/staff/${id}`, staffData);
  return response.data;
};

export const getAdminDepartments = async () => {
  const response = await httpClient.get("/api/admin/departments");
  return response.data;
};

export const createAdminDepartment = async (deptData) => {
  const response = await httpClient.post("/api/admin/departments", deptData);
  return response.data;
};

export const getAdminCalendarEvents = async (month, year) => {
  const response = await httpClient.get("/api/admin/calendar", { params: { month, year } });
  return response.data;
};

export const getAdminRevenueAnalytics = async (range = "month") => {
  const response = await httpClient.get("/api/admin/revenue", { params: { range } });
  return response.data;
};

export const getAdminInventory = async (params = {}) => {
  const response = await httpClient.get("/api/admin/inventory", { params });
  return response.data;
};

export const createAdminInventory = async (inventoryData) => {
  const response = await httpClient.post("/api/admin/inventory", inventoryData);
  return response.data;
};

export const updateAdminInventoryStock = async (id, stockData) => {
  const response = await httpClient.patch(`/api/admin/inventory/${id}/stock`, stockData);
  return response.data;
};

export const getAdminEquipment = async (params = {}) => {
  const response = await httpClient.get("/api/admin/equipment", { params });
  return response.data;
};

export const logPreventiveMaintenance = async (id, data) => {
  const response = await httpClient.post(`/api/admin/equipment/${id}/service`, data);
  return response.data;
};

export const getAdminMaintenanceOrders = async (params = {}) => {
  const response = await httpClient.get("/api/admin/maintenance", { params });
  return response.data;
};

export const createAdminMaintenanceOrder = async (orderData) => {
  const response = await httpClient.post("/api/admin/maintenance", orderData);
  return response.data;
};

export const updateAdminMaintenanceOrderStatus = async (id, statusData) => {
  const response = await httpClient.patch(`/api/admin/maintenance/${id}/status`, statusData);
  return response.data;
};

export const getAdminStaffAttendance = async (params = {}) => {
  const response = await httpClient.get("/api/admin/attendance", { params });
  return response.data;
};

export const getAdminStaffLeaves = async (params = {}) => {
  const response = await httpClient.get("/api/admin/leaves", { params });
  return response.data;
};

export const reviewAdminStaffLeave = async (id, reviewData) => {
  const response = await httpClient.patch(`/api/admin/leaves/${id}/review`, reviewData);
  return response.data;
};

export const getAdminEmergencyOperations = async () => {
  const response = await httpClient.get("/api/admin/emergency");
  return response.data;
};

export const getAdminOperatingTheatreSchedule = async (params = {}) => {
  const response = await httpClient.get("/api/admin/operating-theatre", { params });
  return response.data;
};

export const createAdminProcedureSchedule = async (procedureData) => {
  const response = await httpClient.post("/api/admin/operating-theatre", procedureData);
  return response.data;
};

export const getAdminAuditLogs = async (params = {}) => {
  const response = await httpClient.get("/api/admin/audit-logs", { params });
  return response.data;
};

export const getAdminHospitalSettings = async () => {
  const response = await httpClient.get("/api/admin/settings");
  return response.data;
};

export const updateAdminHospitalSettings = async (settingsData) => {
  const response = await httpClient.patch("/api/admin/settings", settingsData);
  return response.data;
};

export const getAdminInsuranceClaims = async (status = "") => {
  const params = status ? { status } : {};
  const response = await httpClient.get("/api/admin/insurance-claims", { params });
  return response.data;
};

export const decideInsuranceClaim = async (billingId, data) => {
  const response = await httpClient.patch(`/api/admin/insurance-claims/${billingId}/decision`, data);
  return response.data;
};

export const getAdminFeedback = async (status = "") => {
  const params = status ? { status } : {};
  const response = await httpClient.get("/api/admin/feedback", { params });
  return response.data;
};

export const reviewFeedback = async (id, data) => {
  const response = await httpClient.patch(`/api/admin/feedback/${id}/review`, data);
  return response.data;
};
