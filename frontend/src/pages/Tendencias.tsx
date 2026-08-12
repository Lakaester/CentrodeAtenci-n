import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react";
import ReactECharts from "echarts-for-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface TendenciasKpi { variacionVolumen: number | null; variacionTiempoPrimera: number | null; variacionTiempoResolucion: number | null; variacionSla: number | null; variacionFcr: number | null; variacionClientesUnicos: number | null; }
interface AlertaItem { tipo: string; mensaje: string; severidad: "alto" | "medio" | "bajo"; }
interface ResTendencias {
  kpis: TendenciasKpi;
  evolucionVolumen: { periodo: string; total: number }[];
  evolucionCanal: { periodo: string; canal: string; total: number }[];
  evolucionSubcanal: { periodo: string; subcanal: string; total: number }[];
  evolucionCategoria: { periodo: string; categoria: string; total: number }[];
  evolucionSubcategoria: { periodo: string; subcategoria: string; total: number }[];
  evolucionAsesor: { periodo: string; asesor: string; total: number }[];
  evolucionPais: { periodo: string; pais: string; total: number }[];
  evolucionDominio: { dominio: string; periodo: string; total: number }[];
  evolucionCliente: { periodo: string; cliente: string; total: number }[];
  tendenciaSla: { periodo: string; pctCumple: number | null }[];
  tendenciaTiempos: { periodo: string; primeraRespuesta: number | null; resolucion: number | null; espera: number | null }[];
  tendenciaQuintiles: { periodo: string; quintil: number; promedio: number | null }[];
  estacionalidad: { hora: number; dia: number; total: number }[];
  estacionalidadMes: { mes: number; dia: number; total: number }[];
  alertas: AlertaItem[];
}

async function fetchTendencias(params: Record<string, string>): Promise<ResTendencias> {
  const { data } = await api.get("/dashboard/tendencias", { params });
  return data.data as ResTendencias;
}

function cssVar(name: string) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
const fmtPct = (n: number | null | undefined) => n == null ? "—" : `${Math.round(n)}%`;

function VariacionCard({ label, delta, goodUp, fmt }: { label: string; delta: number | null; goodUp?: boolean; fmt?: (v: number) => string }) {
  const f = fmt ?? ((v: number) => `${v >= 0 ? "+" : ""}${v}%`);
  if (delta == null) {
    return (
      <div className="rounded-xl border border-border bg-surface p-5">
        <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
        <p className="mt-2 text-3xl font-semibold text-text">—</p>
      </div>
    );
  }
  const isPos = delta > 0;
  const isNeg = delta < 0;
  const arrow = isPos ? TrendingUp : isNeg ? TrendingDown : Minus;
  const color = isPos ? (goodUp ? "text-success" : "text-danger") : isNeg ? (goodUp ? "text-danger" : "text-success") : "text-muted";
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className={cn("mt-2 flex items-center gap-2 text-3xl font-semibold", color)}>
        {f(delta)}
        {arrow === TrendingUp && <TrendingUp size={24} />}
        {arrow === TrendingDown && <TrendingDown size={24} />}
        {arrow === Minus && <Minus size={24} />}
      </p>
    </div>
  );
}

function useAgrupar(items: { periodo: string; total: number }[], grupo: "dia" | "semana" | "mes") {
  return useMemo(() => {
    if (grupo === "dia") return items;
    const m = new Map<string, { periodo: string; total: number }>();
    for (const e of items) {
      const d = new Date(e.periodo + "T00:00:00Z");
      const k = grupo === "semana" ? ((w) => w.toISOString().slice(0, 10))((d => { const w = new Date(d); w.setDate(d.getDate() - d.getDay()); return w; })(d)) : e.periodo.slice(0, 7);
      const acc = m.get(k) ?? { periodo: k, total: 0 };
      acc.total += e.total;
      m.set(k, acc);
    }
    return [...m.values()].sort((a, b) => a.periodo.localeCompare(b.periodo));
  }, [items, grupo]);
}

