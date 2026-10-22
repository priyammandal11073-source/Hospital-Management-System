import httpClient from "./httpClient.js";

export const getNotifications = async () => {
  const isPatient = Boolean(localStorage.getItem("patient_token"));
  const url = isPatient ? "/api/patient-portal/notifications" : "/api/notifications";
  const response = await httpClient.get(url);
  return response.data;
};

export const markNotificationRead = async (id) => {
  const isPatient = Boolean(localStorage.getItem("patient_token"));
  const url = isPatient
    ? `/api/patient-portal/notifications/${id}/read`
    : `/api/notifications/${id}/read`;
  const response = await httpClient.patch(url);
  return response.data;
};

export const markAllNotificationsRead = async () => {
  const isPatient = Boolean(localStorage.getItem("patient_token"));
  const url = isPatient
    ? "/api/patient-portal/notifications/read-all"
    : "/api/notifications/read-all";
  const response = await httpClient.patch(url);
  return response.data;
};
