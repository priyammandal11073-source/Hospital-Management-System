import httpClient from "./httpClient.js";

export const loginUser = async (email, password) => {
  const response = await httpClient.post("/api/auth/login", { email, password });
  return response.data;
};

export const sendRegistrationOtp = async ({ contactNumber, email }) => {
  const response = await httpClient.post("/api/patient-auth/otp/send", { contactNumber, email });
  return response.data;
};

export const registerPatient = async (patientData) => {
  const response = await httpClient.post("/api/patient-auth/register", patientData);
  return response.data;
};

export const loginPatient = async (email, password) => {
  const response = await httpClient.post("/api/patient-auth/login", { email, password });
  return response.data;
};

export const sendForgotPasswordOtp = async (email) => {
  const response = await httpClient.post("/api/patient-auth/forgot-password", { email });
  return response.data;
};

export const resetPatientPassword = async ({ email, otp, newPassword }) => {
  const response = await httpClient.post("/api/patient-auth/reset-password", { email, otp, newPassword });
  return response.data;
};
