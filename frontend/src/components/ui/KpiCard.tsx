import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface Trend {
  value: number;
  label?: string;
  goodUp?: boolean;
}

interface Props {
  icon: ReactNode;
  value: string;
  label: string;
  subtext?: string;
  trend?: Trend;
  className?: string;
}

export function KpiCard({ icon, value, label, subtext, trend, className }: Props) {
  const trendColor = trend
    ? trend.value > 0
      ? trend.goodUp ? "text-success" : "text-danger"
      : trend.value < 0
        ? trend.goodUp ? "text-danger" : "text-success"
        : "text-black-45"
    : "text-black-45";

  return (
    <div className={cn("border border-black-5 rounded-lg p-4", className)}>
      <div className="flex items-center gap-1.5 text-[10px] text-black-45">
        <span className="text-primary">{icon}</span>
        <span>{label}</span>
      </div>
      <p className="mt-1 text-xl font-semibold tabular-nums text-black-85">{value}</p>
      {subtext && <p className="mt-0.5 text-xs text-black-25">{subtext}</p>}
      {trend && (
        <div className="mt-2 flex items-center gap-1">
          <span className={cn("inline-flex items-center gap-0.5 text-xs font-medium", trendColor)}>
            {trend.value > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {trend.value > 0 ? "+" : ""}{trend.value}%
            {trend.label && <span className="text-black-45"> {trend.label}</span>}
          </span>
        </div>
      )}
    </div>
  );
}
