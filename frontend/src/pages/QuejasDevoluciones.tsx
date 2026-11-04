import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  MessageCircle,
  Ticket,
  Timer,
} from "lucide-react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import { api } from "@/lib/api";
import { useFilters } from "@/contexts/FilterContext";
import { filtersToParams } from "@/lib/filters";
import { getAdvisorColor } from "@/lib/advisorColors";
import { cn } from "@/lib/utils";
import { fmtNum, KpiCard, Section } from "@/components/dashboard/shared";

interface QdKpis {
  totalCasos: number;
  quejas: number;
  devoluciones: number;
  pctQuejas: number;
  totalAnterior: number | null;
  variacionAbs: number | null;
  variacionPct: number | null;
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
}

interface QdEstado {
  estado: string;
  etiqueta: string;
  total: number;
  pct: number;
}

interface QdTipo {
  tipo: "queja" | "devolucion";
  etiqueta: string;
  total: number;
  pct: number;
}

interface QdCanal {
  canal: string;
  quejas: number;
  devoluciones: number;
  total: number;
  pct: number;
}

interface QdTiempoTipo {
  tipo: "queja" | "devolucion";
  etiqueta: string;
  total: number;
  primeraN: number;
  primeraMediana: number | null;
  primeraP90: number | null;
  primeraPromedio: number | null;
  resolucionN: number;
  resolucionMediana: number | null;
  resolucionP90: number | null;
  resolucionPromedio: number | null;
}

interface QdAsesor {
  asesor: string;
  quejas: number;
  devoluciones: number;
  total: number;
  pct: number;
}

interface QdEvolucion {
  actual: { periodo: string; quejas: number; devoluciones: number; total: number }[];
  anterior: { periodo: string; quejas: number; devoluciones: number; total: number }[];
  totalActual: number;
  totalAnterior: number | null;
  variacionAbs: number | null;
  variacionPct: number | null;
}

interface ResQd {
  kpis: QdKpis;
  estados: QdEstado[];
  tipos: QdTipo[];
  canales: QdCanal[];
  tiemposPorTipo: QdTiempoTipo[];
  asesores: QdAsesor[];
  evolucion: QdEvolucion;
  insights: string[];
}

type Granularidad = "diaria" | "semanal" | "mensual";

