import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Clock,
  MessageCircle,
  Timer,
} from "lucide-react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import { api } from "@/lib/api";
import { CHART } from "@/lib/chartPalette";
import { useFilters } from "@/contexts/FilterContext";
import { filtersToParams } from "@/lib/filters";
import { fmtNum, KpiCard, Section } from "@/components/dashboard/shared";
import { cn } from "@/lib/utils";

/* ─── Tipos ─── */
interface WhatsAppKpis {
  totalConversaciones: number;
  totalWhaticket: number;
  totalWameta: number;
  pctWhaticket: number;
  pctWameta: number;
  primeraN: number;
  primeraCobertura: number;
  primeraPromedio: number | null;
  primeraMediana: number | null;
  primeraP90: number | null;
  resolucionN: number;
  resolucionCobertura: number;
  resolucionPromedio: number | null;
  resolucionMediana: number | null;
  resolucionP90: number | null;
  slaPrimeraCumple: number;
  slaPrimeraEvaluables: number;
  slaPrimeraPct: number | null;
  slaPrimeraUmbral: number;
  cerradas: number;
  abiertas: number;
  sinEstado: number;
  otros: number;
  totalAnterior: number | null;
  variacionAbs: number | null;
  variacionPct: number | null;
}

interface WhatsAppPlataforma {
  subcanal: string;
  nombre: string;
  total: number;
  porcentaje: number;
  primeraN: number;
  primeraCobertura: number;
  primeraPromedio: number | null;
  primeraMediana: number | null;
  primeraP90: number | null;
  resolucionN: number;
  resolucionCobertura: number;
  resolucionPromedio: number | null;
  resolucionMediana: number | null;
  resolucionP90: number | null;
  slaCumple: number;
  slaEvaluables: number;
  slaPct: number | null;
  cerradas: number;
  abiertas: number;
  sinEstado: number;
  otros: number;
}

interface WhatsAppEstado {
  estado: string;
  etiqueta: string;
  total: number;
  pct: number;
}

interface WhatsAppExcepcion {
  contacto: string;
  asesor: string;
  plataforma: string;
  tiempo: number;
  tipoTiempo: "resolucion" | "transcurrido";
  fecha: string;
  estado: string;
  umbral: number;
}

interface ResWhatsApp {
  kpis: WhatsAppKpis;
  estados: WhatsAppEstado[];
  plataformas: WhatsAppPlataforma[];
  evolucion: {
    actual: { periodo: string; total: number }[];
    anterior: { periodo: string; total: number }[];
    totalActual: number;
    totalAnterior: number | null;
    variacionAbs: number | null;
    variacionPct: number | null;
  };
  horas: { hora: number; total: number }[];
  dias: { dia: number; total: number }[];
  excepciones: WhatsAppExcepcion[];
  insights: string[];
}

type Granularidad = "diaria" | "semanal" | "mensual";

