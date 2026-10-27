import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { getAdminCalendarEvents } from "../../services/api.js";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const TYPE_COLORS = {
  appointment: { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-200", icon: "📅" },
  procedure: { bg: "bg-purple-100", text: "text-purple-800", border: "border-purple-200", icon: "🏥" },
  leave: { bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-200", icon: "🌴" },
  event: { bg: "bg-sky-100", text: "text-sky-800", border: "border-sky-200", icon: "📋" },
};

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

  const goToToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    setSelectedDayNumber(today.getDate());
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
    const other = events.filter((e) => e.type === "event").length;
    return { appointments, procedures, leaves, other, total: events.length };
  }, [events]);

  const activeDayDisplayEvents = useMemo(() => {
    if (selectedDayEvents !== null) return selectedDayEvents;
    const dayObj = calendarDays.find((d) => d.day === selectedDayNumber);
    return dayObj?.events || [];
  }, [selectedDayEvents, selectedDayNumber, calendarDays]);

  return (
    <div className="space-y-6 animate-pop-in">
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
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition active:scale-95"
          >
            ← Prev
          </button>
          <span className="min-w-[140px] text-center text-sm font-extrabold text-slate-900">
            {MONTH_NAMES[currentMonth]} {currentYear}
          </span>
          <button
            onClick={handleNextMonth}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition active:scale-95"
          >
            Next →
          </button>
          <button
            onClick={goToToday}
            className="ml-2 rounded-xl bg-sky-600 px-3 py-2 text-xs font-bold text-white hover:bg-sky-700 shadow-2xs transition active:scale-95"
          >
            Today
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 animate-pop-in">
          {error}
        </div>
      )}

      {/* Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200/80 shadow-2xs flex items-center justify-between liquid-glass-card">
          <div>
            <p className="text-[11px] font-bold text-blue-600 uppercase">Consultations</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{monthlyStats.appointments}</p>
          </div>
          <span className="text-2xl">📅</span>
        </div>
        <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200/80 shadow-2xs flex items-center justify-between liquid-glass-card">
          <div>
            <p className="text-[11px] font-bold text-purple-600 uppercase">OT Surgeries</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{monthlyStats.procedures}</p>
          </div>
          <span className="text-2xl">🏥</span>
        </div>
        <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200/80 shadow-2xs flex items-center justify-between liquid-glass-card">
          <div>
            <p className="text-[11px] font-bold text-amber-600 uppercase">Approved Leaves</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{monthlyStats.leaves}</p>
          </div>
          <span className="text-2xl">🌴</span>
        </div>
        <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200/80 shadow-2xs flex items-center justify-between liquid-glass-card">
          <div>
            <p className="text-[11px] font-bold text-sky-600 uppercase">Events</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{monthlyStats.other}</p>
          </div>
          <span className="text-2xl">📋</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2 text-xs">
        <span className="text-slate-400 font-semibold mr-2">Display:</span>
        {["all", "appointment", "procedure", "leave", "event"].map((type) => {
          const count = type === "all" ? monthlyStats.total : monthlyStats[type === "appointment" ? "appointments" : type] || 0;
          const colors = {
            all: "bg-slate-900 text-white",
            appointment: "bg-blue-600 text-white",
            procedure: "bg-purple-600 text-white",
            leave: "bg-amber-600 text-white",
            event: "bg-sky-600 text-white",
          };
          return (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`rounded-lg px-3 py-1 font-semibold transition ${
                filterType === type ? colors[type] : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)} ({type === "all" ? monthlyStats.total : count})
            </button>
          );})}
        </div>

      {/* Main Calendar View + Selected Day Pane */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar Grid (2 cols) */}
        <div className="lg:col-span-2 overflow-hidden rounded-2xl bg-white p-5 ring-1 ring-slate-200/80 shadow-xs liquid-glass-card">
          <div className="flex items-center justify-between mb-2">
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>
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
                    {d.events?.slice(0, 2).map((ev) => {
                      const typeColor = TYPE_COLORS[ev.type] || TYPE_COLORS.appointment;
                      return (
                        <div
                          key={ev.id}
                          className={`truncate rounded px-1 text-[9px] font-semibold leading-tight ${typeColor.bg} ${typeColor.text} ${typeColor.border}`}
                        >
                          {ev.time ? `${ev.time} ` : ""}{ev.title}
                        </div>
                      );
                    })}
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
        <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200/80 shadow-xs flex flex-col liquid-glass-card">
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
              activeDayDisplayEvents.map((ev) => {
                const typeColor = TYPE_COLORS[ev.type] || TYPE_COLORS.appointment;
                return (
                  <div
                    key={ev.id}
                    className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 hover:bg-white hover:shadow-2xs transition"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${typeColor.bg} ${typeColor.text} ${typeColor.border}`}
                      >
                        {typeColor.icon} {ev.type}
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
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
