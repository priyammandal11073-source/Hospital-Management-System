import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyDocuments } from "../../services/api.js";

function MyDocuments() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [category, setCategory] = useState("all");

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await getMyDocuments();
        if (active) {
          setDocuments(res.documents || []);
        }
      } catch (err) {
        if (active) setError(err.response?.data?.message || "Failed to load documents");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, []);

  const filteredDocs = category === "all"
    ? documents
    : documents.filter((d) => d.type === category);

  const getDocIcon = (type) => {
    switch (type) {
      case "prescription": return "💊";
      case "lab_report": return "🔬";
      case "invoice": return "🧾";
      case "discharge_summary": return "📋";
      default: return "📄";
    }
  };

  const getDocBadge = (type) => {
    switch (type) {
      case "prescription": return "bg-teal-50 text-teal-700 border-teal-200";
      case "lab_report": return "bg-purple-50 text-purple-700 border-purple-200";
      case "invoice": return "bg-amber-50 text-amber-700 border-amber-200";
      case "discharge_summary": return "bg-blue-50 text-blue-700 border-blue-200";
      default: return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Health Documents & Records</h1>
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-500/20">
              Digital Vault
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Instant digital access to all your prescriptions, pathology reports, hospital receipts, and discharge certificates.
          </p>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        {[
          { key: "all", label: `All Documents (${documents.length})` },
          { key: "prescription", label: `Prescriptions (${documents.filter((d) => d.type === "prescription").length})` },
          { key: "lab_report", label: `Lab Reports (${documents.filter((d) => d.type === "lab_report").length})` },
          { key: "invoice", label: `Invoices & Receipts (${documents.filter((d) => d.type === "invoice").length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setCategory(tab.key)}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              category === tab.key
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
          <p className="mt-3 text-sm font-semibold text-slate-600">Gathering your digital documents...</p>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
            📁
          </div>
          <h3 className="mt-3 text-base font-bold text-slate-800">No documents found</h3>
          <p className="mt-1 text-sm text-slate-500">
            No records match the selected document filter.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDocs.map((doc, idx) => {
            const dateStr = doc.date
              ? new Date(doc.date).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "Recent";

            return (
              <div
                key={doc.id || idx}
                className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition hover:shadow-md hover:border-slate-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-lg flex-shrink-0">
                        {getDocIcon(doc.type)}
                      </div>
                      <div>
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${getDocBadge(
                            doc.type
                          )}`}
                        >
                          {doc.type?.replace("_", " ")}
                        </span>
                        <p className="text-[11px] font-medium text-slate-400 mt-0.5 font-mono">{dateStr}</p>
                      </div>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 mt-3 line-clamp-1">{doc.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {doc.details || doc.doctor || doc.summary || "Official hospital record"}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400">
                    PDF • Verified
                  </span>

                  {doc.type === "prescription" && (
                    <Link
                      to="/patient/prescriptions"
                      className="rounded-lg bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-700 hover:bg-teal-100 transition shadow-2xs"
                    >
                      View & Print →
                    </Link>
                  )}

                  {doc.type === "lab_report" && (
                    <Link
                      to="/patient/lab-reports"
                      className="rounded-lg bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-700 hover:bg-purple-100 transition shadow-2xs"
                    >
                      View Report →
                    </Link>
                  )}

                  {doc.type === "invoice" && (
                    <Link
                      to="/patient/billings"
                      className="rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800 hover:bg-amber-100 transition shadow-2xs"
                    >
                      Receipt Details →
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MyDocuments;
