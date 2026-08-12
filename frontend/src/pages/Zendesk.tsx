import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import ReactECharts from "echarts-for-react";
import { api } from "@/lib/api";
import { useFilters } from "@/contexts/FilterContext";
import { filtersToParams } from "@/lib/filters";
import { fmtNum, fmtPct, fmtDur, Badge, KpiCard, Section, DataTable } from "@/components/dashboard/shared";

/* ─── Tipos ─── */
interface ZendeskKpi { totalTickets: number; ticketsAbiertos: number; ticketsCerrados: number; ticketsPendientes: number; tiempoPrimeraRespuesta: number | null; tiempoResolucion: number | null; slaPrimeraRespuesta: number | null; slaResolucion: number | null; fcr: number | null; tiempoPromedioTicket: number | null; }
interface ResZendesk {
  kpis: ZendeskKpi;
  evolucion: { periodo: string; total: number; abiertos: number; cerrados: number }[];
  backlog: { periodo: string; abiertos: number }[];
  estados: { estado: string; total: number; porcentaje: number }[];
  treemap: { categoria: string; total: number; tiempoResolucion: number | null }[];
  topSubcategorias: { subcategoria: string; total: number; porcentaje: number }[];
  asesores: { asesor: string; total: number; tiempoPromedio: number | null; sla: number | null; fcr: number | null }[];
  paises: { pais: string; total: number }[];
  tiemposCategoria: { categoria: string; primeraRespuesta: number | null; resolucion: number | null }[];
  tiemposSubcategoria: { subcategoria: string; primeraRespuesta: number | null; resolucion: number | null }[];
  tiemposAsesor: { asesor: string; primeraRespuesta: number | null; resolucion: number | null }[];
  tendencia: { periodo: string; actual: number; anterior: number }[];
  insights: string[];
}

async function fetchZendesk(params: Record<string, string>): Promise<ResZendesk> {
  const { data } = await api.get("/dashboard/zendesk", { params });
  return data.data as ResZendesk;
}

function cssVar(name: string) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }

const ASESORES_OFICIALES = ["Andres", "Danilo", "Eveling", "Lidia", "Lisbeth", "Sheyla", "Victor"];

/* ════════════════════════════════════════════════════════════════ */
/*  EVOLUCIÓN ZENDESK                                              */
/* ════════════════════════════════════════════════════════════════ */
function EvolucionZendesk({ items }: { items: { periodo: string; total: number; abiertos: number; cerrados: number }[] }) {
  const muted = cssVar("--muted");
  const opt = {
    tooltip: { trigger: "axis" as const },
    legend: { bottom: 0, textStyle: { color: muted } },
    grid: { left: 50, right: 20, top: 15, bottom: 50 },
    xAxis: { type: "category" as const, data: items.map((i) => i.periodo), axisLabel: { color: muted, fontSize: 10, rotate: items.length > 20 ? 45 : 0 }, axisLine: { show: false } },
    yAxis: { type: "value" as const, axisLabel: { color: muted, fontSize: 10 }, splitLine: { lineStyle: { color: cssVar("--border"), type: "dashed" as const } } },
    series: [
      { name: "Total", type: "line" as const, data: items.map((i) => i.total), smooth: true, lineStyle: { color: "#3b82f6", width: 2 }, itemStyle: { color: "#3b82f6" }, areaStyle: { color: "rgba(59,130,246,0.1)" } },
      { name: "Abiertos", type: "line" as const, data: items.map((i) => i.abiertos), smooth: true, lineStyle: { color: "#f59e0b", width: 2 }, itemStyle: { color: "#f59e0b" } },
      { name: "Cerrados", type: "line" as const, data: items.map((i) => i.cerrados), smooth: true, lineStyle: { color: "#22c55e", width: 2 }, itemStyle: { color: "#22c55e" } },
    ],
  };
  return <Section title="Evolución de tickets"><ReactECharts option={opt} style={{ height: 280 }} notMerge lazyUpdate /></Section>;
}

/* ════════════════════════════════════════════════════════════════ */
/*  BACKLOG                                                        */
/* ════════════════════════════════════════════════════════════════ */
function BacklogChart({ items }: { items: { periodo: string; abiertos: number }[] }) {
  const muted = cssVar("--muted");
  const opt = {
    tooltip: { trigger: "axis" as const },
    grid: { left: 50, right: 20, top: 15, bottom: 50 },
    xAxis: { type: "category" as const, data: items.map((i) => i.periodo), axisLabel: { color: muted, fontSize: 10, rotate: items.length > 20 ? 45 : 0 }, axisLine: { show: false } },
    yAxis: { type: "value" as const, axisLabel: { color: muted, fontSize: 10 }, splitLine: { lineStyle: { color: cssVar("--border"), type: "dashed" as const } } },
    series: [{ name: "Abiertos", type: "line" as const, data: items.map((i) => i.abiertos), smooth: true, lineStyle: { color: "#f59e0b", width: 2 }, itemStyle: { color: "#f59e0b" }, areaStyle: { color: "rgba(245,158,11,0.1)" } }],
  };
  return <Section title="Backlog de tickets abiertos"><ReactECharts option={opt} style={{ height: 280 }} notMerge lazyUpdate /></Section>;
}

