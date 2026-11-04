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
  cumpleResolucionPct: number | null;
  score: number;
}
interface Resumen {
  rango: { inicio: string; fin: string; comparadoCon: { inicio: string; fin: string } } | null;
  kpis: {
    total: Kpi;
    cerrados: Kpi;
    resueltos: Kpi;
    cumplimientos: Kpi;
    cumplimientoSlaPct: Kpi;
    cumplimientoPrimeraPct: Kpi;
    primeraDentro: Kpi;
    primeraFuera: Kpi;
    primeraConDato: Kpi;
    cumplimientoResolucionPct: Kpi;
    resolucionDentro: Kpi;
    resolucionFuera: Kpi;
    resolucionConDato: Kpi;
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

const nombreCanal = (c: string) => {
  const v = c.toUpperCase();
  if (v === "WHATMETA") return "WAMETA";
  if (v === "WHATICKET") return "WATICKET";
  if (v === "ZENDESK") return "ZENDESK";
  if (v === "WHATSAPP") return "WhatsApp";
  if (v === "CORREO") return "Correo";
  return c;
};

/** Lee una variable de color del tema (ej. "--primary") como "rgb(r g b)". */
function cssVar(nombre: string): string {
  if (typeof window === "undefined") return "#2563eb";
  const v = getComputedStyle(document.documentElement).getPropertyValue(nombre).trim();
  return v ? `rgb(${v})` : "#2563eb";
}

function Delta({
  kpi,
  invertir = false,
  modo = "rel",
}: {
  kpi: Kpi;
  invertir?: boolean;
  modo?: "rel" | "pp";
}) {
  const valor =
    modo === "pp" && kpi.valor !== null && kpi.anterior !== null
      ? Math.round((kpi.valor - kpi.anterior) * 10) / 10
      : kpi.deltaPct;
  if (valor === null || valor === undefined) return null;

  const direccion = valor > 0 ? "up" : valor < 0 ? "down" : "flat";
  const bueno = invertir ? direccion === "down" : direccion === "up";
  const color = direccion === "flat" ? "text-muted" : bueno ? "text-success" : "text-danger";
  const Icon = direccion === "up" ? ArrowUp : direccion === "down" ? ArrowDown : Minus;
  return (
    <span className={`mt-2 flex items-center gap-1 text-xs ${color}`}>
      <Icon size={14} /> {Math.abs(valor).toLocaleString("es-PE", { maximumFractionDigits: 1 })}
      {modo === "pp" ? " pp" : "%"} vs. período anterior
    </span>
  );
}

function KpiCard({
  label,
  kpi,
  hint,
  invertir,
  formato = "numero",
  deltaModo = "rel",
}: {
  label: string;
  kpi: Kpi;
  hint?: string;
  invertir?: boolean;
  formato?: "numero" | "pct" | "duracion";
  deltaModo?: "rel" | "pp";
}) {
  const valor =
    formato === "pct" ? fmtPct(kpi.valor) : formato === "duracion" ? fmtDur(kpi.valor) : fmt(kpi.valor);
  return (
    <div className="flex min-h-[168px] flex-col justify-between rounded-xl border border-border bg-surface p-5">
      <div>
        <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
        <p className="mt-2 text-3xl font-semibold text-text">{valor}</p>
      </div>
      <div>
        {hint ? <p className="mt-1 text-[11px] leading-4 text-muted">{hint}</p> : null}
        <Delta kpi={kpi} invertir={invertir} modo={deltaModo} />
      </div>
    </div>
  );
}

function TiemposPorCanal({ items }: { items: TiempoCanal[] }) {
  return (
    <div className="h-full rounded-xl border border-border bg-surface p-5">
      <h3 className="text-sm font-medium text-text">Tiempos promedio por canal</h3>
      <p className="mt-1 text-xs text-muted">
        Solo atenciones finalizadas. Promedios calculados únicamente con tiempos válidos.
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

function colorCanal(canal: string): string {
  const v = canal.toUpperCase();
  if (v === "WHATMETA") return "#22C55E";
  if (v === "WHATICKET") return "#F97316";
  if (v === "ZENDESK") return "#8B5CF6";
  return "#64748B";
}

/** Distribución por canal operativo (subcanal): dona + conteo y porcentaje. */
function DistribucionCanal({ items }: { items: Desglose[] }) {
  const textColor = cssVar("--text");
  const mutedColor = cssVar("--muted");
  const total = items.reduce((s, i) => s + i.total, 0);

  const option = {
    tooltip: {
      trigger: "item",
      formatter: (p: { name: string; value: number; percent: number }) =>
        `${nombreCanal(p.name)}<br/>${p.value.toLocaleString("es-PE")} (${p.percent}%)`,
    },
    legend: { show: false },
    series: [
      {
        type: "pie",
        radius: ["52%", "72%"],
        center: ["50%", "50%"],
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
          itemStyle: { color: colorCanal(i.etiqueta), opacity: 0.9 },
        })),
      },
    ],
    graphic: {
      type: "text",
      left: "center",
      top: "44%",
      style: {
        text: total.toLocaleString("es-PE"),
        fill: textColor,
        fontSize: 20,
        fontWeight: 700,
      },
    },
  };

  return (
    <div className="h-full rounded-xl border border-border bg-surface p-5">
      <h3 className="text-sm font-medium text-text">Distribución por canal</h3>
      <p className="mt-1 text-xs text-muted">
        Cantidad y porcentaje sobre el total de atenciones finalizadas.
      </p>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-muted">Sin datos en el rango actual.</p>
      ) : (
        <div className="mt-2 grid grid-cols-1 items-center gap-2 sm:grid-cols-[1.1fr_1fr]">
          <ReactECharts option={option} style={{ height: 220 }} notMerge lazyUpdate />
          <ul className="space-y-2">
            {items.map((i) => {
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
                    <span className="ml-1 text-xs" style={{ color: mutedColor }}>
                      {pct.toFixed(1)}%
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

/** Barras horizontales compactas para categorías. */
function BreakdownCard({ title, items }: { title: string; items: Desglose[] }) {
  const max = Math.max(1, ...items.map((i) => i.total));
  return (
    <div className="h-full rounded-xl border border-border bg-surface p-5">
      <h3 className="text-sm font-medium text-text">{title}</h3>
      <p className="mt-1 text-xs text-muted">Solo atenciones finalizadas.</p>
      <ul className="mt-3 space-y-2">
        {items.length === 0 ? <li className="text-sm text-muted">Sin datos.</li> : null}
        {items.map((i) => (
          <li key={i.etiqueta}>
            <div className="flex justify-between text-sm">
              <span className="truncate capitalize text-muted">{i.etiqueta}</span>
              <span className="ml-2 font-medium text-text">{i.total.toLocaleString("es-PE")}</span>
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

/** Matriz por país: cantidad y % del total finalizado. Sin scroll interno. */
function MatrizPais({ items }: { items: Desglose[] }) {
  const total = items.reduce((s, i) => s + i.total, 0) || 1;
  const top = items.slice(0, 8);
  return (
    <div className="h-full rounded-xl border border-border bg-surface p-5">
      <h3 className="text-sm font-medium text-text">Por país</h3>
      <p className="mt-1 text-xs text-muted">
        Cantidad y porcentaje sobre el total de atenciones finalizadas.
      </p>
      <table className="mt-3 w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-muted">
            <th className="pb-2 font-medium">País</th>
            <th className="pb-2 text-right font-medium">Cantidad</th>
            <th className="pb-2 text-right font-medium">% del total</th>
          </tr>
        </thead>
        <tbody>
          {top.length === 0 ? (
            <tr>
              <td colSpan={3} className="py-2 text-muted">
                Sin datos.
              </td>
            </tr>
          ) : null}
          {top.map((i) => {
            const pct = (i.total / total) * 100;
            return (
              <tr key={i.etiqueta} className="border-t border-border">
                <td className="py-1.5 capitalize text-text">{i.etiqueta}</td>
                <td className="py-1.5 text-right text-muted">{i.total.toLocaleString("es-PE")}</td>
                <td className="py-1.5 text-right">
                  <span className="font-medium text-text">{pct.toFixed(1)}%</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Podio Top 3 de asesores por performance, solo con atenciones finalizadas. */
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
        Score 0-100: 40% cumplimiento de 1ª respuesta + 30% velocidad + 30% volumen. Mínimo 5
        atenciones finalizadas.
      </p>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-muted">
          Sin asesores con suficientes atenciones finalizadas en el rango actual.
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
                    <span>Finalizadas</span>
                    <span className="font-medium text-text">{a.total.toLocaleString("es-PE")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>1ª respuesta</span>
                    <span className="font-medium text-text">{fmtDur(a.promPrimera)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cumple 1ª resp.</span>
                    <span className="font-medium text-text">{fmtPct(a.cumpleSlaPct)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cumple resolución</span>
                    <span className="font-medium text-text">{fmtPct(a.cumpleResolucionPct)}</span>
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

  const k = data?.kpis;
  const hintPrimera =
    k && k.primeraConDato.valor
      ? `Cumple ${fmt(k.primeraDentro.valor)} · Incumple ${fmt(k.primeraFuera.valor)} · ${fmt(
          k.primeraConDato.valor,
        )} con dato`
      : "Sin datos de tiempo de primera respuesta";
  const hintResolucion =
    k && k.resolucionConDato.valor
      ? `Cumple ${fmt(k.resolucionDentro.valor)} · Incumple ${fmt(
          k.resolucionFuera.valor,
        )} · ${fmt(k.resolucionConDato.valor)} con dato`
      : "Sin datos de tiempo de resolución";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Resumen</h1>
          <p className="mt-1 text-sm text-muted">
            Solo atenciones finalizadas (cerradas o resueltas). Todas las métricas usan el mismo
            universo y respetan los filtros seleccionados.
          </p>
        </div>
        <span className="rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted">
          Universo: cerradas + resueltas
        </span>
      </div>

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

      {data && k ? (
        <>
          {/* 1. KPI principales */}
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Atenciones finalizadas"
              kpi={k.total}
              hint={`Cerradas + resueltas${
                k.total.anterior != null ? ` · Período anterior: ${fmt(k.total.anterior)}` : ""
              }`}
            />
            <KpiCard
              label="Cumplimiento de primera respuesta"
              kpi={k.cumplimientoPrimeraPct}
              hint={hintPrimera}
              formato="pct"
              deltaModo="pp"
            />
            <KpiCard
              label="Cumplimiento de resolución"
              kpi={k.cumplimientoResolucionPct}
              hint={hintResolucion}
              formato="pct"
              deltaModo="pp"
            />
            <KpiCard
              label="Tiempo promedio de resolución"
              kpi={k.promResolucionMin}
              hint="Promedio de atenciones finalizadas con tiempo válido"
              formato="duracion"
              invertir
            />
          </div>

          {/* 2 y 3. Tiempos por canal + distribución por canal */}
          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <TiemposPorCanal items={data.tiemposPorCanal} />
            </div>
            <div className="lg:col-span-5">
              <DistribucionCanal items={data.porSubcanal} />
            </div>
          </div>

          {/* 4. Top 3 asesores */}
          <div className="mt-6">
            <PodioAsesores items={data.topAsesores} />
          </div>

          {/* 5. País y categoría */}
          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <MatrizPais items={data.porPais} />
            <BreakdownCard title="Top categorías" items={data.topCategorias.slice(0, 8)} />
          </div>

          {/* 6. Detalle de atenciones */}
          <div className="mt-8">
            <DetalleTable />
          </div>
        </>
      ) : null}
    </motion.div>
  );
}
