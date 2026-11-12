import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  Flame,
  Inbox,
  Layers,
  RefreshCw,
  Repeat2,
  RotateCcw,
  Share2,
  ShieldCheck,
  Star,
  Timer,
  Users,
} from "lucide-react";
import { useFilters } from "@/contexts/FilterContext";
import type { DashboardFilters } from "@/lib/filters";
import type { BarData, DonutData, LineData } from "@/components/charts";
import { BarChart, DonutChart, HorizontalBarChart, LineChart } from "@/components/charts";
import { useDashboard } from "./hooks/useDashboard";
import { DashboardShell } from "./components/DashboardShell";
import { SectionCard } from "./components/SectionCard";
import { MetricCard, type MetricTrend } from "./components/MetricCard";
import { FilterPanel, type DashboardDraft } from "./components/FilterPanel";
import { Heatmap } from "./components/Heatmap";
import { TeamTable } from "./components/TeamTable";
import { CausesPanel } from "./components/CausesPanel";
import { ControlPanel } from "./components/ControlPanel";
import { InsightsPanel } from "./components/InsightsPanel";
import { CaseDetailModal } from "./components/CaseDetailModal";
import { buildInsights } from "./utils/insights";
import { fmtDateShort, fmtInt, fmtMin, fmtPct, fmtRange } from "./utils/format";
import type { CasoAlerta, GerencialResponse, KpiBackend } from "./dto/dashboard.dto";
import { CHART, channelColor } from "@/lib/chartPalette";
import { cn } from "@/lib/utils";

const ORANGE = CHART.brand;
const CHARCOAL = CHART.charcoal;
const GRAY = CHART.muted;
const GREEN = CHART.success;

/* ─────────────────────────── Fechas y filtros ─────────────────────────── */

function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function shiftDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return isoDate(d);
}

function presetRange(preset: "hoy" | "7d" | "30d" | "90d" | "mes" | "mesAnterior"): [string, string] {
  const today = isoDate(new Date());
  if (preset === "hoy") return [today, today];
  if (preset === "7d") return [shiftDays(-6), today];
  if (preset === "30d") return [shiftDays(-29), today];
  if (preset === "90d") return [shiftDays(-89), today];
  const now = new Date();
  if (preset === "mes") {
    return [isoDate(new Date(now.getFullYear(), now.getMonth(), 1)), today];
  }
  const firstPrev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastPrev = new Date(now.getFullYear(), now.getMonth(), 0);
  return [isoDate(firstPrev), isoDate(lastPrev)];
}

function draftFromFilters(f: DashboardFilters): DashboardDraft {
  return {
    periodo:
      f.fechaHoraInicio && f.fechaHoraFin
        ? [f.fechaHoraInicio.slice(0, 10), f.fechaHoraFin.slice(0, 10)]
        : undefined,
    canal: f.canal,
    pais: f.pais,
    asesor: f.asesor,
    categoria: f.categoria,
    subcategoria: f.subcategoria,
    dominio: f.dominio,
    estado: f.estado,
    search: f.search,
  };
}

function filtersFromDraft(d: DashboardDraft): DashboardFilters {
  const [start, end] = d.periodo ?? [];
  return {
    fechaHoraInicio: start ? `${start} 00:00` : undefined,
    fechaHoraFin: end ? `${end} 23:59` : undefined,
    canal: d.canal,
    pais: d.pais,
    asesor: d.asesor,
    categoria: d.categoria,
    subcategoria: d.subcategoria,
    dominio: d.dominio,
    estado: d.estado,
    search: d.search,
  };
}

function countActive(d: DashboardDraft): number {
  let n = 0;
  if (d.canal?.length) n++;
  if (d.pais?.length) n++;
  if (d.asesor?.length) n++;
  if (d.categoria?.length) n++;
  if (d.subcategoria?.length) n++;
  if (d.dominio?.length) n++;
  if (d.estado?.length) n++;
  if (d.search) n++;
  return n;
}