function EvolucionLinea({ items }: { items: { periodo: string; total: number }[] }) {
  const [grupo, setGrupo] = useState<"dia" | "semana" | "mes">("dia");
  const muted = cssVar("--muted");
  const borderColor = cssVar("--border");
  const data = useAgrupar(items, grupo);
  const opt = {
    tooltip: { trigger: "axis" as const },
    grid: { left: 60, right: 20, top: 15, bottom: 60 },
    xAxis: { type: "category" as const, data: data.map((i) => i.periodo), axisLabel: { color: muted, fontSize: 10, rotate: data.length > 20 ? 45 : 0 }, axisLine: { show: false } },
    yAxis: { type: "value" as const, axisLabel: { color: muted, fontSize: 10 }, splitLine: { lineStyle: { color: borderColor, type: "dashed" as const } } },
    series: [{ name: "Volumen", type: "line" as const, data: data.map((i) => i.total), smooth: true, lineStyle: { color: "#3b82f6", width: 2 }, itemStyle: { color: "#3b82f6" }, areaStyle: { color: "rgba(59,130,246,0.1)" } }],
  };
  const BTN = ({ v, label }: { v: typeof grupo; label: string }) => (
    <button onClick={() => setGrupo(v)} className={cn("rounded px-2 py-1 text-xs font-medium", grupo === v ? "bg-primary text-white" : "bg-bg text-muted hover:text-text")}>{label}</button>
  );
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-text">Evolución del volumen</h3>
        <div className="flex gap-1">
          <BTN v="dia" label="Día" />
          <BTN v="semana" label="Semana" />
          <BTN v="mes" label="Mes" />
        </div>
      </div>
      <ReactECharts option={opt} style={{ height: 280 }} notMerge lazyUpdate />
    </div>
  );
}

function AreaApilada({ items, nameKey }: { items: { periodo: string; [k: string]: string | number }[]; nameKey: string }) {
  const muted = cssVar("--muted");
  const borderColor = cssVar("--border");
  const keys = [...new Set(items.map((i) => i[nameKey] as string))];
  const periodos = [...new Set(items.map((i) => i.periodo))].sort();
  const palette = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#84cc16"];
  const opt = {
    tooltip: { trigger: "axis" as const },
    legend: { bottom: 0, textStyle: { color: muted }, type: "scroll" as const },
    grid: { left: 60, right: 20, top: 15, bottom: 60 },
    xAxis: { type: "category" as const, data: periodos, axisLabel: { color: muted, fontSize: 10, rotate: periodos.length > 20 ? 45 : 0 }, axisLine: { show: false } },
    yAxis: { type: "value" as const, axisLabel: { color: muted, fontSize: 10 }, splitLine: { lineStyle: { color: borderColor, type: "dashed" as const } } },
    series: keys.map((k, idx) => ({
      name: k, type: "line" as const, stack: "total", smooth: true,
      data: periodos.map((p) => items.find((i) => i.periodo === p && i[nameKey] === k)?.total ?? 0),
      lineStyle: { width: 0 },
      areaStyle: { color: palette[idx % palette.length], opacity: 0.6 },
      itemStyle: { color: palette[idx % palette.length] },
    })),
  };
  return <ReactECharts option={opt} style={{ height: 300 }} notMerge lazyUpdate />;
}

