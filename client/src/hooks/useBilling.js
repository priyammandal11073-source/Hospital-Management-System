import { useState, useEffect, useCallback } from "react";
import {
  getBillings,
  createBilling,
  updatePaymentStatus,
  getRevenueSummary,
} from "../services/api.js";
import { getErrorMessage } from "../utils/errorHandler.js";
import { toast } from "../utils/toast.js";

/**
 * useBilling hook
 * Encapsulates invoice tracking, payment settlement, and hospital financial summaries.
 */
export function useBilling(filterDefaults = {}) {
  const [billings, setBillings] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(filterDefaults.status || "all");

  const fetchBillings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [billingData, summaryData] = await Promise.allSettled([
        getBillings(),
        getRevenueSummary().catch(() => null),
      ]);

      if (billingData.status === "fulfilled") {
        let list = Array.isArray(billingData.value) ? billingData.value : billingData.value?.billings || [];
        if (paymentStatus !== "all") {
          list = list.filter((b) => b.paymentStatus?.toLowerCase() === paymentStatus.toLowerCase());
        }
        setBillings(list);
      }

      if (summaryData.status === "fulfilled" && summaryData.value) {
        setSummary(summaryData.value);
      }
    } catch (err) {
      const msg = getErrorMessage(err, "Failed to load billing records.");
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [paymentStatus]);

  useEffect(() => {
    fetchBillings();
  }, [fetchBillings]);

  const generateInvoice = async (payload) => {
    try {
      const invoice = await createBilling(payload);
      toast.success("Invoice generated successfully!");
      fetchBillings();
      return invoice;
    } catch (err) {
      const msg = getErrorMessage(err, "Failed to create invoice.");
      toast.error(msg);
      throw err;
    }
  };

  const settlePayment = async (billingId, paymentDetails) => {
    try {
      const res = await updatePaymentStatus(billingId, paymentDetails);
      toast.success("Payment recorded successfully!");
      fetchBillings();
      return res;
    } catch (err) {
      const msg = getErrorMessage(err, "Failed to record payment.");
      toast.error(msg);
      throw err;
    }
  };

  return {
    billings,
    summary,
    isLoading,
    error,
    paymentStatus,
    setPaymentStatus,
    refetch: fetchBillings,
    generateInvoice,
    settlePayment,
  };
}

export default useBilling;
