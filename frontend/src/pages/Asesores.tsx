import { useState, useMemo, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, ChevronRight } from "lucide-react";
import ReactECharts from "echarts-for-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { MetricsMatrix } from "@/components/dashboard/metrics/MetricsMatrix";
import { PerformanceRanking } from "./PerformanceRanking";
import { useFilters } from "@/contexts/FilterContext";
import { filtersToParams } from "@/lib/filters";

/* ─── Tipos (reflejan AsesoresResponse del backend) ─── */
interface FilaRanking { asesor: string; total: number; porcentaje: number; fcr: number | null; promedioPrimeraRespuesta: number | null; promedioResolucion: number | null; promedioEspera: number | null; scoreGlobal: number; scoreWhatsapp: number; scoreCorreo: number; volumenNormalizado: number; cumplimientoPrimeraRespuesta: number | null; cumplimientoResolucion: number | null; }
interface FilaEvolucion { periodo: string; asesor: string; total: number; }
interface FilaTiempoCanal { asesor: string; whatsapp: number | null; correo: number | null; }
interface FilaMatriz { etiqueta: string; asesor: string; total: number; }
interface ResAsesores {
  kpis: { totalAtenciones: number; promedioPrimeraRespuesta: number | null; promedioResolucion: number | null; promedioEspera: number | null; fcr: number | null; asesoresActivos: number; promedioAtencionesPorAsesor: number | null; tiempoPromedioPorAtencion: number | null; };
  ranking: FilaRanking[];
  volumenPorAsesor: { asesor: string; total: number; porcentaje: number; }[];
  evolucionDiaria: FilaEvolucion[];
  evolucionPorHora: FilaEvolucion[];
  evolucionSemanal: FilaEvolucion[];
  evolucionMensual: FilaEvolucion[];
  tiemposPrimeraRespuesta: FilaTiempoCanal[];
  tiemposResolucion: FilaTiempoCanal[];
  matrizCategoria: FilaMatriz[];
  matrizSubcategoria: FilaMatriz[];
  quintiles: { asesor: string; muyRapido: number; rapido: number; normal: number; lento: number; muyLento: number; }[];
  performanceCanal: { canal: string; total: number; }[];
  performanceCategoria: FilaMatriz[];
  performanceSubcategoria: FilaMatriz[];
  asesorCanal: { asesor: string; canal: string; categoria: string; total: number }[];
  asesorCanalSub: { asesor: string; canal: string; categoria: string; subcategoria: string; total: number }[];
}

async function fetchAsesores(params: Record<string, string>): Promise<ResAsesores> {
  const { data } = await api.get("/dashboard/asesores", { params });
  return data.data as ResAsesores;
}

interface AsesorRow {
  asesor: string;
  wpp_total: number; wpp_en_proceso: number; wpp_cerradas: number;
  wpp_avg_espera: number | null; wpp_avg_atencion: number | null; wpp_avg_total: number | null;
  wpp_sla_esp_1: number; wpp_sla_esp_2: number; wpp_sla_esp_3: number;
  wpp_sla_esp_4: number; wpp_sla_esp_5: number; wpp_sla_esp_t: number;
  wpp_sla_ate_1: number; wpp_sla_ate_2: number; wpp_sla_ate_3: number;
  wpp_sla_ate_4: number; wpp_sla_ate_5: number; wpp_sla_ate_t: number;
  corr_total: number; corr_en_proceso: number; corr_cerradas: number;
  corr_avg_espera: number | null; corr_avg_atencion: number | null; corr_avg_total: number | null;
  corr_sla_pr_1: number; corr_sla_pr_2: number; corr_sla_pr_3: number;
  corr_sla_pr_4: number; corr_sla_pr_5: number; corr_sla_pr_t: number;
  corr_sla_ate_1: number; corr_sla_ate_2: number; corr_sla_ate_3: number;
  corr_sla_ate_4: number; corr_sla_ate_5: number; corr_sla_ate_t: number;
}

interface AsesoresMatrixResponse {
  filas: AsesorRow[];
  totales: AsesorRow;
}

async function fetchAsesoresMatrix(params: Record<string, string>): Promise<AsesoresMatrixResponse> {
  const { data } = await api.get("/dashboard/asesores-matrix", { params });
  return data.data as AsesoresMatrixResponse;
}

/* ─── Oficial advisors ─── */
const OFFICIAL_ADVISORS = [
  "Lidia Ceferino", "Victor Guevara", "Danilo Peña",
  "Eveling Lovera", "Andres Espinoza", "Lisbeth Giron", "Sheyla Guevara",
];

function normalizeAdvisor(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const rawWord = raw.trim()
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[_-]/g, " ")
    .split(" ")[0];
  if (!rawWord) return null;
  for (const official of OFFICIAL_ADVISORS) {
    const offWord = official.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .split(" ")[0];
    if (rawWord === offWord) return official;
  }
  return null;
}

/* Normalize evolucion data without merging periods (filterOfficial breaks time series) */
function normalizeEvolucion(items: FilaEvolucion[]): FilaEvolucion[] {
  return items
    .map((item) => {
      const official = normalizeAdvisor(item.asesor);
      if (!official) return null;
      return { ...item, asesor: official };
    })
    .filter(Boolean) as FilaEvolucion[];
}

function filterOfficial<T extends { asesor: string }>(items: T[]): T[] {
  const map = new Map<string, T>();
  for (const item of items) {
    const official = normalizeAdvisor(item.asesor);
    if (!official) continue;
    const existing = map.get(official);
    if (existing) {
      (existing as any).total = ((existing as any).total || 0) + ((item as any).total || 0);
    } else {
      map.set(official, { ...item, asesor: official });
    }
  }
  return OFFICIAL_ADVISORS.map((name) => map.get(name)).filter(Boolean) as T[];
}

import { getAdvisorColor } from "@/lib/advisorColors";