function isTodayDefault(f: DashboardFilters): boolean {
  const today = isoDate(new Date());
  const dims = [f.canal, f.pais, f.asesor, f.categoria, f.estado, f.subcategoria, f.dominio, f.search];
  return (
    f.fechaHoraInicio?.slice(0, 10) === today &&
    f.fechaHoraFin?.slice(0, 10) === today &&
    dims.every((v) => !v || (Array.isArray(v) && v.length === 0))
  );
}

/* ─────────────────────────── Tendencias ─────────────────────────── */

function trendFor(c: KpiBackend | undefined, invert = false): MetricTrend | undefined {
  if (!c || c.valor == null || c.anterior == null) return undefined;
  return {
    value: c.deltaPct ?? 0,
    direction: c.direccion ?? "flat",
    suffix: "%",
    invert,
    label: `vs ${fmtInt(c.anterior)} del periodo anterior`,
  };
}

function slaTrend(actual: number | null, anterior: number | null, invert = false): MetricTrend | undefined {
  if (actual == null || anterior == null) return undefined;
  const delta = Math.round((actual - anterior) * 10) / 10;
  return {
    value: delta,
    direction: delta > 0 ? "up" : delta < 0 ? "down" : "flat",
    suffix: "pp",
    invert,
    label: `vs ${anterior.toFixed(1)}% del periodo anterior`,
  };
}

function movingAverage(values: number[], window: number): number[] {
  return values.map((_, i) => {
    const start = Math.max(0, i - window + 1);
    const slice = values.slice(start, i + 1);
    return Math.round((slice.reduce((a, b) => a + b, 0) / slice.length) * 10) / 10;
  });
}

/* ─────────────────────────── Header ─────────────────────────── */

function DashboardHeader({
  data,
  isFetching,
  onRefresh,
}: {
  data: GerencialResponse | null;
  isFetching: boolean;
  onRefresh: () => void;
}) {
  const [greeting, setGreeting] = useState("");
  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Buenos días" : h < 18 ? "Buenas tardes" : "Buenas noches");
  }, []);
  const today = new Date().toLocaleDateString("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex w-full flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-black-85">{greeting}</h1>
        <p className="mt-0.5 text-[11px] capitalize text-black-25">{today}</p>
        <p className="mt-1 text-[11px] font-medium text-black-85">
          Panel gerencial de Soporte Especializado · C.O.S.E
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {data && (
          <div className="rounded-xl border border-black-10 bg-white px-3 py-1.5 text-right">
            <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-black-25">Cobertura de la fuente</p>
            <p className="text-[10.5px] font-medium text-black-85">
              {fmtInt(data.cobertura.total)} atenciones · {data.cobertura.desde ?? "—"} a {data.cobertura.hasta ?? "—"}
            </p>
          </div>
        )}
        <button
          type="button"
          onClick={onRefresh}
          disabled={isFetching}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-black-10 bg-white px-3 text-[11px] font-medium text-black-85 hover:bg-light disabled:opacity-50"
        >
          <RefreshCw size={13} className={cn(isFetching && "animate-spin")} /> Actualizar
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────── Skeleton ─────────────────────────── */

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-32 animate-pulse rounded-2xl border border-black-10 bg-white" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl border border-black-10 bg-white" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="h-72 animate-pulse rounded-2xl border border-black-10 bg-white" />
        <div className="h-72 animate-pulse rounded-2xl border border-black-10 bg-white" />
      </div>
    </div>
  );
}

/* ─────────────────────────── Página ─────────────────────────── */

