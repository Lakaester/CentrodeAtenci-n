import type { ChartConfig } from "./types";

export const DEFAULT_CHART_CONFIG: Required<ChartConfig> = {
  height: 300,
  showLegend: true,
  showTooltip: true,
  showGrid: true,
  variant: "line",
};

export const CHART_COLORS = [
  "#2563EB",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
  "#F97316",
];
