import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyMedicalTimeline } from "../../services/api.js";

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
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "prescription":
        return "bg-teal-100 text-teal-800 border-teal-200";
      case "lab_report":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "vitals":
        return "bg-rose-100 text-rose-800 border-rose-200";
      case "admission":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "referral":
        return "bg-amber-100 text-amber-800 border-amber-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Health Journey Timeline</h1>
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-500/20">
              Chronological
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            A comprehensive unified timeline of all your doctor consultations, digital prescriptions, laboratory findings, vitals, and hospital admissions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/patient/records"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
          >
            📋 Records Category View
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
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
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              filterType === tab.key
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-xs">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-3 border-blue-600 border-r-transparent"></div>
          <p className="mt-3 text-sm font-semibold text-slate-600">Reconstructing your clinical journey...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
            📅
          </div>
          <h3 className="mt-3 text-base font-bold text-slate-800">No medical events found</h3>
          <p className="mt-1 text-sm text-slate-500">
            {filterType === "all"
              ? "You do not have any recorded medical activities yet."
              : `No events of type "${filterType.replace("_", " ")}" found.`}
          </p>
        </div>
      ) : (
        <div className="relative pl-6 sm:pl-8 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
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
                  <div className="absolute -left-6 sm:-left-8 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white ring-4 ring-slate-100 shadow-xs border border-slate-300 group-hover:ring-blue-100 group-hover:border-blue-500 transition-all text-xs">
                    {getIcon(item.type)}
                  </div>

                  {/* Event Card */}
                  <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs transition hover:shadow-md hover:border-slate-300">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider border ${getBadgeColor(
                              item.type
                            )}`}
                          >
                            {item.type.replace("_", " ")}
                          </span>
                          <span className="text-xs font-semibold text-slate-400">
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
                          <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mt-2">
                            {item.notes}
                          </p>
                        )}
                      </div>

                      {/* Right side contextual status/details */}
                      <div className="flex flex-wrap sm:flex-col sm:items-end gap-2 text-xs">
                        {item.status && (
                          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-bold capitalize text-slate-700">
                            {item.status}
                          </span>
                        )}
                        {item.type === "prescription" && (
                          <Link
                            to="/patient/prescriptions"
                            className="rounded-lg bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-700 hover:bg-teal-100 transition-colors"
                          >
                            View Rx Details →
                          </Link>
                        )}
                        {item.type === "lab_report" && (
                          <Link
                            to="/patient/lab-reports"
                            className="rounded-lg bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-700 hover:bg-purple-100 transition-colors"
                          >
                            View Lab Report →
                          </Link>
                        )}
                        {item.type === "consultation" && (
                          <Link
                            to="/patient/consultations"
                            className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 hover:bg-blue-100 transition-colors"
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
