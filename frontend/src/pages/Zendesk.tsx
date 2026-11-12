import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, Inbox, Ticket, Timer } from "lucide-react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import { api } from "@/lib/api";
import { useFilters } from "@/contexts/FilterContext";
import { filtersToParams } from "@/lib/filters";
import { fmtNum, KpiCard, Section } from "@/components/dashboard/shared";
import { cn } from "@/lib/utils";
import { CHART } from "@/lib/chartPalette";

/* ─── Tipos ─── */
interface ZendeskKpis {
  totalTickets: number;
  cerrados: number;
  resueltos: number;
  abiertos: number;
  pendientes: number;
  enEspera: number;
  otros: number;
  primeraN: number;
  primeraCobertura: number;
  primeraMediana: number | null;
  primeraP90: number | null;
  primeraPromedio: number | null;
  primeraSinDato: number;
  resolucionN: number;
  resolucionCobertura: number;
  resolucionMediana: number | null;
  resolucionP90: number | null;
  resolucionPromedio: number | null;
  resolucionExcluidas: number;
  slaPrimeraCumple: number;
  slaPrimeraEvaluables: number;
  slaPrimeraPct: number | null;
  slaPrimeraUmbral: number;
  totalAnterior: number | null;
  variacionAbs: number | null;
  variacionPct: number | null;
}

interface ZendeskEstado {
  estado: string;
  etiqueta: string;
  total: number;
  pct: number;
}

interface ZendeskBacklog {
  abiertos: number;
  pendientes: number;
  enEspera: number;
  total: number;
  fechaCorte: string;
}

interface ResZendesk {
  kpis: ZendeskKpis;
  estados: ZendeskEstado[];
  evolucion: {
    actual: { periodo: string; total: number }[];
    anterior: { periodo: string; total: number }[];
    totalActual: number;
    totalAnterior: number | null;
    variacionAbs: number | null;
    variacionPct: number | null;
  };
  backlog: ZendeskBacklog;
  insights: string[];
}

type Granularidad = "diaria" | "semanal" | "mensual";

async function fetchZendesk(params: Record<string, string>): Promise<ResZendesk> {
  const { data } = await api.get("/dashboard/zendesk", { params });
  return data.data as ResZendesk;
}

const fmtPct1 = (n: number | null | undefined) =>
  n == null || !Number.isFinite(n)
    ? "—"
    : `${n.toLocaleString("es-PE", { maximumFractionDigits: 1 })}%`;

const fmtMetric = (min: number | null | undefined) => {
  if (min == null || !Number.isFinite(min)) return "—";
  if (min < 60) {
    return `${(Math.round(min * 10) / 10).toLocaleString("es-PE", {
      maximumFractionDigits: 1,
    })} min`;
  }
  if (min < 1440) return `${(min / 60).toFixed(1)} h`;
  return `${(min / 1440).toFixed(1)} d`;
};

