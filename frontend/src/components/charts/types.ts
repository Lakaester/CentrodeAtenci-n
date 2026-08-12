export type ChartVariant = "line" | "bar" | "hbar" | "donut" | "area";

export interface SeriesConfig {
  name: string;
  color?: string;
  area?: boolean;
  smooth?: boolean;
}

export interface ChartSeries {
  name: string;
  data: number[];
  config?: SeriesConfig;
}

export interface LineData {
  categories: string[];
  series: ChartSeries[];
}

export interface DonutData {
  name: string;
  value: number;
  color?: string;
}

export interface BarData {
  categories: string[];
  series: ChartSeries[];
}

export interface ChartConfig {
  height?: number;
  showLegend?: boolean;
  showTooltip?: boolean;
  showGrid?: boolean;
  variant?: ChartVariant;
}

export interface ChartState {
  isLoading?: boolean;
  isEmpty?: boolean;
  error?: string | null;
  emptyMessage?: string;
}

export type ChartData = LineData | DonutData[] | BarData;