/* ════════════════════════════════════════════════════════════════ */
/*  DONUT ESTADOS                                                  */
/* ════════════════════════════════════════════════════════════════ */
function DonutEstados({ items }: { items: { estado: string; total: number; porcentaje: number }[] }) {
  const muted = cssVar("--muted");
  const palette = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"];
  const opt = {
    tooltip: { formatter: (p: { name: string; percent: number }) => `<b>${p.name}</b><br/>${p.percent}%` },
    series: [{
      type: "pie" as const, radius: ["40%", "70%"], avoidLabelOverlap: true,
      label: { show: true, formatter: "{b}: {d}%", color: muted, fontSize: 11 },
      emphasis: { label: { show: true, fontSize: 14, fontWeight: "bold" as const } },
      data: items.map((i, idx) => ({ name: i.estado, value: i.total, itemStyle: { color: palette[idx % palette.length] } })),
    }],
  };
  return <Section title="Estado de tickets"><ReactECharts option={opt} style={{ height: 300 }} notMerge lazyUpdate /></Section>;
}

/* ════════════════════════════════════════════════════════════════ */
/*  TREEMAP CATEGORÍAS                                             */
/* ════════════════════════════════════════════════════════════════ */
function TreemapChart({ items }: { items: { categoria: string; total: number; tiempoResolucion: number | null }[] }) {
  const maxT = Math.max(...items.map((i) => i.tiempoResolucion ?? 0));
  const option = {
    tooltip: { formatter: (p: { name: string; value: number; data: { tiempoResolucion: number | null } }) =>
      `<b>${p.name}</b><br/>Tickets: ${p.value.toLocaleString("es-PE")}<br/>Resolución: ${fmtDur(p.data?.tiempoResolucion)}` },
    series: [{
      type: "treemap" as const, roam: false,
      label: { show: true, fontSize: 11, color: "#fff", textShadowBlur: 2, textShadowColor: "rgba(0,0,0,0.5)" },
      itemStyle: { borderColor: cssVar("--surface"), borderWidth: 2 },
      levels: [{ colorSaturation: [0.3, 0.7], colorMappingBy: "value" as const }],
      data: items.map((i) => ({
        name: i.categoria, value: i.total,
        tiempoResolucion: i.tiempoResolucion,
        itemStyle: { color: i.tiempoResolucion ? `rgba(239, 68, 68, ${Math.min(1, i.tiempoResolucion / maxT)})` : "#3b82f6" },
      })),
    }],
  };
  return <Section title="Distribución de categorías" subtitle="Tamaño = volumen · Rojo = resolución lenta"><ReactECharts option={option} style={{ height: 400 }} notMerge lazyUpdate /></Section>;
}

/* ════════════════════════════════════════════════════════════════ */
/*  TOP SUBCATEGORÍAS                                              */
/* ════════════════════════════════════════════════════════════════ */
function TopSubTable({ items }: { items: { subcategoria: string; total: number; porcentaje: number }[] }) {
  return (
    <Section title="Top subcategorías">
      <DataTable
        columns={[
          { key: "idx", label: "#", render: (_, i) => <span className="text-black-25">{i + 1}</span> },
          { key: "subcategoria", label: "Subcategoría", render: (r) => <span className="font-medium text-black-85">{r.subcategoria}</span> },
          { key: "total", label: "Total", align: "right", render: (r) => fmtNum(r.total as number) },
          { key: "porcentaje", label: "%", align: "right", render: (r) => <Badge value={r.porcentaje as number} /> },
        ]}
        data={items}
      />
    </Section>
  );
}

/* ════════════════════════════════════════════════════════════════ */
/*  RANKING ASESORES                                               */
/* ════════════════════════════════════════════════════════════════ */
function AsesoresRanking({ items }: { items: ResZendesk["asesores"] }) {
  return (
    <Section title="Ranking de asesores" subtitle="Solo asesores de Soporte Especializado">
      <DataTable
        columns={[
          { key: "idx", label: "#", render: (_, i) => <span className="text-black-25">{i + 1}</span> },
          { key: "asesor", label: "Asesor", render: (r) => <span className="font-medium text-black-85">{r.asesor}</span> },
          { key: "total", label: "Tickets", align: "right", render: (r) => fmtNum(r.total as number) },
          { key: "tiempoPromedio", label: "T. promedio", align: "right", render: (r) => fmtDur(r.tiempoPromedio as number | null) },
          { key: "sla", label: "SLA", align: "right", render: (r) => <Badge value={r.sla as number | null} goodAbove={80} /> },
          { key: "fcr", label: "FCR", align: "right", render: (r) => <Badge value={r.fcr as number | null} goodAbove={80} /> },
        ]}
        data={items}
      />
    </Section>
  );
}

