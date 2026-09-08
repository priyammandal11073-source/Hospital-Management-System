import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { getAdminCalendarEvents } from "../../services/api.js";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function HospitalCalendarPage() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [events, setEvents] = useState([]);
  const [filterType, setFilterType] = useState("all");
  const [selectedDayEvents, setSelectedDayEvents] = useState(null);
  const [selectedDayNumber, setSelectedDayNumber] = useState(today.getDate());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadCalendarEvents = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await getAdminCalendarEvents(currentMonth, currentYear);
      setEvents(res.events || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load hospital events.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCalendarEvents();
  }, [currentMonth, currentYear]);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Calendar grid calculation
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const days = [];

    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ day: null, isCurrentMonth: false });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dayDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dayEvents = events.filter((e) => {
        if (!e.date) return false;
        const eDateStr = String(e.date).slice(0, 10);
        return eDateStr === dayDateStr;
      });
      days.push({
        day: d,
        dateStr: dayDateStr,
        isCurrentMonth: true,
        events: dayEvents,
        isToday:
          d === today.getDate() &&
          currentMonth === today.getMonth() &&
          currentYear === today.getFullYear(),
      });
    }

    return days;
  }, [currentMonth, currentYear, events]);

  const filteredEvents = useMemo(() => {
    if (filterType === "all") return events;
    return events.filter((e) => e.type === filterType);
  }, [events, filterType]);

  const monthlyStats = useMemo(() => {
    const appointments = events.filter((e) => e.type === "appointment").length;
    const procedures = events.filter((e) => e.type === "procedure").length;
    const leaves = events.filter((e) => e.type === "leave").length;
    return { appointments, procedures, leaves };
  }, [events]);

  const activeDayDisplayEvents = useMemo(() => {
    if (selectedDayEvents !== null) return selectedDayEvents;
    const dayObj = calendarDays.find((d) => d.day === selectedDayNumber);
    return dayObj?.events || [];
  }, [selectedDayEvents, selectedDayNumber, calendarDays]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-700 uppercase tracking-wider">
            <Link to="/dashboard" className="hover:underline">Administration</Link>
            <span>/</span>
            <span>Master Schedule</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Hospital Central Operations Calendar
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Synchronized master timeline of outpatient appointments, operating theatre surgeries, and specialist duty leaves.
          </p>
        </div>

        {/* Month Navigation Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs"
          >
            ← Prev
          </button>
          <span className="min-w-[140px] text-center text-sm font-extrabold text-slate-900">
            {MONTH_NAMES[currentMonth]} {currentYear}
          </span>
          <button
            onClick={handleNextMonth}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs"
          >
            Next →
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
          {error}
        </div>
      )}

      {/* Metrics Strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-blue-600 uppercase">Consultations</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{monthlyStats.appointments}</p>
          </div>
          <span className="text-2xl">📅</span>
        </div>
        <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-purple-600 uppercase">OT Surgeries</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{monthlyStats.procedures}</p>
          </div>
          <span className="text-2xl">🏥</span>
        </div>
        <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-amber-600 uppercase">Approved Leaves</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{monthlyStats.leaves}</p>
          </div>
          <span className="text-2xl">🌴</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs">
        <span className="text-slate-400 font-semibold mr-2">Display:</span>
        <button
          onClick={() => setFilterType("all")}
          className={`rounded-lg px-3 py-1 font-semibold transition ${
            filterType === "all" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          All Activity ({events.length})
        </button>
        <button
          onClick={() => setFilterType("appointment")}
          className={`rounded-lg px-3 py-1 font-semibold transition ${
            filterType === "appointment" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Consultations ({monthlyStats.appointments})
        </button>
        <button
          onClick={() => setFilterType("procedure")}
          className={`rounded-lg px-3 py-1 font-semibold transition ${
            filterType === "procedure" ? "bg-purple-600 text-white" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          OT Procedures ({monthlyStats.procedures})
        </button>
        <button
          onClick={() => setFilterType("leave")}
          className={`rounded-lg px-3 py-1 font-semibold transition ${
            filterType === "leave" ? "bg-amber-600 text-white" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Staff Leaves ({monthlyStats.leaves})
        </button>
      </div>

      {/* Main Calendar View + Selected Day Pane */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar Grid (2 cols) */}
        <div className="lg:col-span-2 overflow-hidden rounded-2xl bg-white p-5 ring-1 ring-slate-200/80 shadow-xs">
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {calendarDays.map((d, idx) => {
              if (!d.isCurrentMonth) {
                return <div key={`empty-${idx}`} className="h-20 rounded-xl bg-slate-50/50" />;
              }

              const isSelected = selectedDayNumber === d.day;

              return (
                <div
                  key={`day-${d.day}`}
                  onClick={() => {
                    setSelectedDayNumber(d.day);
                    setSelectedDayEvents(d.events);
                  }}
                  className={`h-22 rounded-xl p-1.5 border transition cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? "border-purple-600 bg-purple-50/40 ring-2 ring-purple-500/30"
                      : d.isToday
                      ? "border-blue-400 bg-blue-50/20"
                      : "border-slate-100 bg-white hover:border-slate-300 hover:bg-slate-50/60"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`h-5 w-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                        d.isToday
                          ? "bg-blue-600 text-white"
                          : isSelected
                          ? "bg-purple-600 text-white"
                          : "text-slate-700"
                      }`}
                    >
                      {d.day}
                    </span>
                    {d.events?.length > 0 && (
                      <span className="text-[10px] font-bold text-slate-400">
                        {d.events.length}
                      </span>
                    )}
                  </div>

                  {/* Micro Indicators */}
                  <div className="space-y-0.5 mt-1 overflow-hidden">
                    {d.events?.slice(0, 2).map((ev) => (
                      <div
                        key={ev.id}
                        className={`truncate rounded px-1 text-[9px] font-semibold leading-tight ${
                          ev.type === "procedure"
                            ? "bg-purple-100 text-purple-800"
                            : ev.type === "leave"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {ev.time ? `${ev.time} ` : ""}{ev.title}
                      </div>
                    ))}
                    {d.events?.length > 2 && (
                      <p className="text-[8px] font-bold text-slate-400 text-center">
                        +{d.events.length - 2} more
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Event Details (1 col) */}
        <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200/80 shadow-xs flex flex-col">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Schedule for {selectedDayNumber} {MONTH_NAMES[currentMonth]}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {activeDayDisplayEvents.length} scheduled hospital commitments
              </p>
            </div>
            <span className="rounded-full bg-purple-50 px-2 py-0.5 text-xs font-bold text-purple-700 ring-1 ring-purple-500/20">
              Day {selectedDayNumber}
            </span>
          </div>

          <div className="mt-4 flex-1 space-y-2.5 overflow-y-auto max-h-[460px] pr-1">
            {activeDayDisplayEvents.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No procedures, appointments, or leaves scheduled on this date.
              </div>
            ) : (
              activeDayDisplayEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 hover:bg-white hover:shadow-2xs transition"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        ev.type === "procedure"
                          ? "bg-purple-100 text-purple-800"
                          : ev.type === "leave"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {ev.type}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-600">
                      {ev.time || "All Day"}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-800 mt-2">{ev.title}</p>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                    <span>{ev.department || "Hospital Central"}</span>
                    <span className="capitalize font-semibold text-slate-600">{ev.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
