"use client";

import { useTheme } from "@/components/layout/ThemeProvider";
import { Sun, Moon, Monitor } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const OPTIONS = [
  { value: "light" as const, label: "Claro", Icon: Sun },
  { value: "dark" as const, label: "Oscuro", Icon: Moon },
  { value: "system" as const, label: "Sistema", Icon: Monitor },
];

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const current = OPTIONS.find((o) => o.value === theme) ?? OPTIONS[2];
  const { Icon } = current;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        title="Cambiar tema"
        className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
        style={{
          color: "var(--text-secondary)",
          background: "transparent",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-surface-2)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <Icon size={16} />
      </button>

      {open && (
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-36 rounded-xl overflow-hidden shadow-lg border z-50"
          style={{
            background: "var(--bg-surface)",
            borderColor: "var(--border)",
            boxShadow: "var(--shadow-lg)",
          }}
        >
          {OPTIONS.map(({ value, label, Icon: Ic }) => (
            <button
              key={value}
              onClick={() => { setTheme(value); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium transition-colors text-left"
              style={{
                color: theme === value ? "var(--text-primary)" : "var(--text-secondary)",
                background: theme === value ? "var(--bg-surface-2)" : "transparent",
              }}
              onMouseEnter={(e) => { if (theme !== value) e.currentTarget.style.background = "var(--bg-surface-2)"; }}
              onMouseLeave={(e) => { if (theme !== value) e.currentTarget.style.background = "transparent"; }}
            >
              <Ic size={13} />
              {label}
              {theme === value && (
                <span className="ml-auto text-[10px] font-bold" style={{ color: "var(--text-muted)" }}>✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