async function fetchQd(params: Record<string, string>): Promise<ResQd> {
  const { data } = await api.get("/dashboard/quejas-devoluciones", { params });
  return data.data as ResQd;
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

const colorVariacion = (v: number | null) =>
  v == null || v === 0 ? "text-black-45" : v > 0 ? "text-danger" : "text-success";

const MESES = ["", "Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

/* ── KPI ── */
function Kpis({ k }: { k: QdKpis }) {
  const variacion =
    k.variacionPct !== null && k.variacionAbs !== null
      ? `${k.variacionAbs > 0 ? "+" : ""}${fmtNum(k.variacionAbs)} (${k.variacionPct > 0 ? "+" : ""}${fmtPct1(k.variacionPct)}) vs. periodo anterior`
      : "Sin periodo anterior comparable";

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        icon={<Ticket size={18} />}
        label="Casos Q/D"
        value={fmtNum(k.totalCasos)}
        hint={variacion}
      />
      <KpiCard
        icon={<AlertTriangle size={18} />}
        label="Quejas"
        value={fmtNum(k.quejas)}
        hint={`${fmtPct1(k.pctQuejas)} del total`}
      />
      <KpiCard
        icon={<MessageCircle size={18} />}
        label="Devoluciones"
        value={fmtNum(k.devoluciones)}
        hint={`${fmtPct1(k.totalCasos > 0 ? 100 - k.pctQuejas : null)} del total`}
      />
      <KpiCard
        icon={<CheckCircle2 size={18} />}
        label="% Quejas"
        value={fmtPct1(k.pctQuejas)}
        hint={`${fmtNum(k.quejas)} quejas de ${fmtNum(k.totalCasos)} casos`}
      />
    </div>
  );
}

/* ── Estados ── */
function colorEstado(estado: string): string {
  if (estado === "cerrado") return "#10B981";
  if (estado === "resuelto") return "#34D399";
  if (estado === "abierto") return "#F59E0B";
  if (estado === "pendiente") return "#EF4444";
  if (estado === "en_espera") return "#8B5CF6";
  if (estado === "sin_mapear") return "#64748B";
  return "#94A3B8";
}

function Estados({ items, total }: { items: QdEstado[]; total: number }) {
  const visibles = items.filter((e) => e.total > 0);
  return (
    <div className="rounded-xl border border-black-10 bg-white p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-medium text-black-85">Estado de los casos</h3>
        <span className="text-xs text-black-25">
          Total {fmtNum(total)} · cada caso pertenece a un solo grupo
        </span>
      </div>

      <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-[#F1F5F9]">
        {visibles.map((e) => (
          <div
            key={e.estado}
            style={{ width: `${e.pct}%`, backgroundColor: colorEstado(e.estado) }}
            title={`${e.etiqueta}: ${fmtNum(e.total)} (${fmtPct1(e.pct)})`}
          />
        ))}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-7">
        {items.map((e) => (
          <div key={e.estado} className="rounded-lg bg-[#F8F9FA] px-3 py-2">
            <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-black-45">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: colorEstado(e.estado) }}
              />
              {e.etiqueta}
            </p>
            <p className="mt-1 text-lg font-semibold text-black-85">{fmtNum(e.total)}</p>
            <p className="text-[10px] text-black-25">{fmtPct1(e.pct)}</p>
          </div>
        ))}
      </div>

      <p className="mt-3 text-[11px] text-black-25">
        Cerrado y resuelto se mantienen como estados distintos. “Sin mapear” agrupa los
        registros sin estado homologado, incluidos los SI/NO de Whaticket.
      </p>
    </div>
  );
}

/* ── Evolución ── */
function agrupar(
  items: { periodo: string; quejas: number; devoluciones: number; total: number }[],
  g: Granularidad,
): { periodo: string; quejas: number; devoluciones: number; total: number }[] {
  if (g === "diaria") return items;
  const mapa = new Map<string, { quejas: number; devoluciones: number; total: number }>();
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
    const acc = mapa.get(clave) ?? { quejas: 0, devoluciones: 0, total: 0 };
    acc.quejas += r.quejas;
    acc.devoluciones += r.devoluciones;
    acc.total += r.total;
    mapa.set(clave, acc);
  }
  return [...mapa.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([periodo, v]) => ({ periodo, ...v }));
}

function labelPeriodo(p: string, g: Granularidad): string {
  if (g === "mensual") {
    const [y, m] = p.split("-");
    return `${MESES[Number(m)] ?? m} ${y.slice(2)}`;
  }
  return p;
}

function Evolucion({ data }: { data: QdEvolucion }) {
  const dias = data.actual.length;
  const defaultG: Granularidad = dias > 120 ? "mensual" : dias > 31 ? "semanal" : "diaria";
  const [granularidad, setGranularidad] = useState<Granularidad>(defaultG);

  useEffect(() => setGranularidad(defaultG), [defaultG]);

  const actual = useMemo(() => agrupar(data.actual, granularidad), [data.actual, granularidad]);
  const anterior = useMemo(() => agrupar(data.anterior, granularidad), [data.anterior, granularidad]);

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
            `Total: <b>${fmtNum(a.total)}</b>`,
            `Quejas: ${fmtNum(a.quejas)} · Devoluciones: ${fmtNum(a.devoluciones)}`,
            p ? `Periodo anterior: ${fmtNum(p.total)}` : "",
          ]
            .filter(Boolean)
            .join("<br/>");
        },
      },
      legend: { bottom: 0, textStyle: { fontSize: 11 } },
      grid: { left: 48, right: 18, top: 18, bottom: conZoom ? 78 : 50 },
      dataZoom: conZoom ? [{ type: "inside" }, { type: "slider", height: 14, bottom: 26 }] : [],
      xAxis: {
        type: "category",
        data: labels.map((p) => labelPeriodo(p, granularidad)),
        axisLabel: { fontSize: 10, rotate: labels.length > 14 ? 38 : 0 },
        axisLine: { show: false },
      },
      yAxis: {
        type: "value",
        name: "Casos",
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
  }, [actual, anterior, granularidad]);

  const variacion = data.variacionPct;

  return (
    <Section
      title="Evolución de casos Q/D"
      subtitle="Casos creados en el periodo, con fecha real de creación. Comparación contra el periodo anterior equivalente."
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-black-25">
          Actual: <b className="text-black-85">{fmtNum(data.totalActual)}</b>
          {data.totalAnterior !== null && (
            <>
              {" "}· Anterior: <b className="text-black-85">{fmtNum(data.totalAnterior)}</b>
            </>
          )}
          {variacion !== null && data.variacionAbs !== null && (
            <>
              {" "}
              <span className={cn("font-medium", colorVariacion(variacion))}>
                {data.variacionAbs > 0 ? "+" : ""}
                {fmtNum(data.variacionAbs)} ({variacion > 0 ? "+" : ""}
                {fmtPct1(variacion)})
              </span>
            </>
          )}
        </div>
        <div className="flex gap-1 rounded-lg border border-black-10 bg-[#F8F9FA] p-1">
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

/* ── Canal ── */
function Canales({ items, total }: { items: QdCanal[]; total: number }) {
  return (
    <Section title="Canal de origen" subtitle="Distribución de los casos Q/D del periodo.">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="text-left text-[10px] font-semibold uppercase tracking-wider text-black-45">
              <th className="pb-2 pr-3">Canal</th>
              <th className="pb-2 pr-3 text-right">Quejas</th>
              <th className="pb-2 pr-3 text-right">Devoluciones</th>
              <th className="pb-2 pr-3 text-right">Total</th>
              <th className="pb-2 text-right">% del total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr key={r.canal} className="border-t border-black-5">
                <td className="py-2 pr-3 text-xs font-medium text-black-85">{r.canal}</td>
                <td className="py-2 pr-3 text-right text-xs text-black-85">{fmtNum(r.quejas)}</td>
                <td className="py-2 pr-3 text-right text-xs text-black-85">{fmtNum(r.devoluciones)}</td>
                <td className="py-2 pr-3 text-right text-xs font-medium text-black-85">{fmtNum(r.total)}</td>
                <td className="py-2 text-right text-xs text-black-45">{fmtPct1(r.pct)}</td>
              </tr>
            ))}
            <tr className="border-t border-black-10">
              <td className="py-2 pr-3 text-xs font-semibold text-black-85">Total</td>
              <td className="py-2 pr-3 text-right text-xs font-semibold text-black-85">
                {fmtNum(items.reduce((s, r) => s + r.quejas, 0))}
              </td>
              <td className="py-2 pr-3 text-right text-xs font-semibold text-black-85">
                {fmtNum(items.reduce((s, r) => s + r.devoluciones, 0))}
              </td>
              <td className="py-2 pr-3 text-right text-xs font-semibold text-black-85">{fmtNum(total)}</td>
              <td className="py-2 text-right text-xs font-semibold text-black-85">100%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </Section>
  );
}

