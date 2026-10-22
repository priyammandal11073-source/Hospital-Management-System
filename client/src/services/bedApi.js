import httpClient from "./httpClient.js";

export const getBeds = async (filters = {}) => {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== "")
  );
  const response = await httpClient.get("/api/beds", { params });
  return response.data;
};

export const getBedSummary = async () => {
  const response = await httpClient.get("/api/beds/summary");
  return response.data;
};

export const getBedById = async (id) => {
  const response = await httpClient.get(`/api/beds/${id}`);
  return response.data;
};

export const createBed = async (bedData) => {
  const response = await httpClient.post("/api/beds", bedData);
  return response.data;
};

export const allocateBed = async (id, allocationData) => {
  const response = await httpClient.post(`/api/beds/${id}/allocate`, allocationData);
  return response.data;
};

export const transferBed = async (id, transferData) => {
  const response = await httpClient.post(`/api/beds/${id}/transfer`, transferData);
  return response.data;
};

export const dischargeBed = async (id, dischargeData) => {
  const response = await httpClient.post(`/api/beds/${id}/discharge`, dischargeData);
  return response.data;
};

export const updateBedStatus = async (id, status) => {
  const response = await httpClient.patch(`/api/beds/${id}/status`, { status });
  return response.data;
};

export const deleteBed = async (id) => {
  const response = await httpClient.delete(`/api/beds/${id}`);
  return response.data;
};
