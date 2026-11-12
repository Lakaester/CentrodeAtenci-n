import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MetricTrend {
  value: number;
  direction: "up" | "down" | "flat";
  suffix?: "%" | "pp";
  label?: string;
  invert?: boolean;
}

type Accent = "orange" | "charcoal" | "green" | "red" | "amber" | "neutral";

interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  help?: string;
  icon?: LucideIcon;
  accent?: Accent;
  trend?: MetricTrend;
  status?: string;
  onClick?: () => void;
  muted?: boolean;
  className?: string;
}

const ACCENT: Record<Accent, { bar: string; icon: string; iconBg: string }> = {
  orange: { bar: "bg-primary-45", icon: "text-primary", iconBg: "bg-primary-5" },
  charcoal: { bar: "bg-black-85", icon: "text-black-85", iconBg: "bg-black-5" },
  green: { bar: "bg-success", icon: "text-success", iconBg: "bg-success-5" },
  red: { bar: "bg-danger", icon: "text-danger", iconBg: "bg-danger-5" },
  amber: { bar: "bg-warning", icon: "text-warning", iconBg: "bg-warning-5" },
  neutral: { bar: "bg-black-10", icon: "text-black-45", iconBg: "bg-black-5" },
};

function TrendBadge({ trend }: { trend: MetricTrend }) {
  if (trend.direction === "flat") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-black-5 px-2 py-0.5 text-[10px] font-medium text-black-45">
        <Minus size={11} /> Sin cambio
      </span>
    );
  }
  const good = trend.invert ? trend.direction === "down" : trend.direction === "up";
  const Icon = trend.direction === "up" ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums",
        good ? "bg-success-5 text-success" : "bg-danger-5 text-danger",
      )}
      title={trend.label}
    >
      <Icon size={11} />
      {trend.value > 0 ? "+" : ""}
      {trend.value.toFixed(1)}
      {trend.suffix ?? "%"}
    </span>
  );
}

export function MetricCard({
  title,
  value,
  subtitle,
  help,
  icon: Icon,
  accent = "orange",
  trend,
  status,
  onClick,
  muted,
  className,
}: Props) {
  const colors = ACCENT[accent];
  const Wrapper = onClick ? "button" : "div";

  return (
    <Wrapper
      {...(onClick ? { type: "button" as const, onClick } : {})}
      title={help}
      className={cn(
        "group relative flex min-h-[118px] w-full flex-col overflow-hidden rounded-2xl border border-black-10 bg-white p-4 text-left shadow-[0_1px_2px_rgba(76,91,95,0.05)]",
        onClick && "transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_6px_18px_rgba(76,91,95,0.10)] focus:outline-none focus-visible:border-primary",
        muted && "bg-black-5",
        className,
      )}
    >
      <div className={cn("absolute inset-x-0 top-0 h-[3px]", colors.bar)} />
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-black-45">{title}</p>
        {Icon && (
          <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-lg", colors.iconBg)}>
            <Icon size={14} className={colors.icon} />
          </span>
        )}
      </div>
      <p className="mt-1.5 text-[25px] font-semibold leading-none tracking-tight text-black-85 tabular-nums">
        {value}
      </p>
      <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
        {trend && <TrendBadge trend={trend} />}
        {status && <span className="text-[10px] font-medium text-black-45">{status}</span>}
      </div>
      {subtitle && <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-black-25">{subtitle}</p>}
    </Wrapper>
  );
}
