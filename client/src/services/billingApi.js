import httpClient from "./httpClient.js";

export const getBillings = async (filters = {}) => {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value)
  );
  const response = await httpClient.get("/api/billing", { params });
  return response.data;
};

export const getBillingById = async (id) => {
  const response = await httpClient.get(`/api/billing/${id}`);
  return response.data;
};

export const createBilling = async (billingData) => {
  const response = await httpClient.post("/api/billing", billingData);
  return response.data;
};

export const updatePaymentStatus = async (id, statusData) => {
  const response = await httpClient.patch(`/api/billing/${id}/payment`, statusData);
  return response.data;
};

export const getRevenueSummary = async () => {
  const response = await httpClient.get("/api/billing/summary");
  return response.data;
};

export const sendBillingEmail = async (id) => {
  const response = await httpClient.post(`/api/billing/${id}/send-email`);
  return response.data;
};

export const sendBillingPaymentLinkSms = async (id, phoneNumber) => {
  const response = await httpClient.post(`/api/billing/${id}/send-sms`, phoneNumber ? { phoneNumber } : {});
  return response.data;
};

export const createRazorpayOrder = async (billingId) => {
  const response = await httpClient.post("/api/razorpay/create-order", { billingId });
  return response.data;
};

export const verifyRazorpayPayment = async (paymentData) => {
  const response = await httpClient.post("/api/razorpay/verify-payment", paymentData);
  return response.data;
};

export const getRevenueAnalytics = async () => {
  const response = await httpClient.get("/api/billing/analytics");
  return response.data;
};