/* ─── Matrix data processing ─── */
const NUMERIC_FIELDS: (keyof AsesorRow)[] = [
  "wpp_total", "wpp_en_proceso", "wpp_cerradas",
  "wpp_sla_esp_1", "wpp_sla_esp_2", "wpp_sla_esp_3",
  "wpp_sla_esp_4", "wpp_sla_esp_5", "wpp_sla_esp_t",
  "wpp_sla_ate_1", "wpp_sla_ate_2", "wpp_sla_ate_3",
  "wpp_sla_ate_4", "wpp_sla_ate_5", "wpp_sla_ate_t",
  "corr_total", "corr_en_proceso", "corr_cerradas",
  "corr_sla_pr_1", "corr_sla_pr_2", "corr_sla_pr_3",
  "corr_sla_pr_4", "corr_sla_pr_5", "corr_sla_pr_t",
  "corr_sla_ate_1", "corr_sla_ate_2", "corr_sla_ate_3",
  "corr_sla_ate_4", "corr_sla_ate_5", "corr_sla_ate_t",
];

const AVG_FIELDS: { field: keyof AsesorRow; weight: keyof AsesorRow }[] = [
  { field: "wpp_avg_espera", weight: "wpp_total" },
  { field: "wpp_avg_atencion", weight: "wpp_total" },
  { field: "wpp_avg_total", weight: "wpp_total" },
  { field: "corr_avg_espera", weight: "corr_total" },
  { field: "corr_avg_atencion", weight: "corr_total" },
  { field: "corr_avg_total", weight: "corr_total" },
];

function weightedAvg(rows: AsesorRow[], field: keyof AsesorRow, weightField: keyof AsesorRow): number | null {
  let sum = 0; let totalWeight = 0;
  for (const r of rows) {
    const val = r[field]; const w = r[weightField] as number;
    if (val != null && w > 0) { sum += (val as number) * w; totalWeight += w; }
  }
  return totalWeight > 0 ? sum / totalWeight : null;
}

function createEmptyRow(asesor: string): AsesorRow {
  const r = { asesor } as AsesorRow;
  for (const f of NUMERIC_FIELDS) (r as any)[f] = 0;
  for (const { field } of AVG_FIELDS) (r as any)[field] = null;
  return r;
}

function processAsesoresMatrixRows(raw: AsesorRow[]): AsesorRow[] {
  const groups = new Map<string, AsesorRow[]>();
  for (const row of raw) {
    const official = normalizeAdvisor(row.asesor);
    if (!official) continue;
    const existing = groups.get(official) ?? [];
    existing.push(row);
    groups.set(official, existing);
  }
  const merged: AsesorRow[] = [];
  for (const name of OFFICIAL_ADVISORS) {
    const rows = groups.get(name);
    if (!rows || rows.length === 0) { merged.push(createEmptyRow(name)); continue; }
    const base = { ...rows[0], asesor: name };
    for (const f of NUMERIC_FIELDS) {
      (base as any)[f] = rows.reduce((s, r) => s + ((r[f] as number) || 0), 0);
    }
    for (const { field, weight } of AVG_FIELDS) {
      (base as any)[field] = weightedAvg(rows, field, weight);
    }
    merged.push(base);
  }
  return merged;
}

function computeAsesoresTotals(filas: AsesorRow[]): AsesorRow {
  const t: AsesorRow = { asesor: "TOTAL" } as AsesorRow;
  for (const f of NUMERIC_FIELDS) {
    (t as any)[f] = filas.reduce((s, r) => s + ((r[f] as number) || 0), 0);
  }
  for (const { field, weight } of AVG_FIELDS) {
    (t as any)[field] = weightedAvg(filas, field, weight);
  }
  return t;
}

/* ─── Helpers ─── */
const fmtNum = (n: number | null | undefined) => n == null ? "—" : n.toLocaleString("es-PE");
const fmtPct = (n: number | null | undefined) => n == null ? "—" : `${n.toLocaleString("es-PE")}%`;
const fmtDur = (min: number | null | undefined) => {
  if (min == null) return "—";
  if (min < 60) return `${Math.round(min)} min`;
  const h = min / 60; return `${Number.isInteger(h) ? h : h.toFixed(1)} h`;
};

/* ─── Sub-componentes ─── */