function MultiLinea({ items, nameKey, titulo, subtitulo }: { items: { periodo: string; [k: string]: string | number }[]; nameKey: string; titulo: string; subtitulo?: string }) {
  const [grupo, setGrupo] = useState<"dia" | "semana" | "mes">("dia");
  const muted = cssVar("--muted");
  const borderColor = cssVar("--border");
  const keys = [...new Set(items.map((i) => i[nameKey] as string))];
  const data = useAgrupar(
    items.map((i) => ({ periodo: i.periodo, total: i.total as number })),
    grupo
  );
  const periodos = data.map((i) => i.periodo);
  const palette = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#84cc16"];
  const opt = {
    tooltip: { trigger: "axis" as const },
    legend: { bottom: 0, textStyle: { color: muted }, type: "scroll" as const },
    grid: { left: 60, right: 20, top: 15, bottom: 60 },
    xAxis: { type: "category" as const, data: periodos, axisLabel: { color: muted, fontSize: 10, rotate: periodos.length > 20 ? 45 : 0 }, axisLine: { show: false } },
    yAxis: { type: "value" as const, axisLabel: { color: muted, fontSize: 10 }, splitLine: { lineStyle: { color: borderColor, type: "dashed" as const } } },
    series: keys.slice(0, 10).map((k, idx) => ({
      name: k, type: "line" as const, smooth: true,
      data: periodos.map((p) => items.filter((i) => i[nameKey] === k).filter((i) => i.periodo === p).reduce((s, i) => s + (i.total as number), 0)),
      lineStyle: { color: palette[idx % palette.length], width: 2 },
      itemStyle: { color: palette[idx % palette.length] },
      symbol: "none" as const,
    })),
  };
  const BTN = ({ v, label }: { v: typeof grupo; label: string }) => (
    <button onClick={() => setGrupo(v)} className={cn("rounded px-2 py-1 text-xs font-medium", grupo === v ? "bg-primary text-white" : "bg-bg text-muted hover:text-text")}>{label}</button>
  );
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-text">{titulo}</h3>
          {subtitulo && <p className="mt-1 text-xs text-muted">{subtitulo}</p>}
        </div>
        <div className="flex gap-1">
          <BTN v="dia" label="Día" />
          <BTN v="semana" label="Semana" />
          <BTN v="mes" label="Mes" />
        </div>
      </div>
      <ReactECharts option={opt} style={{ height: 300 }} notMerge lazyUpdate />
    </div>
  );
}

function TendenciaSlaLinea({ items }: { items: { periodo: string; pctCumple: number | null }[] }) {
  const muted = cssVar("--muted");
  const borderColor = cssVar("--border");
  const data = items.filter((i) => i.pctCumple != null);
  const opt = {
    tooltip: { trigger: "axis" as const, valueFormatter: (v: number) => `${v}%` },
    grid: { left: 50, right: 20, top: 15, bottom: 55 },
    xAxis: { type: "category" as const, data: data.map((i) => i.periodo), axisLabel: { color: muted, fontSize: 10, rotate: data.length > 20 ? 45 : 0 }, axisLine: { show: false } },
    yAxis: { type: "value" as const, min: 0, max: 100, axisLabel: { color: muted, fontSize: 10, formatter: "{value}%" }, splitLine: { lineStyle: { color: borderColor, type: "dashed" as const } } },
    visualMap: { show: false, pieces: [{ lt: 80, color: "#ef4444" }, { gte: 80, color: "#22c55e" }] },
    series: [{
      type: "line" as const, data: data.map((i) => ({ value: i.pctCumple })), smooth: true,
      lineStyle: { width: 3 }, itemStyle: { color: (p: { value: number }) => p.value >= 80 ? "#22c55e" : "#ef4444" },
      areaStyle: { color: "rgba(59,130,246,0.1)" },
      markLine: { silent: true, data: [{ yAxis: 80, label: { formatter: "Meta 80%", color: muted, fontSize: 10 }, lineStyle: { color: "#f59e0b", type: "dashed" as const } }] },
    }],
  };
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <h3 className="text-sm font-medium text-text">Tendencia del SLA</h3>
      <p className="mt-1 text-xs text-muted">Línea discontinua = meta del 80%</p>
      <ReactECharts option={opt} style={{ height: 280 }} notMerge lazyUpdate />
    </div>
  );
}

function TendenciaTiemposLinea({ items }: { items: { periodo: string; primeraRespuesta: number | null; resolucion: number | null; espera: number | null }[] }) {
  const muted = cssVar("--muted");
  const borderColor = cssVar("--border");
  const opt = {
    tooltip: { trigger: "axis" as const },
    legend: { bottom: 0, textStyle: { color: muted } },
    grid: { left: 60, right: 20, top: 15, bottom: 60 },
    xAxis: { type: "category" as const, data: items.map((i) => i.periodo), axisLabel: { color: muted, fontSize: 10, rotate: items.length > 20 ? 45 : 0 }, axisLine: { show: false } },
    yAxis: { type: "value" as const, axisLabel: { color: muted, fontSize: 10, formatter: "{value} min" }, splitLine: { lineStyle: { color: borderColor, type: "dashed" as const } } },
    series: [
      { name: "1ª respuesta", type: "line" as const, data: items.map((i) => i.primeraRespuesta), smooth: true, lineStyle: { color: "#3b82f6", width: 2 }, itemStyle: { color: "#3b82f6" }, symbol: "none" as const },
      { name: "Resolución", type: "line" as const, data: items.map((i) => i.resolucion), smooth: true, lineStyle: { color: "#ef4444", width: 2 }, itemStyle: { color: "#ef4444" }, symbol: "none" as const },
      { name: "Espera", type: "line" as const, data: items.map((i) => i.espera), smooth: true, lineStyle: { color: "#f59e0b", width: 2, type: "dashed" as const }, itemStyle: { color: "#f59e0b" }, symbol: "none" as const },
    ],
  };
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <h3 className="text-sm font-medium text-text">Tendencia de tiempos</h3>
      <p className="mt-1 text-xs text-muted">Azul = 1ª respuesta · Rojo = resolución · Amarillo = espera</p>
      <ReactECharts option={opt} style={{ height: 280 }} notMerge lazyUpdate />
    </div>
  );
}