/* ── Tiempos ── */
function TablaTiempo({
  items,
  metrica,
}: {
  items: QdTiempoTipo[];
  metrica: "primera" | "resolucion";
}) {
  const esPrimera = metrica === "primera";
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-sm">
        <thead>
          <tr className="text-left text-[10px] font-semibold uppercase tracking-wider text-black-45">
            <th className="pb-2 pr-3">Tipo</th>
            <th className="pb-2 pr-3 text-right">Mediana</th>
            <th className="pb-2 pr-3 text-right">P90</th>
            <th className="pb-2 pr-3 text-right">Promedio</th>
            <th className="pb-2 pr-3 text-right">n</th>
            <th className="pb-2 text-right">Cobertura</th>
          </tr>
        </thead>
        <tbody>
          {items.map((r) => {
            const n = esPrimera ? r.primeraN : r.resolucionN;
            const med = esPrimera ? r.primeraMediana : r.resolucionMediana;
            const p90 = esPrimera ? r.primeraP90 : r.resolucionP90;
            const prom = esPrimera ? r.primeraPromedio : r.resolucionPromedio;
            const cobertura = r.total > 0 ? (n / r.total) * 100 : null;
            return (
              <tr key={r.tipo} className="border-t border-black-5">
                <td className="py-2 pr-3 text-xs font-medium text-black-85">{r.etiqueta}</td>
                <td className="py-2 pr-3 text-right text-xs text-black-85">{fmtMetric(med)}</td>
                <td className="py-2 pr-3 text-right text-xs text-black-85">{fmtMetric(p90)}</td>
                <td className="py-2 pr-3 text-right text-xs text-black-45">{fmtMetric(prom)}</td>
                <td className="py-2 pr-3 text-right text-xs text-black-45">{fmtNum(n)}</td>
                <td className="py-2 text-right text-xs text-black-45">{fmtPct1(cobertura)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Tiempos({ k, items }: { k: QdKpis; items: QdTiempoTipo[] }) {
  const plural = (n: number) => (n === 1 ? "caso" : "casos");
  return (
    <Section
      title="Tiempos de atención"
      subtitle="Mediana y p90 como lectura principal; promedio como dato secundario. n y cobertura sobre los casos de cada tipo."
    >
      <div className="grid gap-6 xl:grid-cols-2">
        <div>
          <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-black-45">
            <Clock size={13} /> Primera respuesta
          </h4>
          <TablaTiempo items={items} metrica="primera" />
        </div>
        <div>
          <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-black-45">
            <Timer size={13} /> Resolución
          </h4>
          <TablaTiempo items={items} metrica="resolucion" />
        </div>
      </div>
      <p className="mt-4 text-[11px] text-black-25">
        Primera respuesta sin dato: {fmtNum(k.primeraSinDato)} {plural(k.primeraSinDato)}.
        Resolución sin tiempo válido: {fmtNum(k.resolucionExcluidas)}{" "}
        {plural(k.resolucionExcluidas)} con resolución 0 y primera respuesta nula; se excluyen
        de mediana, p90, promedio y cobertura.
      </p>
    </Section>
  );
}

/* ── Asesores ── */
function Asesores({ items, total }: { items: QdAsesor[]; total: number }) {
  const sinAlex = !items.some((r) => r.asesor.toLowerCase().includes("alex"));
  return (
    <Section
      title="Distribución por asesor"
      subtitle="Casos Q/D asignados en el periodo. Solo se listan asesores con al menos un caso."
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="text-left text-[10px] font-semibold uppercase tracking-wider text-black-45">
              <th className="pb-2 pr-3">Asesor</th>
              <th className="pb-2 pr-3 text-right">Quejas</th>
              <th className="pb-2 pr-3 text-right">Devoluciones</th>
              <th className="pb-2 pr-3 text-right">Total</th>
              <th className="pb-2 text-right">% del total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr key={r.asesor} className="border-t border-black-5">
                <td className="py-2 pr-3 text-xs text-black-85">
                  <span className="inline-flex items-center">
                    <span
                      className="mr-1.5 inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: getAdvisorColor(r.asesor) }}
                    />
                    {r.asesor}
                  </span>
                </td>
                <td className="py-2 pr-3 text-right text-xs text-black-85">{fmtNum(r.quejas)}</td>
                <td className="py-2 pr-3 text-right text-xs text-black-85">{fmtNum(r.devoluciones)}</td>
                <td className="py-2 pr-3 text-right text-xs font-medium text-black-85">{fmtNum(r.total)}</td>
                <td className="py-2 text-right text-xs text-black-45">{fmtPct1(r.pct)}</td>
              </tr>
            ))}
            <tr className="border-t border-black-10">
              <td className="py-2 pr-3 text-xs font-semibold text-black-85">Total</td>
              <td className="py-2 pr-3 text-right text-xs font-semibold text-black-85">
                {fmtNum(items.reduce((s, r) => s + r.quejas, 0))}
              </td>
              <td className="py-2 pr-3 text-right text-xs font-semibold text-black-85">
                {fmtNum(items.reduce((s, r) => s + r.devoluciones, 0))}
              </td>
              <td className="py-2 pr-3 text-right text-xs font-semibold text-black-85">{fmtNum(total)}</td>
              <td className="py-2 text-right text-xs font-semibold text-black-85">100%</td>
            </tr>
          </tbody>
        </table>
      </div>
      {sinAlex && (
        <p className="mt-3 text-[11px] text-black-25">
          Alex López no registra casos Q/D en el periodo; no se muestra una fila en cero.
          Sus atenciones sí están incluidas en los demás reportes.
        </p>
      )}
    </Section>
  );
}

/* ── Page ── */
export default function QuejasDevoluciones() {
  const { filters } = useFilters();
  const params = useMemo(() => filtersToParams(filters), [filters]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["quejas-devoluciones", params],
    queryFn: () => fetchQd(params),
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
        className="flex h-full flex-col items-center justify-center gap-3"
      >
        <AlertTriangle size={26} className="text-danger" />
        <p className="text-sm text-black-45">
          No se pudieron cargar los datos de Quejas y Devoluciones.
        </p>
        <button
          onClick={() => refetch()}
          className="rounded-lg border border-black-10 px-3 py-1.5 text-xs text-black-65 hover:bg-light"
        >
          Reintentar
        </button>
      </motion.div>
    );
  }

  const k = data.kpis;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-text">Quejas y Devoluciones — impacto operativo</h1>
          <p className="mt-1 text-sm text-muted">
            Casos clasificados como queja o solicitud de devolución, con fecha real de creación
            (UTC → America/Lima para Zendesk).
          </p>
        </div>
        <div className="text-right text-xs text-muted">
          <span className="rounded-full border border-border bg-surface px-3 py-1">
            {fmtNum(k.totalCasos)} casos Q/D
          </span>
          <p className="mt-1">
            {fmtNum(k.quejas)} quejas · {fmtNum(k.devoluciones)} devoluciones
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
      <Estados items={data.estados} total={k.totalCasos} />
      <Evolucion data={data.evolucion} />

      <div className="grid gap-5 lg:grid-cols-[1fr_1.35fr]">
        <Canales items={data.canales} total={k.totalCasos} />
        <Section
          title="Composición del periodo"
          subtitle="Quejas y devoluciones sobre el total de casos Q/D."
        >
          <div className="space-y-3">
            {data.tipos.map((t) => (
              <div key={t.tipo}>
                <div className="flex items-baseline justify-between text-xs">
                  <span className="font-medium text-black-85">{t.etiqueta}</span>
                  <span className="text-black-45">
                    {fmtNum(t.total)} · {fmtPct1(t.pct)}
                  </span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-[#F1F5F9]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${t.pct}%`,
                      backgroundColor: t.tipo === "queja" ? "#EA7A7A" : "#7BA3C7",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-[#F8F9FA] px-3 py-2">
              <p className="text-[10px] uppercase tracking-wide text-black-45">Primera respuesta</p>
              <p className="mt-1 text-lg font-semibold text-black-85">{fmtMetric(k.primeraMediana)}</p>
              <p className="text-[10px] text-black-25">
                p90 {fmtMetric(k.primeraP90)} · {fmtPct1(k.primeraCobertura)} con dato
              </p>
            </div>
            <div className="rounded-lg bg-[#F8F9FA] px-3 py-2">
              <p className="text-[10px] uppercase tracking-wide text-black-45">Resolución</p>
              <p className="mt-1 text-lg font-semibold text-black-85">{fmtMetric(k.resolucionMediana)}</p>
              <p className="text-[10px] text-black-25">
                p90 {fmtMetric(k.resolucionP90)} · {fmtPct1(k.resolucionCobertura)} válida
              </p>
            </div>
          </div>
        </Section>
      </div>

      <Tiempos k={k} items={data.tiemposPorTipo} />
      <Asesores items={data.asesores} total={k.totalCasos} />

      {data.insights.length > 0 && (
        <Section
          title="Hallazgos operativos"
          subtitle="Métricas validadas, con periodo, n y cobertura."
        >
          <ul className="space-y-2">
            {data.insights.map((s, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2.5 rounded-xl bg-[#F8F9FA] p-3 text-sm text-black-85"
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
        Universo: tickets de `v_unificado_norm` con categoría GESTION y subcategoría
        normalizada queja o solicitud de devolución, independientemente de su estado actual.
        Fecha real de creación; para Zendesk se convierte de UTC a America/Lima. Los estados son
        mutuamente excluyentes. La primera respuesta usa solo casos con dato; la resolución
        excluye los casos con resolución 0 y primera respuesta nula. No se usa SLA ni se
        incorporan montos o resultados del módulo operativo de casos.
      </div>
    </motion.div>
  );
}
