import { useState, useEffect, useCallback } from "react";
import {
  getPatientVitals,
  recordPatientVitals,
  getRecentVitalsAlerts,
} from "../services/api.js";
import { getErrorMessage } from "../utils/errorHandler.js";
import { toast } from "../utils/toast.js";

/**
 * useVitals hook
 * Encapsulates clinical vital signs tracking, telemetry trends, and STAT alerts.
 */
export function useVitals(patientId = null) {
  const [vitalsHistory, setVitalsHistory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchVitals = useCallback(async () => {
    if (!patientId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getPatientVitals(patientId);
      setVitalsHistory(Array.isArray(data) ? data : data?.vitals || []);
    } catch (err) {
      const msg = getErrorMessage(err, "Failed to load patient vitals.");
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [patientId]);

  const fetchAlerts = useCallback(async () => {
    try {
      const data = await getRecentVitalsAlerts();
      setAlerts(Array.isArray(data) ? data : data?.alerts || []);
    } catch (err) {
      // Silently handle
    }
  }, []);

  useEffect(() => {
    if (patientId) {
      fetchVitals();
    }
  }, [patientId, fetchVitals]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const recordVitals = async (payload) => {
    try {
      const targetId = patientId || payload.patientId;
      const res = await recordPatientVitals(targetId, payload);
      toast.success("Vitals recorded successfully.");
      if (patientId) fetchVitals();
      fetchAlerts();
      return res;
    } catch (err) {
      const msg = getErrorMessage(err, "Failed to record vital signs.");
      toast.error(msg);
      throw err;
    }
  };

  return {
    vitalsHistory,
    alerts,
    isLoading,
    error,
    refetch: fetchVitals,
    recordVitals,
  };
}

export default useVitals;

