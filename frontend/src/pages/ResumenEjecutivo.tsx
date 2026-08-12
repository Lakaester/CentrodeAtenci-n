import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowDown, ArrowUp, Minus, Trophy } from "lucide-react";
import ReactECharts from "echarts-for-react";
import { api } from "@/lib/api";
import { useFilters } from "@/contexts/FilterContext";
import { filtersToParams } from "@/lib/filters";
import { DetalleTable } from "@/components/dashboard/detalle/DetalleTable";

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
interface TiempoCanal {
  etiqueta: string;
  total: number;
  promPrimera: number | null;
  promResolucion: number | null;
}
interface RankingAsesor {
  asesor: string;
  total: number;
  promPrimera: number | null;
  promResolucion: number | null;
  cumpleSlaPct: number | null;
  score: number;
}
interface SlaKpis {
  cumplimientoPrimera: Kpi;
  cumplimientoResolucion: Kpi;
  dentroPrimera: Kpi;
  fueraPrimera: Kpi;
}
interface SlaData {
  kpis: SlaKpis;
}

async function fetchSla(params: Record<string, string>): Promise<SlaData> {
  const { data } = await api.get("/dashboard/sla", { params });
  return data.data as SlaData;
}

interface Resumen {
  rango: { inicio: string; fin: string; comparadoCon: { inicio: string; fin: string } } | null;
  kpis: {
    total: Kpi;
    cerrados: Kpi;
    resueltos: Kpi;
    cumplimientos: Kpi;
    cumplimientoSlaPct: Kpi;
    promPrimeraRespMin: Kpi;
    promResolucionMin: Kpi;
  };
  porCanal: Desglose[];
  porSubcanal: Desglose[];
  porEstado: Desglose[];
  porPais: Desglose[];
  porAsesor: Desglose[];
  topAsesores: RankingAsesor[];
  topCategorias: Desglose[];
  topSubcategorias: Desglose[];
  tiemposPorCanal: TiempoCanal[];
}

async function fetchResumen(params: Record<string, string>): Promise<Resumen> {
  const { data } = await api.get("/dashboard/resumen", { params });
  return data.data as Resumen;
}

const fmt = (n: number | null) =>
  n === null || n === undefined ? "—" : n.toLocaleString("es-PE");

const fmtPct = (n: number | null) =>
  n === null || n === undefined ? "—" : `${n.toLocaleString("es-PE")}%`;

/** Muestra minutos legibles: <60 → "X min"; ≥60 → "Y h". */
const fmtDur = (min: number | null) => {
  if (min === null || min === undefined) return "—";
  if (min < 60) return `${min.toLocaleString("es-PE")} min`;
  const horas = min / 60;
  const txt = Number.isInteger(horas) ? `${horas}` : horas.toFixed(1);
  return `${txt} h`;
};

const nombreCanal = (c: string) =>
  c.toUpperCase() === "WHATSAPP" ? "WhatsApp" : c.toUpperCase() === "CORREO" ? "Correo" : c;

/** Lee una variable de color del tema (ej. "--primary") como "rgb(r g b)". */
function cssVar(nombre: string): string {
  if (typeof window === "undefined") return "#2563eb";
  const v = getComputedStyle(document.documentElement).getPropertyValue(nombre).trim();
  return v ? `rgb(${v})` : "#2563eb";
}

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
        {formato === "pct" ? fmtPct(kpi.valor) : fmt(kpi.valor)}
      </p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
      <Delta kpi={kpi} invertir={invertir} />
    </div>
  );
}

