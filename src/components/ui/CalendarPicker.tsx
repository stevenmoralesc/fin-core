"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";

const MONTH_NAMES = [
  "enero","febrero","marzo","abril","mayo","junio",
  "julio","agosto","septiembre","octubre","noviembre","diciembre",
];

const DAY_HEADERS = ["DO","LU","MA","MI","JU","VI","SA"];

interface CalendarPickerProps {
  value: string;          // ISO "YYYY-MM-DD"
  onChange: (iso: string) => void;
  onClose: () => void;
}

export default function CalendarPicker({ value, onChange, onClose }: CalendarPickerProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Parse initial value
  const parsed = useMemo(() => {
    const d = value ? new Date(value + "T12:00:00") : new Date();
    return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
  }, [value]);

  const [viewYear, setViewYear] = useState(parsed.year);
  const [viewMonth, setViewMonth] = useState(parsed.month);

  // Click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  // Build calendar grid
  const grid = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrev = new Date(viewYear, viewMonth, 0).getDate();

    const cells: { day: number; current: boolean }[] = [];

    // Previous month trailing days
    for (let i = firstDay - 1; i >= 0; i--) {
      cells.push({ day: daysInPrev - i, current: false });
    }
    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, current: true });
    }
    // Next month leading days (fill to 6 rows max, or at least complete current row)
    const remaining = 7 - (cells.length % 7);
    if (remaining < 7) {
      for (let d = 1; d <= remaining; d++) {
        cells.push({ day: d, current: false });
      }
    }
    return cells;
  }, [viewYear, viewMonth]);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  }

  function selectDay(day: number) {
    const iso = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    onChange(iso);
    onClose();
  }

  const isSelectedDay = (day: number, isCurrent: boolean) => {
    return isCurrent && viewYear === parsed.year && viewMonth === parsed.month && day === parsed.day;
  };

  const isTodayDay = (day: number, isCurrent: boolean) => {
    const now = new Date();
    return isCurrent && viewYear === now.getFullYear() && viewMonth === now.getMonth() && day === now.getDate();
  };

  const headerLabel = `${MONTH_NAMES[viewMonth]} ${viewYear}`;

  return (
    <div
      ref={ref}
      style={{
        background: "#fff",
        borderRadius: 22,
        boxShadow: "0 12px 40px rgba(20,20,30,.12)",
        border: "1px solid #efefef",
        padding: "20px 20px 16px",
        width: 320,
        fontFamily: "'Hanken Grotesk', var(--font-sans), system-ui, sans-serif",
      }}
    >
      {/* Header: month name + nav arrows */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "16px", fontWeight: 700, letterSpacing: "-0.01em", color: "#1a1a1e" }}>
          {headerLabel}
          <ChevronDown size={17} style={{ color: "#9a9aa2" }} />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={prevMonth}
            style={{ width: 34, height: 34, borderRadius: 10, background: "#f4f4f2", display: "flex", alignItems: "center", justifyContent: "center", color: "#5a5a62", border: "none", cursor: "pointer" }}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={nextMonth}
            style={{ width: 34, height: 34, borderRadius: 10, background: "#f4f4f2", display: "flex", alignItems: "center", justifyContent: "center", color: "#5a5a62", border: "none", cursor: "pointer" }}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Day-of-week headers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 6 }}>
        {DAY_HEADERS.map((d) => (
          <div
            key={d}
            style={{
              textAlign: "center",
              fontFamily: "'JetBrains Mono', var(--font-jetbrains), monospace",
              fontSize: "10.5px",
              letterSpacing: "0.06em",
              color: "#a6a6ae",
              padding: "4px 0",
            }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, fontVariantNumeric: "tabular-nums" }}>
        {grid.map((cell, i) => {
          const selected = isSelectedDay(cell.day, cell.current);
          const today = isTodayDay(cell.day, cell.current) && !selected;

          return (
            <div
              key={i}
              style={{ height: 42, display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              {cell.current ? (
                <button
                  type="button"
                  onClick={() => selectDay(cell.day)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "14.5px",
                    fontWeight: selected || today ? 700 : 500,
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    ...(selected
                      ? { background: "#14182a", color: "#fff", boxShadow: "0 4px 10px rgba(20,24,42,.28)" }
                      : today
                        ? { background: "#eaeef9", color: "#3b5bda" }
                        : { background: "transparent", color: "#1a1a1e" }),
                  }}
                  onMouseEnter={(e) => {
                    if (!selected && !today) {
                      e.currentTarget.style.background = "#f4f4f2";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!selected && !today) {
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  {cell.day}
                </button>
              ) : (
                <span style={{ fontSize: "14.5px", color: "#cdcdd4" }}>{cell.day}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
