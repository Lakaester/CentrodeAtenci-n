import type { ChartConfig } from "./types";
import { CHART, CHART_SERIES } from "@/lib/chartPalette";

export const DEFAULT_CHART_CONFIG: Required<ChartConfig> = {
  height: 300,
  showLegend: true,
  showTooltip: true,
  showGrid: true,
  variant: "line",
};

export const CHART_COLORS = CHART_SERIES;

export const CHART_TEXT = CHART.charcoal;
export const CHART_AXIS = CHART.axis;
export const CHART_GRID = CHART.grid;
export const CHART_SPLIT = CHART.split;
