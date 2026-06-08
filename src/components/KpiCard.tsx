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
      className="group bg-white p-6 rounded-2xl border border-gray-100/80 shadow-sm flex flex-col justify-between min-h-[140px] gap-3 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
      style={{ borderTopWidth: '3px', borderTopColor: accentColor }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
            {title}
          </p>
          {subtitle && (
            <p className="text-[11px] text-gray-400 font-medium tracking-wide">{subtitle}</p>
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
        <span className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
          {value}
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
            className={`text-xs font-semibold ${
              trend.positive ? "text-emerald-600" : "text-red-500"
            }`}
          >
            {trend.value}
          </span>
          <span className="text-xs font-medium text-gray-400">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