function TiemposPorCanal({ items }: { items: TiempoCanal[] }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <h3 className="text-sm font-medium text-text">Tiempos promedio por canal</h3>
      <p className="mt-1 text-xs text-muted">
        Promedios separados por canal (no mezclados). 1ª respuesta y resolución.
      </p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-muted">
              <th className="pb-2 font-medium">Canal</th>
              <th className="pb-2 text-right font-medium">Atenciones</th>
              <th className="pb-2 text-right font-medium">Prom. 1ª resp.</th>
              <th className="pb-2 text-right font-medium">Prom. resolución</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-2 text-muted">
                  Sin datos en el rango actual.
                </td>
              </tr>
            ) : null}
            {items.map((t) => (
              <tr key={t.etiqueta} className="border-t border-border">
                <td className="py-2 text-text">{nombreCanal(t.etiqueta)}</td>
                <td className="py-2 text-right text-muted">{t.total.toLocaleString("es-PE")}</td>
                <td className="py-2 text-right font-medium text-text">{fmtDur(t.promPrimera)}</td>
                <td className="py-2 text-right font-medium text-text">{fmtDur(t.promResolucion)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Dona de participacion por canal (ECharts). */
function DonaCanal({ items }: { items: Desglose[] }) {
  const colorWhatsApp = "#22C55E";
  const colorCorreo = "#F97316";
  const getColor = (etiqueta: string) =>
    etiqueta.toUpperCase() === "WHATSAPP" ? colorWhatsApp : etiqueta.toUpperCase() === "CORREO" ? colorCorreo : "#8b5cf6";
  const textColor = cssVar("--text");
  const mutedColor = cssVar("--muted");
  const total = items.reduce((s, i) => s + i.total, 0);

  const option = {
    tooltip: {
      trigger: "item",
      formatter: (p: { name: string; value: number; percent: number }) =>
        `${nombreCanal(p.name)}<br/>${p.value.toLocaleString("es-PE")} (${p.percent}%)`,
    },
    legend: {
      bottom: 0,
      textStyle: { color: mutedColor },
      formatter: (name: string) => nombreCanal(name),
    },
    series: [
      {
        type: "pie",
        radius: ["52%", "72%"],
        center: ["50%", "44%"],
        avoidLabelOverlap: true,
        itemStyle: { borderColor: cssVar("--surface"), borderWidth: 2 },
        label: {
          show: true,
          formatter: (p: { percent: number }) => `${p.percent}%`,
          color: textColor,
          fontWeight: 600,
        },
        data: items.map((i) => ({
          name: i.etiqueta,
          value: i.total,
          itemStyle: { color: getColor(i.etiqueta), opacity: 0.88 },
        })),
      },
    ],
    graphic: {
      type: "text",
      left: "center",
      top: "38%",
      style: {
        text: total.toLocaleString("es-PE"),
        fill: textColor,
        fontSize: 22,
        fontWeight: 700,
      },
    },
  };

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <h3 className="text-sm font-medium text-text">Participación por canal</h3>
      <ReactECharts option={option} style={{ height: 280 }} notMerge lazyUpdate />
    </div>
  );
}

/** Barras horizontales reutilizables (subcanal, categorías, etc.). */
function BreakdownCard({ title, items }: { title: string; items: Desglose[] }) {
  const max = Math.max(1, ...items.map((i) => i.total));
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <h3 className="text-sm font-medium text-text">{title}</h3>
      <ul className="mt-3 space-y-2">
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

/** Matriz por país: cantidad y % del total. */
function MatrizPais({ items }: { items: Desglose[] }) {
  const total = items.reduce((s, i) => s + i.total, 0) || 1;
  const top = items.slice(0, 12);
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <h3 className="text-sm font-medium text-text">Por país</h3>
      <p className="mt-1 text-xs text-muted">Cantidad y porcentaje sobre el total.</p>
      <div className="mt-3 max-h-72 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-surface">
            <tr className="text-left text-xs uppercase tracking-wide text-muted">
              <th className="pb-2 font-medium">País</th>
              <th className="pb-2 text-right font-medium">Cantidad</th>
              <th className="pb-2 text-right font-medium">% del total</th>
            </tr>
          </thead>
          <tbody>
            {top.map((i) => {
              const pct = (i.total / total) * 100;
              return (
                <tr key={i.etiqueta} className="border-t border-border">
                  <td className="py-2 capitalize text-text">{i.etiqueta}</td>
                  <td className="py-2 text-right text-muted">{i.total.toLocaleString("es-PE")}</td>
                  <td className="py-2 text-right">
                    <span className="font-medium text-text">{pct.toFixed(1)}%</span>
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

/** Podio Top 3 de asesores por performance. */
function PodioAsesores({ items }: { items: RankingAsesor[] }) {
  const medallas = [
    { nombre: "Oro", borde: "#F5B301", anillo: "ring-amber-400" },
    { nombre: "Plata", borde: "#9CA3AF", anillo: "ring-gray-400" },
    { nombre: "Bronce", borde: "#B45309", anillo: "ring-orange-700" },
  ];
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center gap-2">
        <Trophy size={16} className="text-amber-400" />
        <h3 className="text-sm font-medium text-text">Top 3 asesores · Performance</h3>
      </div>
      <p className="mt-1 text-xs text-muted">
        Puntaje 0-100 que combina cumplimiento de SLA, velocidad de 1ª respuesta y volumen.
      </p>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-muted">
          Sin asesores con suficientes casos en el rango actual.
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          {items.map((a, idx) => {
            const m = medallas[idx] ?? medallas[2];
            return (
              <div
                key={a.asesor}
                className="rounded-xl border border-border bg-bg p-4"
                style={{ borderTop: `3px solid ${m.borde}` }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`grid h-7 w-7 place-items-center rounded-full bg-surface text-xs font-bold ring-2 ${m.anillo}`}
                    style={{ color: m.borde }}
                  >
                    {idx + 1}
                  </span>
                  <span className="text-xs uppercase tracking-wide text-muted">{m.nombre}</span>
                </div>
                <p className="mt-2 truncate text-base font-semibold text-text" title={a.asesor}>
                  {a.asesor}
                </p>
                <p className="text-2xl font-bold text-text">{a.score}</p>
                <div className="mt-3 space-y-1 text-xs text-muted">
                  <div className="flex justify-between">
                    <span>Atenciones</span>
                    <span className="font-medium text-text">{a.total.toLocaleString("es-PE")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>1ª respuesta</span>
                    <span className="font-medium text-text">{fmtDur(a.promPrimera)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cumple SLA</span>
                    <span className="font-medium text-text">{fmtPct(a.cumpleSlaPct)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ResumenEjecutivo() {
  const { filters } = useFilters();
  const params = filtersToParams(filters);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["resumen", params],
    queryFn: () => fetchResumen(params),
  });
  const slaQuery = useQuery({
    queryKey: ["sla", params],
    queryFn: () => fetchSla(params),
    staleTime: 30_000,
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <h1 className="text-2xl font-semibold">Resumen</h1>
      <p className="mt-1 text-sm text-muted">
        Datos en vivo desde tu base. Usa los filtros de arriba; con un rango de fechas se compara
        contra el período anterior.
      </p>

      {data?.rango ? (
        <p className="mt-3 text-xs text-muted">
          Comparando {data.rango.inicio} → {data.rango.fin} contra {data.rango.comparadoCon.inicio} →{" "}
          {data.rango.comparadoCon.fin}.
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
          {/* KPIs ejecutivos */}
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <KpiCard label="Atenciones totales" kpi={data.kpis.total} />
            <KpiCard label="Cerradas" kpi={data.kpis.cerrados} />
            <KpiCard
              label="Cumplimiento SLA"
              kpi={data.kpis.cumplimientoSlaPct}
              hint="1ª respuesta dentro de meta"
              formato="pct"
            />
          </div>

          {/* SLA KPIs integrados */}
          {slaQuery.data ? (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard
                label="Cumplimiento 1ª respuesta"
                kpi={slaQuery.data.kpis.cumplimientoPrimera}
                formato="pct"
              />
              <KpiCard
                label="Cumplimiento resolución"
                kpi={slaQuery.data.kpis.cumplimientoResolucion}
                formato="pct"
              />
              <KpiCard
                label="Dentro de SLA (1ª resp.)"
                kpi={slaQuery.data.kpis.dentroPrimera}
                hint="atenciones"
              />
              <KpiCard
                label="Fuera de SLA (1ª resp.)"
                kpi={slaQuery.data.kpis.fueraPrimera}
                hint="atenciones"
                invertir
              />
            </div>
          ) : null}

          {/* Tiempos separados por canal */}
          <div className="mt-6">
            <TiemposPorCanal items={data.tiemposPorCanal} />
          </div>

          {/* Participación por canal (dona) + subcanal (barras) */}
          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <DonaCanal items={data.porCanal} />
            <BreakdownCard title="Por subcanal" items={data.porSubcanal} />
          </div>

          {/* Podio de asesores */}
          <div className="mt-6">
            <PodioAsesores items={data.topAsesores} />
          </div>

          {/* Matriz por país + Top categorías */}
          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <MatrizPais items={data.porPais} />
            <BreakdownCard title="Top categorías" items={data.topCategorias.slice(0, 5)} />
          </div>

          {/* Detalle de atenciones */}
          <div className="mt-8">
            <DetalleTable />
          </div>
        </>
      ) : null}
    </motion.div>
  );
}
