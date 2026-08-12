import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import ReactECharts from "echarts-for-react";
import { api } from "@/lib/api";
import { useFilters } from "@/contexts/FilterContext";
import { filtersToParams } from "@/lib/filters";

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
interface HoraTotal {
  hora: number;
  total: number;
}
interface DiaTotal {
  dia: number;
  etiqueta: string;
  total: number;
}
interface FechaTotal {
  fecha: string;
  total: number;
}
interface Operacion {
  rango: { inicio: string; fin: string; comparadoCon: { inicio: string; fin: string } } | null;
  kpis: {
    horaPico: string | null;
    horaPicoValor: number | null;
    diaCargado: string | null;
    diaCargadoValor: number | null;
    promedioPorDia: Kpi;
    total: Kpi;
  };
  heatmap: HeatmapCelda[];
  curvaHora: HoraTotal[];
  cargaDiaSemana: DiaTotal[];
  tendenciaDiaria: FechaTotal[];
  topAsesores: Desglose[];
  topCategorias: Desglose[];
}

async function fetchOperacion(params: Record<string, string>): Promise<Operacion> {
  const { data } = await api.get("/dashboard/operacion", { params });
  return data.data as Operacion;
}

const DIAS_CORTOS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const HORAS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}:00`);

const fmtNum = (n: number | null) =>
  n === null || n === undefined ? "—" : n.toLocaleString("es-PE");
const fmtPct = (n: number | null) =>
  n === null || n === undefined ? "—" : `${n.toLocaleString("es-PE")}%`;

const COLORS = {
  primary: "#F97316",
  muted: "#64748B",
  border: "#E2E8F0",
};

function Delta({ kpi, invertir = false }: { kpi: Kpi; invertir?: boolean }) {
  if (kpi.direccion === null || kpi.deltaPct === null) return null;
  const bueno = invertir ? kpi.direccion === "down" : kpi.direccion === "up";
  const color =
    kpi.direccion === "flat" ? "text-muted" : bueno ? "text-success" : "text-danger";
  const Icon = kpi.direccion === "up" ? ArrowUp : kpi.direccion === "down" ? ArrowDown : Minus;
  return (
    <span className={`mt-2 flex items-center gap-1 text-xs ${color}`}>
      <Icon size={14} /> {Math.abs(kpi.deltaPct)}% vs. período anterior
    </span>
  );
}

function KpiCard({
  label,
  kpi,
  hint,
  invertir,
  formato = "numero",
}: {
  label: string;
  kpi: Kpi;
  hint?: string;
  invertir?: boolean;
  formato?: "numero" | "pct";
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-text">
        {formato === "pct" ? fmtPct(kpi.valor) : fmtNum(kpi.valor)}
      </p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
      <Delta kpi={kpi} invertir={invertir} />
    </div>
  );
}

function KpiSimpleCard({
  label,
  valor,
  hint,
}: {
  label: string;
  valor: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-text">{valor}</p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

function BreakdownCard({ title, items }: { title: string; items: Desglose[] }) {
  const max = Math.max(1, ...items.map((i) => i.total));
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <h3 className="text-sm font-medium text-text">{title}</h3>
      <ul className="mt-3 space-y-2">
        {items.length === 0 ? (
          <li className="text-sm text-muted">Sin datos en el rango actual.</li>
        ) : null}
        {items.map((i) => (
          <li key={i.etiqueta}>
            <div className="flex justify-between text-sm">
              <span className="capitalize text-muted">{i.etiqueta}</span>
              <span className="font-medium text-text">{i.total.toLocaleString("es-PE")}</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-bg">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${(i.total / max) * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Mapa de calor: hora del día vs día de la semana. */
function FunnelChart({ items }: { items: Desglose[] }) {
  const total = items.reduce((s, i) => s + i.total, 0);
  const data = items.map((i) => ({ name: i.etiqueta, value: i.total }));
  const maxVal = Math.max(1, ...items.map((i) => i.total));
  const option = {
    tooltip: {
      trigger: "item" as const,
      formatter: (p: { name: string; value: number; percent: number }) =>
        `${p.name}<br/>Atenciones: <b>${p.value.toLocaleString("es-PE")}</b> (${p.percent}%)`,
    },
    series: [
      {
        type: "funnel" as const,
        left: "10%",
        top: 20,
        bottom: 20,
        width: "80%",
        min: 0,
        max: maxVal,
        minSize: "10%",
        maxSize: "100%",
        sort: "descending" as const,
        gap: 2,
        label: {
          show: true,
          position: "inside" as const,
          color: "#fff",
          fontSize: 12,
          fontWeight: "bold" as const,
          formatter: (p: { name: string; percent: number }) => `${p.name} (${p.percent}%)`,
        },
        emphasis: { label: { fontSize: 14 } },
        data,
      },
    ],
  };
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <h3 className="text-sm font-medium text-text">Top categorías por volumen</h3>
      <p className="mt-1 text-xs text-muted">
        Concentración de atenciones por categoría. {total.toLocaleString("es-PE")} totales.
      </p>
      <ReactECharts option={option} style={{ height: 280 }} notMerge lazyUpdate />
    </div>
  );
}

function HeatmapChart({ items }: { items: HeatmapCelda[] }) {
  const mutedColor = COLORS.muted;

  const mapa = new Map<string, number>();
  for (const c of items) {
    mapa.set(`${c.hora}_${c.dia}`, c.total);
  }

  let maxVal = 0;
  const data: [number, number, number][] = [];
  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      const v = mapa.get(`${h}_${d}`) ?? 0;
      if (v > maxVal) maxVal = v;
      data.push([h, d, v]);
    }
  }
  const maxColor = Math.max(1, maxVal);

  const option = {
    tooltip: {
      formatter: (p: { value: [number, number, number] }) => {
        const hh = HORAS[p.value[0]];
        const dd = DIAS_CORTOS[p.value[1]];
        return `${dd} ${hh}<br/>Atenciones: <b>${p.value[2].toLocaleString("es-PE")}</b>`;
      },
    },
    grid: { left: 45, right: 60, top: 10, bottom: 40 },
    xAxis: {
      type: "category" as const,
      data: HORAS,
      splitArea: { show: true },
      axisLabel: { color: mutedColor, fontSize: 9, interval: 2 },
      axisLine: { show: false },
    },
    yAxis: {
      type: "category" as const,
      data: DIAS_CORTOS,
      splitArea: { show: true },
      axisLabel: { color: mutedColor, fontSize: 11 },
      axisLine: { show: false },
    },
    visualMap: {
      min: 0,
      max: maxColor,
      calculable: true,
      orient: "vertical",
      right: 0,
      top: "center",
      inRange: { color: ["#f0fdf4", "#86efac", "#22c55e", "#16a34a", "#166534"] },
      textStyle: { color: mutedColor, fontSize: 10 },
    },
    series: [
      {
        type: "heatmap" as const,
        data,
        label: {
          show: true,
          color: "#1f2937",
          fontSize: 9,
          formatter: (p: { value: [number, number, number] }) =>
            p.value[2] > 0 ? String(p.value[2]) : "",
        },
        emphasis: {
          itemStyle: { shadowBlur: 10, shadowColor: "rgba(0,0,0,0.3)" },
        },
      },
    ],
  };

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <h3 className="text-sm font-medium text-text">Carga horaria · Mapa de calor hora × día</h3>
      <p className="mt-1 text-xs text-muted">
        Color más intenso = más atenciones. Las celdas vacías son horas sin actividad.
      </p>
      <ReactECharts option={option} style={{ height: 320 }} notMerge lazyUpdate />
    </div>
  );
}

/** Curva por hora del día (área). */
function CurvaHoraChart({ items }: { items: HoraTotal[] }) {
  const mutedColor = COLORS.muted;
  const primaryColor = COLORS.primary;

  const datos = HORAS.map((_, h) => {
    const encontrado = items.find((i) => i.hora === h);
    return encontrado?.total ?? 0;
  });

  const option = {
    tooltip: {
      trigger: "axis" as const,
      formatter: (p: { name: string; value: number }[]) =>
        `${p[0].name}<br/>Atenciones: <b>${p[0].value.toLocaleString("es-PE")}</b>`,
    },
    grid: { left: 50, right: 20, top: 15, bottom: 30 },
    xAxis: {
      type: "category" as const,
      data: HORAS,
      boundaryGap: false,
      axisLabel: { color: mutedColor, fontSize: 9, interval: 2 },
      axisLine: { show: false },
    },
    yAxis: {
      type: "value" as const,
      axisLabel: { color: mutedColor, fontSize: 10 },
      splitLine: { lineStyle: { color: COLORS.border, type: "dashed" as const } },
    },
    series: [
      {
        type: "line" as const,
        data: datos,
        smooth: true,
        showSymbol: false,
        areaStyle: {
          color: { type: "linear" as const, x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: "#F97316" }, { offset: 1, color: "#FED7AA" }] },
        },
        lineStyle: { color: primaryColor, width: 2.5 },
        itemStyle: { color: primaryColor },
      },
    ],
  };

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <h3 className="text-sm font-medium text-text">Curva por hora del día</h3>
      <p className="mt-1 text-xs text-muted">
        Muestra la forma del día: a qué hora empiezan a entrar casos, cuándo es el pico y cuándo baja.
      </p>
      <ReactECharts option={option} style={{ height: 260 }} notMerge lazyUpdate />
    </div>
  );
}

/** Barras de carga por día de la semana. */
function CargaDiaChart({ items }: { items: DiaTotal[] }) {
  const mutedColor = COLORS.muted;

  const datos = DIAS_CORTOS.map((_, d) => {
    const encontrado = items.find((i) => i.dia === d);
    return encontrado?.total ?? 0;
  });

  const option = {
    tooltip: {
      trigger: "axis" as const,
      formatter: (p: { name: string; value: number }[]) =>
        `${p[0].name}<br/>Atenciones: <b>${p[0].value.toLocaleString("es-PE")}</b>`,
    },
    grid: { left: 50, right: 20, top: 15, bottom: 30 },
    xAxis: {
      type: "category" as const,
      data: DIAS_CORTOS,
      axisLabel: { color: mutedColor, fontSize: 11 },
      axisLine: { show: false },
    },
    yAxis: {
      type: "value" as const,
      axisLabel: { color: mutedColor, fontSize: 10 },
      splitLine: { lineStyle: { color: COLORS.border, type: "dashed" as const } },
    },
    series: [
      {
        type: "bar" as const,
        data: datos,
        barMaxWidth: 40,
        itemStyle: {
          color: COLORS.primary,
          borderRadius: [4, 4, 0, 0],
        },
      },
    ],
  };

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <h3 className="text-sm font-medium text-text">Carga por día de la semana</h3>
      <p className="mt-1 text-xs text-muted">De lunes a domingo, cuál pesa más en volumen.</p>
      <ReactECharts option={option} style={{ height: 260 }} notMerge lazyUpdate />
    </div>
  );
}

/** Línea de tendencia diaria en el rango. */
function TendenciaDiariaChart({ items }: { items: FechaTotal[] }) {
  const mutedColor = COLORS.muted;
  const primaryColor = COLORS.primary;
  const borderColor = COLORS.border;

  const option = {
    tooltip: {
      trigger: "axis" as const,
      formatter: (p: { axisValueLabel: string; value: number }[]) =>
        `${p[0].axisValueLabel}<br/>Atenciones: <b>${p[0].value.toLocaleString("es-PE")}</b>`,
    },
    grid: { left: 50, right: 20, top: 15, bottom: 30 },
    xAxis: {
      type: "category" as const,
      data: items.map((i) => i.fecha.slice(5)),
      boundaryGap: false,
      axisLabel: { color: mutedColor, fontSize: 10 },
      axisLine: { show: false },
    },
    yAxis: {
      type: "value" as const,
      axisLabel: { color: mutedColor, fontSize: 10 },
      splitLine: { lineStyle: { color: borderColor, type: "dashed" as const } },
    },
    series: [
      {
        type: "line" as const,
        data: items.map((i) => i.total),
        smooth: true,
        showSymbol: false,
        lineStyle: { color: primaryColor, width: 2.5 },
        itemStyle: { color: COLORS.primary },
        areaStyle: {
          color: { type: "linear" as const, x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: "#F97316" }, { offset: 1, color: "#FED7AA" }] },
        },
      },
    ],
  };

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <h3 className="text-sm font-medium text-text">Tendencia diaria</h3>
      <p className="mt-1 text-xs text-muted">
        Evolución del volumen de atenciones día a día en el rango seleccionado.
      </p>
      <ReactECharts option={option} style={{ height: 260 }} notMerge lazyUpdate />
    </div>
  );
}

export default function Operacion() {
  const { filters } = useFilters();
  const params = filtersToParams(filters);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["operacion", params],
    queryFn: () => fetchOperacion(params),
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <h1 className="text-2xl font-semibold">Operación — Carga de trabajo</h1>
      <p className="mt-1 text-sm text-muted">
        ¿Cuándo y dónde se concentra el trabajo? Planifica capacidad según hora, día y volumen.
      </p>

      {data?.rango ? (
        <p className="mt-3 text-xs text-muted">
          Comparando {data.rango.inicio} → {data.rango.fin} contra{" "}
          {data.rango.comparadoCon.inicio} → {data.rango.comparadoCon.fin}.
        </p>
      ) : null}

      {isLoading ? <p className="mt-6 text-muted">Cargando datos…</p> : null}
      {isError ? (
        <p className="mt-6 rounded-lg border border-border bg-surface p-4 text-sm text-muted">
          No se pudieron cargar los datos. Revisa que el backend esté encendido y conectado.
        </p>
      ) : null}

      {data ? (
        <>
          {/* KPIs operativos */}
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiSimpleCard
              label="Hora pico"
              valor={data.kpis.horaPico ?? "—"}
              hint={data.kpis.horaPicoValor !== null ? `${fmtNum(data.kpis.horaPicoValor)} atenciones` : undefined}
            />
            <KpiSimpleCard
              label="Día más cargado"
              valor={data.kpis.diaCargado ?? "—"}
              hint={data.kpis.diaCargadoValor !== null ? `${fmtNum(data.kpis.diaCargadoValor)} atenciones` : undefined}
            />
            <KpiCard label="Promedio atenciones / día" kpi={data.kpis.promedioPorDia} />
            <KpiCard label="Total atenciones" kpi={data.kpis.total} />
          </div>

          {/* Mapa de calor hora × día */}
          <div className="mt-6">
            <HeatmapChart items={data.heatmap} />
          </div>

          {/* Curva por hora + carga por día */}
          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <CurvaHoraChart items={data.curvaHora} />
            <CargaDiaChart items={data.cargaDiaSemana} />
          </div>

          {/* Tendencia diaria */}
          {data.tendenciaDiaria.length > 0 ? (
            <div className="mt-6">
              <TendenciaDiariaChart items={data.tendenciaDiaria} />
            </div>
          ) : null}

          {/* Concentración de carga */}
          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <BreakdownCard title="Top asesores por volumen" items={data.topAsesores} />
            <FunnelChart items={data.topCategorias} />
          </div>
        </>
      ) : null}
    </motion.div>
  );
}
