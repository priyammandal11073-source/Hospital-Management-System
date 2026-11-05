import { useEffect, useState } from "react";
import { getMyVitals } from "../../services/api.js";
import VitalsTracker from "../../components/VitalsTracker.jsx";
import { PageHeader } from "../../components/ui/index.js";

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
      <PageHeader
        breadcrumbs={[
          { label: "My Health", to: "/patient/dashboard" },
          { label: "Vitals & Biometrics", active: true },
        ]}
        title="My Health Records & Vitals"
        badge={
          <span className="inline-flex items-center rounded-full liquid-glass-pill px-2.5 py-0.5 text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200/70">
            Self-Monitoring
          </span>
        }
        subtitle="Track your blood pressure, blood glucose, weight trends, and pulse history over time."
      />

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-800 text-xs font-bold shadow-2xs">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl liquid-glass-card border border-slate-200/80 bg-white/80 p-12 text-center shadow-2xs">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-teal-700 border-r-transparent" />
          <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Loading health vitals history...</p>
        </div>
      ) : (
        <div className="rounded-2xl liquid-glass-card border border-slate-200/80 bg-white/80 p-5 sm:p-6 shadow-2xs">
          <VitalsTracker
            vitals={vitals}
            isPatient={true}
            onVitalsUpdated={fetchVitals}
          />
        </div>
      )}
    </div>
  );
}
