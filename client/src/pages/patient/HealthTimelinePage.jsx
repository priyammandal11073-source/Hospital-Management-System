import { useCallback, useEffect, useState } from "react";
import { getMyAppointments, getMyLabReports, getMyVitals, getMyPrescriptions, getMyBillings, getMyFeedback } from "../../services/api.js";
import ActionMenu from "../../components/ui/ActionMenu.jsx";
import { PageHeader } from "../../components/ui/index.js";
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
            title: `Consultation with ${formatDoctorName(a.doctor?.name, "Specialist")}`,
            details: { department: a.doctor?.department, reason: a.reasonForVisit, type: a.appointmentType },
            icon: "🩺",
            color: "teal",
            status: a.status,
          });
        });

        // Lab Reports
        (reports.reports || []).forEach(r => {
          events.push({
            id: `report-${r._id}`,
            type: "report",
            date: r.createdAt,
            title: `Lab Test: ${r.testName}`,
            details: { doctor: formatDoctorName(r.doctor?.name, "Consultant"), status: r.status, notes: r.resultNotes },
            icon: "🔬",
            color: "purple",
            status: r.status,
          });
        });

        // Vitals
        (vitals.vitals || []).forEach(v => {
          events.push({
            id: `vital-${v._id}`,
            type: "vitals",
            date: v.createdAt || v.recordedAt,
            title: "Vital Signs Recorded",
            details: { bp: `${v.bloodPressureSystolic}/${v.bloodPressureDiastolic}`, pulse: `${v.heartRate} bpm`, temp: `${v.temperature}°F`, spo2: `${v.spo2}%` },
            icon: "❤️",
            color: "rose",
            status: "Recorded",
          });
        });

        // Prescriptions
        (rx.prescriptions || []).forEach(p => {
          events.push({
            id: `rx-${p._id}`,
            type: "prescription",
            date: p.createdAt,
            title: `Prescription #${p.prescriptionNumber || p._id.slice(-6)}`,
            details: { doctor: formatDoctorName(p.doctor?.name, "Consultant"), medicines: p.medications?.length || 0, diagnosis: p.diagnosis },
            icon: "💊",
            color: "indigo",
            status: p.status || "Active",
          });
        });

        // Billings
        (bills.billings || []).forEach(b => {
          events.push({
            id: `bill-${b._id}`,
            type: "billing",
            date: b.createdAt,
            title: `Invoice #${b.invoiceNumber || b._id.slice(-6)}`,
            details: { amount: `₹${b.totalAmount}`, status: b.paymentStatus, method: b.paymentMethod },
            icon: "💳",
            color: "emerald",
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

  if (isLoading) {
    return (
      <div className="rounded-2xl liquid-glass-card border border-slate-200/80 bg-white/80 p-12 text-center shadow-2xs">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-teal-700 border-r-transparent" />
        <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Loading your health timeline...</p>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: "My Health", to: "/patient/dashboard" },
          { label: "Health Timeline", active: true },
        ]}
        title="My Health Timeline"
        badge={
          <span className="inline-flex items-center rounded-full liquid-glass-pill px-2.5 py-0.5 text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200/70">
            {timeline.length} Events
          </span>
        }
        subtitle="Complete chronological view of your healthcare journey."
        actions={
          <ActionMenu
            triggerLabel="Export & Print"
            triggerIcon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            }
            items={[
              { label: "Export Full Timeline (CSV)", onClick: exportTimeline },
              { label: "Print Summary", onClick: handlePrintTimelineSummary },
            ]}
            align="right"
          />
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-2 liquid-glass-card border border-slate-200/80 bg-white/80 p-3 rounded-2xl shadow-2xs">
        {types.map(t => (
          <button
            key={t}
            onClick={() => setActiveFilters(f => ({ ...f, type: t }))}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              activeFilters.type === t
                ? "bg-teal-700 text-white shadow-xs font-bold"
                : "bg-white/80 text-slate-600 border border-slate-200/80 hover:bg-slate-50"
            }`}
          >
            {t === "all" ? "All" : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Timeline List */}
      <div className="relative pl-6 sm:pl-8 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200/80">
        {filtered.length === 0 ? (
          <div className="rounded-2xl liquid-glass-card border border-slate-200/80 bg-white/80 p-8 text-center text-slate-500 text-sm shadow-2xs">
            No events found for this filter.
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(event => (
              <div key={event.id} className="relative group">
                <div className="absolute -left-6 sm:-left-8 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-white ring-4 ring-slate-100 shadow-2xs border border-slate-300 text-xs">
                  {event.icon}
                </div>

                <div className="rounded-2xl liquid-glass-card border border-slate-200/80 bg-white/80 p-4 sm:p-5 shadow-2xs hover:border-slate-300 transition">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 text-sm">{event.title}</h3>
                          <span className="rounded-full liquid-glass-pill px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-slate-50 text-slate-700 border border-slate-200/70">
                            {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5 font-mono">
                          {new Date(event.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })} at {event.time || new Date(event.date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                        {event.details && (
                          <p className="text-xs text-slate-500 mt-1 truncate max-w-2xl">
                            {Object.entries(event.details).filter(([_, v]) => v).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedEvent(event)}
                      className="rounded-xl liquid-glass-pill border border-slate-200/80 bg-white/80 px-3 py-1.5 text-xs font-semibold text-teal-800 hover:bg-teal-50 transition shadow-2xs self-start sm:self-center"
                    >
                      View Details →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs" onClick={() => setSelectedEvent(null)}>
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl liquid-glass-card border border-slate-200/80 bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{selectedEvent.icon}</span>
                <div>
                  <h2 className="text-base font-bold text-slate-900">{selectedEvent.title}</h2>
                  <p className="text-xs text-slate-500 font-mono">{new Date(selectedEvent.date).toLocaleString("en-IN")}</p>
                </div>
              </div>
              <button onClick={() => setSelectedEvent(null)} className="text-xl text-slate-400 hover:text-slate-600 p-1 rounded-lg">✕</button>
            </div>
            <div className="space-y-2.5 text-xs">
              {Object.entries(selectedEvent.details || {}).map(([key, value]) => value && (
                <div key={key} className="rounded-xl bg-slate-50/70 p-3 border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{key}</p>
                  <p className="text-xs text-slate-800 font-medium mt-0.5">{typeof value === "object" ? JSON.stringify(value, null, 2) : value}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-xs font-semibold text-white transition shadow-sm shadow-teal-950/10 active:scale-95"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default PatientHealthTimeline;