function TendenciaQuintiles({ items }: { items: { periodo: string; quintil: number; promedio: number | null }[] }) {
  const muted = cssVar("--muted");
  const borderColor = cssVar("--border");
  const periodos = [...new Set(items.map((i) => i.periodo))].sort();
  const quintiles = [1, 2, 3, 4, 5];
  const palette = ["#22c55e", "#84cc16", "#f59e0b", "#f97316", "#ef4444"];
  const opt = {
    tooltip: { trigger: "axis" as const },
    legend: { bottom: 0, textStyle: { color: muted } },
    grid: { left: 60, right: 20, top: 15, bottom: 60 },
    xAxis: { type: "category" as const, data: periodos, axisLabel: { color: muted, fontSize: 10, rotate: periodos.length > 20 ? 45 : 0 }, axisLine: { show: false } },
    yAxis: { type: "value" as const, axisLabel: { color: muted, fontSize: 10, formatter: "{value} min" }, splitLine: { lineStyle: { color: borderColor, type: "dashed" as const } } },
    series: quintiles.map((q) => ({
      name: `Q${q}`, type: "line" as const, smooth: true,
      data: periodos.map((p) => items.find((i) => i.periodo === p && i.quintil === q)?.promedio ?? null),
      lineStyle: { color: palette[q - 1], width: 2 },
      itemStyle: { color: palette[q - 1] },
      symbol: "none" as const,
    })),
  };
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <h3 className="text-sm font-medium text-text">Tendencia por quintiles</h3>
      <p className="mt-1 text-xs text-muted">Q1 = más rápidos · Q5 = más lentos</p>
      <ReactECharts option={opt} style={{ height: 280 }} notMerge lazyUpdate />
    </div>
  );
}

function EstacionalidadHeatmap({ items }: { items: { hora: number; dia: number; total: number }[] }) {
  const muted = cssVar("--muted");
  const textColor = cssVar("--text");
  const horas = Array.from({ length: 24 }, (_, i) => i);
  const dias = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const maxV = Math.max(...items.map((i) => i.total), 1);
  const data = items.map((i) => [i.hora, i.dia, i.total] as number[]);
  const opt = {
    tooltip: { formatter: (p: { value: number[] }) => `${dias[p.value[1]]} ${String(p.value[0]).padStart(2, "0")}:00<br/>Atenciones: ${p.value[2]}` },
    grid: { left: 50, right: 40, top: 10, bottom: 60 },
    xAxis: { type: "category" as const, data: horas.map((h) => `${String(h).padStart(2, "0")}:00`), axisLabel: { color: muted, fontSize: 9, rotate: 45 }, splitArea: { show: true, areaStyle: { color: ["rgba(0,0,0,0.02)", "transparent"] } } },
    yAxis: { type: "category" as const, data: dias, axisLabel: { color: textColor, fontSize: 10 }, splitArea: { show: true, areaStyle: { color: ["rgba(0,0,0,0.02)", "transparent"] } } },
    visualMap: { min: 0, max: maxV, calculable: true, orient: "horizontal", left: "center", bottom: 10, inRange: { color: ["#f0f9ff", "#3b82f6", "#1d4ed8"] } },
    series: [{
      type: "heatmap" as const, data,
      label: { show: true, color: "#fff", fontSize: 9, formatter: (p: { value: number[] }) => p.value[2] || "" },
    }],
  };
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <h3 className="text-sm font-medium text-text">Estacionalidad · Día vs Hora</h3>
      <p className="mt-1 text-xs text-muted">Distribución del volumen de atención por día de semana y hora del día</p>
      <ReactECharts option={opt} style={{ height: 240 }} notMerge lazyUpdate />
    </div>
  );
}

