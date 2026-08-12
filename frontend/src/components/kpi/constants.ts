import type { TrendDirection, KpiSize } from "./types";

export const TREND_LABELS: Record<TrendDirection, string> = {
  up: "↑",
  down: "↓",
  flat: "→",
};

export const KPI_SIZE_CLASSES: Record<KpiSize, string> = {
  sm: "p-3",
  md: "p-5",
  lg: "p-6",
};

export const KPI_VALUE_SIZE_CLASSES: Record<KpiSize, string> = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-3xl",
};
