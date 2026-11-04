import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import { api } from "@/lib/api";
import { useFilters } from "@/contexts/FilterContext";
import { filtersToParams } from "@/lib/filters";
import { cn } from "@/lib/utils";

interface Kpi {
  valor: number | null;
  anterior: number | null;
  deltaPct: number | null;
  direccion: "up" | "down" | "flat" | null;
}
interface Desglose {
  etiqueta: string;
  total: number;
}
interface HeatmapCelda {
  hora: number;
  dia: number;
  total: number;
}
interface DiaDato {
  dia: number;
  dias: number;
}
interface OperacionPeriodo {
  periodo: string;
  total: number;
  porSubcanal: { subcanal: string; total: number }[];
}
type Granularidad = "diaria" | "semanal" | "mensual" | "trimestral";
interface Serie {
  actual: OperacionPeriodo[];
  anterior: OperacionPeriodo[];
}
interface Operacion {
  rango: { inicio: string; fin: string; comparadoCon: { inicio: string; fin: string } } | null;
  kpis: {
    total: Kpi;
    promedioPorDia: Kpi;
    diasConDatos: number;
    diasConDatosAnterior: number | null;
    horaPico: string | null;
    horaPicoValor: number | null;
    horaPicoAnterior: string | null;
    horaPicoAnteriorValor: number | null;
    diaCargado: string | null;
    diaCargadoValor: number | null;
    diaCargadoAnterior: string | null;
    diaCargadoAnteriorValor: number | null;
  };
  heatmap: HeatmapCelda[];
  diasPorDia: DiaDato[];
  porSubcanal: Desglose[];
  duplicadosEntreCanales: number;
  topAsesores: Desglose[];
  topCategorias: Desglose[];
  evolucion: Record<Granularidad, Serie>;
}

async function fetchOperacion(params: Record<string, string>): Promise<Operacion> {
  const { data } = await api.get("/dashboard/operacion", { params });
  return data.data as Operacion;
}

