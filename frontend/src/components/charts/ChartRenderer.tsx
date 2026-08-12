import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import type { ChartConfig, ChartData, DonutData, LineData } from "./types";
import { DEFAULT_CHART_CONFIG, CHART_COLORS } from "./constants";

function isCategoriesData(d: ChartData): d is LineData {
  return "categories" in d && "series" in d;
}

function isDonutData(d: ChartData): d is DonutData[] {
  return Array.isArray(d);
}

function buildLineOption(data: LineData, config: ChartConfig): EChartsOption {
  return {
    tooltip: config.showTooltip !== false ? { trigger: "axis" } : undefined,
    legend: config.showLegend !== false ? { bottom: 0, textStyle: { fontSize: 11, color: "#64748B" } } : undefined,
    grid: config.showGrid !== false ? { left: 40, right: 16, top: 16, bottom: config.showLegend !== false ? 40 : 24 } : undefined,
    xAxis: { type: "category", data: data.categories, axisLine: { lineStyle: { color: "#E2E8F0" } }, axisLabel: { fontSize: 11, color: "#94A3B8" } },
    yAxis: { type: "value", splitLine: { lineStyle: { color: "#F1F5F9" } }, axisLabel: { fontSize: 11, color: "#94A3B8" } },
    series: data.series.map((s, i) => ({
      type: config.variant === "area" ? "line" : "line",
      name: s.name,
      data: s.data,
      smooth: s.config?.smooth ?? true,
      areaStyle: config.variant === "area" ? { opacity: 0.15 } : undefined,
      lineStyle: { width: 2, color: s.config?.color ?? CHART_COLORS[i] },
      itemStyle: { color: s.config?.color ?? CHART_COLORS[i] },
      symbol: "circle",
      symbolSize: 6,
    })),
  };
}

function buildBarOption(data: LineData, config: ChartConfig): EChartsOption {
  const isHorizontal = config.variant === "hbar";
  return {
    tooltip: config.showTooltip !== false ? { trigger: "axis" } : undefined,
    legend: config.showLegend !== false ? { bottom: 0, textStyle: { fontSize: 11, color: "#64748B" } } : undefined,
    grid: { left: isHorizontal ? 80 : 40, right: 16, top: 16, bottom: config.showLegend !== false ? 40 : 24 },
    xAxis: isHorizontal
      ? { type: "value", splitLine: { lineStyle: { color: "#F1F5F9" } }, axisLabel: { fontSize: 11, color: "#94A3B8" } }
      : { type: "category", data: data.categories, axisLine: { lineStyle: { color: "#E2E8F0" } }, axisLabel: { fontSize: 11, color: "#94A3B8" } },
    yAxis: isHorizontal
      ? { type: "category", data: data.categories, axisLine: { lineStyle: { color: "#E2E8F0" } }, axisLabel: { fontSize: 11, color: "#94A3B8" } }
      : { type: "value", splitLine: { lineStyle: { color: "#F1F5F9" } }, axisLabel: { fontSize: 11, color: "#94A3B8" } },
    series: data.series.map((s, i) => ({
      type: "bar",
      name: s.name,
      data: s.data,
      barMaxWidth: 32,
      itemStyle: { color: s.config?.color ?? CHART_COLORS[i], borderRadius: isHorizontal ? [0, 3, 3, 0] : [3, 3, 0, 0] },
    })),
  };
}

function buildDonutOption(data: DonutData[], config: ChartConfig): EChartsOption {
  return {
    tooltip: config.showTooltip !== false ? { trigger: "item", formatter: "{b}: {c} ({d}%)" } : undefined,
    legend: config.showLegend !== false ? { bottom: 0, textStyle: { fontSize: 11, color: "#64748B" } } : undefined,
    series: [
      {
        type: "pie",
        radius: ["45%", "70%"],
        center: ["50%", "45%"],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 4 },
        label: { show: false },
        emphasis: { label: { show: true, fontSize: 12, fontWeight: "bold" } },
        data: data.map((d, i) => ({
          name: d.name,
          value: d.value,
          itemStyle: { color: d.color ?? CHART_COLORS[i % CHART_COLORS.length] },
        })),
      },
    ],
  };
}

interface Props {
  data: ChartData;
  config?: ChartConfig;
}

export function ChartRenderer({ data, config }: Props) {
  const height = config?.height ?? DEFAULT_CHART_CONFIG.height;

  const option = useMemo<EChartsOption>(() => {
    const merged = { ...DEFAULT_CHART_CONFIG, ...config };
    if (isDonutData(data)) return buildDonutOption(data, merged);
    if (isCategoriesData(data)) {
      if (merged.variant === "bar" || merged.variant === "hbar") return buildBarOption(data, merged);
      return buildLineOption(data, merged);
    }
    return {};
  }, [data, config]);

  return (
    <ReactECharts
      option={option}
      style={{ height, width: "100%" }}
      notMerge
      lazyUpdate
    />
  );
}
