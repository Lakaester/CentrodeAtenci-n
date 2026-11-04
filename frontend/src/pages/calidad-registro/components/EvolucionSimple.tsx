import { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { Section } from "@/components/dashboard/shared";
import { cn } from "@/lib/utils";
import { C } from "../format";
import type { CalidadPeriodo } from "../types";

interface Props {
  titulo: string;
  subtitulo: string;
  periodos: CalidadPeriodo[];
  cumple: (p: CalidadPeriodo) => number;
  pendiente: (p: CalidadPeriodo) => number;
  pct: (p: CalidadPeriodo) => number | null;
  etiquetaCumple: string;
  etiquetaPendiente: string;
  etiquetaPct: string;
  deltaPp: number | null;
}

export function EvolucionSimple({
  titulo,
  subtitulo,
  periodos,
  cumple,
  pendiente,
  pct,
  etiquetaCumple,
  etiquetaPendiente,
  etiquetaPct,
  deltaPp,
}: Props) {
  const option = useMemo<EChartsOption>(() => {
    const labels = periodos.map((p) => p.periodo);
    const conZoom = periodos.length > 18;
    return {
      tooltip: { trigger: "axis" },
      legend: { bottom: 0, type: "scroll", textStyle: { fontSize: 11 } },
      grid: { left: 52, right: 52, top: 18, bottom: conZoom ? 86 : 58 },
      dataZoom: conZoom
        ? [
            { type: "inside" },
            { type: "slider", height: 14, bottom: 30 },
          ]
        : [],
      xAxis: {
        type: "category",
        data: labels,
        axisLabel: { fontSize: 10, rotate: labels.length > 14 ? 40 : 0 },
        axisLine: { show: false },
      },
      yAxis: [
        {
          type: "value",
          name: "Atenciones",
          nameTextStyle: { fontSize: 10 },
          axisLabel: { fontSize: 10 },
          splitLine: { lineStyle: { type: "dashed" } },
        },
        {
          type: "value",
          name: "%",
          min: 0,
          max: 100,
          axisLabel: { formatter: "{value}%", fontSize: 10 },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: etiquetaCumple,
          type: "bar",
          stack: "total",
          barMaxWidth: 38,
          itemStyle: { color: C.verde },
          data: periodos.map(cumple),
        },
        {
          name: etiquetaPendiente,
          type: "bar",
          stack: "total",
          barMaxWidth: 38,
          itemStyle: { color: C.ambar },
          data: periodos.map(pendiente),
        },
        {
          name: etiquetaPct,
          type: "line",
          yAxisIndex: 1,
          smooth: true,
          connectNulls: false,
          symbol: "circle",
          symbolSize: 5,
          lineStyle: { color: C.verdeOscuro, width: 3 },
          itemStyle: { color: C.verdeOscuro },
          data: periodos.map(pct),
        },
      ],
    };
  }, [periodos, cumple, pendiente, pct, etiquetaCumple, etiquetaPendiente, etiquetaPct]);

  const DeltaIcon = deltaPp == null || deltaPp === 0 ? Minus : deltaPp > 0 ? ArrowUp : ArrowDown;
  const deltaColor =
    deltaPp == null || deltaPp === 0
      ? "text-black-45"
      : deltaPp > 0
        ? "text-success"
        : "text-danger";

  if (!periodos.length) {
    return (
      <Section title={titulo} subtitle={subtitulo}>
        <p className="py-10 text-center text-sm text-black-25">
          No hay atenciones para el rango seleccionado.
        </p>
      </Section>
    );
  }

  return (
    <Section title={titulo} subtitle={subtitulo}>
      <div className="mb-2 flex justify-end">
        <span className={cn("inline-flex items-center gap-1 text-xs font-semibold", deltaColor)}>
          <DeltaIcon size={13} />
          {deltaPp == null
            ? "Sin comparativo"
            : `${deltaPp > 0 ? "+" : ""}${deltaPp.toFixed(1)} pp`}
          <span className="font-normal text-black-25">vs periodo anterior</span>
        </span>
      </div>
      <ReactECharts option={option} style={{ height: 300 }} notMerge lazyUpdate />
    </Section>
  );
}
