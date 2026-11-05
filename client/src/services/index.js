/**
 * Nivora Care HMS — Central Services Barrel
 *
 * Provides a scalable, single-responsibility API client architecture:
 * - Direct HTTP transport: `httpClient` (with auto-injected JWT and retry handling)
 * - Domain modules: `authApi`, `patientApi`, `billingApi`, `doctorApi`, etc.
 * - Facade re-export: all domain methods accessible directly from this barrel.
 */

export { default as httpClient } from "./httpClient.js";
export * from "./api.js";