function EstacionalidadMes({ items }: { items: { mes: number; dia: number; total: number }[] }) {
  const muted = cssVar("--muted");
  const textColor = cssVar("--text");
  const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const dias = Array.from({ length: 31 }, (_, i) => i + 1);
  const maxV = Math.max(...items.map((i) => i.total), 1);
  const data = items.map((i) => [i.mes - 1, i.dia - 1, i.total] as number[]);
  const opt = {
    tooltip: { formatter: (p: { value: number[] }) => `${dias[p.value[1]]} ${meses[p.value[0]]}<br/>Atenciones: ${p.value[2]}` },
    grid: { left: 50, right: 40, top: 10, bottom: 55 },
    xAxis: { type: "category" as const, data: meses, axisLabel: { color: muted, fontSize: 10 }, splitArea: { show: true, areaStyle: { color: ["rgba(0,0,0,0.02)", "transparent"] } } },
    yAxis: { type: "category" as const, data: dias.map(String), axisLabel: { color: textColor, fontSize: 9 }, splitArea: { show: true, areaStyle: { color: ["rgba(0,0,0,0.02)", "transparent"] } } },
    visualMap: { min: 0, max: maxV, calculable: true, orient: "horizontal", left: "center", bottom: 0, inRange: { color: ["#f0f9ff", "#3b82f6", "#1d4ed8"] } },
    series: [{
      type: "heatmap" as const, data,
      label: { show: false },
    }],
  };
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <h3 className="text-sm font-medium text-text">Estacionalidad · Mes vs Día</h3>
      <p className="mt-1 text-xs text-muted">Volumen de atención por día del mes</p>
      <ReactECharts option={opt} style={{ height: 360 }} notMerge lazyUpdate />
    </div>
  );
}

