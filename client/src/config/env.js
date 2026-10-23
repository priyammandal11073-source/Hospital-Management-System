import { Capacitor } from "@capacitor/core";

/**
 * Centralized environment configuration for the HMS client.
 * Connects directly to Render backend in Android/Capacitor native builds,
 * while preserving relative /api proxying in Web/Vercel production.
 */
const RENDER_PROD_API_URL = "https://nivora-care-hospital.onrender.com/api";

const resolveApiBaseUrl = () => {
  const envUrl = import.meta.env?.VITE_API_BASE_URL;

  // 1. If running natively in Capacitor (Android/iOS webview),
  // there is no reverse-proxy server on localhost, so direct connection
  // to the production backend on Render is required.
  if (typeof window !== "undefined" && Capacitor.isNativePlatform()) {
    if (envUrl && envUrl.startsWith("http")) {
      return envUrl;
    }
    return RENDER_PROD_API_URL;
  }

  // 2. If explicitly built with Android mode (--mode android)
  if (import.meta.env?.MODE === "android" || import.meta.env?.VITE_BUILD_TARGET === "android") {
    return envUrl || RENDER_PROD_API_URL;
  }

  // 3. Web production (Vercel) or web development
  return envUrl || "";
};

const env = Object.freeze({
  apiBaseUrl: resolveApiBaseUrl(),
  razorpayKeyId: import.meta.env?.VITE_RAZORPAY_KEY_ID || "",
  appName: "Nivora Care Hospital",
});

export default env;
