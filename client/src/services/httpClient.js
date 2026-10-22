import axios from "axios";
import env from "../config/env.js";

/**
 * Core HTTP client for all frontend API requests.
 * Configured with base URL, authentication interceptor, and name cleaning interceptor.
 */
const httpClient = axios.create({
  baseURL: env.apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Add the saved JWT to every request sent through this shared client.
// Staff token (hms_token) and patient token (patient_token) are kept separate
// so both sessions can coexist in the same browser.
httpClient.interceptors.request.use((config) => {
  const url = config.url || "";
  const isPatientRoute = url.includes("/patient-auth") || url.includes("/patient-portal");
  const token = isPatientRoute
    ? localStorage.getItem("patient_token") || localStorage.getItem("hms_token")
    : localStorage.getItem("hms_token") || localStorage.getItem("patient_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

const cleanRepeatedDr = (value) => {
  if (typeof value === "string") {
    return value.replace(/(?:^|\b)(?:dr\.?\s*){2,}/gi, "Dr. ");
  }
  if (Array.isArray(value)) {
    return value.map(cleanRepeatedDr);
  }
  if (value !== null && typeof value === "object") {
    if (typeof Blob !== "undefined" && value instanceof Blob) return value;
    if (typeof ArrayBuffer !== "undefined" && value instanceof ArrayBuffer) return value;
    const cleaned = {};
    for (const key of Object.keys(value)) {
      cleaned[key] = cleanRepeatedDr(value[key]);
    }
    return cleaned;
  }
  return value;
};

httpClient.interceptors.response.use((response) => {
  if (response.data) {
    response.data = cleanRepeatedDr(response.data);
  }
  return response;
});

export default httpClient;
