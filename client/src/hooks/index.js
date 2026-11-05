/**
 * Nivora Care HMS — Custom Hooks Barrel
 *
 * Separates business logic, state mutations, and API lifecycle from UI presentation.
 */

export { default as useDebounce } from "./useDebounce.js";
export { default as useMediaQuery, useIsMobile, useIsTablet, useIsDesktop } from "./useMediaQuery.js";
export { default as useNotifications } from "./useNotifications.js";
export { default as usePatients } from "./usePatients.js";
export { default as useAppointments } from "./useAppointments.js";
export { default as useBilling } from "./useBilling.js";
export { default as useBeds } from "./useBeds.js";
export { default as useVitals } from "./useVitals.js";
export { default as usePageTitle } from "./usePageTitle.js";

