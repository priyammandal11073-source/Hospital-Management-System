import { useCallback, useEffect, useState } from "react";
import { getMyAppointments, getMyLabReports, getMyVitals, getMyPrescriptions, getMyBillings, getMyFeedback } from "../../services/api.js";
import ActionMenu from "../../components/ui/ActionMenu.jsx";
import { exportToCsv } from "../../utils/csvExport.js";
import { usePrintModal } from "../../context/PrintModalContext.jsx";
import { generateGeneralHospitalReportHtml } from "../../utils/printTemplates.js";
import { formatDoctorName } from "../../utils/doctorName.js";

const PatientHealthTimeline = () => {
  const { openPrintPreview } = usePrintModal();
  const [timeline, setTimeline] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilters, setActiveFilters] = useState({ type: "all", dateRange: "year" });
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    const loadTimeline = async () => {
      setIsLoading(true);
      try {
        const [appts, reports, vitals, rx, bills, feedback] = await Promise.all([
          getMyAppointments(),
          getMyLabReports(),
          getMyVitals(),
          getMyPrescriptions(),
          getMyBillings(),
          getMyFeedback(),
        ]);

        const events = [];

        // Appointments
        (appts.appointments || []).forEach(a => {
          events.push({
            id: `appt-${a._id}`,
            type: "appointment",
            date: a.appointmentDate,
            time: a.timeSlot,
            title: `${a.appointmentType || "Consultation"} with ${formatDoctorName(a.doctor?.name, "Specialist")}`,
            details: { reason: a.reasonForVisit, status: a.status, department: a.department, doctor: a.doctor?.name },
            icon: "🩺",
            color: "blue",
            status: a.status,
          });
        });

        // Reports
        (reports.reports || []).forEach(r => {
          events.push({
            id: `report-${r._id}`,
            type: "report",
            date: r.createdAt,
            title: `${r.testName || "Lab Report"}${r.isCritical ? " ⚠ CRITICAL" : ""}`,
            details: { status: r.status, verifiedBy: r.verifiedBy?.name, values: r.values },
            icon: "📋",
            color: r.isCritical ? "rose" : "emerald",
            status: r.status,
          });
        });

        // Vitals
        (vitals.vitals || []).forEach(v => {
          events.push({
            id: `vital-${v._id}`,
            type: "vitals",
            date: v.recordedAt,
            title: "Vitals Recorded",
            details: { bp: `${v.bpSystolic}/${v.bpDiastolic}`, hr: v.heartRate, temp: v.temperature, spo2: v.spo2, bmi: v.bmi },
            icon: "💓",
            color: "amber",
            status: "recorded",
          });
        });

        // Prescriptions
        (rx.prescriptions || []).forEach(p => {
          events.push({
            id: `rx-${p._id}`,
            type: "prescription",
            date: p.createdAt,
            title: `Prescription: ${p.medicines?.map(m => m.name).join(", ") || "Medications"}`,
            details: { diagnosis: p.diagnosis, doctor: p.doctor?.name, medicines: p.medicines, advice: p.advice },
            icon: "💊",
            color: "violet",
            status: "active",
          });
        });

        // Bills
        (bills.billings || []).forEach(b => {
          events.push({
            id: `bill-${b._id}`,
            type: "billing",
            date: b.createdAt,
            title: `Invoice ${b.invoiceNumber || b._id.toString().slice(-6)} - ${b.paymentStatus}`,
            details: { amount: b.totalAmount, paid: b.paidAmount, method: b.paymentMethod, department: b.department },
            icon: "💰",
            color: b.paymentStatus === "paid" ? "emerald" : "amber",
            status: b.paymentStatus,
          });
        });

        // Feedback
        (feedback.feedback || []).forEach(f => {
          events.push({
            id: `fb-${f._id}`,
            type: "feedback",
            date: f.createdAt,
            title: `Feedback: ${f.category} - ${f.rating}/5 ⭐`,
            details: { comments: f.comments, doctor: f.doctor?.name, response: f.response },
            icon: "💬",
            color: "blue",
            status: f.status,
          });
        });

        // Sort by date descending
        events.sort((a, b) => new Date(b.date) - new Date(a.date));
        setTimeline(events);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadTimeline();
  }, []);

  const exportTimeline = () => exportToCsv({
    filename: "health-timeline.csv",
    headers: ["Date", "Type", "Title", "Status", "Details"],
    rows: timeline.map(e => [new Date(e.date).toLocaleDateString("en-IN"), e.type, e.title, e.status, JSON.stringify(e.details)]),
  });

  const filtered = timeline.filter(e => {
    if (activeFilters.type !== "all" && e.type !== activeFilters.type) return false;
    // Date range filter could be added
    return true;
  });

  const types = ["all", "appointment", "report", "vitals", "prescription", "billing", "feedback"];

  const handlePrintTimelineSummary = () => {
    const eventsToPrint = filtered.slice(0, 30);
    const html = generateGeneralHospitalReportHtml({
      title: "Patient Longitudinal Clinical Timeline Summary",
      subtitle: "Consolidated Medical Encounters, Lab Diagnostic Records & Treatment History",
      metrics: [
        { label: "Clinical Visits", value: `${timeline.filter(e => e.type === "appointment").length}`, color: "#0284c7" },
        { label: "Lab Diagnostic Tests", value: `${timeline.filter(e => e.type === "report").length}`, color: "#059669" },
        { label: "Prescriptions Dispensed", value: `${timeline.filter(e => e.type === "prescription").length}`, color: "#7c3aed" },
        { label: "Vitals Recorded", value: `${timeline.filter(e => e.type === "vitals").length}`, color: "#d97706" },
      ],
      tables: [
        {
          title: "Chronological Health Events Log",
          headers: ["Event Date & Time", "Category", "Event Summary / Diagnosis / Test", "Recorded Status"],
          rows: eventsToPrint.map(e => [
            e.date ? new Date(e.date).toLocaleDateString("en-IN") : "—",
            (e.type || "").toUpperCase(),
            e.title || "Clinical Event",
            (e.status || "COMPLETED").toUpperCase(),
          ]),
        },
      ],
      notes: "Official patient medical timeline generated through the Nivora Care Hospital Patient Health Portal. Validated against hospital electronic health records.",
    });

    openPrintPreview({
      title: "Patient Health Timeline Summary",
      htmlContent: html,
      refNumber: `TIMELINE-${Date.now().toString().slice(-6)}`,
    });
  };

  if (isLoading) return <div className="py-12 text-center text-slate-500">Loading your health timeline...</div>;

  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Health Timeline</h1>
          <p className="text-sm text-slate-600">Complete chronological view of your healthcare journey.</p>
        </div>
        <ActionMenu triggerLabel="Export" triggerIcon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>}
          items={[
            { label: "Export Full Timeline (CSV)", onClick: exportTimeline },
            { label: "Print Summary", onClick: handlePrintTimelineSummary },
            { label: "Share with Provider", icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h4M8 12l-2-2m2 2l2-2m-4 4v6M8 12V4m-2 8l4-4m-4 4l4 4" /></svg> },
          ]} align="right" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        {types.map(t => (
          <button key={t} onClick={() => setActiveFilters(f => ({...f, type: t}))}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${activeFilters.type === t ? "bg-teal-600 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"}`}>
            {t === "all" ? "All" : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {["appointment", "report", "vitals", "prescription", "billing", "feedback"].map(type => {
          const count = timeline.filter(e => e.type === type).length;
          const meta = { appointment: { label: "Visits", icon: "🩺", cls: "bg-blue-50 text-blue-700" },
            report: { label: "Reports", icon: "📋", cls: "bg-emerald-50 text-emerald-700" },
            vitals: { label: "Vitals", icon: "💓", cls: "bg-amber-50 text-amber-700" },
            prescription: { label: "Rx", icon: "💊", cls: "bg-violet-50 text-violet-700" },
            billing: { label: "Bills", icon: "💰", cls: "bg-amber-50 text-amber-700" },
            feedback: { label: "Feedback", icon: "💬", cls: "bg-blue-50 text-blue-700" } }[type];
          return (
            <div key={type} className={`rounded-xl p-3 border ${meta.cls} border-current/20 text-center`}>
              <p className="text-2xl">{meta.icon}</p>
              <p className="text-2xl font-black text-slate-900">{count}</p>
              <p className="text-xs uppercase tracking-wide">{meta.label}</p>
            </div>
          );
        })}
        <div className="rounded-xl p-3 border bg-slate-50 text-slate-700 border-slate-200 text-center">
          <p className="text-2xl">📅</p>
          <p className="text-2xl font-black text-slate-900">{timeline.length > 0 ? new Date(timeline[0].date).getFullYear() - new Date(timeline[timeline.length - 1].date).getFullYear() + 1 : 0}</p>
          <p className="text-xs uppercase tracking-wide">Years of Care</p>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200" />
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-12 text-center ml-12">
            <p className="text-3xl">📭</p>
            <p className="mt-2 font-semibold text-slate-700">No events in this view</p>
            <p className="text-sm text-slate-500">Try changing the filter</p>
          </div>
        ) : (
          <div className="space-y-6 ml-12">
            {filtered.map((event, index) => (
              <div key={event.id} className="relative group">
                <div className="absolute left-6 top-0 w-3 h-3 rounded-full border-4 border-white z-10"
                  style={{ backgroundColor: event.color === "blue" ? "#3b82f6" : event.color === "emerald" ? "#10b981" : event.color === "amber" ? "#f59e0b" : event.color === "violet" ? "#8b5cf6" : event.color === "rose" ? "#f43f5e" : "#6366f1" }} />
                <div className="ml-6">
                  <div className={`rounded-xl border p-4 shadow-xs transition hover:shadow-md ${event.color === "rose" ? "border-rose-200 bg-rose-50/30" : event.color === "amber" ? "border-amber-200 bg-amber-50/30" : "border-slate-200"}`} onClick={() => setSelectedEvent(event)}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="text-2xl flex-shrink-0">{event.icon}</span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-slate-800 truncate">{event.title}</p>
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${event.color === "blue" ? "bg-blue-50 text-blue-700" : event.color === "emerald" ? "bg-emerald-50 text-emerald-700" : event.color === "amber" ? "bg-amber-50 text-amber-700" : event.color === "violet" ? "bg-violet-50 text-violet-700" : event.color === "rose" ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-700"}`}>
                              {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                            </span>
                          </div>
                          <p className="text-sm text-slate-500 mt-1">{new Date(event.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })} at {event.time || new Date(event.date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
                          {event.details && (
                            <p className="text-xs text-slate-400 mt-1 truncate max-w-2xl">
                              {Object.entries(event.details).filter(([_,v]) => v).map(([k,v]) => `${k}: ${v}`).join(" · ")}
                            </p>
                          )}
                        </div>
                      </div>
                      <ActionMenu
                        triggerIcon={<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>}
                        items={[
                          { label: "View Details", icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>, primary: true, onClick: () => setSelectedEvent(event) },
                          { label: event.type === "report" ? "Download Report" : event.type === "prescription" ? "View Prescription" : event.type === "billing" ? "View Bill" : "View", icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg> },
                          { label: "Add Note", icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg> },
                          { divider: true },
                          { label: "Export Event", icon: <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>, onClick: () => exportToCsv({ filename: `event-${event.id}.csv`, headers: ["Field", "Value"], rows: Object.entries({...event, date: new Date(event.date).toLocaleString()}).map(([k,v]) => [k, JSON.stringify(v)]) }) },
                        ]} align="right" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4" onClick={() => setSelectedEvent(null)}>
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{selectedEvent.icon}</span>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">{selectedEvent.title}</h2>
                  <p className="text-sm text-slate-500">{new Date(selectedEvent.date).toLocaleString("en-IN")}</p>
                </div>
              </div>
              <button onClick={() => setSelectedEvent(null)} className="text-2xl text-slate-400 hover:text-slate-700">✕</button>
            </div>
            <div className="space-y-3">
              {Object.entries(selectedEvent.details || {}).map(([key, value]) => value && (
                <div key={key} className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs font-bold text-slate-400 uppercase">{key}</p>
                  <p className="text-sm text-slate-800 font-mono">{typeof value === "object" ? JSON.stringify(value, null, 2) : value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default PatientHealthTimeline;