const DIAS_LARGOS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const DIAS_ORDEN = [1, 2, 3, 4, 5, 6, 0];
const DIAS_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const HORAS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}:00`);
const SUB_ORDER = ["WHATMETA", "WHATICKET", "ZENDESK"] as const;

const fmt = (n: number | null | undefined) =>
  n === null || n === undefined ? "—" : n.toLocaleString("es-PE");
const fmt1 = (n: number | null | undefined) =>
  n === null || n === undefined ? "—" : n.toLocaleString("es-PE", { maximumFractionDigits: 1 });
const fmtPct = (n: number | null | undefined) =>
  n === null || n === undefined
    ? "—"
    : `${n.toLocaleString("es-PE", { maximumFractionDigits: 1 })}%`;

const nombreCanal = (c: string) => {
  const v = c.toUpperCase();
  if (v === "WHATMETA") return "WAMETA";
  if (v === "WHATICKET") return "WATICKET";
  if (v === "ZENDESK") return "ZENDESK";
  return c;
};

const colorCanal = (c: string) => {
  const v = c.toUpperCase();
  if (v === "WHATMETA") return "#22C55E";
  if (v === "WHATICKET") return "#F97316";
  if (v === "ZENDESK") return "#8B5CF6";
  return "#64748B";
};

function formatFechaLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function rangoUltimos90Dias(): { fechaHoraInicio: string; fechaHoraFin: string } {
  const hoy = new Date();
  const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - 89);
  return {
    fechaHoraInicio: `${formatFechaLocal(inicio)} 00:00`,
    fechaHoraFin: `${formatFechaLocal(hoy)} 23:59`,
  };
}

function diasEntre(inicio: string | null | undefined, fin: string | null | undefined): number {
  if (!inicio || !fin) return 0;
  const a = new Date(`${inicio.slice(0, 10)}T00:00:00Z`).getTime();
  const b = new Date(`${fin.slice(0, 10)}T00:00:00Z`).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) return 0;
  return Math.floor((b - a) / 86400000) + 1;
}

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
        activo ? "bg-primary text-white" : "bg-bg text-muted hover:text-text",
      )}
    >
      {children}
    </button>
  );
}

function KpiDemanda({
  label,
  value,
  hint,
  deltaAbs,
  deltaPct,
  deltaUnidad = "atenciones",
  invertir = false,
}: {
  label: string;
  value: string;
  hint?: string;
  deltaAbs?: number | null;
  deltaPct?: number | null;
  deltaUnidad?: string;
  invertir?: boolean;
}) {
  const tieneDelta =
    deltaAbs !== null && deltaAbs !== undefined && deltaPct !== null && deltaPct !== undefined;
  const direction = !tieneDelta ? "flat" : deltaAbs > 0 ? "up" : deltaAbs < 0 ? "down" : "flat";
  const bueno = invertir ? direction === "down" : direction === "up";
  const color = !tieneDelta || direction === "flat" ? "text-muted" : bueno ? "text-success" : "text-danger";
  const Icon = direction === "up" ? ArrowUp : direction === "down" ? ArrowDown : Minus;

  return (
    <div className="flex min-h-[158px] flex-col justify-between rounded-xl border border-border bg-surface p-5">
      <div>
        <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
        <p className="mt-2 text-3xl font-semibold text-text">{value}</p>
      </div>
      <div>
        {hint ? <p className="mt-1 text-[11px] leading-4 text-muted">{hint}</p> : null}
        {tieneDelta ? (
          <span className={cn("mt-2 flex items-center gap-1 text-xs font-medium", color)}>
            <Icon size={14} />
            {deltaAbs > 0 ? "+" : ""}
            {fmt1(deltaAbs)} {deltaUnidad}
            <span className="font-normal">
              ({deltaPct > 0 ? "+" : ""}
              {fmt1(deltaPct)}%)
            </span>
            <span className="font-normal text-muted">vs. periodo anterior</span>
          </span>
        ) : null}
      </div>
    </div>
  );
}

function Heatmap({ items, diasPorDia }: { items: HeatmapCelda[]; diasPorDia: DiaDato[] }) {
  const muted = "#64748B";
  const mapa = new Map<string, number>();
  for (const c of items) mapa.set(`${c.dia}_${c.hora}`, c.total);
  const diasMap = new Map<number, number>();
  for (const d of diasPorDia) diasMap.set(d.dia, d.dias);

  let maxVal = 0;
  const data: [number, number, number][] = [];
  for (let idx = 0; idx < 7; idx++) {
    const dow = DIAS_ORDEN[idx];
    const dias = diasMap.get(dow) ?? 0;
    for (let h = 0; h < 24; h++) {
      const v = dias > 0 ? mapa.get(`${dow}_${h}`) ?? 0 : -1;
      if (v > maxVal) maxVal = v;
      data.push([h, idx, v]);
    }
  }

  const option: EChartsOption = {
    tooltip: {
      formatter: (p) => {
        const value = (p as unknown as { value: [number, number, number] }).value;
        const h = value[0];
        const idx = value[1];
        const v = value[2];
        const dow = DIAS_ORDEN[idx];
        const dias = diasMap.get(dow) ?? 0;
        if (v < 0) return `${DIAS_LARGOS[dow]} ${HORAS[h]}<br/>Sin datos para este día en el rango`;
        return `${DIAS_LARGOS[dow]} ${HORAS[h]}<br/>Atenciones: <b>${v.toLocaleString(
          "es-PE",
        )}</b><br/>Días observados: ${dias}<br/>Promedio/día: ${(v / Math.max(dias, 1)).toFixed(1)}`;
      },
    },
    grid: { left: 44, right: 72, top: 12, bottom: 44 },
    xAxis: {
      type: "category",
      data: HORAS,
      splitArea: { show: true },
      axisLabel: { color: muted, fontSize: 9, interval: 2 },
      axisLine: { show: false },
    },
    yAxis: {
      type: "category",
      data: DIAS_LABELS,
      splitArea: { show: true },
      axisLabel: { color: muted, fontSize: 11 },
      axisLine: { show: false },
    },
    visualMap: {
      min: 0,
      max: Math.max(1, maxVal),
      calculable: true,
      orient: "vertical",
      right: 0,
      top: "center",
      inRange: { color: ["#eff6ff", "#bfdbfe", "#60a5fa", "#2563eb", "#1e3a8a"] },
      outOfRange: { color: ["#f1f5f9"] },
      textStyle: { color: muted, fontSize: 10 },
      text: ["Más", "Menos"],
    },
    series: [
      {
        type: "heatmap",
        data,
        label: { show: false },
        emphasis: {
          itemStyle: { shadowBlur: 10, shadowColor: "rgba(0,0,0,0.25)" },
        },
      },
    ],
  };

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <h3 className="text-sm font-medium text-text">Carga horaria · Mapa de calor día × hora</h3>
      <p className="mt-1 text-xs text-muted">
        Intensidad = atenciones recibidas en el rango. Celdas grises = día sin ocurrencias en el
        rango; celdas claras = día observado sin atenciones en esa hora.
      </p>
      <ReactECharts option={option} style={{ height: 420 }} notMerge lazyUpdate />
      <p className="mt-1 text-[11px] text-muted">
        Pasa el cursor sobre una celda para ver cantidad, días observados y promedio por día.
      </p>
    </div>
  );
}

function Hallazgos({ data }: { data: Operacion }) {
  const k = data.kpis;
  const horas = Array.from({ length: 24 }, () => 0);
  for (const c of data.heatmap) horas[c.hora] += c.total;
  let mejorInicio = 0;
  let mejorTotal = -1;
  for (let h = 0; h <= 21; h++) {
    const total = horas[h] + horas[h + 1] + horas[h + 2];
    if (total > mejorTotal) {
      mejorTotal = total;
      mejorInicio = h;
    }
  }
  const canalTop = [...data.porSubcanal].sort((a, b) => b.total - a.total)[0];
  const totalCanal = data.porSubcanal.reduce((s, c) => s + c.total, 0);
  const share = totalCanal > 0 && canalTop ? (canalTop.total / totalCanal) * 100 : null;
  const variacion =
    k.total.valor !== null && k.total.anterior !== null ? k.total.valor - k.total.anterior : null;

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <h3 className="text-sm font-medium text-text">Hallazgos de demanda</h3>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
        <div className="rounded-lg bg-bg p-3">
          <p className="text-[10px] uppercase tracking-wide text-muted">Día de mayor demanda</p>
          <p className="mt-1 text-lg font-semibold text-text">{k.diaCargado ?? "—"}</p>
          <p className="text-xs text-muted">{fmt(k.diaCargadoValor)} atenciones</p>
        </div>
        <div className="rounded-lg bg-bg p-3">
          <p className="text-[10px] uppercase tracking-wide text-muted">Hora de mayor demanda</p>
          <p className="mt-1 text-lg font-semibold text-text">{k.horaPico ?? "—"}</p>
          <p className="text-xs text-muted">{fmt(k.horaPicoValor)} atenciones</p>
        </div>
        <div className="rounded-lg bg-bg p-3">
          <p className="text-[10px] uppercase tracking-wide text-muted">Franja de 3 horas</p>
          <p className="mt-1 text-lg font-semibold text-text">
            {mejorTotal >= 0
              ? `${String(mejorInicio).padStart(2, "0")}:00–${String(mejorInicio + 3).padStart(2, "0")}:00`
              : "—"}
          </p>
          <p className="text-xs text-muted">{fmt(mejorTotal)} atenciones</p>
        </div>
        <div className="rounded-lg bg-bg p-3">
          <p className="text-[10px] uppercase tracking-wide text-muted">Canal con mayor participación</p>
          <p className="mt-1 text-lg font-semibold text-text">
            {canalTop ? nombreCanal(canalTop.etiqueta) : "—"}
          </p>
          <p className="text-xs text-muted">
            {fmtPct(share)} · {fmt(canalTop?.total)} atenciones
          </p>
        </div>
      </div>
      <p className="mt-3 text-[11px] text-muted">
        Variación total:{" "}
        <span className={variacion !== null && variacion >= 0 ? "text-success" : "text-danger"}>
          {variacion !== null ? `${variacion > 0 ? "+" : ""}${fmt(variacion)}` : "—"}
        </span>{" "}
        atenciones vs. periodo anterior. Este reporte mide demanda; no infiere capacidad ociosa ni
        recomienda turnos sin información de dotación, disponibilidad y turnos.
      </p>
    </div>
  );
}

function EvolucionDemanda({
  data,
  granularidad,
  setGranularidad,
}: {
  data: Operacion;
  granularidad: Granularidad;
  setGranularidad: (g: Granularidad) => void;
}) {
  const serie = data.evolucion[granularidad];
  const actual = serie?.actual ?? [];
  const anterior = serie?.anterior ?? [];
  const esUnDia = actual.length <= 1 && anterior.length <= 1;
  const totalActual = actual.reduce((s, p) => s + p.total, 0);
  const totalAnterior = anterior.reduce((s, p) => s + p.total, 0);
  const variacion = totalAnterior > 0 ? ((totalActual - totalAnterior) / totalAnterior) * 100 : null;

  const option = useMemo<EChartsOption>(() => {
    const labels = actual.map((p) => p.periodo);
    const conZoom = labels.length > 20;
    return {
      tooltip: { trigger: "axis" },
      legend: { bottom: 0, textStyle: { fontSize: 11 } },
      grid: { left: 52, right: 20, top: 20, bottom: conZoom ? 82 : 55 },
      dataZoom: conZoom
        ? [
            { type: "inside" },
            { type: "slider", height: 14, bottom: 28 },
          ]
        : [],
      xAxis: {
        type: "category",
        data: labels,
        axisLabel: { fontSize: 10, rotate: labels.length > 14 ? 40 : 0 },
        axisLine: { show: false },
      },
      yAxis: {
        type: "value",
        name: "Atenciones",
        nameTextStyle: { fontSize: 10 },
        axisLabel: { fontSize: 10 },
        splitLine: { lineStyle: { type: "dashed" } },
      },
      series: [
        {
          name: "Actual",
          type: "line",
          smooth: true,
          symbol: "none",
          lineStyle: { color: "#F97316", width: 3 },
          itemStyle: { color: "#F97316" },
          areaStyle: { color: "rgba(249,115,22,0.10)" },
          data: actual.map((p) => p.total),
        },
        {
          name: "Periodo anterior",
          type: "line",
          smooth: true,
          symbol: "none",
          lineStyle: { color: "#94A3B8", width: 2, type: "dashed" },
          itemStyle: { color: "#94A3B8" },
          data: actual.map((_, i) => anterior[i]?.total ?? null),
        },
      ],
    };
  }, [actual, anterior]);

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium text-text">Evolución de la demanda</h3>
          <p className="mt-1 text-xs text-muted">
            Volumen recibido por periodo. La serie anterior se alinea por posición de periodo.
          </p>
        </div>
        <div className="flex gap-1 rounded-lg border border-border bg-bg p-1">
          {(["diaria", "semanal", "mensual", "trimestral"] as Granularidad[]).map((g) => (
            <Boton key={g} activo={granularidad === g} onClick={() => setGranularidad(g)}>
              {g === "diaria" ? "Diaria" : g === "semanal" ? "Semanal" : g === "mensual" ? "Mensual" : "Trimestral"}
            </Boton>
          ))}
        </div>
      </div>

      {esUnDia ? (
        <p className="mt-6 rounded-lg bg-bg p-4 text-sm text-muted">
          El rango seleccionado es de un día. No hay serie temporal para comparar; amplía el rango
          para analizar la evolución.
        </p>
      ) : (
        <>
          {variacion !== null && (
            <p className={`mt-2 text-xs font-medium ${variacion >= 0 ? "text-success" : "text-danger"}`}>
              {variacion >= 0 ? "+" : ""}
              {variacion.toFixed(1)}% vs. periodo anterior ({fmt(totalActual)} vs {fmt(totalAnterior)})
            </p>
          )}
          <ReactECharts option={option} style={{ height: 300 }} notMerge lazyUpdate />
        </>
      )}
    </div>
  );
}

function DistribucionCanal({
  items,
  totalConsolidado,
  duplicados,
  esUnDia,
  serieActual,
}: {
  items: Desglose[];
  totalConsolidado: number;
  duplicados: number;
  esUnDia: boolean;
  serieActual: OperacionPeriodo[];
}) {
  const visibles = items.filter((i) => i.total > 0);
  const total = visibles.reduce((s, i) => s + i.total, 0);

  const option: EChartsOption = {
    tooltip: {
      trigger: "item",
      formatter: (p) => {
        const item = p as { name: string; value: number; percent: number };
        return `${nombreCanal(item.name)}<br/>${item.value.toLocaleString("es-PE")} (${item.percent}%)`;
      },
    },
    legend: { show: false },
    series: [
      {
        type: "pie",
        radius: ["48%", "70%"],
        center: ["50%", "50%"],
        itemStyle: { borderColor: "#fff", borderWidth: 2 },
        label: { show: true, formatter: "{d}%", fontSize: 11 },
        data: visibles.map((i) => ({
          name: i.etiqueta,
          value: i.total,
          itemStyle: { color: colorCanal(i.etiqueta) },
        })),
      },
    ],
    graphic: {
      type: "text",
      left: "center",
      top: "45%",
      style: {
        text: total.toLocaleString("es-PE"),
        fill: "#111827",
        fontSize: 20,
        fontWeight: 700,
      },
    },
  };

  return (
    <div className="h-full rounded-xl border border-border bg-surface p-5">
      <h3 className="text-sm font-medium text-text">Distribución por canal</h3>
      <p className="mt-1 text-xs text-muted">Atenciones recibidas por subcanal.</p>
      {!visibles.length ? (
        <p className="mt-4 text-sm text-muted">Sin datos.</p>
      ) : (
        <div className="mt-2 grid grid-cols-1 items-center gap-2 sm:grid-cols-[1fr_1fr]">
          <ReactECharts option={option} style={{ height: 210 }} notMerge lazyUpdate />
          <ul className="space-y-2">
            {visibles.map((i) => {
              const pct = total > 0 ? (i.total / total) * 100 : 0;
              return (
                <li key={i.etiqueta} className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex min-w-0 items-center gap-2 text-muted">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: colorCanal(i.etiqueta) }}
                    />
                    <span className="truncate">{nombreCanal(i.etiqueta)}</span>
                  </span>
                  <span className="whitespace-nowrap text-right text-text">
                    <span className="font-medium">{i.total.toLocaleString("es-PE")}</span>
                    <span className="ml-1 text-xs text-muted">{pct.toFixed(1)}%</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      <p className="mt-2 text-[11px] text-muted">
        Consolidado: <b className="text-text">{fmt(totalConsolidado)}</b> · Suma de canales:{" "}
        <b className="text-text">{fmt(total)}</b>
        {duplicados > 0 ? ` · ${duplicados} ticket(s) en más de un canal` : ""}.
      </p>
      {!esUnDia && serieActual.length > 1 && duplicados > 0 && (
        <p className="mt-1 text-[11px] text-muted">
          La evolución por canal usa las mismas filas por canal; la suma puede exceder el consolidado
          por los tickets duplicados.
        </p>
      )}
    </div>
  );
}

function EvolucionCanal({
  periodos,
  granularidad,
}: {
  periodos: OperacionPeriodo[];
  granularidad: Granularidad;
}) {
  const labels = periodos.map((p) => p.periodo);
  const option = useMemo<EChartsOption>(() => {
    const conZoom = labels.length > 20;
    const canales = SUB_ORDER.filter((canal) =>
      periodos.some(
        (p) => (p.porSubcanal.find((c) => c.subcanal === canal)?.total ?? 0) > 0,
      ),
    );
    return {
      tooltip: { trigger: "axis" },
      legend: { bottom: 0, textStyle: { fontSize: 11 } },
      grid: { left: 50, right: 20, top: 20, bottom: conZoom ? 82 : 55 },
      dataZoom: conZoom
        ? [
            { type: "inside" },
            { type: "slider", height: 14, bottom: 28 },
          ]
        : [],
      xAxis: {
        type: "category",
        data: labels,
        axisLabel: { fontSize: 10, rotate: labels.length > 14 ? 40 : 0 },
        axisLine: { show: false },
      },
      yAxis: {
        type: "value",
        name: "Atenciones",
        nameTextStyle: { fontSize: 10 },
        axisLabel: { fontSize: 10 },
        splitLine: { lineStyle: { type: "dashed" } },
      },
      series: canales.map((canal) => ({
        name: nombreCanal(canal),
        type: "line" as const,
        smooth: true,
        symbol: "none" as const,
        lineStyle: { color: colorCanal(canal), width: 2 },
        itemStyle: { color: colorCanal(canal) },
        data: periodos.map(
          (p) => p.porSubcanal.find((c) => c.subcanal === canal)?.total ?? 0,
        ),
      })),
    };
  }, [periodos, labels]);

  return (
    <div className="h-full rounded-xl border border-border bg-surface p-5">
      <h3 className="text-sm font-medium text-text">Evolución por canal</h3>
      <p className="mt-1 text-xs text-muted">
        Atenciones recibidas por subcanal en la granularidad {granularidad}.
      </p>
      {periodos.length <= 1 ? (
        <p className="mt-6 text-sm text-muted">Amplía el rango para ver la evolución por canal.</p>
      ) : (
        <ReactECharts option={option} style={{ height: 280 }} notMerge lazyUpdate />
      )}
    </div>
  );
}

function RankingCard({
  title,
  subtitle,
  items,
  total,
  nota,
}: {
  title: string;
  subtitle: string;
  items: Desglose[];
  total: number;
  nota: string;
}) {
  const top = items.slice(0, 8);
  const max = Math.max(1, ...top.map((i) => i.total));
  return (
    <div className="h-full rounded-xl border border-border bg-surface p-5">
      <h3 className="text-sm font-medium text-text">{title}</h3>
      <p className="mt-1 text-xs text-muted">{subtitle}</p>
      <ul className="mt-3 space-y-2">
        {top.length === 0 ? <li className="text-sm text-muted">Sin datos.</li> : null}
        {top.map((i) => {
          const pct = total > 0 ? (i.total / total) * 100 : 0;
          return (
            <li key={i.etiqueta}>
              <div className="flex justify-between text-sm">
                <span className="truncate text-muted">{i.etiqueta}</span>
                <span className="ml-2 whitespace-nowrap font-medium text-text">
                  {i.total.toLocaleString("es-PE")}
                  <span className="ml-1 text-xs font-normal text-muted">{pct.toFixed(1)}%</span>
                </span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-bg">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${(i.total / max) * 100}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-[11px] text-muted">{nota}</p>
    </div>
  );
}

export default function Operacion() {
  const { filters, setFilters } = useFilters();
  const [granularidad, setGranularidad] = useState<Granularidad>("semanal");
  const didInit = useRef(false);

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    const hoy = formatFechaLocal(new Date());
    const esDefaultHoy =
      filters.fechaHoraInicio?.startsWith(hoy) && filters.fechaHoraFin?.startsWith(hoy);
    if (!filters.fechaHoraInicio || !filters.fechaHoraFin || esDefaultHoy) {
      setFilters({ ...filters, ...rangoUltimos90Dias() });
    }
  }, [filters, setFilters]);

  const params = useMemo(() => filtersToParams(filters), [filters]);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["operacion", params],
    queryFn: () => fetchOperacion(params),
    refetchOnWindowFocus: false,
  });

  const diasRango = diasEntre(
    data?.rango?.inicio ?? filters.fechaHoraInicio,
    data?.rango?.fin ?? filters.fechaHoraFin,
  );
  const esUnDia = diasRango === 1;
  const maxDiasDow = data ? Math.max(0, ...data.diasPorDia.map((d) => d.dias)) : 0;
  const muestraCorta = !!data && diasRango > 0 && (diasRango < 14 || maxDiasDow < 2);

  useEffect(() => {
    if (!diasRango) return;
    setGranularidad(
      diasRango <= 31 ? "diaria" : diasRango <= 120 ? "semanal" : diasRango <= 730 ? "mensual" : "trimestral",
    );
  }, [diasRango]);

  const serieActual = data?.evolucion[granularidad]?.actual ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-5"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Operación — Planificación de capacidad</h1>
          <p className="mt-1 text-sm text-muted">
            Demanda recibida por fecha y hora de creación. Todos los estados; no se usa fecha de
            cierre.
          </p>
        </div>
        <span className="rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted">
          Universo: atenciones recibidas
        </span>
      </div>

      {data?.rango ? (
        <p className="text-xs text-muted">
          Comparando {data.rango.inicio} → {data.rango.fin} contra{" "}
          {data.rango.comparadoCon.inicio} → {data.rango.comparadoCon.fin}.
        </p>
      ) : null}

      {muestraCorta && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Muestra corta: el rango tiene pocos días o algunos días de la semana aparecen una sola vez.
          Evita conclusiones de recurrencia; amplía el rango para identificar patrones estables.
        </div>
      )}

      {isLoading ? <p className="text-muted">Cargando datos…</p> : null}
      {isError ? (
        <p className="rounded-lg border border-border bg-surface p-4 text-sm text-muted">
          No se pudieron cargar los datos. Revisa que el backend esté encendido y conectado.
        </p>
      ) : null}

      {data ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiDemanda
              label="Atenciones recibidas"
              value={fmt(data.kpis.total.valor)}
              hint={`Periodo anterior: ${fmt(data.kpis.total.anterior)} atenciones`}
              deltaAbs={
                data.kpis.total.valor !== null && data.kpis.total.anterior !== null
                  ? data.kpis.total.valor - data.kpis.total.anterior
                  : null
              }
              deltaPct={data.kpis.total.deltaPct}
            />
            <KpiDemanda
              label="Promedio por día calendario"
              value={fmt1(data.kpis.promedioPorDia.valor)}
              hint={`${fmt(data.kpis.diasConDatos)} ${
                data.kpis.diasConDatos === 1 ? "día" : "días"
              } con datos · Periodo anterior: ${fmt1(data.kpis.promedioPorDia.anterior)}`}
              deltaAbs={
                data.kpis.promedioPorDia.valor !== null &&
                data.kpis.promedioPorDia.anterior !== null
                  ? data.kpis.promedioPorDia.valor - data.kpis.promedioPorDia.anterior
                  : null
              }
              deltaPct={data.kpis.promedioPorDia.deltaPct}
              deltaUnidad="atenciones/día"
            />
            <KpiDemanda
              label="Día de mayor demanda"
              value={data.kpis.diaCargado ?? "—"}
              hint={`${fmt(data.kpis.diaCargadoValor)} atenciones · Periodo anterior: ${
                data.kpis.diaCargadoAnterior ?? "—"
              } (${fmt(data.kpis.diaCargadoAnteriorValor)})`}
            />
            <KpiDemanda
              label="Hora de mayor demanda"
              value={data.kpis.horaPico ?? "—"}
              hint={`${fmt(data.kpis.horaPicoValor)} atenciones · Periodo anterior: ${
                data.kpis.horaPicoAnterior ?? "—"
              } (${fmt(data.kpis.horaPicoAnteriorValor)})`}
            />
          </div>

          <Heatmap items={data.heatmap} diasPorDia={data.diasPorDia} />
          <Hallazgos data={data} />

          <EvolucionDemanda
            data={data}
            granularidad={granularidad}
            setGranularidad={setGranularidad}
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
            <div className="md:col-span-4">
              <DistribucionCanal
                items={data.porSubcanal}
                totalConsolidado={data.kpis.total.valor ?? 0}
                duplicados={data.duplicadosEntreCanales}
                esUnDia={esUnDia}
                serieActual={serieActual}
              />
            </div>
            <div className="md:col-span-8">
              <EvolucionCanal periodos={serieActual} granularidad={granularidad} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <RankingCard
              title="Atenciones recibidas por asesor"
              subtitle="Volumen asignado en la fuente, contado por fecha de creación."
              items={data.topAsesores}
              total={data.kpis.total.valor ?? 0}
              nota="Es volumen asignado, no resuelto por el asesor. La fecha usada es la de creación de la atención."
            />
            <RankingCard
              title="Distribución por categoría"
              subtitle="Principales categorías de demanda recibida."
              items={data.topCategorias}
              total={data.kpis.total.valor ?? 0}
              nota="Top 8 de categorías. Los porcentajes se calculan sobre el total recibido del periodo."
            />
          </div>

          <div className="rounded-xl border border-border bg-bg px-4 py-3 text-[11px] text-muted">
            Zendesk: hora de creación convertida de UTC a America/Lima; WhatsApp: fecha/hora local de
            creación.{" "}
            {data.duplicadosEntreCanales > 0
              ? `La suma de canales puede exceder el total consolidado por ${data.duplicadosEntreCanales} ticket(s) que aparecen en más de un subcanal.`
              : "En este rango, la suma de canales coincide con el total consolidado."}
          </div>
        </>
      ) : null}
    </motion.div>
  );
}
