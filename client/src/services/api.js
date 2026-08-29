import axios from "axios";

/**
 * Shared HTTP client for all frontend API requests.
 * In development, an empty base URL lets Vite proxy /api requests to Express.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add the saved JWT to every request sent through this shared client.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("hms_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const loginUser = async (email, password) => {
  const response = await api.post("/api/auth/login", { email, password });
  return response.data;
};

export default api;
