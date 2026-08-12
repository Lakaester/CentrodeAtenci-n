import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { KpiTrend as KpiTrendData } from "./types";

interface Props {
  trend: KpiTrendData;
  className?: string;
}

const DIRECTION_ICON = {
  up: TrendingUp,
  down: TrendingDown,
  flat: Minus,
} as const;

export function KpiTrend({ trend, className }: Props) {
  const Icon = DIRECTION_ICON[trend.direction];
  const isUp = trend.direction === "up";
  const isFlat = trend.direction === "flat";
  const good = trend.inverted ? !isUp : isUp;

  const color = isFlat
    ? "text-black-45 bg-black-5"
    : good
      ? "text-success bg-success-5"
      : "text-danger bg-danger-5";

  return (
    <span className={cn(
      "inline-flex items-center gap-1 text-xs font-semibold rounded-full px-2 py-0.5",
      color,
      className,
    )}>
      <Icon size={12} aria-hidden="true" />
      {!isFlat && <span>{trend.value > 0 ? "+" : ""}{trend.value}%</span>}
      {trend.label && <span className="font-normal opacity-70 ml-0.5">{trend.label}</span>}
    </span>
  );
}
