"use client";

import { TrendingUp, TrendingDown, LucideIcon } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string;
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
      className="group relative bg-white rounded-2xl border border-gray-100 p-6 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 cursor-default overflow-hidden"
      style={{ boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.08)" }}
    >
      {/* Accent gradient top bar */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl opacity-60"
        style={{ backgroundColor: accentColor }}
      />

      {/* Header row */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-0.5">
            {title}
          </p>
          {subtitle && (
            <p className="text-[11px] text-gray-400">{subtitle}</p>
          )}
        </div>
        <div
          className="flex items-center justify-center w-10 h-10 rounded-xl transition-colors duration-200"
          style={{ backgroundColor: accentBg }}
        >
          <Icon size={18} style={{ color: accentText }} strokeWidth={2} />
        </div>
      </div>

      {/* Value */}
      <div className="mb-3">
        <span className="text-2xl font-bold text-gray-900 tracking-tight">
          {value}
        </span>
      </div>

      {/* Trend */}
      {trend && (
        <div className="flex items-center gap-1.5">
          {trend.positive ? (
            <TrendingUp size={13} className="text-emerald-500" />
          ) : (
            <TrendingDown size={13} className="text-red-500" />
          )}
          <span
            className={`text-xs font-semibold ${
              trend.positive ? "text-emerald-600" : "text-red-500"
            }`}
          >
            {trend.value}
          </span>
          <span className="text-xs text-gray-400">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
