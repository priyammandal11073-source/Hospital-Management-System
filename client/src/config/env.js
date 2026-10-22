/**
 * Centralized environment configuration for the HMS client.
 */
const env = Object.freeze({
  apiBaseUrl: import.meta.env?.VITE_API_BASE_URL || "",
  razorpayKeyId: import.meta.env?.VITE_RAZORPAY_KEY_ID || "rzp_test_TZavagxglGTRZp",
  appName: "Nivora Care HMS",
});

export default env;
