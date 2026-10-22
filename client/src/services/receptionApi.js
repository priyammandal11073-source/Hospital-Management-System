import httpClient from "./httpClient.js";

export const getReceptionistTelemetry = async () => {
  const response = await httpClient.get("/api/receptionist/telemetry");
  return response.data;
};

export const getFrontDeskWorkQueue = async (category = "all") => {
  const response = await httpClient.get("/api/receptionist/work-queue", { params: { category } });
  return response.data;
};

export const checkDuplicatePatient = async (params) => {
  const response = await httpClient.get("/api/receptionist/duplicate-check", { params });
  return response.data;
};

export const checkInPatient = async (appointmentId) => {
  const response = await httpClient.post(`/api/receptionist/check-in/${appointmentId}`);
  return response.data;
};

export const createWalkInAppointment = async (appointmentData) => {
  const response = await httpClient.post("/api/receptionist/walk-in", appointmentData);
  return response.data;
};

export const getWaitingRoomQueue = async (params = {}) => {
  const response = await httpClient.get("/api/receptionist/waiting-room", { params });
  return response.data;
};

export const updateWaitingRoomStatus = async (appointmentId, status) => {
  const response = await httpClient.patch(`/api/receptionist/waiting-room/${appointmentId}/status`, { status });
  return response.data;
};

export const getDoctorAvailability = async (doctorId, date) => {
  const response = await httpClient.get("/api/receptionist/doctor-availability", { params: { doctorId, date } });
  return response.data;
};

export const getOnlineBookings = async (params = {}) => {
  const response = await httpClient.get("/api/receptionist/online-bookings", { params });
  return response.data;
};

export const confirmOnlineBooking = async (appointmentId, data) => {
  const response = await httpClient.patch(`/api/receptionist/online-bookings/${appointmentId}/confirm`, data);
  return response.data;
};

export const getDischargeQueue = async () => {
  const response = await httpClient.get("/api/receptionist/discharges");
  return response.data;
};

export const getDailyFrontDeskSummary = async (date) => {
  const response = await httpClient.get("/api/receptionist/daily-summary", { params: { date } });
  return response.data;
};

export const getDeskHandovers = async () => {
  const response = await httpClient.get("/api/receptionist/handover");
  return response.data;
};

export const createDeskHandover = async (handoverData) => {
  const response = await httpClient.post("/api/receptionist/handover", handoverData);
  return response.data;
};

export const acknowledgeDeskHandover = async (id) => {
  const response = await httpClient.patch(`/api/receptionist/handover/${id}/acknowledge`);
  return response.data;
};

export const processBillingRefund = async (billingId, data) => {
  const response = await httpClient.post(`/api/receptionist/refund/${billingId}`, data);
  return response.data;
};

export const sendAdministrativeNotification = async (data) => {
  const response = await httpClient.post("/api/receptionist/notification", data);
  return response.data;
};

export const getAppointmentReminders = async () => {
  const response = await httpClient.get("/api/receptionist/reminders");
  return response.data;
};

export const sendAppointmentReminder = async (appointmentId) => {
  const response = await httpClient.post(`/api/receptionist/reminders/${appointmentId}/send`);
  return response.data;
};
