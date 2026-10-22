import httpClient from "./httpClient.js";

export const getPharmacyTelemetry = async () => {
  const response = await httpClient.get("/api/pharmacy/telemetry");
  return response.data;
};

export const getPharmacyAlerts = async () => {
  const response = await httpClient.get("/api/pharmacy/alerts");
  return response.data;
};

export const getPrescriptionQueue = async (filters = {}) => {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== undefined && v !== "")
  );
  const response = await httpClient.get("/api/pharmacy/queue", { params });
  return response.data;
};

export const getPrescriptionForDispensing = async (id) => {
  const response = await httpClient.get(`/api/pharmacy/dispense/${id}`);
  return response.data;
};

export const dispensePrescription = async (id, data) => {
  const response = await httpClient.post(`/api/pharmacy/dispense/${id}`, data);
  return response.data;
};

export const flagPrescriptionIssue = async (id, data) => {
  const response = await httpClient.post(`/api/pharmacy/flag-prescription/${id}`, data);
  return response.data;
};

export const getPharmacyInventory = async (filters = {}) => {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== undefined && v !== "")
  );
  const response = await httpClient.get("/api/pharmacy/inventory", { params });
  return response.data;
};

export const addOrUpdateMedicine = async (data) => {
  const response = await httpClient.post("/api/pharmacy/inventory", data);
  return response.data;
};

export const getBatches = async () => {
  const response = await httpClient.get("/api/pharmacy/batches");
  return response.data;
};

export const getStockMovements = async () => {
  const response = await httpClient.get("/api/pharmacy/stock-movements");
  return response.data;
};

export const recordStockAdjustment = async (data) => {
  const response = await httpClient.post("/api/pharmacy/adjust-stock", data);
  return response.data;
};

export const getSuppliers = async () => {
  const response = await httpClient.get("/api/pharmacy/suppliers");
  return response.data;
};

export const createSupplier = async (data) => {
  const response = await httpClient.post("/api/pharmacy/suppliers", data);
  return response.data;
};

export const getPurchaseOrders = async () => {
  const response = await httpClient.get("/api/pharmacy/purchase-orders");
  return response.data;
};

export const createPurchaseOrder = async (data) => {
  const response = await httpClient.post("/api/pharmacy/purchase-orders", data);
  return response.data;
};

export const receivePurchaseOrder = async (id, data) => {
  const response = await httpClient.post(`/api/pharmacy/goods-receipt/${id}`, data);
  return response.data;
};

export const getPharmacyReturns = async () => {
  const response = await httpClient.get("/api/pharmacy/returns");
  return response.data;
};

export const processPharmacyReturn = async (data) => {
  const response = await httpClient.post("/api/pharmacy/returns", data);
  return response.data;
};

export const getPharmacyStaff = async () => {
  const response = await httpClient.get("/api/pharmacy/staff");
  return response.data;
};
