import httpClient from "./httpClient.js";

export const getDoctors = async (specialization = "", department = "") => {
  const params = {};
  if (specialization) params.specialization = specialization;
  if (department) params.department = department;

  const response = await httpClient.get("/api/doctors", { params });
  return response.data;
};

export const getMyDoctorProfile = async () => {
  const response = await httpClient.get("/api/doctors/me");
  return response.data;
};

export const getDoctorById = async (id) => {
  const response = await httpClient.get(`/api/doctors/${id}`);
  return response.data;
};

export const createDoctor = async (doctorData) => {
  const response = await httpClient.post("/api/doctors", doctorData);
  return response.data;
};

export const updateDoctor = async (id, doctorData) => {
  const response = await httpClient.put(`/api/doctors/${id}`, doctorData);
  return response.data;
};

export const deleteDoctor = async (id) => {
  const response = await httpClient.delete(`/api/doctors/${id}`);
  return response.data;
};

export const updateDoctorSchedule = async (doctorId, scheduleData) => {
  const response = await httpClient.put(`/api/doctors/${doctorId}/schedule`, scheduleData);
  return response.data;
};

export const addDoctorLeave = async (doctorId, leaveData) => {
  const response = await httpClient.post(`/api/doctors/${doctorId}/leaves`, leaveData);
  return response.data;
};

export const removeDoctorLeave = async (doctorId, leaveIndex) => {
  const response = await httpClient.delete(`/api/doctors/${doctorId}/leaves/${leaveIndex}`);
  return response.data;
};

export const getDoctorDashboardData = async () => {
  const response = await httpClient.get("/api/doctor-workspace/dashboard");
  return response.data;
};

export const getConsultationBundle = async (appointmentId) => {
  const response = await httpClient.get(`/api/doctor-workspace/consultation-bundle/${appointmentId}`);
  return response.data;
};

export const concludeConsultation = async (consultationData) => {
  const response = await httpClient.post("/api/doctor-workspace/conclude-consultation", consultationData);
  return response.data;
};

export const getDoctorPatientProfile = async (patientId) => {
  const response = await httpClient.get(`/api/doctor-workspace/patient-profile/${patientId}`);
  return response.data;
};

export const getDoctorWorkspaceOrders = async (filters = {}) => {
  const response = await httpClient.get("/api/doctor-workspace/orders", { params: filters });
  return response.data;
};

export const createDoctorWorkspaceOrder = async (orderData) => {
  const response = await httpClient.post("/api/doctor-workspace/orders", orderData);
  return response.data;
};

export const getSpecialistReferrals = async (filters = {}) => {
  const response = await httpClient.get("/api/doctor-workspace/referrals", { params: filters });
  return response.data;
};

export const createSpecialistReferral = async (referralData) => {
  const response = await httpClient.post("/api/doctor-workspace/referrals", referralData);
  return response.data;
};

export const updateSpecialistReferralStatus = async (id, updateData) => {
  const response = await httpClient.patch(`/api/doctor-workspace/referrals/${id}/status`, updateData);
  return response.data;
};

export const getCriticalLabResults = async (filters = {}) => {
  const response = await httpClient.get("/api/doctor-workspace/critical-labs", { params: filters });
  return response.data;
};

export const acknowledgeCriticalLabResult = async (reportId, data = {}) => {
  const response = await httpClient.post(`/api/doctor-workspace/acknowledge-lab/${reportId}`, data);
  return response.data;
};

export const getDoctorFollowUps = async (days = 14) => {
  const response = await httpClient.get(`/api/doctor-workspace/follow-ups?days=${days}`);
  return response.data;
};

export const getSpecialistDirectory = async () => {
  const response = await httpClient.get("/api/doctor-workspace/specialist-directory");
  return response.data;
};

export const getDoctorTeleconsults = async () => {
  const response = await httpClient.get("/api/doctor-workspace/telemedicine");
  return response.data;
};

export const startTeleconsult = async (id) => {
  const response = await httpClient.post(`/api/doctor-workspace/telemedicine/${id}/start`);
  return response.data;
};

export const endTeleconsult = async (id) => {
  const response = await httpClient.post(`/api/doctor-workspace/telemedicine/${id}/end`);
  return response.data;
};