export function DashboardPage() {
  const { filters, setFilters } = useFilters();
  const [draft, setDraft] = useState<DashboardDraft>(() => draftFromFilters(filters));
  const [rangeError, setRangeError] = useState<string | null>(null);
  const [selectedCase, setSelectedCase] = useState<CasoAlerta | null>(null);
  const [granularity, setGranularity] = useState<"diaria" | "semanal" | "mensual">("diaria");
  const bootstrapped = useRef(false);
  const bootstrapPending = !bootstrapped.current && isTodayDefault(filters);
  const { state, data, isFetching, error, retry } = useDashboard(!bootstrapPending);

  // Primer ingreso: si el contexto global trae "hoy", abrir en 30 días para
  // que las tendencias y comparaciones tengan una base útil.
  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;
    if (isTodayDefault(filters)) {
      const [start, end] = presetRange("30d");
      setFilters({ fechaHoraInicio: `${start} 00:00`, fechaHoraFin: `${end} 23:59` });
    }
  }, [filters, setFilters]);

  // Mantener el borrador sincronizado cuando los filtros aplicados cambian.
  useEffect(() => {
    setDraft(draftFromFilters(filters));
  }, [filters]);

  const apply = useCallback(() => {
    const [start, end] = draft.periodo ?? [];
    if (start && end && start > end) {
      setRangeError("La fecha desde no puede ser posterior a la fecha hasta.");
      return;
    }
    setRangeError(null);
    setFilters(filtersFromDraft(draft));
  }, [draft, setFilters]);

  const clearAll = useCallback(() => {
    const [start, end] = presetRange("30d");
    const next: DashboardDraft = { periodo: [start, end] };
    setDraft(next);
    setRangeError(null);
    setFilters(filtersFromDraft(next));
  }, [setFilters]);

  const applyPreset = useCallback(
    (preset: "hoy" | "7d" | "30d" | "90d" | "mes" | "mesAnterior") => {
      const [start, end] = presetRange(preset);
      const next = { ...draft, periodo: [start, end] as [string, string] };
      setDraft(next);
      setRangeError(null);
      setFilters(filtersFromDraft(next));
    },
    [draft, setFilters],
  );

  const drilldown = useCallback(
    (kind: "categoria" | "subcategoria" | "dominio" | "pais" | "canal" | "asesor", value: string) => {
      const next: DashboardDraft = { ...draft, [kind]: [value] };
      setDraft(next);
      setFilters(filtersFromDraft(next));
    },
    [draft, setFilters],
  );

  const isDirty = useMemo(
    () => JSON.stringify(filtersFromDraft(draft)) !== JSON.stringify(filtersFromDraft(draftFromFilters(filters))),
    [draft, filters],
  );

  const insights = useMemo(() => (data ? buildInsights(data) : []), [data]);

  if (state === "loading") {
    return (
      <DashboardShell header={<DashboardHeader data={null} isFetching onRefresh={retry} />}>
        <DashboardSkeleton />
      </DashboardShell>
    );
  }

  if (state === "error" || !data) {
    return (
      <DashboardShell header={<DashboardHeader data={null} isFetching={false} onRefresh={retry} />}>
        <div className="rounded-2xl border border-danger-25 bg-danger-5 p-6">
          <div className="flex items-start gap-2">
            <AlertCircle size={18} className="mt-0.5 shrink-0 text-danger" />
            <div>
              <p className="text-sm font-semibold text-danger">No se pudo cargar el dashboard</p>
              <p className="mt-1 text-xs text-danger/80">{error ?? "Respuesta vacía del servicio."}</p>
              <button
                type="button"
                onClick={retry}
                className="mt-3 rounded-lg bg-primary px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-primary-85"
              >
                Reintentar
              </button>
            </div>
          </div>
        </div>
      </DashboardShell>
    );
  }

  const k = data.kpis;
  const c = data.comparacion;
  const reincidenciaRate = k.gestionadas > 0 ? (k.reincidencias / k.gestionadas) * 100 : null;
  const trendRows =
    granularity === "diaria"
      ? data.tendencia.diaria
      : granularity === "semanal"
        ? data.tendencia.semanal
        : data.tendencia.mensual;
  const categories = trendRows.map((r) => (granularity === "mensual" ? r.periodo : fmtDateShort(r.periodo)));
  const previousSeries = trendRows.map((_, i) => data.tendencia.anterior[i]?.total ?? 0);

  const demandData: LineData = {
    categories,
    series: [
      { name: "Recibidas", data: trendRows.map((r) => r.total), config: { name: "Recibidas", color: ORANGE, smooth: true } },
      { name: "Gestionadas", data: trendRows.map((r) => r.gestionadas), config: { name: "Gestionadas", color: CHARCOAL, smooth: true } },
      ...(granularity === "diaria" && data.tendencia.anterior.length
        ? [{ name: "Periodo anterior", data: previousSeries, config: { name: "Periodo anterior", color: GRAY, smooth: true } }]
        : []),
      ...(granularity === "diaria" && trendRows.length >= 7
        ? [
            {
              name: "Media móvil 7d",
              data: movingAverage(trendRows.map((r) => r.total), 7),
              config: { name: "Media móvil 7d", color: GREEN, smooth: true },
            },
          ]
        : []),
    ],
  };

  const slaData: LineData = {
    categories,
    series: [
      {
        name: "SLA primera respuesta",
        data: trendRows.map((r) => r.slaPrimeraPct) as unknown as number[],
        config: { name: "SLA primera respuesta", color: ORANGE, smooth: true },
      },
      {
        name: "SLA resolución",
        data: trendRows.map((r) => r.slaResolucionPct) as unknown as number[],
        config: { name: "SLA resolución", color: CHARCOAL, smooth: true },
      },
    ],
  };

  const timesData: LineData = {
    categories,
    series: [
      {
        name: "Primera respuesta",
        data: trendRows.map((r) => r.primera) as unknown as number[],
        config: { name: "Primera respuesta", color: ORANGE, smooth: true },
      },
      {
        name: "Solución",
        data: trendRows.map((r) => r.solucion) as unknown as number[],
        config: { name: "Solución", color: CHARCOAL, smooth: true },
      },
    ],
  };

  const hourMap = new Map(data.horas.map((h) => [h.hora, h.total]));
  const hourData: BarData = {
    categories: Array.from({ length: 24 }, (_, h) => String(h).padStart(2, "0")),
    series: [
      {
        name: "Atenciones",
        data: Array.from({ length: 24 }, (_, h) => hourMap.get(h) ?? 0),
        config: { name: "Atenciones", color: ORANGE },
      },
    ],
  };

  const canalDonut: DonutData[] = data.distribuciones.canal.map((c) => ({
    name: c.etiqueta,
    value: c.total,
    color: channelColor(c.etiqueta),
  }));

  const estadoColors: Record<string, string> = {
    Cerrado: GREEN,
    Resuelto: CHARCOAL,
    Abierto: ORANGE,
    Pendiente: CHART.warning,
    "Sin estado válido": CHART.grid,
  };
  const estadoDonut: DonutData[] = data.distribuciones.estado.map((e) => ({
    name: e.etiqueta,
    value: e.total,
    color: estadoColors[e.etiqueta] ?? CHART.muted,
  }));

  const paisData: BarData = {
    categories: data.distribuciones.pais.slice(0, 8).map((p) => p.etiqueta).reverse(),
    series: [
      {
        name: "Atenciones",
        data: data.distribuciones.pais.slice(0, 8).map((p) => p.total).reverse(),
        config: { name: "Atenciones", color: ORANGE },
      },
    ],
  };

  const slaCanalData: BarData = {
    categories: data.slaPorCanal.map((s) => s.etiqueta),
    series: [
      {
        name: "SLA 1ª respuesta",
        data: data.slaPorCanal.map((s) => s.primeraPct ?? 0),
        config: { name: "SLA 1ª respuesta", color: ORANGE },
      },
      {
        name: "SLA resolución",
        data: data.slaPorCanal.map((s) => s.resolucionPct ?? 0),
        config: { name: "SLA resolución", color: CHARCOAL },
      },
    ],
  };

  const activeCount = countActive(draft);
  const showEmpty = state === "empty";

  return (
    <DashboardShell header={<DashboardHeader data={data} isFetching={isFetching} onRefresh={retry} />}>
      <div className="space-y-4 pb-6">
        <FilterPanel
          options={data.opciones}
          value={draft}
          onChange={setDraft}
          onApply={apply}
          onClear={clearAll}
          onPreset={applyPreset}
          dirty={isDirty}
          activeCount={activeCount}
          isFetching={isFetching}
        />
        {rangeError && (
          <div className="rounded-lg border border-danger-25 bg-danger-5 px-3 py-2 text-[11px] text-danger">
            {rangeError}
          </div>
        )}

        {showEmpty ? (
          <div className="rounded-2xl border border-black-10 bg-white px-6 py-14 text-center">
            <Inbox size={26} className="mx-auto text-black-25" />
            <p className="mt-3 text-sm font-semibold text-black-85">No hay atenciones para los filtros seleccionados.</p>
            <p className="mt-1 text-[11px] text-black-25">
              Ajusta el periodo o quita filtros para volver a ver la operación.
            </p>
            <button
              type="button"
              onClick={clearAll}
              className="mt-4 rounded-lg bg-primary px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-primary-85"
            >
              Ver últimos 30 días
            </button>
          </div>
        ) : (
          <>
            {/* 1. Demanda y operación */}
            <SectionCard
              title="Demanda y operación"
              subtitle="Volumen recibido, gestionado y estado actual del trabajo"
              action={
                <span className="rounded-full bg-light px-2.5 py-1 text-[9px] font-medium text-black-45">
                  {fmtRange(data.rango?.inicio, data.rango?.fin)}
                </span>
              }
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                <MetricCard
                  title="Atenciones recibidas"
                  value={fmtInt(k.recibidas)}
                  subtitle={`${fmtInt(k.gestionadas)} gestionadas (${fmtPct(k.efectividad.pct)})`}
                  icon={Inbox}
                  accent="orange"
                  trend={trendFor(c.recibidas)}
                  onClick={() => document.getElementById("tendencia")?.scrollIntoView({ behavior: "smooth" })}
                />
                <MetricCard
                  title="Gestionadas"
                  value={fmtInt(k.gestionadas)}
                  subtitle={`${fmtInt(k.cerradas)} cerradas · ${fmtInt(k.resueltas)} resueltas`}
                  icon={CheckCircle2}
                  accent="green"
                  trend={trendFor(c.gestionadas)}
                />
                <MetricCard
                  title="Pendientes del periodo"
                  value={fmtInt(k.pendientes)}
                  subtitle={`Backlog actual: ${fmtInt(k.backlog)} casos abiertos`}
                  icon={Clock}
                  accent="amber"
                  status={k.pendientes > 0 ? "Requieren seguimiento" : "Sin pendientes nuevos"}
                  onClick={() => document.getElementById("control")?.scrollIntoView({ behavior: "smooth" })}
                />
                <MetricCard
                  title="Backlog actual"
                  value={fmtInt(k.backlog)}
                  subtitle={`${fmtInt(k.fueraSla)} fuera de SLA · ${fmtInt(k.antiguos)} > 7 días`}
                  icon={Layers}
                  accent="red"
                  status={`${fmtInt(k.criticos)} críticos > 72 h`}
                  onClick={() => document.getElementById("control")?.scrollIntoView({ behavior: "smooth" })}
                />
                <MetricCard
                  title="Casos críticos"
                  value={fmtInt(k.criticos)}
                  subtitle="Abiertos con más de 72 horas de antigüedad"
                  icon={Flame}
                  accent="red"
                  status="Prioridad operativa"
                  onClick={() => document.getElementById("control")?.scrollIntoView({ behavior: "smooth" })}
                />
                <MetricCard
                  title="Derivadas a otra área"
                  value={fmtInt(k.derivadas)}
                  subtitle="Departamento distinto a Soporte En Línea"
                  icon={Share2}
                  accent="neutral"
                  help="La vista no tiene un flag de escalamiento; se reporta la derivación por departamento."
                />
              </div>
            </SectionCard>

            {/* 2. SLA y tiempos */}
            <SectionCard
              title="SLA y tiempos de respuesta"
              subtitle="Umbrales vigentes por canal: WhatsApp 15 min / Correo 24 h para primera respuesta; resolución WhatsApp 120 min / Correo 24 h."
              action={
                <span className="inline-flex items-center gap-1 rounded-full bg-black-5 px-2.5 py-1 text-[9px] font-medium text-black-85">
                  <ShieldCheck size={11} /> Configuración del proyecto
                </span>
              }
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                <MetricCard
                  title="SLA primera respuesta"
                  value={fmtPct(k.slaPrimera.pct)}
                  subtitle={`${fmtInt(k.slaPrimera.dentro)} dentro · ${fmtInt(k.slaPrimera.evaluados - k.slaPrimera.dentro)} fuera · ${fmtInt(k.slaPrimera.evaluados)} evaluadas`}
                  icon={ShieldCheck}
                  accent={(k.slaPrimera.pct ?? 0) >= 80 ? "green" : "red"}
                  trend={slaTrend(k.slaPrimera.pct, c.slaPrimeraPct.anterior)}
                />
                <MetricCard
                  title="SLA resolución"
                  value={fmtPct(k.slaResolucion.pct)}
                  subtitle={`${fmtInt(k.slaResolucion.dentro)} dentro · ${fmtInt(k.slaResolucion.evaluados - k.slaResolucion.dentro)} fuera · ${fmtInt(k.slaResolucion.evaluados)} evaluadas`}
                  icon={ShieldCheck}
                  accent={(k.slaResolucion.pct ?? 0) >= 80 ? "green" : "red"}
                  trend={slaTrend(k.slaResolucion.pct, c.slaResolucionPct.anterior)}
                />
                <MetricCard
                  title="Primera respuesta"
                  value={fmtMin(k.primera)}
                  subtitle="Promedio de atención al primer contacto"
                  icon={Timer}
                  accent="charcoal"
                  trend={trendFor(c.primera, true)}
                />
                <MetricCard
                  title="Tiempo de atención"
                  value={fmtMin(k.atencion)}
                  subtitle="Promedio de respuesta durante la conversación"
                  icon={Activity}
                  accent="charcoal"
                  help="Calculado con respuesta_promedio_min_norm. Solo disponible para WhatsApp."
                  trend={trendFor(c.atencion, true)}
                />
                <MetricCard
                  title="Tiempo de solución"
                  value={fmtMin(k.solucion)}
                  subtitle="Promedio hasta el cierre o resolución"
                  icon={CheckCircle2}
                  accent="charcoal"
                  trend={trendFor(c.solucion, true)}
                />
                <MetricCard
                  title="Tiempo de espera"
                  value="No disponible"
                  subtitle="La fuente no separa asignación de primera respuesta"
                  icon={AlertCircle}
                  accent="neutral"
                  muted
                  help="Brecha de datos: no existe un timestamp de asignación independiente. No se duplica el valor de primera respuesta."
                />
              </div>
            </SectionCard>

            {/* 3. Calidad y resolución */}
            <SectionCard
              title="Calidad y resolución"
              subtitle="Efectividad sobre el volumen recibido e indicadores disponibles en la fuente"
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                  title="Resolución efectiva"
                  value={fmtPct(k.efectividad.pct)}
                  subtitle={`${fmtInt(k.efectividad.gestionadas)} gestionadas de ${fmtInt(k.efectividad.recibidas)} recibidas`}
                  icon={CheckCircle2}
                  accent="green"
                />
                <MetricCard
                  title="Reincidencias"
                  value={fmtInt(k.reincidencias)}
                  subtitle={
                    reincidenciaRate != null
                      ? `${reincidenciaRate.toFixed(1)}% de las gestionadas · contactos con más de una atención`
                      : "Contactos con más de una atención finalizada"
                  }
                  icon={Repeat2}
                  accent="amber"
                  help="Se calcula agrupando contacto, número o dominio dentro del periodo filtrado."
                />
                <MetricCard
                  title="Reabiertos"
                  value="No disponible"
                  subtitle="Sin historial de estados por ticket"
                  icon={RotateCcw}
                  accent="neutral"
                  muted
                  help="Brecha de datos: no se almacena el historial de reaperturas. No se inventa un valor."
                />
                <MetricCard
                  title="Calidad de atención"
                  value="No disponible"
                  subtitle="Sin evaluación CSAT/QA en las fuentes"
                  icon={Star}
                  accent="neutral"
                  muted
                  help="Brecha de datos: no existe una fuente de calidad o satisfacción almacenada."
                />
              </div>
            </SectionCard>

            {/* 4. Tendencias */}
            <div id="tendencia" className="scroll-mt-24">
              <SectionCard
                title="Tendencias y comparación"
                subtitle="Evolución de la demanda y del cumplimiento SLA contra el periodo anterior"
                action={
                  <div className="flex rounded-lg border border-black-10 bg-white p-0.5">
                    {(
                      [
                        ["diaria", "Diaria"],
                        ["semanal", "Semanal"],
                        ["mensual", "Mensual"],
                      ] as [typeof granularity, string][]
                    ).map(([id, label]) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setGranularity(id)}
                        className={cn(
                          "rounded-md px-2.5 py-1 text-[10px] font-medium",
                          granularity === id ? "bg-primary text-white" : "text-black-45 hover:bg-light",
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                }
              >
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                  <LineChart
                    title="Demanda de atenciones"
                    subtitle={granularity === "diaria" ? "Recibidas vs gestionadas · periodo anterior incluido" : "Recibidas vs gestionadas"}
                    data={demandData}
                    config={{ height: 260, showLegend: true }}
                    state={{
                      isEmpty: trendRows.length === 0,
                      emptyMessage: "No hay registros para los filtros aplicados.",
                    }}
                  />
                  <LineChart
                    title="Evolución del cumplimiento SLA"
                    subtitle="Porcentaje sobre casos evaluados; el detalle n/N está en las tarjetas SLA y en la tabla del equipo"
                    data={slaData}
                    config={{ height: 260, showLegend: true }}
                    state={{
                      isEmpty: trendRows.every((r) => r.slaPrimeraPct == null && r.slaResolucionPct == null),
                      emptyMessage: "No hay casos evaluables de SLA en el periodo.",
                    }}
                  />
                  <div className="xl:col-span-2">
                    <LineChart
                      title="Evolución de tiempos de respuesta y solución"
                      subtitle="Minutos promedio por periodo; los días sin dato se muestran como espacios"
                      data={timesData}
                      config={{ height: 260, showLegend: true }}
                      state={{
                        isEmpty: trendRows.every((r) => r.primera == null && r.solucion == null),
                        emptyMessage: "No hay tiempos calculables en el periodo.",
                      }}
                    />
                  </div>
                </div>
              </SectionCard>
            </div>

            {/* 5. Distribución y carga */}
            <SectionCard
              title="Distribución operativa y carga"
              subtitle="Canales, estados, países y horarios de mayor demanda"
            >
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
                <DonutChart
                  title="Distribución por canal"
                  subtitle={`${fmtInt(k.recibidas)} atenciones`}
                  data={canalDonut}
                  config={{ height: 220, showLegend: true }}
                  state={{ isEmpty: canalDonut.length === 0, emptyMessage: "Sin canales en el periodo." }}
                />
                <DonutChart
                  title="Distribución por estado"
                  subtitle="Estado homologado"
                  data={estadoDonut}
                  config={{ height: 220, showLegend: true }}
                  state={{ isEmpty: estadoDonut.length === 0, emptyMessage: "Sin estados en el periodo." }}
                />
                <HorizontalBarChart
                  title="Atenciones por país"
                  subtitle="Top 8 del periodo"
                  data={paisData}
                  config={{ height: 220, showLegend: false }}
                  state={{ isEmpty: paisData.categories.length === 0, emptyMessage: "Sin países en el periodo." }}
                />
                <div>
                  <BarChart
                    title="SLA por canal"
                    subtitle="Primera respuesta vs resolución"
                    data={slaCanalData}
                    config={{ height: 190, showLegend: true }}
                    state={{ isEmpty: slaCanalData.categories.length === 0, emptyMessage: "Sin casos evaluables." }}
                  />
                  <div className="mt-1 space-y-0.5">
                    {data.slaPorCanal.map((s) => (
                      <div key={s.etiqueta} className="flex items-center justify-between gap-2 text-[9px] text-black-45">
                        <span className="font-semibold text-black-85">{s.etiqueta}</span>
                        <span className="tabular-nums">
                          1ª {fmtInt(s.primeraDentro)}/{fmtInt(s.primeraEvaluados)} · Res{" "}
                          {fmtInt(s.resolucionDentro)}/{fmtInt(s.resolucionEvaluados)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
                <BarChart
                  title="Carga por hora"
                  subtitle="Volumen de atenciones por hora de creación"
                  data={hourData}
                  config={{ height: 240, showLegend: false }}
                  state={{ isEmpty: hourData.series[0].data.every((v) => v === 0), emptyMessage: "Sin registros horarios." }}
                />
                <div className="rounded-lg border border-black-5 bg-white p-4">
                  <div className="mb-3">
                    <h3 className="text-xs font-semibold text-black-85">Mapa de calor día × hora</h3>
                    <p className="mt-0.5 text-[10px] text-black-25">Lunes a domingo, 00 a 23 horas</p>
                  </div>
                  <Heatmap data={data.heatmap} />
                </div>
              </div>
            </SectionCard>

            {/* 6. Equipo */}
            <SectionCard
              title="Rendimiento del equipo"
              subtitle="Comparación por volumen, tiempos, SLA y reincidencias. Sin ranking único de desempeño."
              action={
                <span className="inline-flex items-center gap-1 rounded-full bg-light px-2.5 py-1 text-[9px] font-medium text-black-45">
                  <Users size={11} /> {data.asesores.length} asesores con actividad
                </span>
              }
            >
              <TeamTable rows={data.asesores} onSelect={(asesor) => drilldown("asesor", asesor)} />
            </SectionCard>

            {/* 7. Causas */}
            <SectionCard
              title="Análisis de causas"
              subtitle="Categoría, subcategoría, cliente/dominio, país y canal. Haz clic en una fila para filtrar el dashboard."
            >
              <CausesPanel distribuciones={data.distribuciones} total={k.recibidas} onFilter={drilldown} />
            </SectionCard>

            {/* 8. Control operativo */}
            <div id="control" className="scroll-mt-24">
              <SectionCard
                title="Control operativo y alertas"
                subtitle="Casos prioritarios, actividad reciente y accesos directos"
              >
                <ControlPanel alertas={data.alertas} actividad={data.actividad} onOpenCase={setSelectedCase} />
              </SectionCard>
            </div>

            {/* 9. Insights */}
            <SectionCard
              title="Insights gerenciales"
              subtitle="Observaciones generadas solo cuando existe evidencia y base suficiente"
              action={<span className="text-[9px] text-black-25">{insights.length} hallazgo(s)</span>}
            >
              <InsightsPanel insights={insights} />
            </SectionCard>

            {/* 10. Brechas */}
            <details className="rounded-2xl border border-black-10 bg-white px-4 py-3 text-[10px] text-black-45">
              <summary className="cursor-pointer text-[11px] font-semibold text-black-85">
                Brechas de datos documentadas ({data.brechas.length})
              </summary>
              <ul className="mt-2 list-disc space-y-1 pl-4 leading-5">
                {data.brechas.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
              <p className="mt-2 text-[9px] text-black-25">
                Fuente: public.v_unificado_norm · generado {new Date(data.generadoEn).toLocaleString("es-PE")} · sin
                valores simulados.
              </p>
            </details>
          </>
        )}
      </div>

      <CaseDetailModal caso={selectedCase} onClose={() => setSelectedCase(null)} />
    </DashboardShell>
  );
}
