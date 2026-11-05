import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyMedicalTimeline } from "../../services/api.js";
import { PageHeader } from "../../components/ui/index.js";

function MyMedicalTimeline() {
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await getMyMedicalTimeline();
        if (active) {
          setTimeline(res.timeline || []);
        }
      } catch (err) {
        if (active) setError(err.response?.data?.message || "Failed to load medical timeline");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, []);

  const filteredItems = filterType === "all"
    ? timeline
    : timeline.filter((item) => item.type === filterType);

  const getBadgeColor = (type) => {
    switch (type) {
      case "consultation":
        return "bg-teal-50 text-teal-800 border-teal-200/70";
      case "prescription":
        return "bg-indigo-50 text-indigo-700 border-indigo-200/70";
      case "lab_report":
        return "bg-purple-50 text-purple-800 border-purple-200/70";
      case "vitals":
        return "bg-rose-50 text-rose-800 border-rose-200/70";
      case "admission":
        return "bg-sky-50 text-sky-800 border-sky-200/70";
      case "referral":
        return "bg-amber-50 text-amber-800 border-amber-200/70";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200/70";
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case "consultation": return "🩺";
      case "prescription": return "💊";
      case "lab_report": return "🔬";
      case "vitals": return "❤️";
      case "admission": return "🛏️";
      case "referral": return "🔄";
      default: return "📋";
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: "My Health", to: "/patient/dashboard" },
          { label: "Health Timeline", active: true },
        ]}
        title="My Health Journey Timeline"
        badge={
          <span className="inline-flex items-center rounded-full liquid-glass-pill px-2.5 py-0.5 text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200/70">
            Chronological
          </span>
        }
        subtitle="A comprehensive unified timeline of all your doctor consultations, digital prescriptions, laboratory findings, vitals, and hospital admissions."
        actions={
          <Link
            to="/patient/records"
            className="inline-flex items-center gap-1.5 rounded-xl liquid-glass-pill border border-slate-200/80 bg-white/80 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition"
          >
            📋 Records Category View
          </Link>
        }
      />

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/80 pb-3">
        {[
          { key: "all", label: "All Events" },
          { key: "consultation", label: "Consultations" },
          { key: "prescription", label: "Prescriptions" },
          { key: "lab_report", label: "Lab Reports" },
          { key: "vitals", label: "Vitals Recorded" },
          { key: "admission", label: "Admissions" },
          { key: "referral", label: "Referrals" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterType(tab.key)}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
              filterType === tab.key
                ? "bg-teal-700 text-white shadow-xs font-bold"
                : "bg-white/80 text-slate-600 border border-slate-200/80 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200/80 bg-rose-50 p-4 text-xs font-bold text-rose-800 shadow-2xs">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl liquid-glass-card border border-slate-200/80 bg-white/80 p-12 text-center shadow-2xs">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-teal-700 border-r-transparent" />
          <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Reconstructing your clinical journey...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-2xl liquid-glass-card border border-dashed border-slate-300/80 bg-white/80 p-12 text-center shadow-2xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl liquid-glass-subtle text-2xl text-slate-700 mb-3">
            📅
          </div>
          <h3 className="text-sm font-bold text-slate-800">No medical events found</h3>
          <p className="mt-1 text-xs text-slate-500">
            {filterType === "all"
              ? "You do not have any recorded medical activities yet."
              : `No events of type "${filterType.replace("_", " ")}" found.`}
          </p>
        </div>
      ) : (
        <div className="relative pl-6 sm:pl-8 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200/80">
          <div className="space-y-6">
            {filteredItems.map((item, idx) => {
              const eventDate = new Date(item.date);
              const formattedDate = eventDate.toLocaleDateString("en-IN", {
                weekday: "short",
                day: "2-digit",
                month: "short",
                year: "numeric",
              });
              const formattedTime = eventDate.toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div key={item.id || idx} className="relative group">
                  {/* Timeline bullet dot */}
                  <div className="absolute -left-6 sm:-left-8 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white ring-4 ring-slate-100 shadow-2xs border border-slate-300 group-hover:ring-teal-100 group-hover:border-teal-700 transition-all text-xs">
                    {getIcon(item.type)}
                  </div>

                  {/* Event Card */}
                  <div className="rounded-2xl liquid-glass-card border border-slate-200/80 bg-white/80 p-4 sm:p-5 shadow-2xs transition hover:border-slate-300">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider liquid-glass-pill border ${getBadgeColor(
                              item.type
                            )}`}
                          >
                            {item.type.replace("_", " ")}
                          </span>
                          <span className="text-xs font-semibold text-slate-400 font-mono">
                            {formattedDate} • {formattedTime}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-slate-900">{item.title}</h4>
                        {item.doctor && (
                          <p className="text-xs font-medium text-slate-600">
                            Attending / Prescribed by: <strong className="text-slate-800">{item.doctor}</strong>
                          </p>
                        )}
                        {item.notes && (
                          <p className="text-xs text-slate-600 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100 mt-2">
                            {item.notes}
                          </p>
                        )}
                      </div>

                      {/* Right side contextual status/details */}
                      <div className="flex flex-wrap sm:flex-col sm:items-end gap-2 text-xs">
                        {item.status && (
                          <span className="rounded-full liquid-glass-pill bg-slate-50 border border-slate-200/70 px-2.5 py-0.5 font-bold capitalize text-slate-700 text-[10px]">
                            {item.status}
                          </span>
                        )}
                        {item.type === "prescription" && (
                          <Link
                            to="/patient/prescriptions"
                            className="rounded-xl liquid-glass-pill border border-teal-200/70 bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-800 hover:bg-teal-100 transition shadow-2xs"
                          >
                            View Rx Details →
                          </Link>
                        )}
                        {item.type === "lab_report" && (
                          <Link
                            to="/patient/lab-reports"
                            className="rounded-xl liquid-glass-pill border border-purple-200/70 bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-800 hover:bg-purple-100 transition shadow-2xs"
                          >
                            View Lab Report →
                          </Link>
                        )}
                        {item.type === "consultation" && (
                          <Link
                            to="/patient/consultations"
                            className="rounded-xl liquid-glass-pill border border-teal-200/70 bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-800 hover:bg-teal-100 transition shadow-2xs"
                          >
                            Consultation Summary →
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default MyMedicalTimeline;
