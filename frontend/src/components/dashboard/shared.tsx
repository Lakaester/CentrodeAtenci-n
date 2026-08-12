/* Shared dashboard UI components with Restaurant.pe brand design */

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ── Pastel chart palette (10 colors, brand-derived) ── */
export const CHART_COLORS = [
  "#FED7AA", "#A7F3D0", "#BFDBFE", "#DDD6FE", "#FECDD3",
  "#FEF08A", "#BAE6FD", "#BBF7D0", "#E9D5FF", "#FDBA74",
];

export function getChartColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}

/* ── Formatters ── */
export const fmtNum = (n: number | null | undefined) =>
  n == null ? "—" : n.toLocaleString("es-PE");
export const fmtPct = (n: number | null | undefined) =>
  n == null ? "—" : `${Math.round(n)}%`;
export const fmtDur = (min: number | null | undefined) => {
  if (min == null) return "—";
  if (min < 60) return `${Math.round(min)} min`;
  const h = min / 60;
  return `${Number.isInteger(h) ? h : h.toFixed(1)} h`;
};

/* ── Brand KPI Card ── */
interface KpiCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  hint?: string;
  trend?: { value: number; goodUp?: boolean } | null;
  color?: string;
}

export function KpiCard({ icon, label, value, hint, trend, color }: KpiCardProps) {
  const trendColor = trend
    ? trend.value > 0
      ? trend.goodUp ? "text-success" : "text-danger"
      : trend.value < 0
        ? trend.goodUp ? "text-danger" : "text-success"
        : "text-black-45"
    : "text-black-45";
  return (
    <div className="rounded-2xl border border-black-10 bg-white p-5  transition-colors hover:">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-black-45">{label}</p>
          <p className={cn("mt-1.5 text-2xl font-bold tracking-tight", color ?? "text-black-85")}>{value}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-10 text-primary">
          {icon}
        </div>
      </div>
      {trend && (
        <p className={cn("mt-2 text-xs font-medium", trendColor)}>
          {trend.value > 0 ? "+" : ""}{trend.value}% vs período anterior
        </p>
      )}
      {hint && <p className="mt-1 text-xs text-black-25">{hint}</p>}
    </div>
  );
}

/* ── Section wrapper ── */
export function Section({
  title,
  subtitle,
  children,
  className,
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-black-10 bg-white p-6 ", className)}>
      {title && (
        <div className="mb-5">
          <h3 className="text-sm font-semibold text-black-85">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-black-25">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
}

/* ── Data Table ── */
interface Column<T> {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
  render: (row: T, index: number) => ReactNode;
}

export function DataTable<T>({
  columns,
  data,
  maxHeight = "max-h-96",
}: {
  columns: Column<T>[];
  data: T[];
  maxHeight?: string;
}) {
  if (!data.length) return null;
  return (
    <div className={cn("overflow-x-auto", maxHeight, "overflow-y-auto")}>
      <table className="w-full text-sm">
        <thead className="sticky top-0 z-10 bg-white">
          <tr className="text-left text-xs font-semibold uppercase tracking-wider text-black-45">
            {columns.map((col) => (
              <th key={col.key} className={cn("pb-3 pr-4", col.align === "right" && "text-right", col.align === "center" && "text-center")}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr
              key={idx}
              className="border-t border-black-5 transition-colors hover:bg-light [&:nth-child(even)]:bg-light"
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn(
                    "py-3 pr-4 text-black-85",
                    col.align === "right" && "text-right",
                    col.align === "center" && "text-center",
                  )}
                >
                  {col.render(row, idx)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Badge (for SLA, status, etc.) ── */
export function Badge({
  value,
  goodAbove,
  format,
}: {
  value: number | null | undefined;
  goodAbove?: number;
  format?: (v: number) => string;
}) {
  if (value == null) return <span className="text-black-25">—</span>;
  const f = format ?? ((v: number) => `${Math.round(v)}%`);
  const ok = goodAbove == null || value >= goodAbove;
  const bg = ok ? "bg-success-5 text-success border-emerald-200" : "bg-danger-5 text-danger border-rose-200";
  return (
    <span className={`inline-block rounded-md border px-2 py-0.5 text-xs font-semibold ${bg}`}>
      {f(value)}
    </span>
  );
}