/* ════════════════════════════════════════════════════════════════ */
/*  PAÍSES                                                         */
/* ════════════════════════════════════════════════════════════════ */
function PaisBars({ items }: { items: { pais: string; total: number }[] }) {
  const muted = cssVar("--muted");
  const textColor = cssVar("--text");
  const sorted = [...items].sort((a, b) => b.total - a.total).slice(0, 20);
  const opt = {
    tooltip: { trigger: "axis" as const },
    grid: { left: 120, right: 30, top: 15, bottom: 20 },
    xAxis: { type: "value" as const, axisLabel: { color: muted, fontSize: 10 }, splitLine: { lineStyle: { color: cssVar("--border"), type: "dashed" as const } } },
    yAxis: { type: "category" as const, data: sorted.map((i) => i.pais), axisLabel: { color: textColor, fontSize: 10 } },
    series: [{ type: "bar" as const, data: sorted.map((i) => i.total), barMaxWidth: 20, itemStyle: { color: "#3b82f6", borderRadius: [0, 4, 4, 0] } }],
  };
  return <Section title="Tickets por país"><ReactECharts option={opt} style={{ height: Math.max(200, sorted.length * 24) }} notMerge lazyUpdate /></Section>;
}

/* ════════════════════════════════════════════════════════════════ */
/*  TIEMPOS BARS                                                   */
/* ════════════════════════════════════════════════════════════════ */
function TiemposBars({ items, esSub, esAsesor }: { items: { categoria?: string; subcategoria?: string; asesor?: string; primeraRespuesta: number | null; resolucion: number | null }[]; esSub?: boolean; esAsesor?: boolean }) {
  const muted = cssVar("--muted");
  const textColor = cssVar("--text");
  const key = esAsesor ? "asesor" : esSub ? "subcategoria" : "categoria";
  const sorted = [...items].sort((a, b) => (b.resolucion ?? 0) - (a.resolucion ?? 0));
  const labels = sorted.map((i) => (i as any)[key]);
  const opt = {
    tooltip: { trigger: "axis" as const },
    legend: { bottom: 0, textStyle: { color: muted } },
    grid: { left: 140, right: 30, top: 10, bottom: 55 },
    xAxis: { type: "value" as const, axisLabel: { color: muted, fontSize: 10 }, splitLine: { lineStyle: { color: cssVar("--border"), type: "dashed" as const } } },
    yAxis: { type: "category" as const, data: labels, axisLabel: { color: textColor, fontSize: 10 } },
    series: [
      { name: "1ª respuesta", type: "bar" as const, data: sorted.map((i) => i.primeraRespuesta), barMaxWidth: 8, barGap: "20%", itemStyle: { color: "#3b82f6", borderRadius: [0, 2, 2, 0] } },
      { name: "Resolución", type: "bar" as const, data: sorted.map((i) => i.resolucion), barMaxWidth: 8, barGap: "20%", itemStyle: { color: "#ef4444", borderRadius: [0, 2, 2, 0] } },
    ],
  };
  const title = esAsesor ? "por asesor" : esSub ? "por subcategoría" : "por categoría";
  return <Section title={`Tiempos ${title}`} subtitle="Azul = 1ª respuesta · Rojo = resolución"><ReactECharts option={opt} style={{ height: Math.max(200, labels.length * 24) }} notMerge lazyUpdate /></Section>;
}

/* ════════════════════════════════════════════════════════════════ */
/*  TENDENCIA                                                      */
/* ════════════════════════════════════════════════════════════════ */
function TendenciaChart({ items }: { items: { periodo: string; actual: number; anterior: number }[] }) {
  const muted = cssVar("--muted");
  const opt = {
    tooltip: { trigger: "axis" as const },
    legend: { bottom: 0, textStyle: { color: muted } },
    grid: { left: 50, right: 20, top: 15, bottom: 50 },
    xAxis: { type: "category" as const, data: items.map((i) => i.periodo), axisLabel: { color: muted, fontSize: 10, rotate: items.length > 12 ? 45 : 0 }, axisLine: { show: false } },
    yAxis: { type: "value" as const, axisLabel: { color: muted, fontSize: 10 }, splitLine: { lineStyle: { color: cssVar("--border"), type: "dashed" as const } } },
    series: [
      { name: "Actual", type: "line" as const, data: items.map((i) => i.actual), smooth: true, lineStyle: { color: "#3b82f6", width: 2 }, itemStyle: { color: "#3b82f6" }, areaStyle: { color: "rgba(59,130,246,0.1)" } },
      { name: "Anterior", type: "line" as const, data: items.map((i) => i.anterior), smooth: true, lineStyle: { color: "#94a3b8", width: 2, type: "dashed" as const }, itemStyle: { color: "#94a3b8" } },
    ],
  };
  return <Section title="Tendencia: actual vs período anterior"><ReactECharts option={opt} style={{ height: 280 }} notMerge lazyUpdate /></Section>;
}

