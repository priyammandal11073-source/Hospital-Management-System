import { useState, useEffect, useCallback } from "react";
import {
  getBeds,
  createBed,
  allocateBed,
  transferBed,
  dischargeBed,
} from "../services/api.js";
import { getErrorMessage } from "../utils/errorHandler.js";
import { toast } from "../utils/toast.js";

/**
 * useBeds hook
 * Encapsulates inpatient ward bed availability, allocation, transfers, and discharges.
 */
export function useBeds(wardFilter = "all") {
  const [beds, setBeds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedWard, setSelectedWard] = useState(wardFilter);

  const fetchBeds = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getBeds();
      let list = Array.isArray(data) ? data : data?.beds || [];

      if (selectedWard !== "all") {
        list = list.filter((b) => b.ward?.toLowerCase() === selectedWard.toLowerCase());
      }

      setBeds(list);
    } catch (err) {
      const msg = getErrorMessage(err, "Failed to load ward beds.");
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [selectedWard]);

  useEffect(() => {
    fetchBeds();
  }, [fetchBeds]);

  const addBed = async (payload) => {
    try {
      const res = await createBed(payload);
      toast.success("Bed added to ward registry.");
      fetchBeds();
      return res;
    } catch (err) {
      const msg = getErrorMessage(err, "Failed to create bed.");
      toast.error(msg);
      throw err;
    }
  };

  const assignBed = async (bedId, patientId, notes = "") => {
    try {
      const res = await allocateBed(bedId, { patientId, notes });
      toast.success("Patient admitted and bed allocated.");
      fetchBeds();
      return res;
    } catch (err) {
      const msg = getErrorMessage(err, "Failed to allocate bed.");
      toast.error(msg);
      throw err;
    }
  };

  const moveBed = async (bedId, targetBedId, reason = "") => {
    try {
      const res = await transferBed(bedId, { targetBedId, reason });
      toast.success("Patient transferred to new bed.");
      fetchBeds();
      return res;
    } catch (err) {
      const msg = getErrorMessage(err, "Failed to transfer bed.");
      toast.error(msg);
      throw err;
    }
  };

  const releaseBed = async (bedId) => {
    try {
      const res = await dischargeBed(bedId);
      toast.success("Bed discharged and marked for sanitization.");
      fetchBeds();
      return res;
    } catch (err) {
      const msg = getErrorMessage(err, "Failed to discharge bed.");
      toast.error(msg);
      throw err;
    }
  };

  return {
    beds,
    isLoading,
    error,
    selectedWard,
    setSelectedWard,
    refetch: fetchBeds,
    addBed,
    assignBed,
    moveBed,
    releaseBed,
  };
}

export default useBeds;

