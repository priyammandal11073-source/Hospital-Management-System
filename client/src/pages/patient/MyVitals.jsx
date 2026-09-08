import { useEffect, useState } from "react";
import { getMyVitals } from "../../services/api.js";
import VitalsTracker from "../../components/VitalsTracker.jsx";

export default function MyVitals() {
  const [vitals, setVitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchVitals = async () => {
    setLoading(true);
    try {
      const data = await getMyVitals();
      setVitals(data.vitals || []);
    } catch (err) {
      setError("Unable to load health vitals records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVitals();
  }, []);

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <span>📊 My Health Records & Vitals</span>
          <span className="text-xs font-bold bg-teal-100 text-teal-800 px-2.5 py-0.5 rounded-full">
            Self-Monitoring
          </span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Track your blood pressure, blood glucose, weight trends, and pulse history over time.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
          {error}
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs font-semibold">
          Loading health vitals history...
        </div>
      ) : (
        <VitalsTracker
          vitals={vitals}
          isPatient={true}
          onVitalsUpdated={fetchVitals}
        />
      )}
    </div>
  );
}
