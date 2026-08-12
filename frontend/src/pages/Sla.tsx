import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import ReactECharts from "echarts-for-react";
import { api } from "@/lib/api";
import { useFilters } from "@/contexts/FilterContext";
import { filtersToParams } from "@/lib/filters";

function cssVar(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

interface Kpi {
  valor: number | null;
  anterior: number | null;
  deltaPct: number | null;
  direccion: "up" | "down" | "flat" | null;
}
interface SlaFila {
  etiqueta: string;
  total: number;
  cumplePrimeraPct: number | null;
  cumpleResolucionPct: number | null;
  dentroPrimera: number;
  conDatoPrimera: number;
}
interface Metas {
  primeraRespuesta: { whatsapp: number; correo: number; otro: number };
  resolucion: { whatsapp: number; correo: number; otro: number };
}
interface Sla {
  rango: { inicio: string; fin: string; comparadoCon: { inicio: string; fin: string } } | null;
  metas: Metas;
  kpis: {
    cumplimientoPrimera: Kpi;
    cumplimientoResolucion: Kpi;
    dentroPrimera: Kpi;
    fueraPrimera: Kpi;
  };
  porCanal: SlaFila[];
  porPaisWhatsapp: SlaFila[];
  porPaisCorreo: SlaFila[];
  porAsesorWhatsapp: SlaFila[];
  porAsesorCorreo: SlaFila[];
  porCategoriaWhatsapp: SlaFila[];
  porCategoriaCorreo: SlaFila[];
}

async function fetchSla(params: Record<string, string>): Promise<Sla> {
  const { data } = await api.get("/dashboard/sla", { params });
  return data.data as Sla;
}

const ETIQUETAS_CANAL: Record<string, string> = {
  whatsapp: "WhatsApp",
  correo: "Correo (Zendesk)",
  otro: "Otro",
};

const fmtNum = (n: number | null) =>
  n === null || n === undefined ? "—" : n.toLocaleString("es-PE");
const fmtPct = (n: number | null) => (n === null || n === undefined ? "—" : `${n}%`);
const fmtDur = (min: number) => {
  if (min < 60) return `${min} min`;
  const horas = min / 60;
  return `${Number.isInteger(horas) ? horas : horas.toFixed(1)} h`;
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
  valor,
  kpi,
  hint,
  invertir,
}: {
  label: string;
  valor: string;
  kpi: Kpi;
  hint?: string;
  invertir?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-text">{valor}</p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
      <Delta kpi={kpi} invertir={invertir} />
    </div>
  );
}

/** Color de la barra según el nivel de cumplimiento. */
function colorBarra(pct: number | null): string {
  if (pct === null) return "bg-muted";
  if (pct >= 90) return "bg-success-50";
  if (pct >= 75) return "bg-warning-50";
  return "bg-danger-50";
}

function DonaSlaCanal({ items }: { items: SlaFila[] }) {
  const COLORES_CANAL: Record<string, string> = {
    whatsapp: "#10b981",
    correo: cssVar("--primary"),
    otro: "#f59e0b",
  };
  const textColor = cssVar("--text");
  const mutedColor = cssVar("--muted");
  const total = items.reduce((s, i) => s + i.total, 0);

  const option = {
    tooltip: {
      trigger: "item",
      formatter: (p: { name: string; value: number; percent: number }) =>
        `${ETIQUETAS_CANAL[p.name] ?? p.name}<br/>${p.value.toLocaleString("es-PE")} (${p.percent}%)`,
    },
    legend: {
      bottom: 0,
      textStyle: { color: mutedColor },
      formatter: (name: string) => ETIQUETAS_CANAL[name] ?? name,
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
          itemStyle: { color: COLORES_CANAL[i.etiqueta] ?? "#8b5cf6" },
        })),
      },
    ],
    graphic: {
      type: "text",
      left: "center",
      top: "38%",
      style: {
        text: total.toLocaleString("es-PE"),
        textAlign: "center",
        fill: textColor,
        fontSize: 18,
        fontWeight: 700,
      },
    },
  };

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <h3 className="text-sm font-medium text-text">Por canal</h3>
      <p className="mt-1 text-xs text-muted">{items.length} canales</p>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-muted">Sin datos en el rango actual.</p>
      ) : (
        <ReactECharts option={option} style={{ height: 260 }} notMerge lazyUpdate />
      )}
    </div>
  );
}

