import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeftRight,
  Download,
  Link2,
  Link2Off,
  RefreshCw,
  ShieldCheck,
  Tags,
} from "lucide-react";
import { api } from "@/lib/api";
import { useFilters } from "@/contexts/FilterContext";
import { filtersToParams } from "@/lib/filters";
import { cn } from "@/lib/utils";
import { KpiPrincipal } from "./components/KpiPrincipal";
import { KpiPendiente } from "./components/KpiPendiente";
import { EvolucionSimple } from "./components/EvolucionSimple";
import { TablaComparativaCanal } from "./components/TablaComparativaCanal";
import { TablaCalidad } from "./components/TablaCalidad";
import { EvolucionCategorizacion } from "./components/EvolucionCategorizacion";
import { EvolucionDominio } from "./components/EvolucionDominio";
import { ComparativoCanal } from "./components/ComparativoCanal";
import { CumplimientoIntegral } from "./components/CumplimientoIntegral";
import { exportarCalidadCompleta } from "./exportCalidad";
import { CANAL_ORDER, canalLabel, fmtNum } from "./format";
import type {
  CalidadMeta,
  CalidadPeriodo,
  CalidadRegistroResponse,
  Granularidad,
} from "./types";

const cumpleCat = (p: CalidadPeriodo) => p.categorizacion.registradas;
const pendCat = (p: CalidadPeriodo) => p.categorizacion.noRegistradas;
const pctCat = (p: CalidadPeriodo) => p.categorizacion.pctRegistrada;
const cumpleDom = (p: CalidadPeriodo) => p.dominio.informados;
const pendDom = (p: CalidadPeriodo) => p.dominio.noInformados;
const pctDom = (p: CalidadPeriodo) => p.dominio.pctInformado;

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function fmtFechaLocal(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function rangoUltimos12Meses(): { fechaHoraInicio: string; fechaHoraFin: string } {
  const hoy = new Date();
  const inicio = new Date(hoy.getFullYear(), hoy.getMonth() - 11, 1);
  return {
    fechaHoraInicio: `${fmtFechaLocal(inicio)} 00:00`,
    fechaHoraFin: `${fmtFechaLocal(hoy)} 23:59`,
  };
}

function BotonToggle({
  activo,
  onClick,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded px-2.5 py-1 text-xs font-medium transition-colors",
        activo ? "bg-primary text-white" : "bg-white text-black-45 hover:text-black-85",
      )}
    >
      {children}
    </button>
  );
}

async function fetchCalidad(params: Record<string, string>): Promise<CalidadRegistroResponse> {
  const { data } = await api.get("/dashboard/calidad-registro", { params });
  return data.data as CalidadRegistroResponse;
}