function KpiCard({ label, valor, hint }: { label: string; valor: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-black-10 bg-white p-5 ">
      <p className="text-xs uppercase tracking-wide text-black-45">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-black-85">{valor}</p>
      {hint ? <p className="mt-1 text-xs text-black-25">{hint}</p> : null}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════ */
/*  MATRIZ EJECUTIVA (reemplaza VolumenChart)                       */
/* ════════════════════════════════════════════════════════════════ */
function ExecutiveMatrix({ rows }: { rows: AsesorRow[] }) {
  const sorted = [...rows].sort((a, b) => (b.wpp_total + b.corr_total) - (a.wpp_total + a.corr_total));
  const wppTotal = sorted.reduce((s, r) => s + r.wpp_total, 0) || 1;
  const corrTotal = sorted.reduce((s, r) => s + r.corr_total, 0) || 1;
  const grandTotal = wppTotal + corrTotal || 1;
  const all = [...sorted, { asesor: "TOTAL", wpp_total: wppTotal, corr_total: corrTotal } as AsesorRow];
  return (
    <div className="rounded-2xl border border-black-10 bg-white ">
      <div className="border-b border-black-10 px-4 py-3">
        <h3 className="text-xs font-semibold text-black-85">VOLUMEN POR ASESOR</h3>
        <p className="mt-0.5 text-[10px] text-black-25">Atenciones por canal y porcentaje sobre el total del canal. Ordenado por volumen total.</p>
      </div>
      <div className="overflow-auto max-h-[500px]">
        <table className="w-full">
          <thead className="sticky top-0 z-20 bg-white">
            <tr>
              <th className="sticky left-0 z-30 bg-white border-r border-black-10 px-2 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider text-black-45 min-w-[150px]">Asesor</th>
              <th className="border-r border-black-10 px-2 py-1.5 text-right text-[10px] font-semibold uppercase tracking-wider text-black-45 min-w-[120px]">WhatsApp</th>
              <th className="border-r border-black-10 px-2 py-1.5 text-right text-[10px] font-semibold uppercase tracking-wider text-black-45 min-w-[120px]">Correo</th>
              <th className="border-r border-black-10 px-2 py-1.5 text-right text-[10px] font-bold uppercase tracking-wider text-primary bg-orange-50 min-w-[120px]">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {all.map((r) => {
              const isTotal = r.asesor === "TOTAL";
              const wpp = r.wpp_total || 0;
              const corr = r.corr_total || 0;
              const total = wpp + corr;
              const wppPct = (wpp / wppTotal) * 100;
              const corrPct = (corr / corrTotal) * 100;
              const totalPct = (total / grandTotal) * 100;
              const cell = (val: number, pct: number) =>
                `${val.toLocaleString("es-PE")} (${pct.toFixed(1)}%)`;
              return (
                <tr key={r.asesor} className="transition-colors hover:bg-light">
                  <td className={`sticky left-0 z-10 border-r border-black-5 px-2 py-1 text-[11px] ${isTotal ? "font-bold text-primary" : "text-black-85"}`}
                    style={{ backgroundColor: isTotal ? "#FFF" : "transparent" }}>
                    {r.asesor}
                  </td>
                  <td className={`border-r border-black-5 px-2 py-1 text-right text-[11px] tabular-nums ${isTotal ? "font-bold text-primary" : "text-black-85"}`}>
                    {cell(wpp, wppPct)}
                  </td>
                  <td className={`border-r border-black-5 px-2 py-1 text-right text-[11px] tabular-nums ${isTotal ? "font-bold text-primary" : "text-black-85"}`}>
                    {cell(corr, corrPct)}
                  </td>
                  <td className={`border-r border-black-5 px-2 py-1 text-right text-[11px] tabular-nums font-bold ${isTotal ? "text-primary" : "text-black-85"}`}>
                    {cell(total, totalPct)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════ */
/*  DISTRIBUCIÓN DE CARGA (dona)                                   */
/* ════════════════════════════════════════════════════════════════ */
function DistribucionDona({ items }: { items: { asesor: string; total: number }[] }) {
  const total = items.reduce((s, i) => s + i.total, 0);
  const option = {
    tooltip: { trigger: "item" as const, formatter: (p: { name: string; value: number; percent: number }) => `${p.name}<br/>${p.value.toLocaleString("es-PE")} (${p.percent}%)` },
    legend: { bottom: 0, textStyle: { color: "#94A3B8", fontSize: 11 }, type: "scroll" as const },
    series: [{
      type: "pie" as const, radius: ["48%", "68%"], center: ["50%", "44%"],
      avoidLabelOverlap: true, itemStyle: { borderColor: "#fff", borderWidth: 2 },
      label: { show: true, formatter: (p: { percent: number }) => `${p.percent}%`, color: "#1E293B", fontWeight: 600, fontSize: 11 },
      data: items.map((i) => ({ name: i.asesor, value: i.total, itemStyle: { color: getAdvisorColor(i.asesor) } })),
    }],
    graphic: { type: "text" as const, left: "center", top: "38%", style: { text: total.toLocaleString("es-PE"), fill: "#1E293B", fontSize: 18, fontWeight: 700, textAlign: "center" as const } },
  };
  return (
    <div className="rounded-xl border border-black-10 bg-white p-5 ">
      <h3 className="text-sm font-medium text-black-85">Distribución de carga</h3>
      <p className="mt-1 text-xs text-black-25">Porcentaje del total por asesor.</p>
      <ReactECharts option={option} style={{ height: 280 }} notMerge lazyUpdate />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════ */
/*  EVOLUCIÓN DEL VOLUMEN (líneas por asesor, datos reales)        */
/* ════════════════════════════════════════════════════════════════ */
const MONTHS_LONG  = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

function fmtPeriodo(p: string, grupo: string): string {
  if (grupo === "dia") { const parts = p.split("-"); return `${parts[2]}/${parts[1]}`; }
  if (grupo === "semana") { const w = p.split("W")[1]; return `Semana ${parseInt(w, 10)}`; }
  if (grupo === "mes") { const m = parseInt(p.split("-")[1], 10); return MONTHS_LONG[m - 1] ?? p; }
  return p;
}

function EvolucionChart({
  diaria, semanal, mensual, porHora,
}: {
  diaria: FilaEvolucion[]; semanal: FilaEvolucion[]; mensual: FilaEvolucion[]; porHora: FilaEvolucion[];
}) {
  const [grupo, setGrupo] = useState<"hora" | "dia" | "semana" | "mes">("dia");

  const { periodos, series } = useMemo(() => {
    const raw = grupo === "hora" ? porHora : grupo === "dia" ? diaria : grupo === "semana" ? semanal : mensual;
    const sorted = [...raw].sort((a, b) => a.periodo.localeCompare(b.periodo));
    const per = [...new Set(sorted.map((e) => e.periodo))].sort();
    return {
      periodos: per,
      series: OFFICIAL_ADVISORS.map((name) => ({
        name,
        type: "line" as const,
        data: per.map((p) => sorted.find((e) => e.periodo === p && e.asesor === name)?.total ?? 0),
        smooth: false,
        showSymbol: per.length <= 31,
        symbolSize: 4,
        lineStyle: { width: 2, color: getAdvisorColor(name) },
        itemStyle: { color: getAdvisorColor(name) },
      })),
    };
  }, [diaria, semanal, mensual, porHora, grupo]);

  const option = {
    tooltip: {
      trigger: "axis" as const,
      formatter: (params: { seriesName: string; value: number; color: string; axisValueLabel: string }[]) => {
        const sorted = [...params].sort((a, b) => b.value - a.value);
        return `${params[0].axisValueLabel}<br/>${sorted.map((s) =>
          `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${s.color};margin-right:4px"></span> ${s.seriesName}: <b>${s.value.toLocaleString("es-PE")}</b>`
        ).join("<br/>")}`;
      },
    },
    legend: { bottom: 0, textStyle: { color: "#94A3B8", fontSize: 11 }, type: "scroll" as const },
    grid: { left: 50, right: 20, top: 15, bottom: 50 },
    xAxis: {
      type: "category" as const, data: periodos, boundaryGap: false,
      axisLabel: {
        color: "#94A3B8", fontSize: 10, rotate: periodos.length > 20 ? 45 : 0,
        formatter: (v: string) => fmtPeriodo(v, grupo),
      },
      axisLine: { show: false },
    },
    yAxis: {
      type: "value" as const,
      axisLabel: { color: "#94A3B8", fontSize: 10 },
      splitLine: { lineStyle: { color: "#F1F5F9", type: "dashed" as const } },
    },
    series,
  };

  const BTN = ({ v, label }: { v: typeof grupo; label: string }) => (
    <button onClick={() => setGrupo(v)} className={cn("rounded px-2 py-1 text-xs font-medium", grupo === v ? "bg-primary text-white" : "bg-light text-black-45 hover:text-black-85")}>{label}</button>
  );

  return (
    <div className="rounded-xl border border-black-10 bg-white p-5 ">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-black-85">Evolución del volumen</h3>
        <div className="flex gap-1">
          <BTN v="hora" label="Hora" />
          <BTN v="dia" label="Día" />
          <BTN v="semana" label="Semana" />
          <BTN v="mes" label="Mes" />
        </div>
      </div>
      <p className="mt-1 text-xs text-black-25">Volumen real (WhatsApp + Correo) por asesor. Líneas sin suavizado.</p>
      <ReactECharts option={option} style={{ height: 300 }} notMerge lazyUpdate />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════ */
/*  TIEMPOS HORIZONTALES (separados WhatsApp / Correo)             */
/* ════════════════════════════════════════════════════════════════ */
function TiempoHorizontal({ items, titulo }: { items: FilaTiempoCanal[]; titulo: string }) {
  const sorted = [...items].sort((a, b) => (a.whatsapp ?? 999) - (b.whatsapp ?? 999));
  const sorted2 = [...items].sort((a, b) => (a.correo ?? 999) - (b.correo ?? 999));

  const barStyle = (name: string) => ({ color: getAdvisorColor(name), borderRadius: [0, 4, 4, 0] as [number, number, number, number] });

  const opW = {
    tooltip: { trigger: "axis" as const, formatter: (p: { name: string; value: string }[]) => `${p[0].name}<br/>${p[0].value}` },
    grid: { left: 110, right: 60, top: 10, bottom: 10 },
    xAxis: { type: "value" as const, axisLabel: { color: "#94A3B8", fontSize: 9, formatter: (v: number) => `${v} min` }, splitLine: { lineStyle: { color: "#F1F5F9", type: "dashed" as const } } },
    yAxis: { type: "category" as const, data: sorted.map((i) => i.asesor), axisLabel: { color: "#1E293B", fontSize: 10 }, axisLine: { show: false } },
    series: [{ type: "bar" as const, data: sorted.map((i) => ({ value: i.whatsapp, itemStyle: barStyle(i.asesor) })), barMaxWidth: 18, label: { show: true, position: "right" as const, formatter: (p: { value: number }) => fmtDur(p.value), color: "#1E293B", fontSize: 9 } }],
  };
  const opC = {
    tooltip: { trigger: "axis" as const, formatter: (p: { name: string; value: string }[]) => `${p[0].name}<br/>${p[0].value}` },
    grid: { left: 110, right: 60, top: 10, bottom: 10 },
    xAxis: { type: "value" as const, axisLabel: { color: "#94A3B8", fontSize: 9, formatter: (v: number) => `${v} min` }, splitLine: { lineStyle: { color: "#F1F5F9", type: "dashed" as const } } },
    yAxis: { type: "category" as const, data: sorted2.map((i) => i.asesor), axisLabel: { color: "#1E293B", fontSize: 10 }, axisLine: { show: false } },
    series: [{ type: "bar" as const, data: sorted2.map((i) => ({ value: i.correo, itemStyle: barStyle(i.asesor) })), barMaxWidth: 18, label: { show: true, position: "right" as const, formatter: (p: { value: number }) => fmtDur(p.value), color: "#1E293B", fontSize: 9 } }],
  };

  return (
    <div className="rounded-xl border border-black-10 bg-white p-5 ">
      <h3 className="text-sm font-medium text-black-85">{titulo}</h3>
      <p className="mt-1 text-xs text-black-25">Menor tiempo = mejor. WhatsApp y Correo NO se mezclan.</p>
      <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div>
          <p className="mb-1 text-xs font-medium" style={{ color: "#128C7E" }}>WhatsApp</p>
          <ReactECharts option={opW} style={{ height: Math.max(180, items.length * 32) }} notMerge lazyUpdate />
        </div>
        <div>
          <p className="mb-1 text-xs font-medium" style={{ color: "#F97316" }}>Correo</p>
          <ReactECharts option={opC} style={{ height: Math.max(180, items.length * 32) }} notMerge lazyUpdate />
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════ */
/*  HEATMAP MATRIZ                                                 */
/* ════════════════════════════════════════════════════════════════ */
function HeatmapMatriz({ items, titulo, maxH = 320 }: { items: FilaMatriz[]; titulo: string; maxH?: number }) {
  const etiquetas = [...new Set(items.map((m) => m.etiqueta))].slice(0, 20);
  const asesores = [...new Set(items.map((m) => m.asesor))];
  const map = new Map<string, number>();
  for (const m of items) map.set(`${m.etiqueta}|${m.asesor}`, m.total);
  let maxVal = 0;
  const data: [number, number, number][] = [];
  for (let r = 0; r < etiquetas.length; r++) {
    for (let c = 0; c < asesores.length; c++) {
      const v = map.get(`${etiquetas[r]}|${asesores[c]}`) ?? 0;
      if (v > maxVal) maxVal = v;
      data.push([c, r, v]);
    }
  }
  const maxColor = Math.max(1, maxVal);
  const option = {
    tooltip: { formatter: (p: { value: [number, number, number] }) => `${asesores[p.value[0]]} · ${etiquetas[p.value[1]]}<br/>Atenciones: <b>${p.value[2].toLocaleString("es-PE")}</b>` },
    grid: { left: 100, right: 60, top: 10, bottom: 50 },
    xAxis: { type: "category" as const, data: asesores, splitArea: { show: true }, axisLabel: { color: "#94A3B8", fontSize: 9, rotate: 30 }, axisLine: { show: false } },
    yAxis: { type: "category" as const, data: etiquetas, splitArea: { show: true }, axisLabel: { color: "#94A3B8", fontSize: 9 }, axisLine: { show: false } },
    visualMap: { min: 0, max: maxColor, calculable: true, orient: "vertical", right: 0, top: "center", inRange: { color: ["#f0fdf4", "#86efac", "#22c55e", "#16a34a", "#166534"] }, textStyle: { color: "#94A3B8", fontSize: 9 } },
    series: [{ type: "heatmap" as const, data, label: { show: true, color: "#1f2937", fontSize: 9, formatter: (p: { value: [number, number, number] }) => p.value[2] > 0 ? String(p.value[2]) : "" }, emphasis: { itemStyle: { shadowBlur: 10, shadowColor: "rgba(0,0,0,0.3)" } } }],
  };
  return (
    <div className="rounded-xl border border-black-10 bg-white p-5 ">
      <h3 className="text-sm font-medium text-black-85">{titulo}</h3>
      <p className="mt-1 text-xs text-black-25">Intensidad de color = más atenciones. Identifica especialización.</p>
      <div className="overflow-x-auto"><ReactECharts option={option} style={{ height: maxH, minWidth: 350 }} notMerge lazyUpdate /></div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════ */
/*  QUINTILES                                                      */
/* ════════════════════════════════════════════════════════════════ */
function QuintilesTable({ items }: { items: { asesor: string; muyRapido: number; rapido: number; normal: number; lento: number; muyLento: number }[] }) {
  return (
    <div className="rounded-xl border border-black-10 bg-white p-5 ">
      <h3 className="text-sm font-medium text-black-85">Quintiles por asesor</h3>
      <p className="mt-1 text-xs text-black-25">Distribución de velocidad de respuesta: 1 = muy rápido, 5 = muy lento.</p>
      <div className="mt-3">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-white"><tr className="text-left text-xs uppercase tracking-wide text-black-45">
            <th className="pb-2 font-medium">Asesor</th>
            {["Muy rápido", "Rápido", "Normal", "Lento", "Muy lento"].map((l) => <th key={l} className="pb-2 text-right font-medium">{l}</th>)}
          </tr></thead>
          <tbody>
            {items.map((q) => {
              const vals = [q.muyRapido, q.rapido, q.normal, q.lento, q.muyLento];
              const colores = ["text-success", "text-green-400", "text-warning", "text-orange-500", "text-danger"];
              return (
                <tr key={q.asesor} className="border-t border-black-5 transition-colors hover:bg-light">
                  <td className="py-2 text-black-85">
                    <span className="inline-flex items-center">
                      <span className="inline-block w-2.5 h-2.5 rounded-full mr-1.5 shrink-0" style={{ backgroundColor: getAdvisorColor(q.asesor) }} />
                      {q.asesor}
                    </span>
                  </td>
                  {vals.map((v, i) => <td key={i} className={`py-2 text-right font-medium ${colores[i]}`}>{fmtPct(v)}</td>)}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════ */
/*  PERFORMANCE POR PAÍS (barras apiladas)                         */
/* ════════════════════════════════════════════════════════════════ */
/* ════════════════════════════════════════════════════════════════ */
/*  ASESOR POR CANAL — Navegación jerárquica                       */
/* ════════════════════════════════════════════════════════════════ */
interface AsesorCanalRow {
  asesor: string;
  volumen: number;
  pct: string;
}

function AsesorCanalTable({
  rows,
  subRows,
  selectedAsesor,
  selectedCanal,
  selectedCategoria,
  onSelectAsesor,
  onSelectCanal,
  onSelectCategoria,
}: {
  rows: AsesorCanalRow[];
  subRows: { asesor: string; canal: string; categoria: string; subcategoria: string; total: number }[];
  selectedAsesor: string | null;
  selectedCanal: string | null;
  selectedCategoria: string | null;
  onSelectAsesor: (asesor: string | null) => void;
  onSelectCanal: (canal: string | null) => void;
  onSelectCategoria: (categoria: string | null) => void;
}) {
  const canales = useMemo(() => {
    if (!selectedAsesor) return [];
    const map = new Map<string, number>();
    for (const r of subRows) {
      const official = normalizeAdvisor(r.asesor);
      if (official === selectedAsesor) {
        map.set(r.canal, (map.get(r.canal) ?? 0) + r.total);
      }
    }
    return Array.from(map.entries())
      .map(([nombre, total]) => ({ nombre, total }))
      .sort((a, b) => b.total - a.total);
  }, [subRows, selectedAsesor]);

  const categorias = useMemo(() => {
    if (!selectedAsesor || !selectedCanal) return [];
    const map = new Map<string, number>();
    for (const r of subRows) {
      const official = normalizeAdvisor(r.asesor);
      if (official === selectedAsesor && r.canal === selectedCanal) {
        map.set(r.categoria, (map.get(r.categoria) ?? 0) + r.total);
      }
    }
    return Array.from(map.entries())
      .map(([nombre, total]) => ({ nombre, total }))
      .sort((a, b) => b.total - a.total);
  }, [subRows, selectedAsesor, selectedCanal]);

  const subcategorias = useMemo(() => {
    if (!selectedAsesor || !selectedCanal || !selectedCategoria) return [];
    return subRows
      .filter((r) => normalizeAdvisor(r.asesor) === selectedAsesor && r.canal === selectedCanal && r.categoria === selectedCategoria)
      .map((r) => ({ subcategoria: r.subcategoria, total: r.total }))
      .sort((a, b) => b.total - a.total);
  }, [subRows, selectedAsesor, selectedCanal, selectedCategoria]);

  if (rows.length === 0) return null;

  const subtitle = !selectedAsesor
    ? "Seleccione un asesor para comenzar."
    : !selectedCanal
      ? "Canales atendidos por el asesor."
      : !selectedCategoria
        ? `Categorías del canal ${selectedCanal}.`
        : "Desglose por subcategoría.";

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[35fr_65fr]">
      <div className="rounded-2xl border border-black-10 bg-white ">
        <div className="border-b border-black-10 px-3 py-2">
          <h3 className="text-xs font-semibold text-black-85">Asesor por Canal</h3>
        </div>
        <div className="overflow-auto max-h-[500px]">
          <table className="w-full table-auto">
            <thead className="sticky top-0 z-20 bg-white">
              <tr>
                <th className="border-r border-black-10 px-1.5 py-1 text-left text-[10px] font-semibold uppercase tracking-wider text-black-45">Asesor</th>
                <th className="border-r border-black-10 px-1.5 py-1 text-right text-[10px] font-semibold uppercase tracking-wider text-black-45 w-0 whitespace-nowrap">Vol</th>
                <th className="px-1.5 py-1 text-right text-[10px] font-semibold uppercase tracking-wider text-black-45 w-0 whitespace-nowrap">%</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((g) => {
                const isSelected = selectedAsesor === g.asesor;
                return (
                  <tr
                    key={g.asesor}
                    onClick={() => onSelectAsesor(isSelected ? null : g.asesor)}
                    className={`cursor-pointer border-t border-black-5 transition-all duration-150 hover:bg-[#FFF7ED] ${
                      isSelected ? "bg-[#FFF7ED] border-l-2 border-l-[#F97316]" : "border-l-2 border-l-transparent"
                    }`}
                  >
                    <td className={`border-r border-black-5 px-1.5 py-1 text-[11px] font-medium truncate max-w-[140px] ${isSelected ? "text-primary" : "text-black-85"}`}>{g.asesor}</td>
                    <td className="border-r border-black-5 px-1.5 py-1 text-[11px] text-right font-medium text-black-85 whitespace-nowrap">{g.volumen.toLocaleString("es-PE")}</td>
                    <td className="px-1.5 py-1 text-[11px] text-right text-[#475569] whitespace-nowrap">{g.pct}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-black-10 bg-white ">
        <div className="border-b border-black-10 px-4 py-3">
          <h3 className="text-xs font-semibold text-black-85">
            {selectedAsesor ? (
              <span>
                {selectedCanal ? (
                  <>
                    <button onClick={() => onSelectAsesor(selectedAsesor)} className="text-primary hover:underline cursor-pointer">{selectedAsesor}</button>
                    <span className="text-black-25 font-normal"> &nbsp;›&nbsp; </span>
                    {selectedCategoria ? (
                      <>
                        <button onClick={() => onSelectCanal(selectedCanal)} className="text-primary hover:underline cursor-pointer">{selectedCanal}</button>
                        <span className="text-black-25 font-normal"> &nbsp;›&nbsp; </span>
                        <span className="text-primary">{selectedCategoria}</span>
                      </>
                    ) : (
                      <span className="text-primary">{selectedCanal}</span>
                    )}
                  </>
                ) : (
                  <span className="text-primary">{selectedAsesor}</span>
                )}
              </span>
            ) : (
              "Navegación"
            )}
          </h3>
          <p className="mt-0.5 text-[10px] text-black-25">{subtitle}</p>
        </div>

        <AnimatePresence mode="wait">
          {!selectedAsesor ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center py-16 text-xs text-black-25"
            >
              Seleccione un asesor para comenzar.
            </motion.div>
          ) : !selectedCanal ? (
            <motion.div
              key="canales"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              <div className="overflow-auto max-h-[440px]">
                <table className="w-full">
                  <thead className="sticky top-0 z-20 bg-white">
                    <tr>
                      <th className="border-r border-black-10 px-2 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider text-black-45">Canal</th>
                      <th className="px-2 py-1.5 text-right text-[10px] font-semibold uppercase tracking-wider text-black-45 w-[1%]">Volumen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {canales.map((c) => {
                      const isSelected = selectedCanal === c.nombre;
                      return (
                        <tr
                          key={c.nombre}
                          onClick={() => onSelectCanal(isSelected ? null : c.nombre)}
                          className={`cursor-pointer border-t border-black-5 transition-all duration-150 hover:bg-[#FFF7ED] ${
                            isSelected ? "bg-[#FFF7ED] border-l-2 border-l-[#F97316]" : "border-l-2 border-l-transparent"
                          }`}
                        >
                          <td className={`border-r border-black-5 px-2 py-1.5 text-[11px] ${isSelected ? "font-semibold text-primary" : "text-[#475569]"}`}>
                            {c.nombre}
                          </td>
                          <td className="px-2 py-1.5 text-[11px] text-right font-medium text-black-85">{c.total.toLocaleString("es-PE")}</td>
                        </tr>
                      );
                    })}
                    {canales.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="px-2 py-8 text-center text-xs text-black-25">Sin canales para este asesor.</td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </motion.div>
          ) : !selectedCategoria ? (
            <motion.div
              key="categorias"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              <div className="overflow-auto max-h-[440px]">
                <table className="w-full">
                  <thead className="sticky top-0 z-20 bg-white">
                    <tr>
                      <th className="border-r border-black-10 px-2 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider text-black-45">Categoría</th>
                      <th className="px-2 py-1.5 text-right text-[10px] font-semibold uppercase tracking-wider text-black-45 w-[1%]">Volumen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categorias.map((cat) => {
                      const isSelected = selectedCategoria === cat.nombre;
                      return (
                        <tr
                          key={cat.nombre}
                          onClick={() => onSelectCategoria(isSelected ? null : cat.nombre)}
                          className={`cursor-pointer border-t border-black-5 transition-all duration-150 hover:bg-[#FFF7ED] ${
                            isSelected ? "bg-[#FFF7ED] border-l-2 border-l-[#F97316]" : "border-l-2 border-l-transparent"
                          }`}
                        >
                          <td className={`border-r border-black-5 px-2 py-1.5 text-[11px] ${isSelected ? "font-semibold text-primary" : "text-[#475569]"}`}>
                            {cat.nombre}
                          </td>
                          <td className="px-2 py-1.5 text-[11px] text-right font-medium text-black-85">{cat.total.toLocaleString("es-PE")}</td>
                        </tr>
                      );
                    })}
                    {categorias.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="px-2 py-8 text-center text-xs text-black-25">Sin categorías para este canal.</td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="subcategorias"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              <div className="overflow-auto max-h-[440px]">
                <table className="w-full">
                  <thead className="sticky top-0 z-20 bg-white">
                    <tr>
                      <th className="border-r border-black-10 px-2 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider text-black-45">Subcategoría</th>
                      <th className="px-2 py-1.5 text-right text-[10px] font-semibold uppercase tracking-wider text-black-45 w-[1%]">Volumen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subcategorias.map((s) => (
                      <tr key={s.subcategoria} className="border-t border-black-5 hover:bg-[#FFF7ED] transition-colors">
                        <td className="border-r border-black-5 px-2 py-1.5 text-[11px] text-[#475569]">
                          <span className="flex items-center gap-1">
                            <ChevronRight size={10} className="text-primary shrink-0" />
                            {s.subcategoria}
                          </span>
                        </td>
                        <td className="px-2 py-1.5 text-[11px] text-right font-medium text-black-85">{s.total.toLocaleString("es-PE")}</td>
                      </tr>
                    ))}
                    {subcategorias.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="px-2 py-8 text-center text-xs text-black-25">Sin subcategorías.</td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}



/* ════════════════════════════════════════════════════════════════ */
/*  PÁGINA PRINCIPAL                                               */
/* ════════════════════════════════════════════════════════════════ */
export default function Asesores() {
  const { filters } = useFilters();

  const params = useMemo(() => filtersToParams(filters), [filters]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["asesores", params],
    queryFn: () => fetchAsesores(params),
    refetchOnWindowFocus: false,
  });

  const matrixQuery = useQuery({
    queryKey: ["asesores-matrix", params],
    queryFn: () => fetchAsesoresMatrix(params),
    refetchOnWindowFocus: false,
    staleTime: 30_000,
  });

  /* ── Filter all data to official advisors ── */
  const filtered = useMemo(() => {
    if (!data) return null;
    const ranking = data.ranking;  // respeta orden del backend (scoreGlobal DESC)
    const evolucionDiaria = normalizeEvolucion(data.evolucionDiaria);
    const evolucionPorHora = normalizeEvolucion(data.evolucionPorHora);
    const evolucionSemanal = normalizeEvolucion(data.evolucionSemanal);
    const evolucionMensual = normalizeEvolucion(data.evolucionMensual);
    const tiemposPrimeraRespuesta = filterOfficial(data.tiemposPrimeraRespuesta);
    const tiemposResolucion = filterOfficial(data.tiemposResolucion);
    const matrizCategoria = filterOfficial(data.matrizCategoria);
    const matrizSubcategoria = filterOfficial(data.matrizSubcategoria);
    const quintiles = filterOfficial(data.quintiles);
    const performanceCategoria = filterOfficial(data.performanceCategoria);
    const performanceSubcategoria = filterOfficial(data.performanceSubcategoria);

    const totalAtenciones = ranking.reduce((s, r) => s + r.total, 0);
    const activos = ranking.length;
    const tPrim = ranking.map((r) => r.promedioPrimeraRespuesta).filter((x): x is number => x !== null);
    const tRes = ranking.map((r) => r.promedioResolucion).filter((x): x is number => x !== null);
    const tEsp = ranking.map((r) => r.promedioEspera).filter((x): x is number => x !== null);
    const avgT = (arr: number[]) => arr.length > 0 ? arr.reduce((s, v) => s + v, 0) / arr.length : null;
    const totalResueltos = ranking.reduce((s, r) => s + Math.round((r.total * (r.fcr ?? 0)) / 100), 0);

    return {
      ranking,
      volumenPorAsesor: ranking.map((r) => ({ asesor: r.asesor, total: r.total, porcentaje: totalAtenciones > 0 ? Math.round((r.total / totalAtenciones) * 1000) / 10 : 0 })),
      evolucionDiaria, evolucionPorHora, evolucionSemanal, evolucionMensual,
      tiemposPrimeraRespuesta, tiemposResolucion,
      matrizCategoria, matrizSubcategoria, quintiles,
      performanceCategoria, performanceSubcategoria,
      kpis: {
        totalAtenciones,
        promedioPrimeraRespuesta: avgT(tPrim),
        promedioResolucion: avgT(tRes),
        promedioEspera: avgT(tEsp),
        fcr: totalAtenciones > 0 ? Math.round((totalResueltos / totalAtenciones) * 1000) / 10 : null,
        asesoresActivos: activos,
        promedioAtencionesPorAsesor: activos > 0 ? Math.round((totalAtenciones / activos) * 10) / 10 : null,
        tiempoPromedioPorAtencion: avgT(tPrim),
      },
    };
  }, [data]);

  const processedMatrix = useMemo(() => {
    if (!matrixQuery.data) return null;
    const filas = processAsesoresMatrixRows(matrixQuery.data.filas);
    const totales = computeAsesoresTotals(filas);
    return { filas, totales };
  }, [matrixQuery.data]);

  /* ── Asesor por Canal — navegación jerárquica ── */
  const [selectedAsesor, setSelectedAsesor] = useState<string | null>(null);
  const [selectedCanal, setSelectedCanal] = useState<string | null>(null);
  const [selectedCategoria, setSelectedCategoria] = useState<string | null>(null);

  const leftRows = useMemo(() => {
    if (!data?.asesorCanal) return [];
    const map = new Map<string, number>();
    for (const r of data.asesorCanal) {
      const official = normalizeAdvisor(r.asesor);
      if (!official) continue;
      map.set(official, (map.get(official) ?? 0) + r.total);
    }
    const grandTotal = Array.from(map.values()).reduce((s, v) => s + v, 0);
    return Array.from(map.entries())
      .map(([asesor, volumen]) => ({ asesor, volumen, pct: grandTotal > 0 ? ((volumen / grandTotal) * 100).toFixed(1) : "0" }))
      .sort((a, b) => b.volumen - a.volumen);
  }, [data?.asesorCanal]);

  const onSelectAsesor = useCallback((asesor: string | null) => {
    setSelectedAsesor(asesor);
    setSelectedCanal(null);
    setSelectedCategoria(null);
  }, []);

  const onSelectCanal = useCallback((canal: string | null) => {
    setSelectedCanal(canal);
    setSelectedCategoria(null);
  }, []);

  const onSelectCategoria = useCallback((categoria: string | null) => {
    setSelectedCategoria(categoria);
  }, []);

  /* Clear selection when filters change */
  useEffect(() => {
    setSelectedAsesor(null);
    setSelectedCanal(null);
    setSelectedCategoria(null);
  }, [params]);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <div>
        <h1 className="text-2xl font-semibold text-black-85">Asesores — Desempeño del equipo</h1>
        <p className="mt-1 text-sm text-black-25">Indicadores del equipo de Soporte Especializado.</p>
      </div>

      {isLoading ? <p className="mt-6 text-black-45">Cargando datos…</p> : null}
      {isError ? <p className="mt-6 rounded-lg border border-black-10 bg-white p-4 text-sm text-black-45">No se pudieron cargar los datos.</p> : null}

      {filtered ? (
        <>
          {/* ── KPIs ── */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <KpiCard label="Total atenciones" valor={fmtNum(filtered.kpis.totalAtenciones)} hint="en el período" />
            <KpiCard label="FCR" valor={fmtPct(filtered.kpis.fcr)} hint="tasa de resolución" />
            <KpiCard label="Asesores activos" valor={fmtNum(filtered.kpis.asesoresActivos)} />
            <KpiCard label="Prom. x asesor" valor={fmtNum(filtered.kpis.promedioAtencionesPorAsesor)} hint="atenciones" />
          </div>

          {/* ── Matrices de indicadores por asesor ── */}
          {processedMatrix && (
            <div className="mt-6 space-y-6">
              <div className="flex items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary-10">
                  <BarChart3 size={14} className="text-primary" />
                </div>
                <h2 className="text-sm font-bold text-black-85">Matriz de indicadores por asesor</h2>
              </div>
              <MetricsMatrix
                title="WHATSAPP"
                subtitle="Whaticket + Whatmeta"
                filas={processedMatrix.filas}
                totales={processedMatrix.totales}
                canal="wpp"
                getName={(r: Record<string, any>) => r.asesor}
              />
              <MetricsMatrix
                title="CORREO"
                subtitle="Zendesk"
                filas={processedMatrix.filas}
                totales={processedMatrix.totales}
                canal="corr"
                getName={(r: Record<string, any>) => r.asesor}
              />
            </div>
          )}

          {/* ── Ranking de Performance ── */}
          <div className="mt-6">
            <PerformanceRanking items={filtered.ranking} />
          </div>

          {/* ── Volumen por asesor ── */}
          <div className="mt-6">
            {processedMatrix && <ExecutiveMatrix rows={processedMatrix.filas} />}
          </div>

          {/* ── Distribución ── */}
          <div className="mt-6">
            <DistribucionDona items={filtered.volumenPorAsesor} />
          </div>

          {/* ── Evolución ── */}
          <div className="mt-6">
            <EvolucionChart diaria={filtered.evolucionDiaria} semanal={filtered.evolucionSemanal} mensual={filtered.evolucionMensual} porHora={filtered.evolucionPorHora} />
          </div>

          {/* ── Asesor por Canal — navegación jerárquica ── */}
          <div className="mt-6">
            <AsesorCanalTable
              rows={leftRows}
              subRows={data?.asesorCanalSub ?? []}
              selectedAsesor={selectedAsesor}
              selectedCanal={selectedCanal}
              selectedCategoria={selectedCategoria}
              onSelectAsesor={onSelectAsesor}
              onSelectCanal={onSelectCanal}
              onSelectCategoria={onSelectCategoria}
            />
          </div>

          {/* ── Tiempos ── */}
          <div className="mt-6">
            <TiempoHorizontal items={filtered.tiemposPrimeraRespuesta} titulo="Tiempo promedio de primera respuesta" />
          </div>
          <div className="mt-6">
            <TiempoHorizontal items={filtered.tiemposResolucion} titulo="Tiempo promedio de resolución" />
          </div>

          {/* ── Matrices de calor ── */}
          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <HeatmapMatriz items={filtered.matrizCategoria} titulo="Matriz Categoría vs Asesor" maxH={filtered.matrizCategoria.length > 8 ? 420 : 320} />
            <HeatmapMatriz items={filtered.matrizSubcategoria} titulo="Matriz Subcategoría vs Asesor" maxH={filtered.matrizSubcategoria.length > 8 ? 480 : 360} />
          </div>

          {/* ── Quintiles ── */}
          <div className="mt-6">
            <QuintilesTable items={filtered.quintiles} />
          </div>
        </>
      ) : null}
    </motion.div>
  );
}
