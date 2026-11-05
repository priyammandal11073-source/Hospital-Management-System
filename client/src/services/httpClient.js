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
  const isPatientPortalPage = typeof window !== "undefined" && (
    window.location.pathname.startsWith("/patient") ||
    window.location.pathname.startsWith("/pay")
  );
  const isPatientRoute = isPatientPortalPage || url.includes("/patient-auth") || url.includes("/patient-portal");
  const token = isPatientRoute
    ? localStorage.getItem("patient_token") || localStorage.getItem("hms_token")
    : localStorage.getItem("hms_token") || localStorage.getItem("patient_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

const cleanRepeatedDr = (value, depth = 0) => {
  if (depth > 5 || value === null || value === undefined) return value;
  if (typeof value === "string") {
    if (value.length > 2 && value.length < 120 && /dr/i.test(value)) {
      return value.replace(/(?:^|\b)(?:dr\.?\s*){2,}/gi, "Dr. ");
    }
    return value;
  }
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      value[i] = cleanRepeatedDr(value[i], depth + 1);
    }
    return value;
  }
  if (typeof value === "object") {
    if (typeof Blob !== "undefined" && value instanceof Blob) return value;
    if (typeof ArrayBuffer !== "undefined" && value instanceof ArrayBuffer) return value;
    for (const key of Object.keys(value)) {
      value[key] = cleanRepeatedDr(value[key], depth + 1);
    }
    return value;
  }
  return value;
};

httpClient.interceptors.response.use(
  (response) => {
    if (response.data) {
      response.data = cleanRepeatedDr(response.data);
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Clear expired credentials from storage
      localStorage.removeItem("hms_token");
      localStorage.removeItem("hms_user");
      localStorage.removeItem("patient_token");
      localStorage.removeItem("patient_user");
    }
    return Promise.reject(error);
  }
);

export default httpClient;