const MESES = ["", "Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const colorVariacion = (v: number | null) =>
  v == null || v === 0 ? "text-black-45" : v > 0 ? "text-danger" : "text-success";

/* ════════════════════════════════════════════════════════════════ */
/*  KPI                                                            */
/* ════════════════════════════════════════════════════════════════ */
function Kpis({ k }: { k: ZendeskKpis }) {
  const primeraHint =
    k.primeraN > 0
      ? `p90 ${fmtMetric(k.primeraP90)} · ${fmtNum(k.primeraN)} de ${fmtNum(
          k.totalTickets,
        )} (${fmtPct1(k.primeraCobertura)})`
      : "Sin datos suficientes";
  const resolucionHint =
    k.resolucionN > 0
      ? `p90 ${fmtMetric(k.resolucionP90)} · ${fmtNum(k.resolucionN)} de ${fmtNum(
          k.totalTickets,
        )} (${fmtPct1(k.resolucionCobertura)}) · ${fmtNum(
          k.resolucionExcluidas,
        )} sin tiempo válido`
      : "Sin datos suficientes";
  const slaHint =
    k.slaPrimeraPct !== null
      ? `${fmtNum(k.slaPrimeraCumple)} de ${fmtNum(
          k.slaPrimeraEvaluables,
        )} evaluables · umbral ${fmtNum(k.slaPrimeraUmbral)} min`
      : "Sin datos suficientes";

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        icon={<Ticket size={18} />}
        label="Tickets recibidos"
        value={fmtNum(k.totalTickets)}
        hint={`${fmtNum(k.cerrados)} cerrados · ${fmtNum(k.resueltos)} resueltos`}
      />
      <KpiCard
        icon={<Clock size={18} />}
        label="Primera respuesta"
        value={fmtMetric(k.primeraMediana)}
        hint={primeraHint}
      />
      <KpiCard
        icon={<Timer size={18} />}
        label="Resolución"
        value={fmtMetric(k.resolucionMediana)}
        hint={resolucionHint}
      />
      <KpiCard
        icon={<CheckCircle2 size={18} />}
        label="SLA primera respuesta"
        value={fmtPct1(k.slaPrimeraPct)}
        hint={slaHint}
      />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════ */
/*  ESTADOS                                                        */
/* ════════════════════════════════════════════════════════════════ */
function Estados({ items, total }: { items: ZendeskEstado[]; total: number }) {
  const color = (estado: string) => {
    if (estado === "cerrado") return CHART.success;
    if (estado === "resuelto") return CHART.success;
    if (estado === "abierto") return CHART.warning;
    if (estado === "pendiente") return CHART.danger;
    if (estado === "en_espera") return CHART.purple;
    return CHART.muted;
  };
  const visibles = items.filter((e) => e.total > 0);

  return (
    <div className="rounded-xl border border-black-10 bg-white p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-medium text-black-85">Estado de los tickets</h3>
        <span className="text-xs text-black-25">
          Total {fmtNum(total)} · cada ticket pertenece a un solo grupo
        </span>
      </div>

      <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-black-5">
        {visibles.map((e) => (
          <div
            key={e.estado}
            style={{ width: `${e.pct}%`, backgroundColor: color(e.estado) }}
            title={`${e.etiqueta}: ${fmtNum(e.total)} (${fmtPct1(e.pct)})`}
          />
        ))}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {items.map((e) => (
          <div key={e.estado} className="rounded-lg bg-black-5 px-3 py-2">
            <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-black-45">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: color(e.estado) }}
              />
              {e.etiqueta}
            </p>
            <p className="mt-1 text-lg font-semibold text-black-85">{fmtNum(e.total)}</p>
            <p className="text-[10px] text-black-25">{fmtPct1(e.pct)}</p>
          </div>
        ))}
      </div>

      <p className="mt-3 text-[11px] text-black-25">
        Cerrado y resuelto se mantienen como estados distintos. Abiertos, pendientes y en
        espera se muestran por separado; si no hay tickets, quedan en 0.
      </p>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════ */
/*  EVOLUCIÓN                                                      */
/* ════════════════════════════════════════════════════════════════ */
function agrupar(
  items: { periodo: string; total: number }[],
  g: Granularidad,
): { periodo: string; total: number }[] {
  if (g === "diaria") return items;
  const mapa = new Map<string, number>();
  for (const r of items) {
    const d = new Date(`${r.periodo}T00:00:00Z`);
    let clave: string;
    if (g === "semanal") {
      const day = d.getUTCDay() || 7;
      d.setUTCDate(d.getUTCDate() - (day - 1));
      clave = d.toISOString().slice(0, 10);
    } else {
      clave = r.periodo.slice(0, 7);
    }
    mapa.set(clave, (mapa.get(clave) ?? 0) + r.total);
  }
  return [...mapa.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([periodo, total]) => ({ periodo, total }));
}

function labelPeriodo(p: string, g: Granularidad): string {
  if (g === "mensual") {
    const [y, m] = p.split("-");
    return `${MESES[Number(m)] ?? m} ${y.slice(2)}`;
  }
  return p;
}

function Evolucion({ data }: { data: ResZendesk["evolucion"] }) {
  const dias = data.actual.length;
  const defaultG: Granularidad = dias > 120 ? "mensual" : dias > 31 ? "semanal" : "diaria";
  const [granularidad, setGranularidad] = useState<Granularidad>(defaultG);

  useEffect(() => {
    setGranularidad(defaultG);
  }, [defaultG]);

  const actual = useMemo(
    () => agrupar(data.actual, granularidad),
    [data.actual, granularidad],
  );
  const anterior = useMemo(
    () => agrupar(data.anterior, granularidad),
    [data.anterior, granularidad],
  );

  const option = useMemo<EChartsOption>(() => {
    const labels = actual.map((p) => p.periodo);
    const conZoom = labels.length > 20;
    return {
      tooltip: {
        trigger: "axis",
        formatter: (params: any) => {
          const i = params?.[0]?.dataIndex ?? 0;
          const a = actual[i];
          const p = anterior[i];
          if (!a) return "";
          return [
            `<b>${labelPeriodo(a.periodo, granularidad)}</b>`,
            `Actual: <b>${fmtNum(a.total)}</b>`,
            p ? `Periodo anterior: ${fmtNum(p.total)}` : "",
          ]
            .filter(Boolean)
            .join("<br/>");
        },
      },
      legend: { bottom: 0, textStyle: { fontSize: 11 } },
      grid: { left: 48, right: 18, top: 18, bottom: conZoom ? 78 : 50 },
      dataZoom: conZoom
        ? [
            { type: "inside" },
            { type: "slider", height: 14, bottom: 26 },
          ]
        : [],
      xAxis: {
        type: "category",
        data: labels.map((p) => labelPeriodo(p, granularidad)),
        axisLabel: { fontSize: 10, rotate: labels.length > 14 ? 38 : 0 },
        axisLine: { show: false },
      },
      yAxis: {
        type: "value",
        name: "Tickets",
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
          lineStyle: { color: CHART.brand, width: 3 },
          itemStyle: { color: CHART.brand },
          areaStyle: { color: "rgba(249,115,22,0.10)" },
          data: actual.map((p) => p.total),
        },
        {
          name: "Periodo anterior",
          type: "line",
          smooth: true,
          symbol: "none",
          lineStyle: { color: CHART.muted, width: 2, type: "dashed" },
          itemStyle: { color: CHART.muted },
          data: actual.map((_, i) => anterior[i]?.total ?? null),
        },
      ],
    };
  }, [actual, anterior, granularidad]);

  const variacion = data.variacionPct;
  const variacionAbs = data.variacionAbs;

  return (
    <Section
      title="Evolución de tickets creados"
      subtitle="Zendesk/Correo por fecha real de creación · comparación contra el periodo anterior equivalente."
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-black-25">
          Actual: <b className="text-black-85">{fmtNum(data.totalActual)}</b>
          {data.totalAnterior !== null && (
            <>
              {" "}
              · Anterior: <b className="text-black-85">{fmtNum(data.totalAnterior)}</b>
            </>
          )}
          {variacion !== null && variacionAbs !== null && (
            <>
              {" "}
              <span className={cn("font-medium", colorVariacion(variacion))}>
                {variacion > 0 ? "+" : ""}
                {variacionAbs.toLocaleString("es-PE")} ({variacion > 0 ? "+" : ""}
                {fmtPct1(variacion)})
              </span>
            </>
          )}
        </div>
        <div className="flex gap-1 rounded-lg border border-black-10 bg-black-5 p-1">
          {(["diaria", "semanal", "mensual"] as Granularidad[]).map((g) => (
            <button
              key={g}
              onClick={() => setGranularidad(g)}
              className={cn(
                "rounded px-2 py-1 text-[11px] font-medium",
                granularidad === g ? "bg-primary text-white" : "text-black-45",
              )}
            >
              {g === "diaria" ? "Diaria" : g === "semanal" ? "Semanal" : "Mensual"}
            </button>
          ))}
        </div>
      </div>

      {actual.length <= 1 ? (
        <p className="py-10 text-center text-sm text-black-25">
          Se requieren al menos 2 periodos para mostrar la evolución.
        </p>
      ) : (
        <ReactECharts option={option} style={{ height: 300 }} notMerge lazyUpdate />
      )}
      {data.totalAnterior === null && (
        <p className="mt-2 text-[11px] text-black-25">
          No hay periodo anterior comparable para el rango seleccionado.
        </p>
      )}
    </Section>
  );
}

/* ════════════════════════════════════════════════════════════════ */
/*  BACKLOG                                                        */
/* ════════════════════════════════════════════════════════════════ */
function Backlog({ b }: { b: ZendeskBacklog }) {
  return (
    <div className="h-full rounded-xl border border-black-10 bg-white p-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-medium text-black-85">Backlog al corte</h3>
          <p className="mt-0.5 text-xs text-black-25">
            Tickets que continúan abiertos, pendientes o en espera.
          </p>
        </div>
        <Inbox size={18} className="text-black-25" />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-black-5 px-3 py-2">
          <p className="text-[10px] uppercase tracking-wide text-black-45">Abiertos</p>
          <p className="mt-1 text-2xl font-semibold text-black-85">{fmtNum(b.abiertos)}</p>
        </div>
        <div className="rounded-lg bg-black-5 px-3 py-2">
          <p className="text-[10px] uppercase tracking-wide text-black-45">Pendientes</p>
          <p className="mt-1 text-2xl font-semibold text-black-85">{fmtNum(b.pendientes)}</p>
        </div>
        <div className="rounded-lg bg-black-5 px-3 py-2">
          <p className="text-[10px] uppercase tracking-wide text-black-45">En espera</p>
          <p className="mt-1 text-2xl font-semibold text-black-85">{fmtNum(b.enEspera)}</p>
        </div>
      </div>

      <p className="mt-4 text-[11px] text-black-25">
        Corte: {b.fechaCorte || "—"}.{" "}
        {b.total === 0
          ? "No hay tickets abiertos ni pendientes al corte. No se muestra una tendencia histórica porque la fuente no la sustenta."
          : `${fmtNum(b.total)} tickets requieren seguimiento.`}
      </p>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════ */
/*  CAPACIDAD                                                      */
/* ════════════════════════════════════════════════════════════════ */
function Capacidad({ k }: { k: ZendeskKpis }) {
  return (
    <div className="h-full rounded-xl border border-black-10 bg-white p-5">
      <h3 className="text-sm font-medium text-black-85">Oportunidad y capacidad</h3>
      <p className="mt-0.5 text-xs text-black-25">
        Mediana y p90 como lectura principal; promedio como dato secundario.
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[620px] text-sm">
          <thead>
            <tr className="text-left text-[10px] font-semibold uppercase tracking-wider text-black-45">
              <th className="pb-2 pr-3">Métrica</th>
              <th className="pb-2 pr-3 text-right">Mediana</th>
              <th className="pb-2 pr-3 text-right">P90</th>
              <th className="pb-2 pr-3 text-right">Promedio</th>
              <th className="pb-2 pr-3 text-right">n</th>
              <th className="pb-2 text-right">Cobertura</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-black-5">
              <td className="py-2 pr-3 text-xs font-medium text-black-85">Primera respuesta</td>
              <td className="py-2 pr-3 text-right text-xs text-black-85">{fmtMetric(k.primeraMediana)}</td>
              <td className="py-2 pr-3 text-right text-xs text-black-85">{fmtMetric(k.primeraP90)}</td>
              <td className="py-2 pr-3 text-right text-xs text-black-45">{fmtMetric(k.primeraPromedio)}</td>
              <td className="py-2 pr-3 text-right text-xs text-black-45">{fmtNum(k.primeraN)}</td>
              <td className="py-2 text-right text-xs text-black-45">{fmtPct1(k.primeraCobertura)}</td>
            </tr>
            <tr className="border-t border-black-5">
              <td className="py-2 pr-3 text-xs font-medium text-black-85">Resolución</td>
              <td className="py-2 pr-3 text-right text-xs text-black-85">{fmtMetric(k.resolucionMediana)}</td>
              <td className="py-2 pr-3 text-right text-xs text-black-85">{fmtMetric(k.resolucionP90)}</td>
              <td className="py-2 pr-3 text-right text-xs text-black-45">{fmtMetric(k.resolucionPromedio)}</td>
              <td className="py-2 pr-3 text-right text-xs text-black-45">{fmtNum(k.resolucionN)}</td>
              <td className="py-2 text-right text-xs text-black-45">{fmtPct1(k.resolucionCobertura)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-[11px] text-black-25">
        Primera respuesta sin dato: {fmtNum(k.primeraSinDato)} tickets. Resolución sin tiempo
        válido: {fmtNum(k.resolucionExcluidas)} tickets con resolución 0 y primera respuesta
        nula; se excluyen de mediana, p90, promedio y cobertura.
      </p>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════ */
/*  PAGE                                                           */
/* ════════════════════════════════════════════════════════════════ */
export default function Zendesk() {
  const { filters } = useFilters();
  const params = useMemo(() => filtersToParams(filters), [filters]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["zendesk", params],
    queryFn: () => fetchZendesk(params),
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex h-full items-center justify-center"
      >
        <p className="text-sm text-black-25">
          No se pudieron cargar los datos. Revisa que el backend esté encendido y conectado.
        </p>
      </motion.div>
    );
  }

  const k = data.kpis;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-text">Zendesk — impacto operativo</h1>
          <p className="mt-1 text-sm text-muted">
            Tickets creados en Zendesk/Correo, con fecha real de creación (UTC → America/Lima).
          </p>
        </div>
        <div className="text-right text-xs text-muted">
          <span className="rounded-full border border-border bg-surface px-3 py-1">
            {fmtNum(k.totalTickets)} tickets recibidos
          </span>
          <p className="mt-1">
            {fmtNum(k.cerrados)} cerrados · {fmtNum(k.resueltos)} resueltos
          </p>
          {k.variacionPct !== null && (
            <p className={cn("mt-0.5 font-medium", colorVariacion(k.variacionPct))}>
              {k.variacionPct > 0 ? "+" : ""}
              {fmtPct1(k.variacionPct)} vs. periodo anterior
            </p>
          )}
        </div>
      </div>

      <Kpis k={k} />
      <Estados items={data.estados} total={k.totalTickets} />
      <Evolucion data={data.evolucion} />

      <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
        <Backlog b={data.backlog} />
        <Capacidad k={k} />
      </div>

      {data.insights.length > 0 && (
        <Section
          title="Hallazgos operativos"
          subtitle="Métricas validadas, con periodo, n y cobertura."
        >
          <ul className="space-y-2">
            {data.insights.map((s, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2.5 rounded-xl bg-black-5 p-3 text-sm text-black-85"
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                  {idx + 1}
                </span>
                {s}
              </li>
            ))}
          </ul>
        </Section>
      )}

      <div className="rounded-xl border border-border bg-bg px-4 py-3 text-[11px] text-muted">
        Universo: tickets creados en el periodo, independientemente de su estado actual, con
        fecha real de creación. Estados mutuamente excluyentes. La primera respuesta usa solo
        tickets con dato; la resolución excluye los tickets con resolución 0 y primera respuesta
        nula. SLA aplicado: primera respuesta ≤1,440 min. No se usa FCR ni SLA de resolución.
        Backlog al corte con la fecha indicada; no se inventan tendencias históricas.
      </div>
    </motion.div>
  );
}
