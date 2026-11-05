import { useState, useEffect, useCallback } from "react";
import { getPatients, createPatient, updatePatient, deletePatient } from "../services/api.js";
import { getErrorMessage } from "../utils/errorHandler.js";
import { toast } from "../utils/toast.js";

/**
 * usePatients hook
 * Encapsulates patient querying, search filtering, pagination, and CRUD operations.
 */
export function usePatients(initialParams = {}) {
  const [patients, setPatients] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState(initialParams.search || "");
  const [page, setPage] = useState(initialParams.page || 1);
  const [limit, setLimit] = useState(initialParams.limit || 20);

  const fetchPatients = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getPatients({
        search: searchQuery,
        page,
        limit,
      });

      if (Array.isArray(res)) {
        setPatients(res);
        setTotalCount(res.length);
      } else if (res?.patients) {
        setPatients(res.patients);
        setTotalCount(res.totalCount || res.patients.length);
      } else {
        setPatients([]);
        setTotalCount(0);
      }
    } catch (err) {
      const msg = getErrorMessage(err, "Failed to load patient records.");
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, page, limit]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const addPatient = async (data) => {
    try {
      const created = await createPatient(data);
      toast.success("Patient registered successfully!");
      fetchPatients();
      return created;
    } catch (err) {
      const msg = getErrorMessage(err, "Failed to register patient.");
      toast.error(msg);
      throw err;
    }
  };

  const editPatient = async (id, data) => {
    try {
      const updated = await updatePatient(id, data);
      toast.success("Patient records updated successfully!");
      fetchPatients();
      return updated;
    } catch (err) {
      const msg = getErrorMessage(err, "Failed to update patient.");
      toast.error(msg);
      throw err;
    }
  };

  const removePatient = async (id) => {
    try {
      await deletePatient(id);
      toast.success("Patient record removed.");
      fetchPatients();
    } catch (err) {
      const msg = getErrorMessage(err, "Failed to remove patient.");
      toast.error(msg);
      throw err;
    }
  };

  return {
    patients,
    totalCount,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    page,
    setPage,
    limit,
    setLimit,
    refetch: fetchPatients,
    addPatient,
    editPatient,
    removePatient,
  };
}

export default usePatients;

