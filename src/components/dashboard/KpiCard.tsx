"use client";

import { TrendingUp, TrendingDown, LucideIcon } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string;
  valueParts?: { integer: string; decimal: string };
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    positive: boolean;
    label: string;
  };
  variant?: "default" | "warning" | "success";
  accentColor?: string;
}

export default function KpiCard({
  title,
  value,
  valueParts,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
  accentColor = "#111827",
}: KpiCardProps) {
  const accentBg =
    variant === "warning"
      ? "#fef3c7"
      : variant === "success"
        ? "#d1fae5"
        : "#f3f4f6";

  const accentText =
    variant === "warning"
      ? "#92400e"
      : variant === "success"
        ? "#065f46"
        : "#374151";

  return (
    <div 
      className="group p-6 rounded-2xl border flex flex-col justify-between min-h-[140px] gap-3 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
      style={{ background: "var(--bg-surface)", borderRightColor: "var(--border)", borderBottomColor: "var(--border)", borderLeftColor: "var(--border)", borderTopWidth: '3px', borderTopColor: accentColor, boxShadow: "var(--shadow-sm)" }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
            {title}
          </p>
          {subtitle && (
            <p className="text-[11px] font-medium tracking-wide" style={{ color: "var(--text-secondary)" }}>{subtitle}</p>
          )}
        </div>
        <div
          className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0 transition-colors duration-200"
          style={{ backgroundColor: accentBg }}
        >
          <Icon size={18} style={{ color: accentText }} strokeWidth={2} />
        </div>
      </div>

      {/* Value */}
      <div>
        <span className="text-2xl md:text-3xl font-bold tracking-tight tabular-nums" style={{ color: "var(--text-primary)" }}>
          {valueParts ? (
            <>
              {valueParts.integer}
              <span style={{ color: "var(--text-placeholder)", fontSize: "0.65em" }}>{valueParts.decimal}</span>
            </>
          ) : (
            value
          )}
        </span>
      </div>

      {/* Trend */}
      {trend && (
        <div className="flex items-center gap-1.5 mt-1">
          {trend.positive ? (
            <TrendingUp size={14} className="text-emerald-500" />
          ) : (
            <TrendingDown size={14} className="text-red-500" />
          )}
          <span
            className="text-xs font-semibold"
            style={{ color: trend.positive ? "var(--success)" : "var(--danger)" }}
          >
            {trend.value}
          </span>
          <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{trend.label}</span>
        </div>
      )}
    </div>
  );
}