/* ════════════════════════════════════════════════════════════════ */
/*  INSIGHTS                                                       */
/* ════════════════════════════════════════════════════════════════ */
function InsightsPanel({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <Section title="Insights automáticos" subtitle="Conclusiones generadas a partir de los datos del período.">
      <ul className="space-y-2">
        {items.map((s, idx) => (
          <li key={idx} className="flex items-start gap-2 rounded-lg bg-bg p-3 text-sm text-text">
            <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
            {s}
          </li>
        ))}
      </ul>
    </Section>
  );
}

/* ════════════════════════════════════════════════════════════════ */
/*  PAGE                                                            */
/* ════════════════════════════════════════════════════════════════ */
export default function Zendesk() {
  const { filters } = useFilters();
  const params = useMemo(() => filtersToParams(filters), [filters]);

  const { data, isLoading } = useQuery({
    queryKey: ["zendesk", params],
    queryFn: () => fetchZendesk(params),
    refetchOnWindowFocus: false,
  });

  if (isLoading) return <div className="flex h-full items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;
  if (!data) return <p className="text-muted p-6">Error al cargar datos.</p>;

  const k = data.kpis;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <h1 className="text-lg font-semibold text-text">Zendesk</h1>

      {/* KPI Row */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        <KpiCard icon={null} label="Total tickets" value={fmtNum(k.totalTickets)} />
        <KpiCard icon={null} label="Abiertos" value={fmtNum(k.ticketsAbiertos)} color="text-warning" />
        <KpiCard icon={null} label="Cerrados" value={fmtNum(k.ticketsCerrados)} color="text-success" />
        <KpiCard icon={null} label="Pendientes" value={fmtNum(k.ticketsPendientes)} color="text-danger" />
        <KpiCard icon={null} label="1ª respuesta" value={fmtDur(k.tiempoPrimeraRespuesta)} color="text-success" />
        <KpiCard icon={null} label="Resolución" value={fmtDur(k.tiempoResolucion)} color="text-success" />
        <KpiCard icon={null} label="T. promedio ticket" value={fmtDur(k.tiempoPromedioTicket)} />
        <KpiCard icon={null} label="FCR" value={fmtPct(k.fcr)} color={(k.fcr ?? 0) >= 80 ? "text-success" : (k.fcr ?? 0) >= 50 ? "text-warning" : "text-danger"} />
      </div>

      {/* SLA */}
      <div className="grid gap-4 sm:grid-cols-2">
        <KpiCard icon={null} label="SLA 1ª respuesta" value={fmtPct(k.slaPrimeraRespuesta)} color={(k.slaPrimeraRespuesta ?? 100) >= 80 ? "text-success" : (k.slaPrimeraRespuesta ?? 100) >= 50 ? "text-warning" : "text-danger"} />
        <KpiCard icon={null} label="SLA resolución" value={fmtPct(k.slaResolucion)} color={(k.slaResolucion ?? 100) >= 80 ? "text-success" : (k.slaResolucion ?? 100) >= 50 ? "text-warning" : "text-danger"} />
      </div>

      {/* Treemap */}
      <TreemapChart items={data.treemap} />

      {/* Evolución | Backlog | Estados */}
      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <EvolucionZendesk items={data.evolucion} />
        <BacklogChart items={data.backlog} />
        <DonutEstados items={data.estados} />
      </div>

      {/* Top Subs | Asesores | Países */}
      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <TopSubTable items={data.topSubcategorias} />
        <AsesoresRanking items={data.asesores.filter(a => ASESORES_OFICIALES.includes(a.asesor))} />
        <PaisBars items={data.paises} />
      </div>

      {/* Tiempos */}
      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <TiemposBars items={data.tiemposCategoria} />
        {data.tiemposSubcategoria.length > 0 && <TiemposBars items={data.tiemposSubcategoria} esSub />}
        {data.tiemposAsesor.length > 0 && <TiemposBars items={data.tiemposAsesor} esAsesor />}
      </div>

      {/* Tendencia */}
      {data.tendencia.length > 0 && <TendenciaChart items={data.tendencia} />}

      {/* Insights */}
      <InsightsPanel items={data.insights} />
    </motion.div>
  );
}