function SlaBreakdown({
  title,
  items,
  usarEtiquetaCanal = false,
}: {
  title: string;
  items: SlaFila[];
  usarEtiquetaCanal?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <h3 className="text-sm font-medium text-text">{title}</h3>
      <p className="mt-1 text-xs text-muted">
        {items.length} {items.length === 1 ? "canal" : "canales"}
      </p>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-muted">Sin datos en el rango actual.</p>
      ) : (
        <ul className="mt-3 max-h-[26rem] space-y-3 overflow-y-auto">
          {items.map((i) => {
            const nombre = usarEtiquetaCanal ? ETIQUETAS_CANAL[i.etiqueta] ?? i.etiqueta : i.etiqueta;
            const pct = i.cumplePrimeraPct;
            return (
              <li key={i.etiqueta}>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="capitalize text-text">{nombre}</span>
                  <span className="text-muted">
                    {i.total.toLocaleString("es-PE")} atenc.
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-3">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-bg">
                    <div
                      className={`h-full rounded-full ${colorBarra(pct)}`}
                      style={{ width: `${pct ?? 0}%` }}
                    />
                  </div>
                  <span className="w-12 shrink-0 text-right text-sm font-medium text-text">
                    {fmtPct(pct)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted">
                  Resolución: {fmtPct(i.cumpleResolucionPct)} · 1ª resp. dentro de SLA:{" "}
                  {i.dentroPrimera}/{i.conDatoPrimera}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function Sla() {
  const { filters } = useFilters();
  const params = filtersToParams(filters);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["sla", params],
    queryFn: () => fetchSla(params),
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <h1 className="text-2xl font-semibold">SLA — Cumplimiento de tiempos</h1>
      <p className="mt-1 text-sm text-muted">
        Porcentaje de atenciones dentro de la meta de tiempo. Cada canal usa su propia meta porque
        WhatsApp y Correo no son comparables. Usa los filtros de arriba.
      </p>

      {data?.metas ? (
        <p className="mt-3 rounded-lg border border-border bg-surface px-3 py-2 text-xs text-muted">
          <span className="font-medium text-text">Metas actuales</span> — 1ª respuesta:{" "}
          WhatsApp ≤ {fmtDur(data.metas.primeraRespuesta.whatsapp)} · Correo ≤{" "}
          {fmtDur(data.metas.primeraRespuesta.correo)}. Resolución (provisional): WhatsApp ≤{" "}
          {fmtDur(data.metas.resolucion.whatsapp)} · Correo ≤ {fmtDur(data.metas.resolucion.correo)}.
        </p>
      ) : null}

      {data?.rango ? (
        <p className="mt-2 text-xs text-muted">
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
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              label="Cumplimiento 1ª respuesta"
              valor={fmtPct(data.kpis.cumplimientoPrimera.valor)}
              kpi={data.kpis.cumplimientoPrimera}
            />
            <KpiCard
              label="Cumplimiento resolución"
              valor={fmtPct(data.kpis.cumplimientoResolucion.valor)}
              kpi={data.kpis.cumplimientoResolucion}
            />
            <KpiCard
              label="Dentro de SLA (1ª resp.)"
              valor={fmtNum(data.kpis.dentroPrimera.valor)}
              kpi={data.kpis.dentroPrimera}
              hint="atenciones"
            />
            <KpiCard
              label="Fuera de SLA (1ª resp.)"
              valor={fmtNum(data.kpis.fueraPrimera.valor)}
              kpi={data.kpis.fueraPrimera}
              hint="atenciones"
              invertir
            />
          </div>

          <div className="mt-6 max-w-lg">
            <DonaSlaCanal items={data.porCanal} />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <SlaBreakdown title="Por país · WhatsApp" items={data.porPaisWhatsapp} />
            <SlaBreakdown title="Por país · Correo (Zendesk)" items={data.porPaisCorreo} />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <SlaBreakdown title="Por asesor · WhatsApp" items={data.porAsesorWhatsapp} />
            <SlaBreakdown title="Por asesor · Correo (Zendesk)" items={data.porAsesorCorreo} />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <SlaBreakdown title="Por categorías · WhatsApp" items={data.porCategoriaWhatsapp} />
            <SlaBreakdown title="Por categorías · Correo (Zendesk)" items={data.porCategoriaCorreo} />
          </div>
        </>
      ) : null}
    </motion.div>
  );
}
