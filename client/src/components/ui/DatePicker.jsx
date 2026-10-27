import React, { useState, useRef, useEffect } from "react";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function DatePicker({
  value,
  onChange,
  label,
  placeholder = "Select date",
  disabled = false,
  minDate,
  maxDate,
  className = "",
  showClear = true,
  disabledDates = [],
  min = undefined,
  max = undefined,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = value ? new Date(value) : new Date();
    return d.getMonth();
  });
  const [currentYear, setCurrentYear] = useState(() => {
    const d = value ? new Date(value) : new Date();
    return d.getFullYear();
  });
  const inputRef = useRef(null);
  const pickerRef = useRef(null);

  const handleDateChange = (dateStr) => {
    onChange?.(dateStr);
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange?.("");
    setIsOpen(false);
  };

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const isDateDisabled = (day) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const dateObj = new Date(currentYear, currentMonth, day);
    
    if (minDate && dateObj < new Date(minDate)) return true;
    if (maxDate && dateObj > new Date(maxDate)) return true;
    if (min && dateObj < new Date(min)) return true;
    if (max && dateObj > new Date(max)) return true;
    if (disabledDates.includes(dateStr)) return true;
    
    return false;
  };

  const isToday = (day) => {
    return (
      day === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear()
    );
  };

  const isSelected = (day) => {
    return value === `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };

  return (
    <div ref={pickerRef} className={`relative inline-block ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          readOnly
          value={value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : ""}
          placeholder={placeholder}
          onClick={() => !disabled && setIsOpen(true)}
          onFocus={() => !disabled && setIsOpen(true)}
          disabled={disabled}
          className={`
            w-full rounded-xl border border-slate-300/80 bg-white/85 backdrop-blur-md px-3.5 py-2 min-h-[38px]
            text-xs sm:text-sm text-slate-900 placeholder-slate-400
            focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:ring-offset-2 focus:border-sky-500
            disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200/50
            transition-[border-color,box-shadow,background-color] duration-150 ease-out
            pr-10
            ${className}
          `}
        />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          disabled={disabled}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 disabled:opacity-50"
          aria-label="Open calendar"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div
          className="absolute z-50 mt-1.5 min-w-[280px] liquid-glass-elevated rounded-2xl shadow-xl ring-1 ring-slate-900/5 overflow-hidden animate-dropdown-in"
          style={{ transformOrigin: "top right" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-white/50">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition active:scale-95"
              aria-label="Previous month"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="text-center">
              <p className="text-sm font-bold text-slate-900">{MONTH_NAMES[currentMonth]}</p>
              <p className="text-xs text-slate-500">{currentYear}</p>
            </div>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition active:scale-95"
              aria-label="Next month"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Year/Month quick select */}
          <div className="px-3 py-2 flex items-center gap-2 border-b border-slate-100 bg-white/30">
            <select
              value={currentMonth}
              onChange={(e) => setCurrentMonth(Number(e.target.value))}
              className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-800 font-medium focus:border-sky-500 focus:outline-none"
            >
              {MONTH_NAMES.map((m, i) => (
                <option key={i} value={i}>{m.slice(0, 3)}</option>
              ))}
            </select>
            <select
              value={currentYear}
              onChange={(e) => setCurrentYear(Number(e.target.value))}
              className="w-24 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-800 font-medium focus:border-sky-500 focus:outline-none"
            >
              {Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - 10 + i).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-0.5 px-3 py-2 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-0.5 px-3 pb-3">
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="h-10 rounded-lg bg-slate-50/50" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const disabled = isDateDisabled(day);
              const today = isToday(day);
              const selected = isSelected(day);
              const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const hasEvent = false; // Could be extended to show events

              return (
                <button
                  key={day}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleDateChange(dateStr)}
                  className={`h-10 rounded-lg transition-all duration-150 ease-out flex flex-col items-center justify-center ${
                    disabled
                      ? "text-slate-300 cursor-not-allowed"
                      : selected
                      ? "bg-sky-600 text-white shadow-xs"
                      : today
                      ? "bg-sky-50 text-sky-700 font-semibold ring-2 ring-sky-500/50"
                      : "text-slate-700 hover:bg-sky-50 hover:text-sky-700 font-medium"
                    } active:scale-95`}
                  aria-selected={selected}
                  aria-disabled={disabled}
                  aria-label={`${MONTH_NAMES[currentMonth]} ${day}, ${currentYear}`}
                >
                  <span className="text-xs sm:text-sm font-semibold">{day}</span>
                  {hasEvent && !selected && <span className="h-1 w-1 rounded-full bg-sky-500 mt-0.5" />}
                </button>
              );
            })}
          </div>

          {/* Footer with Today and Clear buttons */}
          <div className="flex items-center justify-between px-3 py-2 border-t border-slate-100 bg-white/30">
            <button
              type="button"
              onClick={() => {
                const todayStr = new Date().toISOString().split("T")[0];
                handleDateChange(todayStr);
              }}
              className="text-xs font-semibold text-sky-600 hover:underline"
            >
              Today
            </button>
            {showClear && value && (
              <button
                type="button"
                onClick={handleClear}
                className="text-xs font-semibold text-rose-600 hover:underline"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {label && (
        <label className="block text-xs font-medium text-slate-700 mb-1">{label}</label>
      )}
    </div>
  );
}