export default function CalidadRegistroPage() {
  const { filters, setFilters } = useFilters();
  const [granularidad, setGranularidad] = useState<Granularidad>("mes");
  const [detalleAbierto, setDetalleAbierto] = useState(false);
  const [diagnosticoAbierto, setDiagnosticoAbierto] = useState(false);
  const didInit = useRef(false);

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    const hoy = fmtFechaLocal(new Date());
    const esDefaultHoy =
      filters.fechaHoraInicio?.startsWith(hoy) && filters.fechaHoraFin?.startsWith(hoy);
    if (!filters.fechaHoraInicio || !filters.fechaHoraFin || esDefaultHoy) {
      setFilters({ ...filters, ...rangoUltimos12Meses() });
    }
  }, [filters, setFilters]);

  const params = useMemo(
    () => ({ ...filtersToParams(filters), granularidad }),
    [filters, granularidad],
  );

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: ["calidad-registro", params],
    queryFn: () => fetchCalidad(params),
    refetchOnWindowFocus: false,
  });

  const canalActivo =
    filters.subcanal?.length === 1 ? filters.subcanal[0].toUpperCase() : "TODOS";

  const setCanal = (canal: string) => {
    setFilters({
      ...filters,
      subcanal: canal === "TODOS" ? undefined : [canal],
    });
  };

  const meta: CalidadMeta = useMemo(
    () => ({
      inicio: data?.rango.inicio ?? filters.fechaHoraInicio?.slice(0, 10) ?? "—",
      fin: data?.rango.fin ?? filters.fechaHoraFin?.slice(0, 10) ?? "—",
      canales: filters.subcanal?.length
        ? filters.subcanal.map(canalLabel).join(", ")
        : "Todos",
      granularidad,
      generadoEn: data?.generadoEn ?? new Date().toISOString(),
    }),
    [data, filters, granularidad],
  );

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <AlertTriangle size={28} className="text-danger" />
        <p className="text-sm text-black-45">No se pudo cargar Calidad de Registro.</p>
        <p className="max-w-md text-center text-xs text-black-25">
          {error instanceof Error ? error.message : "Error de conexión con el backend."}
        </p>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 rounded bg-primary px-3 py-1.5 text-sm font-medium text-white"
        >
          <RefreshCw size={14} /> Reintentar
        </button>
      </div>
    );
  }

  const r = data.resumen.actual;
  const v = data.resumen.variacion;
  const pctPendCat = r.total > 0 ? (r.categorizacion.noRegistradas / r.total) * 100 : null;
  const pctPendDom = r.total > 0 ? (r.dominio.noInformados / r.total) * 100 : null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-semibold text-text">
            <ShieldCheck size={20} className="text-primary" />
            Calidad de Registro
          </h1>
          <p className="mt-1 text-xs text-black-45">
            Cumplimiento de categorización y vinculación de dominios · WATICKET, WAMETA y ZENDESK
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
            <span className="rounded-full bg-light px-3 py-1 font-semibold text-black-85">
              Total analizado: {fmtNum(r.total)} atenciones
            </span>
            <span className="text-black-45">
              {data.rango.inicio ?? "—"} → {data.rango.fin ?? "—"}
            </span>
            {data.resumen.anterior && (
              <span className="text-black-25">
                Periodo anterior: {fmtNum(data.resumen.anterior.total)} atenciones
              </span>
            )}
            <span className="text-black-25">
              Generado: {new Date(data.generadoEn).toLocaleString("es-PE")}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border border-black-10 bg-light p-1">
            <BotonToggle activo={granularidad === "semana"} onClick={() => setGranularidad("semana")}>
              Semanal
            </BotonToggle>
            <BotonToggle activo={granularidad === "mes"} onClick={() => setGranularidad("mes")}>
              Mensual
            </BotonToggle>
            <BotonToggle
              activo={granularidad === "trimestre"}
              onClick={() => setGranularidad("trimestre")}
            >
              Trimestral
            </BotonToggle>
          </div>
          <button
            onClick={() => exportarCalidadCompleta(data, meta)}
            className="inline-flex items-center gap-1.5 rounded bg-primary px-3 py-2 text-xs font-medium text-white hover:bg-primary/90"
          >
            <Download size={14} /> Exportar
          </button>
          {isFetching && <RefreshCw size={14} className="animate-spin text-primary" />}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-black-10 bg-white px-4 py-2.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-black-45">Canal</span>
        <BotonToggle activo={canalActivo === "TODOS"} onClick={() => setCanal("TODOS")}>
          Todos
        </BotonToggle>
        {CANAL_ORDER.map((c) => (
          <BotonToggle key={c} activo={canalActivo === c} onClick={() => setCanal(c)}>
            {canalLabel(c)}
          </BotonToggle>
        ))}
        <span className="ml-auto text-[11px] text-black-25">
          Los KPI y gráficos responden al canal seleccionado; la tabla comparativa muestra los tres
          cuando el filtro está en Todos.
        </span>
      </div>

      {r.total === 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          No hay atenciones para el rango seleccionado. Amplía el rango de fechas o cambia el canal.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <KpiPrincipal
          icon={<Tags size={20} />}
          titulo="Cumplimiento de categorización"
          pct={r.categorizacion.pctRegistrada}
          cantidad={r.categorizacion.registradas}
          total={r.total}
          pendientes={r.categorizacion.noRegistradas}
          deltaPp={v.catRegistradaPp}
        />
        <KpiPrincipal
          icon={<Link2 size={20} />}
          titulo="Cumplimiento de vinculación de dominio"
          pct={r.dominio.pctInformado}
          cantidad={r.dominio.informados}
          total={r.total}
          pendientes={r.dominio.noInformados}
          deltaPp={v.domInformadoPp}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <KpiPendiente
          icon={<Tags size={16} />}
          titulo="Pendientes de categorizar"
          cantidad={r.categorizacion.noRegistradas}
          pct={pctPendCat}
        />
        <KpiPendiente
          icon={<Link2Off size={16} />}
          titulo="Pendientes de vincular dominio"
          cantidad={r.dominio.noInformados}
          pct={pctPendDom}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <EvolucionSimple
          titulo="Evolución de categorización"
          subtitulo="% de categorización (línea) · Categorizadas y pendientes (barras)"
          periodos={data.evolucion}
          cumple={cumpleCat}
          pendiente={pendCat}
          pct={pctCat}
          etiquetaCumple="Categorizadas"
          etiquetaPendiente="Pendientes"
          etiquetaPct="% Categorización"
          deltaPp={v.catRegistradaPp}
        />
        <EvolucionSimple
          titulo="Evolución de vinculación de dominio"
          subtitulo="% de vinculación (línea) · Con dominio y sin dominio (barras)"
          periodos={data.evolucion}
          cumple={cumpleDom}
          pendiente={pendDom}
          pct={pctDom}
          etiquetaCumple="Con dominio"
          etiquetaPendiente="Sin dominio"
          etiquetaPct="% Vinculación"
          deltaPp={v.domInformadoPp}
        />
      </div>

      <TablaComparativaCanal data={data} onVerTodos={() => setCanal("TODOS")} />

      <details
        className="rounded-2xl border border-black-10 bg-white"
        onToggle={(e) => setDetalleAbierto(e.currentTarget.open)}
      >
        <summary className="cursor-pointer select-none px-5 py-3 text-sm font-semibold text-black-85">
          Detalle histórico por periodo
          <span className="ml-2 text-xs font-normal text-black-25">
            (información complementaria)
          </span>
        </summary>
        {detalleAbierto && (
          <div className="border-t border-black-5 p-4">
            <TablaCalidad data={data} meta={meta} />
          </div>
        )}
      </details>

      <details
        className="rounded-2xl border border-black-10 bg-white"
        onToggle={(e) => setDiagnosticoAbierto(e.currentTarget.open)}
      >
        <summary className="cursor-pointer select-none px-5 py-3 text-sm font-semibold text-black-85">
          Diagnóstico técnico (opcional)
          <span className="ml-2 text-xs font-normal text-black-25">
            homologación, dominio válido, brechas y escenarios
          </span>
        </summary>
        {diagnosticoAbierto && (
          <div className="space-y-4 border-t border-black-5 p-4">
            <p className="text-xs text-black-45">
              Indicadores técnicos para auditoría de datos. No forman parte del resumen ejecutivo:
              la categoría registrada no equivale a homologada y el dominio informado no equivale a
              dominio válido.
            </p>
            <EvolucionCategorizacion data={data} />
            <EvolucionDominio data={data} />
            <ComparativoCanal data={data} />
            <CumplimientoIntegral data={data} />
          </div>
        )}
      </details>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-black-10 bg-light px-4 py-3 text-[11px] text-black-45">
        <span className="inline-flex items-center gap-1.5">
          <ArrowLeftRight size={13} />
          Consolidado deduplicado por ticket WhatsApp; Zendesk se mantiene separado.
        </span>
        <span>
          Resumen ejecutivo: categoría registrada y dominio informado. Los indicadores técnicos están
          en “Diagnóstico técnico”.
        </span>
      </div>
    </motion.div>
  );
}
