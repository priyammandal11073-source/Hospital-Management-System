import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyActiveMedicines } from "../../services/api.js";

function MyMedicines() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await getMyActiveMedicines();
        if (active) {
          setMedicines(res.medicines || []);
        }
      } catch (err) {
        if (active) setError(err.response?.data?.message || "Unable to fetch active medicines");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, []);

  const filteredMedicines = filter === "all"
    ? medicines
    : medicines.filter((m) => (filter === "active" ? m.isActive : !m.isActive));

  const formatSchedule = (freq = "") => {
    const f = freq.toLowerCase();
    const times = [];
    if (f.includes("morning") || f.includes("od") || f.includes("bd") || f.includes("tds") || f.includes("qid") || f.includes("1-")) {
      times.push({ label: "Morning", icon: "🌅", time: "8:00 AM" });
    }
    if (f.includes("afternoon") || f.includes("tds") || f.includes("qid") || f.includes("-1-")) {
      times.push({ label: "Afternoon", icon: "☀️", time: "1:30 PM" });
    }
    if (f.includes("night") || f.includes("bd") || f.includes("tds") || f.includes("qid") || f.includes("hs") || f.endsWith("-1")) {
      times.push({ label: "Night", icon: "🌙", time: "9:00 PM" });
    }
    return times.length > 0 ? times : [{ label: "As Directed", icon: "⏰", time: freq || "Per prescription" }];
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Medications & Dosage Guide</h1>
            <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-semibold text-teal-700 ring-1 ring-teal-500/20">
              Active Prescriptions
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Clear, plain-language breakdown of all your prescribed medications, daily routines, and doctor instructions.
          </p>
        </div>

        <Link
          to="/patient/prescriptions"
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition"
        >
          📄 View Original Digital Prescriptions
        </Link>
      </div>

      {/* Safety Pill Advice */}
      <div className="rounded-2xl bg-amber-50 border border-amber-200/80 p-4 sm:p-5 flex items-start gap-3.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-800 text-lg flex-shrink-0">
          💡
        </div>
        <div className="text-xs sm:text-sm text-amber-900 leading-relaxed">
          <p className="font-bold text-amber-950">Medication Safety Guidelines:</p>
          <ul className="mt-1 list-disc list-inside space-y-0.5 text-amber-800">
            <li>Always complete the prescribed antibiotic course unless advised otherwise by your physician.</li>
            <li>Take medicines with a full glass of water. If you experience allergic reactions or severe dizziness, contact the 24/7 helpline immediately.</li>
          </ul>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        {[
          { key: "all", label: `All Medicines (${medicines.length})` },
          { key: "active", label: `Active Routine (${medicines.filter((m) => m.isActive).length})` },
          { key: "completed", label: `Completed Course (${medicines.filter((m) => !m.isActive).length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              filter === tab.key
                ? "bg-teal-700 text-white shadow-xs"
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
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-3 border-teal-600 border-r-transparent"></div>
          <p className="mt-3 text-sm font-semibold text-slate-600">Loading your dosage schedules...</p>
        </div>
      ) : filteredMedicines.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
            💊
          </div>
          <h3 className="mt-3 text-base font-bold text-slate-800">No medications found</h3>
          <p className="mt-1 text-sm text-slate-500">
            You do not currently have any active medicine routines under this category.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredMedicines.map((m, idx) => {
            const scheduleTimes = formatSchedule(m.frequency);
            const isFoodBefore = (m.instructions || "").toLowerCase().includes("before food") || (m.instructions || "").toLowerCase().includes("empty stomach");

            return (
              <div
                key={m.id || idx}
                className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition hover:shadow-md hover:border-teal-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-700 font-bold text-lg ring-1 ring-teal-500/20">
                        💊
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900">{m.name}</h3>
                        <p className="text-xs font-semibold text-teal-700">
                          {m.dosage} • {m.form || "Tablet/Capsule"}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        m.isActive ? "bg-teal-100 text-teal-800" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {m.isActive ? "Active Now" : "Course Finished"}
                    </span>
                  </div>

                  {/* Frequency / Time schedule */}
                  <div className="mt-4 rounded-xl bg-slate-50 p-3 border border-slate-100">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Daily Routine / Timing:
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {scheduleTimes.map((s, sIdx) => (
                        <div
                          key={sIdx}
                          className="flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 border border-slate-200 shadow-2xs"
                        >
                          <span>{s.icon}</span>
                          <span className="font-bold text-slate-900">{s.label}</span>
                          <span className="text-[10px] text-slate-400">({s.time})</span>
                        </div>
                      ))}
                    </div>

                    {/* Meal instructions */}
                    <div className="mt-2.5 flex items-center gap-2 text-xs font-semibold">
                      <span className="text-slate-500">Meal intake:</span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-bold ${
                          isFoodBefore
                            ? "bg-amber-100 text-amber-900 border border-amber-200"
                            : "bg-emerald-100 text-emerald-900 border border-emerald-200"
                        }`}
                      >
                        {isFoodBefore ? "🍽️ Before Food (Empty Stomach)" : "🍲 After Food / Meals"}
                      </span>
                    </div>
                  </div>

                  {/* Doctor notes or instructions */}
                  {m.instructions && (
                    <div className="mt-3 text-xs text-slate-600">
                      <span className="font-semibold text-slate-800">Doctor instructions:</span>{" "}
                      <span>{m.instructions}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div>
                    <span>Prescribed by: </span>
                    <strong className="text-slate-700">{m.doctor || "Attending Physician"}</strong>
                  </div>
                  <span>Duration: {m.duration || "As prescribed"}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MyMedicines;
