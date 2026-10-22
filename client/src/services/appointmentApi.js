import httpClient from "./httpClient.js";

export const getAppointments = async (filters = {}) => {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value)
  );
  const response = await httpClient.get("/api/appointments", { params });
  return response.data;
};

export const getAppointmentById = async (id) => {
  const response = await httpClient.get(`/api/appointments/${id}`);
  return response.data;
};

export const createAppointment = async (appointmentData) => {
  const response = await httpClient.post("/api/appointments", appointmentData);
  return response.data;
};

export const updateAppointmentStatus = async (id, status) => {
  const response = await httpClient.patch(`/api/appointments/${id}/status`, { status });
  return response.data;
};

export const updateAppointmentChecklist = async (id, prepChecklist) => {
  const response = await httpClient.patch(`/api/appointments/${id}/checklist`, { prepChecklist });
  return response.data;
};

export const deleteAppointment = async (id) => {
  const response = await httpClient.delete(`/api/appointments/${id}`);
  return response.data;
};