function AlertasPanel({ items }: { items: AlertaItem[] }) {
  const badge = (s: string) => {
    if (s === "alto") return "bg-danger-50/10 text-danger border-rose-500/20";
    if (s === "medio") return "bg-warning-50/10 text-warning border-amber-500/20";
    return "bg-success-50/10 text-success border-emerald-500/20";
  };
  const label = (s: string) => s === "alto" ? "Alta" : s === "medio" ? "Media" : "Baja";
  if (!items.length) return null;
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle size={16} className="text-warning" />
        <h3 className="text-sm font-medium text-text">Alertas de tendencia</h3>
      </div>
      <div className="space-y-2">
        {items.map((a, idx) => (
          <div key={idx} className="flex items-start gap-3 rounded-lg bg-bg p-3">
            <span className={cn("mt-0.5 rounded border px-1.5 py-0.5 text-xs font-medium shrink-0", badge(a.severidad))}>{label(a.severidad)}</span>
            <div>
              <p className="text-xs font-medium text-text">{a.tipo}</p>
              <p className="text-xs text-muted mt-0.5">{a.mensaje}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface FiltrosLocal {
  fechaHoraInicio: string; fechaHoraFin: string;
  [k: string]: string;
}

export default function Tendencias() {
  const [filtros, setFiltros] = useState<FiltrosLocal>({ fechaHoraInicio: "", fechaHoraFin: "" });
  const [showFilters, setShowFilters] = useState(false);

  const params = useMemo(() => {
    const p: Record<string, string> = {};
    for (const [k, v] of Object.entries(filtros)) if (v) p[k] = v;
    return p;
  }, [filtros]);

  const { data, isLoading } = useQuery({
    queryKey: ["tendencias", params],
    queryFn: () => fetchTendencias(params),
    refetchOnWindowFocus: false,
  });

  const set = (k: string, v: string) => setFiltros((prev) => ({ ...prev, [k]: v }));

  const isFiltered = Object.values(filtros).some((v) => v);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!data) return <p className="text-muted p-6">Error al cargar datos.</p>;

  const { kpis: k } = data;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-text">Tendencias</h1>
        <button onClick={() => setShowFilters(!showFilters)} className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted hover:text-text">
          {showFilters ? "Ocultar filtros" : "Filtros locales"} {isFiltered ? "· Activos" : ""}
        </button>
      </div>

      {showFilters && (
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="flex flex-wrap gap-3">
            <div>
              <label className="block text-xs text-muted mb-1">Fecha inicio</label>
              <input type="datetime-local" value={filtros.fechaHoraInicio.replace(" ", "T")} onChange={(e) => set("fechaHoraInicio", e.target.value.replace("T", " "))} className="rounded-lg border border-border bg-bg px-3 py-1.5 text-xs text-text outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">Fin</label>
              <input type="datetime-local" value={filtros.fechaHoraFin.replace(" ", "T")} onChange={(e) => set("fechaHoraFin", e.target.value.replace("T", " "))} className="rounded-lg border border-border bg-bg px-3 py-1.5 text-xs text-text outline-none focus:border-primary" />
            </div>
            {isFiltered && (
              <div className="flex items-end">
                <button onClick={() => setFiltros({ fechaHoraInicio: "", fechaHoraFin: "" })} className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted hover:text-text">
                  Limpiar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <VariacionCard label="Volumen" delta={k.variacionVolumen} goodUp={false} />
        <VariacionCard label="1ª respuesta" delta={k.variacionTiempoPrimera} goodUp={false} fmt={(v) => `${v >= 0 ? "+" : ""}${v}%`} />
        <VariacionCard label="Resolución" delta={k.variacionTiempoResolucion} goodUp={false} fmt={(v) => `${v >= 0 ? "+" : ""}${v}%`} />
        <VariacionCard label="SLA" delta={k.variacionSla} goodUp fmt={fmtPct} />
        <VariacionCard label="FCR" delta={k.variacionFcr} goodUp fmt={fmtPct} />
        <VariacionCard label="Clientes únicos" delta={k.variacionClientesUnicos} goodUp={false} />
      </div>

      <EvolucionLinea items={data.evolucionVolumen} />

      {data.evolucionCanal.length > 0 && (
        <div className="rounded-xl border border-border bg-surface p-5">
          <h3 className="text-sm font-medium text-text">Evolución por canal</h3>
          <AreaApilada items={data.evolucionCanal} nameKey="canal" />
        </div>
      )}

      {data.evolucionSubcanal.length > 0 && (
        <MultiLinea items={data.evolucionSubcanal} nameKey="subcanal" titulo="Evolución por subcanal" />
      )}

      {data.evolucionCategoria.length > 0 && (
        <MultiLinea items={data.evolucionCategoria} nameKey="categoria" titulo="Evolución por categoría (Top 10)" subtitulo="Categorías con mayor volumen en el período" />
      )}

      {data.evolucionSubcategoria.length > 0 && (
        <MultiLinea items={data.evolucionSubcategoria} nameKey="subcategoria" titulo="Evolución por subcategoría (Top 10)" subtitulo="Subcategorías con mayor volumen" />
      )}

      {data.evolucionAsesor.length > 0 && (
        <MultiLinea items={data.evolucionAsesor} nameKey="asesor" titulo="Evolución por asesor" subtitulo="Top asesores por volumen de atención" />
      )}

      {data.evolucionPais.length > 0 && (
        <MultiLinea items={data.evolucionPais} nameKey="pais" titulo="Evolución por país" subtitulo="Top países por volumen de atención" />
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <TendenciaSlaLinea items={data.tendenciaSla} />
        <TendenciaTiemposLinea items={data.tendenciaTiempos} />
      </div>

      {data.tendenciaQuintiles.length > 0 && (
        <TendenciaQuintiles items={data.tendenciaQuintiles} />
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {data.estacionalidad.length > 0 && <EstacionalidadHeatmap items={data.estacionalidad} />}
        {data.estacionalidadMes.length > 0 && <EstacionalidadMes items={data.estacionalidadMes} />}
      </div>

      <AlertasPanel items={data.alertas} />
    </motion.div>
  );
}