async function fetchData(params: Record<string, string>): Promise<ResWhatsApp> {
  const { data } = await api.get("/dashboard/whatsapp", { params });
  return data.data as ResWhatsApp;
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

const DIAS_ORDEN = [1, 2, 3, 4, 5, 6, 0];
const DIAS_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MESES = ["", "Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const colorVariacion = (v: number | null) =>
  v == null || v === 0 ? "text-black-45" : v > 0 ? "text-danger" : "text-success";

/* ════════════════════════════════════════════════════════════════ */
/*  KPI + estados                                                  */
/* ════════════════════════════════════════════════════════════════ */
function Kpis({ k }: { k: WhatsAppKpis }) {
  const primeraHint =
    k.primeraN > 0
      ? `p90 ${fmtMetric(k.primeraP90)} · ${fmtNum(k.primeraN)} de ${fmtNum(
          k.totalConversaciones,
        )} (${fmtPct1(k.primeraCobertura)})`
      : "Sin datos suficientes";
  const resolucionHint =
    k.resolucionN > 0
      ? `p90 ${fmtMetric(k.resolucionP90)} · ${fmtNum(k.resolucionN)} de ${fmtNum(
          k.totalConversaciones,
        )} (${fmtPct1(k.resolucionCobertura)})`
      : "Sin datos suficientes";
  const slaHint =
    k.slaPrimeraPct !== null
      ? `${fmtNum(k.slaPrimeraCumple)} de ${fmtNum(
          k.slaPrimeraEvaluables,
        )} evaluables · umbral ${k.slaPrimeraUmbral} min`
      : "Sin datos suficientes";

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        icon={<MessageCircle size={18} />}
        label="Total conversaciones"
        value={fmtNum(k.totalConversaciones)}
        hint={`${fmtNum(k.totalWameta)} Wameta · ${fmtNum(k.totalWhaticket)} Whaticket`}
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

function Estados({ items, total }: { items: WhatsAppEstado[]; total: number }) {
  const sinEstado = items.find((e) => e.estado === "sin_mapear");
  return (
    <div className="rounded-xl border border-black-10 bg-white p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-medium text-black-85">Estado de las conversaciones</h3>
        <span className="text-xs text-black-25">
          Total {fmtNum(total)} · los grupos suman el total
        </span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
        {items.map((e) => (
          <div key={e.estado} className="rounded-lg bg-black-5 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wide text-black-45">{e.etiqueta}</p>
            <p className="mt-1 text-lg font-semibold text-black-85">{fmtNum(e.total)}</p>
            <p className="text-[10px] text-black-25">{fmtPct1(e.pct)}</p>
          </div>
        ))}
      </div>
      {sinEstado && sinEstado.total > 0 ? (
        <p className="mt-3 text-[11px] text-black-25">
          “Sin estado homologado” corresponde a conversaciones de Whaticket con estado{" "}
          <b>SI</b>/<b>NO</b>. No se reinterpretan como cerradas ni abiertas.
        </p>
      ) : null}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════ */
/*  Evolución consolidada                                          */
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

function Evolucion({ data }: { data: ResWhatsApp["evolucion"] }) {
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
        name: "Conversaciones",
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
      title="Evolución de la demanda de WhatsApp"
      subtitle="Wameta + Whaticket consolidados · comparación contra el periodo anterior equivalente."
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
/*  Demanda por hora y por día                                     */
/* ════════════════════════════════════════════════════════════════ */
function ChartBase({
  title,
  subtitle,
  labels,
  values,
  total,
  peakLabel,
}: {
  title: string;
  subtitle: string;
  labels: string[];
  values: number[];
  total: number;
  peakLabel: string;
}) {
  const max = Math.max(...values, 1);
  const peakIndex = values.indexOf(max);
  const option: EChartsOption = {
    tooltip: {
      trigger: "axis",
      formatter: (params: any) => {
        const i = params?.[0]?.dataIndex ?? 0;
        const v = values[i] ?? 0;
        return `<b>${labels[i]}</b><br/>Conversaciones: <b>${fmtNum(v)}</b> (${fmtPct1(
          total > 0 ? (v / total) * 100 : 0,
        )})`;
      },
    },
    grid: { left: 42, right: 16, top: 18, bottom: 42 },
    xAxis: {
      type: "category",
      data: labels,
      axisLabel: { fontSize: 9, interval: labels.length > 12 ? 1 : 0 },
      axisLine: { show: false },
    },
    yAxis: {
      type: "value",
      axisLabel: { fontSize: 9 },
      splitLine: { lineStyle: { type: "dashed" } },
    },
    series: [
      {
        type: "bar",
        barMaxWidth: 22,
        data: values.map((v, i) => ({
          value: v,
          itemStyle: { color: i === peakIndex ? CHART.brand : CHART.soft, borderRadius: [3, 3, 0, 0] },
        })),
      },
    ],
  };

  return (
    <Section title={title} subtitle={subtitle}>
      <ReactECharts option={option} style={{ height: 280 }} notMerge lazyUpdate />
      <p className="mt-2 text-[11px] text-black-25">
        {peakLabel} · Total del periodo: {fmtNum(total)}
      </p>
    </Section>
  );
}

function HorasDias({ horas, dias, total }: { horas: ResWhatsApp["horas"]; dias: ResWhatsApp["dias"]; total: number }) {
  const horasLabels = horas.map((h) => `${String(h.hora).padStart(2, "0")}:00`);
  const horasValues = horas.map((h) => h.total);
  const peakHora = horas.reduce((a, b) => (b.total > a.total ? b : a), horas[0]);

  const diasValues = DIAS_ORDEN.map(
    (dow) => dias.find((d) => d.dia === dow)?.total ?? 0,
  );
  const peakDiaIdx = diasValues.indexOf(Math.max(...diasValues, 1));
  const peakDiaTotal = diasValues[peakDiaIdx] ?? 0;

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <ChartBase
        title="Demanda por hora"
        subtitle="Conversaciones consolidadas según la hora de creación."
        labels={horasLabels}
        values={horasValues}
        total={total}
        peakLabel={`Hora pico: ${String(peakHora?.hora ?? 0).padStart(2, "0")}:00 · ${fmtNum(
          peakHora?.total ?? 0,
        )} conversaciones`}
      />
      <ChartBase
        title="Demanda por día de la semana"
        subtitle="Conversaciones consolidadas según el día de creación."
        labels={DIAS_LABELS}
        values={diasValues}
        total={total}
        peakLabel={`Día pico: ${DIAS_LABELS[peakDiaIdx] ?? "—"} · ${fmtNum(peakDiaTotal)} conversaciones`}
      />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════ */
/*  Tabla de plataformas                                           */
/* ════════════════════════════════════════════════════════════════ */
function PlataformasTable({ items }: { items: WhatsAppPlataforma[] }) {
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-sm">
          <thead>
            <tr className="text-left text-[10px] font-semibold uppercase tracking-wider text-black-45">
              <th className="pb-2 pr-3">Plataforma</th>
              <th className="pb-2 pr-3 text-right">Volumen</th>
              <th className="pb-2 pr-3 text-right">Participación</th>
              <th className="pb-2 pr-3 text-right">1ª respuesta<br />mediana / p90</th>
              <th className="pb-2 pr-3 text-right">n / cobertura<br />1ª respuesta</th>
              <th className="pb-2 pr-3 text-right">Resolución<br />mediana / p90</th>
              <th className="pb-2 pr-3 text-right">n / cobertura<br />resolución</th>
              <th className="pb-2 pr-3 text-right">SLA ≤15 min</th>
              <th className="pb-2 text-right">Cerradas / Abiertas / Sin estado</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.subcanal} className="border-t border-black-5 align-top">
                <td className="py-2.5 pr-3 text-xs font-medium text-black-85">{p.nombre}</td>
                <td className="py-2.5 pr-3 text-right text-xs text-black-85">{fmtNum(p.total)}</td>
                <td className="py-2.5 pr-3 text-right text-xs text-black-45">{fmtPct1(p.porcentaje)}</td>
                <td className="py-2.5 pr-3 text-right text-xs text-black-85">
                  {fmtMetric(p.primeraMediana)} / {fmtMetric(p.primeraP90)}
                </td>
                <td className="py-2.5 pr-3 text-right text-xs text-black-45">
                  {fmtNum(p.primeraN)} · {fmtPct1(p.primeraCobertura)}
                </td>
                <td className="py-2.5 pr-3 text-right text-xs text-black-85">
                  {fmtMetric(p.resolucionMediana)} / {fmtMetric(p.resolucionP90)}
                </td>
                <td className="py-2.5 pr-3 text-right text-xs text-black-45">
                  {fmtNum(p.resolucionN)} · {fmtPct1(p.resolucionCobertura)}
                </td>
                <td className="py-2.5 pr-3 text-right text-xs text-black-85">
                  {fmtPct1(p.slaPct)}
                  <span className="ml-1 text-[10px] text-black-25">
                    ({fmtNum(p.slaCumple)}/{fmtNum(p.slaEvaluables)})
                  </span>
                </td>
                <td className="py-2.5 text-right text-xs text-black-45">
                  {fmtNum(p.cerradas)} / {fmtNum(p.abiertas)} / {fmtNum(p.sinEstado)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[11px] text-black-25">
        La mediana y el p90 consolidados se calculan sobre todos los registros válidos de
        Wameta + Whaticket; no son un promedio ponderado de las medianas por plataforma. La
        cobertura usa el total de conversaciones de cada plataforma, incluyendo las que no
        tienen dato válido. Sin FCR.
      </p>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════ */
/*  Excepciones operativas                                         */
/* ════════════════════════════════════════════════════════════════ */
function ExcepcionesTable({ items }: { items: WhatsAppExcepcion[] }) {
  const estadoClass = (estado: string) =>
    estado === "Abierta"
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : estado === "Sin estado"
        ? "border-slate-200 bg-slate-50 text-slate-600"
        : "border-emerald-200 bg-emerald-50 text-emerald-700";

  return (
    <div>
      <div className="max-h-[360px] overflow-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="sticky top-0 z-10 bg-white">
            <tr className="text-left text-[10px] font-semibold uppercase tracking-wider text-black-45">
              <th className="pb-2 pr-3">Contacto</th>
              <th className="pb-2 pr-3">Asesor</th>
              <th className="pb-2 pr-3">Plataforma</th>
              <th className="pb-2 pr-3 text-right">Tiempo</th>
              <th className="pb-2 pr-3">Fecha</th>
              <th className="pb-2 text-right">Estado</th>
            </tr>
          </thead>
          <tbody>
            {items.map((r, i) => (
              <tr key={`${r.plataforma}-${r.fecha}-${r.contacto}-${i}`} className="border-t border-black-5">
                <td className="max-w-[220px] truncate py-2 pr-3 text-xs text-black-85">{r.contacto}</td>
                <td className="py-2 pr-3 text-xs text-black-45">{r.asesor}</td>
                <td className="py-2 pr-3 text-xs text-black-45">{r.plataforma}</td>
                <td className="py-2 pr-3 text-right text-xs text-black-85">
                  {fmtMetric(r.tiempo)}{" "}
                  <span className="text-[10px] text-black-25">
                    {r.tipoTiempo === "transcurrido" ? "transcurrido" : "resolución"}
                  </span>
                </td>
                <td className="py-2 pr-3 text-xs text-black-45">{r.fecha}</td>
                <td className="py-2 text-right">
                  <span
                    className={cn(
                      "inline-flex rounded-md border px-1.5 py-0.5 text-[10px] font-medium",
                      estadoClass(r.estado),
                    )}
                  >
                    {r.estado}
                  </span>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-sm text-black-25">
                  Sin excepciones con los umbrales actuales.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[11px] text-black-25">
        Criterio de revisión operativa: abiertas con más de 24 h y cerradas o sin estado con
        más de 8 h de resolución. No es un incumplimiento SLA.
      </p>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════ */
/*  PAGE                                                           */
/* ════════════════════════════════════════════════════════════════ */
export default function WhatsApp() {
  const { filters } = useFilters();
  const params = useMemo(() => filtersToParams(filters), [filters]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["whatsapp", params],
    queryFn: () => fetchData(params),
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex h-64 items-center justify-center"
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
          <h1 className="text-xl font-bold text-black-85">WhatsApp — impacto operativo</h1>
          <p className="mt-1 text-sm text-black-45">
            Demanda y capacidad del canal consolidado Wameta + Whaticket.
          </p>
        </div>
        <div className="text-right text-xs text-black-25">
          <span className="rounded-full border border-black-10 bg-white px-3 py-1">
            {fmtNum(k.totalConversaciones)} conversaciones
          </span>
          <p className="mt-1">
            {fmtPct1(k.pctWameta)} Wameta · {fmtPct1(k.pctWhaticket)} Whaticket
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
      <Estados items={data.estados} total={k.totalConversaciones} />
      <Evolucion data={data.evolucion} />
      <HorasDias horas={data.horas} dias={data.dias} total={k.totalConversaciones} />

      <Section
        title="Oportunidad y capacidad por plataforma"
        subtitle="Detalle secundario de Wameta y Whaticket. La lectura principal es consolidada."
      >
        <PlataformasTable items={data.plataformas} />
      </Section>

      <Section
        title="Excepciones operativas"
        subtitle="Conversaciones que requieren revisión por demora o estado anómalo."
      >
        <ExcepcionesTable items={data.excepciones} />
      </Section>

      {data.insights.length > 0 && (
        <Section
          title="Hallazgos operativos"
          subtitle="Métricas validadas, con periodo y denominador."
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
        Universo: todas las conversaciones de WhatsApp (Wameta + Whaticket), incluyendo
        abiertas, cerradas y sin estado homologado. Los tiempos faltantes (dato original nulo
        con minuto 0) se excluyen de medianas, p90 y SLA. SLA aplicado: primera respuesta ≤15
        min. No se usa FCR ni la meta provisional de resolución de 120 min. No se modifican
        otros reportes.
      </div>
    </motion.div>
  );
}
