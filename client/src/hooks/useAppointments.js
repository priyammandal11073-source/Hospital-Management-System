import { useState, useEffect, useCallback } from "react";
import {
  getAppointments,
  createAppointment,
  updateAppointmentStatus,
  cancelMyAppointment,
} from "../services/api.js";
import { getErrorMessage } from "../utils/errorHandler.js";
import { toast } from "../utils/toast.js";

/**
 * useAppointments hook
 * Encapsulates clinical appointment schedule management, status transitions, and filtering.
 */
export function useAppointments(filters = {}) {
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState(filters.status || "all");
  const [dateFilter, setDateFilter] = useState(filters.date || "");

  const fetchAppointments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAppointments();
      let list = Array.isArray(data) ? data : data?.appointments || [];

      if (statusFilter !== "all") {
        list = list.filter((a) => a.status?.toLowerCase() === statusFilter.toLowerCase());
      }

      if (dateFilter) {
        list = list.filter((a) => a.appointmentDate?.startsWith(dateFilter));
      }

      setAppointments(list);
    } catch (err) {
      const msg = getErrorMessage(err, "Failed to load clinical appointments.");
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, dateFilter]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const bookAppointment = async (payload) => {
    try {
      const created = await createAppointment(payload);
      toast.success("Appointment scheduled successfully!");
      fetchAppointments();
      return created;
    } catch (err) {
      const msg = getErrorMessage(err, "Failed to book appointment.");
      toast.error(msg);
      throw err;
    }
  };

  const changeStatus = async (id, newStatus) => {
    try {
      const updated = await updateAppointmentStatus(id, { status: newStatus });
      toast.success(`Appointment marked as ${newStatus}.`);
      fetchAppointments();
      return updated;
    } catch (err) {
      const msg = getErrorMessage(err, `Failed to update appointment to ${newStatus}.`);
      toast.error(msg);
      throw err;
    }
  };

  const cancelAppointment = async (id, reason = "") => {
    try {
      await cancelMyAppointment(id, reason);
      toast.info("Appointment cancelled.");
      fetchAppointments();
    } catch (err) {
      const msg = getErrorMessage(err, "Failed to cancel appointment.");
      toast.error(msg);
      throw err;
    }
  };

  return {
    appointments,
    isLoading,
    error,
    statusFilter,
    setStatusFilter,
    dateFilter,
    setDateFilter,
    refetch: fetchAppointments,
    bookAppointment,
    changeStatus,
    cancelAppointment,
  };
}

export default useAppointments;

