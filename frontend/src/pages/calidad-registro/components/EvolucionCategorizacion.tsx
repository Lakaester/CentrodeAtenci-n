import { useMemo, useState, type ReactNode } from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import { Section } from "@/components/dashboard/shared";
import { cn } from "@/lib/utils";
import { C, fmtNum, fmtPct } from "../format";
import type { CalidadRegistroResponse } from "../types";

type Vista = "consolidado" | "canal";

function Boton({
  activo,
  onClick,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded px-2.5 py-1 text-xs font-medium transition-colors",
        activo ? "bg-primary text-white" : "bg-light text-black-45 hover:text-black-85",
      )}
    >
      {children}
    </button>
  );
}

export function EvolucionCategorizacion({ data }: { data: CalidadRegistroResponse }) {
  const [vista, setVista] = useState<Vista>("consolidado");
  const [metrica, setMetrica] = useState<"registrada" | "homologada">("homologada");

  const option = useMemo<EChartsOption>(() => {
    const periodos = data.evolucion.map((p) => p.periodo);
    const conZoom = data.evolucion.length > 18;
    const base = {
      tooltip: { trigger: "axis" as const },
      legend: { bottom: 0, type: "scroll" as const, textStyle: { fontSize: 11 } },
      grid: { left: 55, right: 55, top: 20, bottom: conZoom ? 88 : 62 },
      dataZoom: conZoom
        ? [
            { type: "inside" as const },
            { type: "slider" as const, height: 14, bottom: 32 },
          ]
        : [],
      xAxis: {
        type: "category" as const,
        data: periodos,
        axisLabel: { fontSize: 10, rotate: periodos.length > 14 ? 40 : 0 },
        axisLine: { show: false },
      },
    };

    if (vista === "canal") {
      const series = data.evolucionPorCanal.map((serie, idx) => {
        const byStart = new Map(serie.periodos.map((p) => [p.periodoInicio, p]));
        const color = [C.ambar, C.azul, C.violeta][idx % 3];
        return {
          name: serie.canalLabel,
          type: "line" as const,
          smooth: true,
          symbol: "none" as const,
          connectNulls: false,
          lineStyle: { color, width: 2 },
          itemStyle: { color },
          data: data.evolucion.map((p) => {
            const fila = byStart.get(p.periodoInicio);
            if (!fila) return null;
            return metrica === "registrada"
              ? fila.categorizacion.pctRegistrada
              : fila.categorizacion.pctHomologada;
          }),
        };
      });
      return {
        ...base,
        yAxis: {
          type: "value" as const,
          min: 0,
          max: 100,
          axisLabel: { formatter: "{value}%", fontSize: 10 },
          splitLine: { lineStyle: { type: "dashed" as const } },
        },
        series,
      };
    }

    return {
      ...base,
      yAxis: [
        {
          type: "value" as const,
          name: "Atenciones",
          nameTextStyle: { fontSize: 10 },
          axisLabel: { fontSize: 10 },
          splitLine: { lineStyle: { type: "dashed" as const } },
        },
        {
          type: "value" as const,
          name: "%",
          min: 0,
          max: 100,
          axisLabel: { formatter: "{value}%", fontSize: 10 },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: "Homologadas",
          type: "bar" as const,
          stack: "total",
          barMaxWidth: 38,
          itemStyle: { color: C.verde },
          data: data.evolucion.map((p) => p.categorizacion.homologadas),
        },
        {
          name: "Registradas no homologadas",
          type: "bar" as const,
          stack: "total",
          barMaxWidth: 38,
          itemStyle: { color: C.ambar },
          data: data.evolucion.map((p) => p.categorizacion.registradasNoHomologadas),
        },
        {
          name: "No registradas",
          type: "bar" as const,
          stack: "total",
          barMaxWidth: 38,
          itemStyle: { color: C.rojo },
          data: data.evolucion.map((p) => p.categorizacion.noRegistradas),
        },
        {
          name: "% Cat. registrada",
          type: "line" as const,
          yAxisIndex: 1,
          smooth: true,
          connectNulls: false,
          symbol: "circle",
          symbolSize: 4,
          lineStyle: { color: C.azul, width: 2 },
          itemStyle: { color: C.azul },
          data: data.evolucion.map((p) => p.categorizacion.pctRegistrada),
        },
        {
          name: "% Cat. homologada",
          type: "line" as const,
          yAxisIndex: 1,
          smooth: true,
          connectNulls: false,
          symbol: "none" as const,
          lineStyle: { color: C.verdeOscuro, width: 2, type: "dashed" as const },
          itemStyle: { color: C.verdeOscuro },
          data: data.evolucion.map((p) => p.categorizacion.pctHomologada),
        },
      ],
    };
  }, [data, vista, metrica]);

  if (!data.evolucion.length) {
    return (
      <Section title="Evolución de categorización">
        <p className="py-8 text-center text-sm text-black-25">
          No hay atenciones para el rango seleccionado.
        </p>
      </Section>
    );
  }

  const actual = data.resumen.actual;
  return (
    <Section
      title="Evolución de categorización"
      subtitle={`Barras = conteos · Líneas = % · Brecha actual de homologación: ${fmtPpValue(
        actual.categorizacion.brechaHomologacionPp,
      )} (${fmtNum(actual.categorizacion.brechaHomologacionCount)} atenciones)`}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1">
          <Boton activo={vista === "consolidado"} onClick={() => setVista("consolidado")}>
            Consolidado
          </Boton>
          <Boton activo={vista === "canal"} onClick={() => setVista("canal")}>
            Por canal
          </Boton>
        </div>
        {vista === "canal" && (
          <div className="flex gap-1">
            <Boton activo={metrica === "registrada"} onClick={() => setMetrica("registrada")}>
              Registrada
            </Boton>
            <Boton activo={metrica === "homologada"} onClick={() => setMetrica("homologada")}>
              Homologada
            </Boton>
          </div>
        )}
      </div>
      <ReactECharts option={option} style={{ height: 340 }} notMerge lazyUpdate />
      <div className="mt-2 flex flex-wrap gap-4 text-xs text-black-45">
        <span>
          Registradas: <b className="text-black-85">{fmtPct(actual.categorizacion.pctRegistrada)}</b>
        </span>
        <span>
          Homologadas: <b className="text-black-85">{fmtPct(actual.categorizacion.pctHomologada)}</b>
        </span>
        <span>
          Sin registrar: <b className="text-black-85">{fmtNum(actual.categorizacion.noRegistradas)}</b>
        </span>
      </div>
    </Section>
  );
}

function fmtPpValue(n: number | null): string {
  return n == null ? "—" : `${n.toFixed(1)} pp`;
}
