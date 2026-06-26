"use client";

import { useState, useEffect, useRef } from "react";
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

const MONTH_SHORT = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];

export default function MonthPickerPopover({
  periodo,
  onChange,
}: {
  periodo: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const [selYear, selMonthIdx] = (() => {
    const [y, m] = periodo.split("-");
    return [parseInt(y), parseInt(m) - 1];
  })();

  const now = new Date();
  const currentYear = now.getFullYear();
  const [viewYear, setViewYear] = useState(selYear);

  // Recalculate years array based on viewYear
  const years = [viewYear - 1, viewYear, viewYear + 1];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Sync viewYear when selection changes externally
  useEffect(() => {
    setViewYear(selYear);
  }, [selYear]);

  const monthName = new Date(selYear, selMonthIdx, 1)
    .toLocaleDateString("es-CO", { month: "long" });
  const label = `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${selYear}`;

  function select(monthIdx: number) {
    const val = `${viewYear}-${(monthIdx + 1).toString().padStart(2, "0")}`;
    onChange(val);
    setOpen(false);
  }

  return (
    <div className="relative z-50" ref={ref}>
      {/* Trigger button — HandOff style */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 9,
          padding: "9px 16px",
          borderRadius: 14,
          background: "#fff",
          border: "1px solid #ececea",
          boxShadow: "0 2px 8px rgba(20,20,30,.05)",
          cursor: "pointer",
          fontFamily: "'Hanken Grotesk', var(--font-sans), system-ui, sans-serif",
        }}
      >
        <Calendar size={18} strokeWidth={2} style={{ color: "#3b5bda" }} />
        <span style={{ fontSize: "15px", fontWeight: 700, letterSpacing: "0.01em", color: "#1a1a1e" }}>
          {label}
        </span>
        <ChevronDown size={16} style={{ color: "#9a9aa2" }} />
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            background: "#fff",
            borderRadius: 22,
            boxShadow: "0 12px 40px rgba(20,20,30,.12)",
            border: "1px solid #efefef",
            padding: 18,
            width: 300,
            fontFamily: "'Hanken Grotesk', var(--font-sans), system-ui, sans-serif",
          }}
        >
          {/* Year selector row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <button
              type="button"
              onClick={() => setViewYear(viewYear - 1)}
              style={{
                width: 34, height: 34, borderRadius: 10,
                background: "#f4f4f2", display: "flex", alignItems: "center", justifyContent: "center",
                color: "#5a5a62", border: "none", cursor: "pointer",
              }}
            >
              <ChevronLeft size={18} />
            </button>

            {/* Year pills */}
            <div style={{ display: "flex", background: "#f3f3f1", borderRadius: 12, padding: 4 }}>
              {years.map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => setViewYear(y)}
                  style={{
                    padding: "7px 16px",
                    fontSize: 14,
                    fontWeight: viewYear === y ? 700 : 600,
                    color: viewYear === y ? "#fff" : "#8a8a92",
                    background: viewYear === y ? "#14182a" : "transparent",
                    borderRadius: viewYear === y ? 9 : 0,
                    boxShadow: viewYear === y ? "0 2px 6px rgba(20,24,42,.24)" : "none",
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {y}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setViewYear(viewYear + 1)}
              style={{
                width: 34, height: 34, borderRadius: 10,
                background: "#f4f4f2", display: "flex", alignItems: "center", justifyContent: "center",
                color: "#5a5a62", border: "none", cursor: "pointer",
              }}
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* 4×3 month grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            {MONTH_SHORT.map((m, i) => {
              const isSel = viewYear === selYear && i === selMonthIdx;
              const isFuture = viewYear > currentYear || (viewYear === currentYear && i > now.getMonth());

              return (
                <button
                  key={m}
                  type="button"
                  disabled={isFuture}
                  onClick={() => select(i)}
                  style={{
                    height: 46,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 13,
                    fontSize: "14.5px",
                    fontWeight: isSel ? 700 : 600,
                    textTransform: "capitalize",
                    border: "none",
                    cursor: isFuture ? "default" : "pointer",
                    transition: "all 0.15s ease",
                    ...(isSel
                      ? { background: "#14182a", color: "#fff", boxShadow: "0 4px 10px rgba(20,24,42,.26)" }
                      : isFuture
                        ? { background: "transparent", color: "#c4c4cc" }
                        : { background: "transparent", color: "#1a1a1e" }),
                  }}
                  onMouseEnter={(e) => {
                    if (!isSel && !isFuture) e.currentTarget.style.background = "#f4f4f2";
                  }}
                  onMouseLeave={(e) => {
                    if (!isSel && !isFuture) e.currentTarget.style.background = "transparent";
                  }}
                >
                  {m}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
