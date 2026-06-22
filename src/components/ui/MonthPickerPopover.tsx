"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";

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
  const years = [currentYear - 1, currentYear, currentYear + 1];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const label = new Date(selYear, selMonthIdx, 1)
    .toLocaleDateString("es-CO", { month: "long", year: "numeric" });

  function select(monthIdx: number) {
    const val = `${viewYear}-${(monthIdx + 1).toString().padStart(2, "0")}`;
    onChange(val);
    setOpen(false);
  }

  return (
    <div className="relative z-50" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-colors shadow-sm bg-surface hover:bg-surface-2"
        style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
      >
        <span className="text-sm font-bold capitalize">{label}</span>
        <ChevronDown size={14} style={{ color: "var(--text-muted)" }} />
      </button>

      {open && (
        <div
          className="absolute top-full left-0 mt-2 p-3 rounded-2xl border shadow-lg w-64"
          style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
        >
          {/* Year pills */}
          <div className="flex gap-1.5 mb-3 justify-center">
            {years.map((y) => (
              <button
                key={y}
                type="button"
                onClick={() => setViewYear(y)}
                className="px-3 py-1 rounded-full text-xs font-semibold transition-colors"
                style={viewYear === y
                  ? { background: "var(--accent)", color: "var(--accent-fg)" }
                  : { background: "var(--bg-surface-2)", color: "var(--text-secondary)" }}
              >
                {y}
              </button>
            ))}
          </div>
          {/* 3×4 month grid */}
          <div className="grid grid-cols-4 gap-1.5">
            {MONTH_SHORT.map((m, i) => {
              const isSel = viewYear === selYear && i === selMonthIdx;
              const isFuture = viewYear > currentYear || (viewYear === currentYear && i > now.getMonth());
              return (
                <button
                  key={m}
                  type="button"
                  disabled={isFuture}
                  onClick={() => select(i)}
                  className="py-2 rounded-xl text-xs font-semibold transition-colors"
                  style={isSel
                    ? { background: "var(--accent)", color: "var(--accent-fg)" }
                    : isFuture
                    ? { color: "var(--text-muted)", cursor: "default" }
                    : { color: "var(--text-secondary)" }}
                  onMouseEnter={(e) => { if (!isSel && !isFuture) e.currentTarget.style.background = "var(--bg-surface-2)"; }}
                  onMouseLeave={(e) => { if (!isSel) e.currentTarget.style.background = "transparent"; }}
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
