import { useMemo, useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  X, Plus, RefreshCcw, ArrowUpRight, Download, Trash2, CheckCircle2, RotateCcw,
  GitMerge, Link2, ChevronDown, XCircle, Clock,
  MessageSquare, Search, SlidersHorizontal, Wallet, Banknote, ArrowRight, Inbox,
  History, AlertCircle, ChevronUp, FileText,
  Layers, FolderOpen,
} from "lucide-react";
import { normalizeDomain } from "@/domain/normalizacion";
import {
  useQdLista, useQdDetalle, useQdCrear, useQdActualizar, useQdEliminar,
  useQdEstados, useQdResultados, useQdAreas, useQdProductos, useQdTiposQueja,
  useQdDominios, useQdCerrarCaso, useQdReabrirCaso, useQdConsolidarCasos,
  useQdVincularTicket,
  qdService,
} from "@/modules/quejas-devoluciones";
import type { QdCaso, QdInteraccion, QdTipo } from "@/modules/quejas-devoluciones";
import {
  CasoAbiertoBadge, EstadoBadge, ResultadoBadge, TipoBadge, OrigenBadge,
  SinDominioBadge, fechaCasoSolicitud, fmtFecha, fmtMoneda, fmtPct,
} from "@/modules/quejas-devoluciones/components/qdUI";
import { useAuth, authService } from "@/modules/auth";
import { cn } from "@/lib/utils";
import { clavePais, etiquetaPais } from "@/lib/paises";

type Filtro = "todas" | QdTipo;

interface Filtros {
  desde: string;   // YYYY-MM-DDTHH:mm (local) — conserva hora
  hasta: string;   // YYYY-MM-DDTHH:mm (local) — conserva hora
  pais: string;
  estado: string;
  resultado: string;
  asesor: string;
  area: string;
  producto: string;
  tipoQueja: string;
}

const VACIO: Filtros = { desde: "", hasta: "", pais: "", estado: "", resultado: "", asesor: "", area: "", producto: "", tipoQueja: "" };

function pad(n: number): string { return String(n).padStart(2, "0"); }

/** Formatea una fecha local como YYYY-MM-DDTHH:mm (conserva hora). */
function toLocalDT(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Filtros iniciales: Desde = primer día del mes actual 00:00, Hasta = fecha/hora actual. */
function filtrosIniciales(): Filtros {
  const ahora = new Date();
  const desde = new Date(ahora.getFullYear(), ahora.getMonth(), 1, 0, 0, 0);
  return { ...VACIO, desde: toLocalDT(desde), hasta: toLocalDT(ahora) };
}

/** Parte de fecha (YYYY-MM-DD) de un valor YYYY-MM-DDTHH:mm. */
function datePart(v: string): string { return v ? v.split("T")[0] : ""; }

type KpiTone = "primary" | "success" | "warning" | "danger" | "neutral" | "purple" | "aqua";

const KPI_TONE: Record<KpiTone, string> = {
  primary: "border-primary-10 bg-primary-5 text-primary",
  success: "border-success-10 bg-success-5 text-success",
  warning: "border-warning-10 bg-warning-5 text-warning-65",
  danger: "border-danger-10 bg-danger-5 text-danger",
  neutral: "border-black-10 bg-black-5 text-black-65",
  purple: "border-purple-10 bg-purple-5 text-purple",
  aqua: "border-aqua-10 bg-aqua-5 text-aqua",
};

function KpiCard({
  icon: Icon, label, pen, usd, count, hint, tone = "neutral", loading = false,
}: {
  icon: React.ElementType;
  label: string;
  pen?: number;
  usd?: number;
  count?: number;
  hint?: string;
  tone?: KpiTone;
  loading?: boolean;
}) {
  return (
    <div className="rounded-xl border border-black-10 bg-white p-4 transition-shadow hover:shadow-[0_2px_8px_rgba(15,23,42,0.05)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-black-45">{label}</p>
          {loading ? (
            <div className="mt-2 h-7 w-24 animate-pulse rounded-md bg-black-5" />
          ) : count != null ? (
            <p className="mt-2 text-[26px] font-semibold leading-none tracking-tight text-black-85">{count}</p>
          ) : (
            <>
              <p className="mt-2 text-[20px] font-semibold leading-tight tracking-tight text-black-85">{fmtMoneda(pen ?? 0, "PEN")}</p>
              <p className="mt-0.5 text-[12px] text-black-45">{fmtMoneda(usd ?? 0, "USD")}</p>
            </>
          )}
          {hint ? <p className="mt-1.5 text-[11px] text-black-25">{hint}</p> : null}
        </div>
        <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border", KPI_TONE[tone])}>
          <Icon size={16} />
        </span>
      </div>
    </div>
  );
}

export default function QuejasDevoluciones() {
  const { user } = useAuth();
  const puedeCrear = authService.hasPermiso(user, "Quejas y Devoluciones", "crear");
  const puedeEditar = authService.hasPermiso(user, "Quejas y Devoluciones", "editar");
  const puedeEliminar = authService.hasPermiso(user, "Quejas y Devoluciones", "eliminar");
  const puedeExportar = authService.hasPermiso(user, "Quejas y Devoluciones", "exportar");
  const puedeAdministrar = authService.hasPermiso(user, "Quejas y Devoluciones", "administrar");

  const [searchParams] = useSearchParams();
  const casoParam = searchParams.get("caso");
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [casoId, setCasoId] = useState<string | null>(() => casoParam);
  const [creando, setCreando] = useState(false);
  const [buscador, setBuscador] = useState("");
  const [draft, setDraft] = useState<Filtros>(() => filtrosIniciales());
  const [applied, setApplied] = useState<Filtros>(() => filtrosIniciales());
  const [aplicando, setAplicando] = useState(false);
  const [filtrosAvanzados, setFiltrosAvanzados] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [errorExport, setErrorExport] = useState<string | null>(null);

  const [selCasos, setSelCasos] = useState<Set<string>>(new Set());
  const [consolidando, setConsolidando] = useState(false);
  const [confirmandoCerrar, setConfirmandoCerrar] = useState(false);
  const [confirmandoReabrir, setConfirmandoReabrir] = useState(false);

  useEffect(() => {
    if (casoParam) {
      setCasoId(casoParam);
      setCreando(false);
    }
  }, [casoParam]);

  const { data: devoluciones, isLoading: loadD, isFetching: fetchD, error: errD, refetch: refD } = useQdLista("devolucion");
  const { data: quejas, isLoading: loadQ, isFetching: fetchQ, error: errQ, refetch: refQ } = useQdLista("queja");
  const { data: detalle } = useQdDetalle(casoId);
  const crear = useQdCrear();
  const actualizar = useQdActualizar();
  const eliminar = useQdEliminar();
  const cerrar = useQdCerrarCaso();
  const reabrir = useQdReabrirCaso();
  const consolidar = useQdConsolidarCasos();
  const vincular = useQdVincularTicket();
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false);

  const estados = useQdEstados().data ?? [];
  const resultados = useQdResultados().data ?? [];
  const areas = useQdAreas().data ?? [];
  const productos = useQdProductos().data ?? [];
  const tiposQueja = useQdTiposQueja().data ?? [];
  const dominios = useQdDominios().data ?? [];

  const todos = useMemo(() => [...(devoluciones ?? []), ...(quejas ?? [])], [devoluciones, quejas]);
  const cargando = filtro === "todas" ? loadD || loadQ : filtro === "devolucion" ? loadD : loadQ;
  const actualizando = filtro === "todas" ? fetchD || fetchQ : filtro === "devolucion" ? fetchD : fetchQ;
  const error = filtro === "todas" ? errD ?? errQ : filtro === "devolucion" ? errD : errQ;
  const reintentar = () => { refD(); refQ(); };

  // Base filtrada por búsqueda, período y filtros. Conserva ambos tipos para
  // que las pestañas y los KPI ejecutivos mantengan los totales reales.
  const filtradaBase = useMemo(() => {
    return todos.filter((c) => {
      const q = buscador.trim().toLowerCase();
      if (q && ![c.numero, c.ticket_id, c.dominio, c.pais, c.motivo, c.clasificacion, c.producto, c.area]
        .some((v) => (v ?? "").toLowerCase().includes(q))) return false;
      const fs = c.fecha_solicitud ?? (c.created_at ? c.created_at.slice(0, 10) : "");
      const dentroRango = (!applied.desde || fs >= applied.desde) && (!applied.hasta || fs <= applied.hasta);
      if (!dentroRango && c.caso_cerrado) return false;
      if (applied.pais && clavePais(c.pais) !== applied.pais) return false;
      if (applied.estado && c.estado !== applied.estado) return false;
      if (applied.resultado && c.resultado !== applied.resultado) return false;
      if (applied.asesor && c.asesor !== applied.asesor) return false;
      if (applied.area && c.area !== applied.area) return false;
      if (applied.producto && c.producto !== applied.producto) return false;
      if (applied.tipoQueja && c.clasificacion !== applied.tipoQueja) return false;
      return true;
    });
  }, [todos, buscador, applied]);

  const filtrada = useMemo(
    () => filtro === "todas" ? filtradaBase : filtradaBase.filter((c) => c.tipo === filtro),
    [filtradaBase, filtro],
  );

  const conteosTipo = useMemo(() => ({
    todas: filtradaBase.length,
    queja: filtradaBase.filter((c) => c.tipo === "queja").length,
    devolucion: filtradaBase.filter((c) => c.tipo === "devolucion").length,
  }), [filtradaBase]);

  const resumenKpis = useMemo(() => {
    const devs = filtradaBase.filter((c) => c.tipo === "devolucion");
    const qjas = filtradaBase.filter((c) => c.tipo === "queja");
    let solicPEN = 0, solicUSD = 0, noProcPEN = 0, noProcUSD = 0, devPEN = 0, devUSD = 0, pendPEN = 0, pendUSD = 0;
    for (const c of devs) {
      const mp = Number(c.monto_pagado) || 0;
      const md = Number(c.monto_devuelto) || 0;
      const esPEN = c.moneda === "PEN";
      const esUSD = c.moneda === "USD";
      const r = c.resultado ?? "";
      if (esPEN) solicPEN += mp; else if (esUSD) solicUSD += mp;
      if (r === "No procede") {
        if (esPEN) noProcPEN += mp; else if (esUSD) noProcUSD += mp;
      } else if (r === "Procede parcialmente") {
        if (esPEN) { devPEN += md; noProcPEN += mp - md; }
        else if (esUSD) { devUSD += md; noProcUSD += mp - md; }
      } else if (r === "Procede 100%") {
        if (esPEN) devPEN += md; else if (esUSD) devUSD += md;
      } else if (r === "Pendiente") {
        if (esPEN) { pendPEN += md; noProcPEN += mp - md; }
        else if (esUSD) { pendUSD += md; noProcUSD += mp - md; }
      }
    }
    const cerrados = filtradaBase.filter((c) => {
      const estado = (c.estado ?? "").trim().toLowerCase();
      return c.caso_cerrado || estado === "resuelto" || estado === "cerrado";
    }).length;
    const pendientesConciliacion = filtradaBase.filter(
      (c) => (c.estado ?? "").trim().toLowerCase().includes("pendiente de conciliación"),
    ).length;
    return {
      solicPEN, solicUSD, noProcPEN, noProcUSD, devPEN, devUSD, pendPEN, pendUSD,
      totalQuejas: qjas.length,
      totalDevoluciones: devs.length,
      totalCasos: filtradaBase.length,
      abiertos: filtradaBase.length - cerrados,
      cerrados,
      pendientesConciliacion,
    };
  }, [filtradaBase]);

  const hayFiltros = Object.values(draft).some((v) => v !== "");

  const setFiltroVal = (k: keyof Filtros, v: string) => setDraft((prev) => ({ ...prev, [k]: v }));

  const seleccionados = useMemo(
    () => filtrada.filter((c) => selCasos.has(c.id)),
    [filtrada, selCasos],
  );

  const toggleSel = (c: QdCaso) => {
    if (c.caso_cerrado) return;
    setSelCasos((prev) => {
      const next = new Set(prev);
      if (next.has(c.id)) next.delete(c.id); else next.add(c.id);
      return next;
    });
  };

  const limpiarSel = () => setSelCasos(new Set());

  const cambiarFiltro = (t: Filtro) => { setFiltro(t); setCasoId(null); limpiarSel(); };

  /** Aplicar filtros: copia draft → applied y recalcula la tabla (client-side). */
  const aplicar = () => {
    if (aplicando) return;
    setAplicando(true);
    setApplied(draft);
    setTimeout(() => setAplicando(false), 250);
  };

  /** Limpiar: restaura el periodo inicial y actualiza la tabla de inmediato. */
  const limpiar = () => {
    const inicial = filtrosIniciales();
    setDraft(inicial);
    setApplied(inicial);
    limpiarSel();
  };

  const exportarExcel = async (todo = false) => {
    setErrorExport(null);
    setExportando(true);
    try {
      const res = await qdService.exportar({
        tipo: todo ? "todas" : filtro,
        desde: todo ? "" : datePart(applied.desde),
        hasta: todo ? "" : datePart(applied.hasta),
        pais: todo ? "" : applied.pais,
        estado: todo ? "" : applied.estado,
        resultado: todo ? "" : applied.resultado,
        asesor: todo ? "" : applied.asesor,
        area: todo ? "" : applied.area,
        producto: todo ? "" : applied.producto,
        tipoQueja: todo ? "" : applied.tipoQueja,
      });
      const url = URL.createObjectURL(res.blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.nombre;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setErrorExport(e?.response?.data?.error ?? e?.message ?? "Error al exportar");
    } finally {
      setExportando(false);
    }
  };

  const filtrosActivos = Object.entries(applied).filter(
    ([k, v]) => k !== "desde" && k !== "hasta" && Boolean(v),
  ).length;
  const periodoLabel = `${datePart(applied.desde) ? fmtFecha(applied.desde) : "Inicio"} — ${datePart(applied.hasta) ? fmtFecha(applied.hasta) : "Hoy"}`;

  return (
    <div className="flex flex-1 min-h-0 flex-col bg-light-5">
      <header className="shrink-0 border-b border-black-10 bg-white px-6 py-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex min-w-0 items-start gap-3.5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary-10 bg-primary-5 text-primary">
              <RefreshCcw size={20} />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[22px] font-semibold leading-tight tracking-tight text-black-85">Quejas y Devoluciones</h1>
                <span className="rounded-full border border-primary-25 bg-primary-5 px-2.5 py-0.5 text-[11px] font-medium text-primary">Gestión QyD</span>
              </div>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-black-45">
                Seguimiento ejecutivo de quejas, devoluciones y conciliaciones de clientes.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {actualizando && !cargando ? (
              <span className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-black-10 bg-white px-3 text-[12px] text-black-45">
                <RefreshCcw size={14} className="animate-spin" /> Actualizando
              </span>
            ) : null}
            {puedeAdministrar && (
              <button
                type="button"
                onClick={() => exportarExcel(true)}
                disabled={exportando}
                title="Exportar el histórico completo sin aplicar filtros"
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-black-10 bg-white px-3 text-sm font-medium text-black-65 transition-colors hover:bg-light disabled:opacity-50"
              >
                <Download size={16} /> Exportar todo
              </button>
            )}
            {puedeExportar && (
              <button
                type="button"
                onClick={() => exportarExcel(false)}
                disabled={exportando}
                title={hayFiltros ? "Exportar los casos que cumplen los filtros activos" : "Exportar todos los casos (sin filtros)"}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-black-10 bg-white px-3 text-sm font-medium text-black-65 transition-colors hover:bg-light disabled:opacity-50"
              >
                <Download size={16} /> {exportando ? "Exportando…" : "Exportar"}
              </button>
            )}
            {puedeCrear && (
              <button
                type="button"
                onClick={() => setCreando(true)}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-85"
              >
                <Plus size={16} /> Nuevo caso
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="space-y-5 px-6 py-5">
          <section>
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="text-[18px] font-semibold tracking-tight text-black-85">Resumen ejecutivo</h2>
                <p className="mt-0.5 text-[13px] text-black-45">Indicadores calculados sobre los expedientes filtrados.</p>
              </div>
              <span className="rounded-full border border-black-10 bg-white px-3 py-1 text-[12px] text-black-45">{periodoLabel}</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <KpiCard icon={Layers} label="Expedientes" count={resumenKpis.totalCasos} hint="total filtrado" tone="primary" loading={cargando} />
              <KpiCard icon={MessageSquare} label="Quejas" count={resumenKpis.totalQuejas} hint="casos de queja" tone="purple" loading={cargando} />
              <KpiCard icon={RotateCcw} label="Devoluciones" count={resumenKpis.totalDevoluciones} hint="solicitudes" tone="aqua" loading={cargando} />
              <KpiCard icon={FolderOpen} label="Abiertos" count={resumenKpis.abiertos} hint="en gestión" tone="success" loading={cargando} />
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <KpiCard icon={CheckCircle2} label="Cerrados / resueltos" count={resumenKpis.cerrados} hint="histórico" tone="neutral" loading={cargando} />
              <KpiCard icon={Clock} label="Pend. conciliación" count={resumenKpis.pendientesConciliacion} hint="por regularizar" tone="warning" loading={cargando} />
              <KpiCard icon={Wallet} label="Monto solicitado" pen={resumenKpis.solicPEN} usd={resumenKpis.solicUSD} tone="primary" loading={cargando} />
              <KpiCard icon={Banknote} label="Monto devuelto" pen={resumenKpis.devPEN} usd={resumenKpis.devUSD} tone="success" loading={cargando} />
              <KpiCard icon={XCircle} label="Monto no procedente" pen={resumenKpis.noProcPEN} usd={resumenKpis.noProcUSD} tone="danger" loading={cargando} />
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-black-10 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black-10 px-4 py-3">
              <div className="flex flex-wrap items-center gap-3">
                <nav className="flex rounded-lg bg-black-5 p-1" aria-label="Filtro por tipo de expediente">
                  {(["todas", "queja", "devolucion"] as Filtro[]).map((t) => {
                    const total = conteosTipo[t];
                    const activo = filtro === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => cambiarFiltro(t)}
                        className={cn(
                          "inline-flex h-9 items-center gap-2 rounded-md px-3 text-[13px] font-medium transition-colors",
                          activo ? "bg-white text-primary shadow-sm" : "text-black-45 hover:text-black-85",
                        )}
                      >
                        {t === "todas" ? "Todos" : t === "queja" ? "Quejas" : "Devoluciones"}
                        <span className={cn("rounded-full px-1.5 text-[11px] leading-5", activo ? "bg-primary-5 text-primary" : "bg-black-10 text-black-45")}>
                          {total}
                        </span>
                      </button>
                    );
                  })}
                </nav>
                <span className="text-[12px] text-black-45">
                  {filtrada.length} resultado{filtrada.length === 1 ? "" : "s"}
                </span>
              </div>
              <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
                {puedeAdministrar && seleccionados.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setConsolidando(true)}
                    title={`Consolidar ${seleccionados.length} caso(s) seleccionado(s)`}
                    className="inline-flex h-10 items-center gap-2 rounded-lg border border-primary-25 bg-primary-5 px-3 text-sm font-medium text-primary transition-colors hover:bg-primary-10"
                  >
                    <GitMerge size={16} /> Consolidar ({seleccionados.length})
                  </button>
                )}
                <div className="relative w-full min-w-[240px] sm:w-auto sm:min-w-[320px]">
                  <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black-25" />
                  <input
                    value={buscador}
                    onChange={(e) => setBuscador(e.target.value)}
                    placeholder="Buscar ticket, cliente o dominio…"
                    className="h-10 w-full rounded-lg border border-black-10 bg-white pl-9 pr-3 text-sm text-black-85 transition-colors placeholder:text-black-25 focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="border-b border-black-10 bg-light-5/40 px-4 py-3">
              <div className="flex flex-wrap items-end gap-2.5">
                <FilterField label="Desde">
                  <input
                    type="date"
                    value={datePart(draft.desde)}
                    onChange={(e) => e.target.value ? setFiltroVal("desde", `${e.target.value}T00:00`) : setFiltroVal("desde", "")}
                    className="h-10 rounded-lg border border-black-10 bg-white px-3 text-sm text-black-85 focus:border-primary focus:outline-none"
                    title={`Desde · ${draft.desde || ""}`}
                  />
                </FilterField>
                <FilterField label="Hasta">
                  <input
                    type="date"
                    value={datePart(draft.hasta)}
                    onChange={(e) => e.target.value ? setFiltroVal("hasta", `${e.target.value}T23:59`) : setFiltroVal("hasta", "")}
                    className="h-10 rounded-lg border border-black-10 bg-white px-3 text-sm text-black-85 focus:border-primary focus:outline-none"
                    title={`Hasta · ${draft.hasta || ""}`}
                  />
                </FilterField>
                <FilterField label="País">
                  <Select value={draft.pais} onChange={(v) => setFiltroVal("pais", v)} options={paises(todos)} placeholder="Todos" />
                </FilterField>
                <FilterField label="Estado">
                  <Select value={draft.estado} onChange={(v) => setFiltroVal("estado", v)} options={estados.map((e) => ({ value: e.nombre, label: e.nombre }))} placeholder="Todos" />
                </FilterField>
                <FilterField label="Resultado">
                  <Select value={draft.resultado} onChange={(v) => setFiltroVal("resultado", v)} options={resultados.map((r) => ({ value: r.nombre, label: r.nombre }))} placeholder="Todos" />
                </FilterField>
                <div className="ml-auto flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFiltrosAvanzados((v) => !v)}
                    className="inline-flex h-10 items-center gap-2 rounded-lg border border-black-10 bg-white px-3 text-sm font-medium text-black-65 transition-colors hover:bg-light"
                  >
                    <SlidersHorizontal size={16} /> Más filtros
                    {filtrosActivos > 0 && <span className="rounded-full bg-primary-5 px-1.5 text-[11px] text-primary">{filtrosActivos}</span>}
                    {filtrosAvanzados ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>
                  <button
                    type="button"
                    onClick={aplicar}
                    disabled={aplicando}
                    className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary-85 disabled:opacity-50"
                  >
                    {aplicando ? <RefreshCcw size={15} className="animate-spin" /> : <Search size={15} />}
                    {aplicando ? "Aplicando…" : "Aplicar filtros"}
                  </button>
                  <button
                    type="button"
                    onClick={limpiar}
                    disabled={aplicando}
                    className="h-10 rounded-lg border border-black-10 bg-white px-3 text-sm text-black-45 transition-colors hover:bg-light disabled:opacity-50"
                  >
                    Limpiar
                  </button>
                </div>
              </div>
              {filtrosAvanzados && (
                <div className="mt-3 grid grid-cols-1 gap-2.5 border-t border-black-10 pt-3 sm:grid-cols-2 xl:grid-cols-4">
                  <FilterField label="Asesor">
                    <Select value={draft.asesor} onChange={(v) => setFiltroVal("asesor", v)} options={asesores(todos)} placeholder="Todos" />
                  </FilterField>
                  <FilterField label="Área">
                    <Select value={draft.area} onChange={(v) => setFiltroVal("area", v)} options={areas.map((a) => ({ value: a.nombre, label: a.nombre }))} placeholder="Todas" />
                  </FilterField>
                  <FilterField label="Producto">
                    <Select value={draft.producto} onChange={(v) => setFiltroVal("producto", v)} options={productos.map((p) => ({ value: p.nombre, label: p.nombre }))} placeholder="Todos" />
                  </FilterField>
                  <FilterField label="Tipo de queja">
                    <Select value={draft.tipoQueja} onChange={(v) => setFiltroVal("tipoQueja", v)} options={tiposQueja.map((t) => ({ value: t.nombre, label: t.nombre }))} placeholder="Todos" />
                  </FilterField>
                </div>
              )}
              {errorExport && (
                <p className="mt-2 flex items-center gap-1.5 text-[12px] text-danger">
                  <AlertCircle size={14} /> {errorExport}
                </p>
              )}
            </div>

            <div className="flex min-h-0 flex-col xl:flex-row">
              <div className="min-w-0 flex-1">
                {cargando ? (
                  <QdTableSkeleton />
                ) : error ? (
                  <QdErrorState onRetry={reintentar} />
                ) : filtrada.length === 0 ? (
                  <QdEmptyState puedeCrear={puedeCrear} onCrear={() => setCreando(true)} />
                ) : (
                  <div className="max-h-[calc(100vh-390px)] min-h-[320px] overflow-auto">
                    <table className="w-full min-w-[1500px] border-collapse text-left text-[13px]">
                      <thead className="sticky top-0 z-10 bg-white">
                        <tr className="border-b border-black-10 text-[13px] font-semibold uppercase tracking-[0.04em] text-black-45">
                          {puedeAdministrar && <th className="w-12 px-4 py-3 font-semibold" title="Seleccionar para consolidar">Sel.</th>}
                          <th className="px-4 py-3 font-semibold">Caso</th>
                          <th className="px-4 py-3 font-semibold">Tipo</th>
                          <th className="px-4 py-3 font-semibold">Fecha</th>
                          <th className="px-4 py-3 font-semibold">Ticket</th>
                          <th className="px-4 py-3 font-semibold">Cliente / dominio</th>
                          <th className="px-4 py-3 font-semibold">País</th>
                          <th className="px-4 py-3 text-right font-semibold">Monto / detalle</th>
                          <th className="px-4 py-3 font-semibold">Estado</th>
                          <th className="px-4 py-3 font-semibold">Resultado</th>
                          <th className="px-4 py-3 font-semibold">Asesor</th>
                          <th className="px-4 py-3 font-semibold">Últ. actualización</th>
                          <th className="px-4 py-3 font-semibold">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black-5">
                        {filtrada.map((c) => (
                          <tr
                            key={c.id}
                            onClick={() => { setCasoId(c.id); setCreando(false); }}
                            className={cn(
                              "group min-h-[72px] cursor-pointer transition-colors hover:bg-primary-5/30",
                              selCasos.has(c.id) && "bg-primary-5/60",
                            )}
                          >
                            {puedeAdministrar && (
                              <td className="px-4 py-3 align-middle" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={selCasos.has(c.id)}
                                  disabled={c.caso_cerrado}
                                  onChange={() => toggleSel(c)}
                                  title={c.caso_cerrado ? "Los casos cerrados no se pueden consolidar" : "Seleccionar para consolidar"}
                                  className="h-4 w-4 rounded border-black-25 accent-primary disabled:cursor-not-allowed disabled:opacity-40"
                                />
                              </td>
                            )}
                            <td className="px-4 py-3 align-middle">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[13px] font-semibold text-primary">{c.numero}</span>
                                {c.consolidado_en && <span className="rounded-full border border-black-10 bg-black-5 px-1.5 py-0.5 text-[10px] text-black-45">Consolidado</span>}
                              </div>
                              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                <CasoAbiertoBadge cerrado={c.caso_cerrado} />
                                <OrigenBadge origen={c.origen} />
                              </div>
                            </td>
                            <td className="px-4 py-3 align-middle"><TipoBadge tipo={c.tipo} /></td>
                            <td className="whitespace-nowrap px-4 py-3 align-middle text-black-65">{fechaCasoSolicitud(c)}</td>
                            <td className="px-4 py-3 align-middle">
                              <span className="font-mono text-[13px] text-black-65">{c.ticket_id || "—"}</span>
                              {c.total_interacciones != null && c.total_interacciones > 1 && (
                                <span className="ml-1.5 rounded-full bg-primary-5 px-1.5 py-0.5 text-[10px] font-medium text-primary">{c.total_interacciones} tickets</span>
                              )}
                            </td>
                            <td className="px-4 py-3 align-middle">
                              {c.dominio ? (
                                <span className="block max-w-[220px] truncate text-[13px] text-black-85" title={c.dominio}>{c.dominio}</span>
                              ) : (
                                <SinDominioBadge />
                              )}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 align-middle text-black-65">{c.pais || "—"}</td>
                            <td className="px-4 py-3 text-right align-middle">
                              {c.tipo === "devolucion" ? (
                                <div className="space-y-0.5">
                                  <div className="text-[13px] font-semibold text-black-85">{fmtMoneda(c.monto_pagado, c.moneda)}</div>
                                  <div className="text-[12px] text-black-45">A devolver: {c.monto_devuelto == null ? "—" : fmtMoneda(c.monto_devuelto, c.moneda)}</div>
                                  {c.porcentaje != null && <div className="text-[11px] font-medium text-primary">{fmtPct(c.porcentaje)} conciliado</div>}
                                </div>
                              ) : (
                                <div className="space-y-0.5">
                                  <div className="text-[13px] text-black-85">{c.clasificacion || "—"}</div>
                                  <div className="max-w-[190px] truncate text-[12px] text-black-45" title={c.area || c.producto || c.motivo || ""}>
                                    {c.area || c.producto || (c.motivo ? c.motivo.slice(0, 48) : "—")}
                                  </div>
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 align-middle"><EstadoBadge estado={c.estado} /></td>
                            <td className="px-4 py-3 align-middle">
                              {c.resultado ? <ResultadoBadge resultado={c.resultado} /> : <span className="text-black-25">—</span>}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 align-middle text-black-65">{c.asesor || "—"}</td>
                            <td className="whitespace-nowrap px-4 py-3 align-middle text-black-45">{fmtFecha(c.updated_at)}</td>
                            <td className="px-4 py-3 align-middle">
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setCasoId(c.id); setCreando(false); }}
                                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-primary-25 bg-white px-3 text-[12px] font-medium text-primary transition-colors hover:bg-primary-5"
                              >
                                Abrir <ArrowRight size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {creando && (
                <CasoForm
                  estados={estados} resultados={resultados} areas={areas} productos={productos} tiposQueja={tiposQueja}
                  onClose={() => setCreando(false)}
                  onSave={async (input) => {
                    const c = await crear.mutateAsync(input);
                    setCreando(false);
                    setCasoId(c.id);
                    return;
                  }}
                />
              )}
              {!creando && casoId && detalle && (
                <CasoDetalle
                  caso={detalle.caso}
                  interacciones={detalle.interacciones ?? []}
                  auditoria={detalle.auditoria}
                  dominios={dominios}
                  puedeEditar={puedeEditar}
                  puedeEliminar={puedeEliminar && detalle.caso.origen === "MANUAL"}
                  confirmandoEliminar={confirmandoEliminar}
                  setConfirmandoEliminar={setConfirmandoEliminar}
                  onEliminar={async () => {
                    await eliminar.mutateAsync(detalle.caso.id);
                    setConfirmandoEliminar(false);
                    setCasoId(null);
                  }}
                  confirmandoCerrar={confirmandoCerrar}
                  setConfirmandoCerrar={setConfirmandoCerrar}
                  onCerrarCaso={async () => {
                    await cerrar.mutateAsync(detalle.caso.id);
                    setConfirmandoCerrar(false);
                  }}
                  confirmandoReabrir={confirmandoReabrir}
                  setConfirmandoReabrir={setConfirmandoReabrir}
                  onReabrirCaso={async () => {
                    await reabrir.mutateAsync(detalle.caso.id);
                    setConfirmandoReabrir(false);
                  }}
                  onVincularTicket={async (ticketId, canal) => {
                    await vincular.mutateAsync({ casoId: detalle.caso.id, ticketId, canal });
                  }}
                  estados={estados} resultados={resultados} areas={areas} productos={productos} tiposQueja={tiposQueja}
                  onActualizar={async (input) => actualizar.mutateAsync({ id: detalle.caso.id, input })}
                  onCerrar={() => setCasoId(null)}
                />
              )}
            </div>
          </section>
        </div>
      </div>

      {consolidando && (
        <ConsolidarModal
          casos={seleccionados}
          onClose={() => { setConsolidando(false); limpiarSel(); }}
          onConfirmar={async (principalId, motivo) => {
            const ids = seleccionados.map((c) => c.id).filter((id) => id !== principalId);
            await consolidar.mutateAsync({ principalId, casosIds: ids, motivo });
            setConsolidando(false);
            limpiarSel();
          }}
        />
      )}
    </div>
  );
}

/* ============================================================ */

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex min-w-[132px] flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-black-45">{label}</span>
      {children}
    </label>
  );
}

function Select({ value, onChange, options, placeholder }: {
  value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; placeholder: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 min-w-[140px] rounded-lg border border-black-10 bg-white px-3 text-sm text-black-85 transition-colors focus:border-primary focus:outline-none"
    >
      <option value="">{placeholder}</option>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function QdTableSkeleton() {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="h-14 animate-pulse rounded-lg bg-black-5" style={{ opacity: 1 - i * 0.08 }} />
      ))}
    </div>
  );
}

function QdErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center p-8 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-danger-10 bg-danger-5 text-danger">
        <AlertCircle size={20} />
      </span>
      <p className="mt-3 text-sm font-semibold text-black-85">No pudimos cargar los expedientes</p>
      <p className="mt-1 max-w-md text-[13px] text-black-45">Revisa la conexión o reintenta la consulta.</p>
      <button type="button" onClick={onRetry} className="mt-3 inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary-85">
        <RefreshCcw size={15} /> Reintentar
      </button>
    </div>
  );
}

function QdEmptyState({ puedeCrear, onCrear }: { puedeCrear: boolean; onCrear: () => void }) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center p-8 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-black-10 bg-black-5 text-black-45">
        <Inbox size={20} />
      </span>
      <p className="mt-3 text-sm font-semibold text-black-85">No hay expedientes con estos filtros</p>
      <p className="mt-1 max-w-md text-[13px] text-black-45">Ajusta el periodo, limpia los filtros o crea un expediente manual.</p>
      {puedeCrear && (
        <button type="button" onClick={onCrear} className="mt-3 inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary-85">
          <Plus size={15} /> Nuevo caso
        </button>
      )}
    </div>
  );
}

function paises(casos: QdCaso[]): { value: string; label: string }[] {
  const mapa = new Map<string, string>();
  for (const c of casos) {
    if (!c.pais) continue;
    const clave = clavePais(c.pais);
    if (!clave || mapa.has(clave)) continue;
    mapa.set(clave, etiquetaPais(c.pais));
  }
  return [...mapa.entries()]
    .sort((a, b) => a[1].localeCompare(b[1], "es"))
    .map(([value, label]) => ({ value, label }));
}
function asesores(casos: QdCaso[]): { value: string; label: string }[] {
  return [...new Set(casos.map((c) => c.asesor).filter(Boolean) as string[])].map((a) => ({ value: a, label: a }));
}

/* ============================================================ */

function CasoForm({ estados, resultados, areas, productos, tiposQueja, onClose, onSave }: {
  estados: any[]; resultados: any[]; areas: any[]; productos: any[]; tiposQueja: any[];
  onClose: () => void; onSave: (input: any) => Promise<unknown>;
}) {
  const [tipo, setTipo] = useState<QdTipo | null>(null);
  const [guardando, setGuardando] = useState(false);
  const todayStr = new Date().toLocaleDateString("sv-SE"); // YYYY-MM-DD
  const [form, setForm] = useState<any>({
    ticketId: "", dominio: "", pais: "", estado: "", fechaSolicitud: todayStr, resultado: "",
    moneda: "PEN", montoPagado: "", tipoMonto: "", area: "", motivo: "", porcentaje: "", montoDevuelto: "",
    clasificacion: "", producto: "", observacion: "",
  });
  const [error, setError] = useState<string | null>(null);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const montoPagado = form.montoPagado ? Number(form.montoPagado) : null;
  const porcentaje = form.porcentaje !== "" ? Number(form.porcentaje) : null;
  const calculado = montoPagado != null && porcentaje != null ? montoPagado * (porcentaje / 100) : null;

  const guardar = async () => {
    if (guardando) return;
    setError(null);
    if (!tipo) { setError("Selecciona el tipo de caso."); return; }
    if (!form.fechaSolicitud) { setError("Ingresa la fecha de solicitud."); return; }
    setGuardando(true);
    try {
      const input: any = {
        tipo,
        ticketId: form.ticketId.trim() || null,
        dominio: form.dominio.trim() || null,
        pais: form.pais.trim() || null,
        estado: form.estado || null,
        resultado: form.resultado || null,
        area: form.area || null,
        motivo: form.motivo || null,
        observacion: form.observacion || null,
        fechaSolicitud: form.fechaSolicitud || null,
      };
      if (tipo === "devolucion") {
        input.moneda = form.moneda || "PEN";
        input.montoPagado = montoPagado;
        input.tipoMonto = form.tipoMonto || null;
        input.porcentaje = porcentaje;
        input.montoDevuelto = form.montoDevuelto !== "" ? Number(form.montoDevuelto) : calculado;
      } else {
        input.clasificacion = form.clasificacion || null;
        input.producto = form.producto || null;
      }
      await onSave(input);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? e.message ?? "Error");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="flex w-full shrink-0 flex-col border-t border-black-10 bg-white xl:w-[520px] xl:border-l xl:border-t-0">
      <div className="flex items-start justify-between border-b border-black-10 px-5 py-4">
        <div>
          <h2 className="text-[18px] font-semibold tracking-tight text-black-85">Nuevo expediente</h2>
          <p className="mt-0.5 text-[13px] text-black-45">Registra un caso manual de Quejas y Devoluciones.</p>
        </div>
        <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-black-45 transition-colors hover:bg-light hover:text-black-85"><X size={18} /></button>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        {!tipo ? (
          <div className="space-y-3">
            <p className="text-[13px] font-medium text-black-65">Selecciona el tipo de expediente</p>
            <button type="button" onClick={() => setTipo("queja")} className="flex w-full items-center gap-3 rounded-xl border border-black-10 bg-white p-4 text-left transition-colors hover:border-primary-25 hover:bg-primary-5/40">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary-10 bg-primary-5 text-primary"><MessageSquare size={18} /></span>
              <span><span className="block text-sm font-semibold text-black-85">Queja</span><span className="block text-[12px] text-black-45">Reclamo de servicio, producto u otro.</span></span>
            </button>
            <button type="button" onClick={() => setTipo("devolucion")} className="flex w-full items-center gap-3 rounded-xl border border-black-10 bg-white p-4 text-left transition-colors hover:border-purple-25 hover:bg-purple-5/40">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-purple-10 bg-purple-5 text-purple"><RotateCcw size={18} /></span>
              <span><span className="block text-sm font-semibold text-black-85">Devolución</span><span className="block text-[12px] text-black-45">Solicitud de devolución y conciliación económica.</span></span>
            </button>
          </div>
        ) : (
          <>
            <div className="rounded-xl border border-black-10 p-4">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.07em] text-black-45">Identificación</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <CampoDato label="Ticket"><input value={form.ticketId} onChange={(e) => set("ticketId", e.target.value)} placeholder="Número de ticket" className="h-10 w-full rounded-lg border border-black-10 px-3 text-sm focus:border-primary focus:outline-none" /></CampoDato>
                <CampoDato label="Dominio"><input value={form.dominio} onChange={(e) => set("dominio", e.target.value)} placeholder="cliente.restaurant.pe" className="h-10 w-full rounded-lg border border-black-10 px-3 text-sm focus:border-primary focus:outline-none" /></CampoDato>
                <CampoDato label="País"><input value={form.pais} onChange={(e) => set("pais", e.target.value)} placeholder="País" className="h-10 w-full rounded-lg border border-black-10 px-3 text-sm focus:border-primary focus:outline-none" /></CampoDato>
                <CampoDato label="Fecha de solicitud *"><input type="date" value={form.fechaSolicitud} onChange={(e) => set("fechaSolicitud", e.target.value)} className="h-10 w-full rounded-lg border border-black-10 px-3 text-sm focus:border-primary focus:outline-none" /></CampoDato>
                <CampoDato label="Estado"><select value={form.estado} onChange={(e) => set("estado", e.target.value)} className="h-10 w-full rounded-lg border border-black-10 px-3 text-sm focus:border-primary focus:outline-none"><option value="">Seleccionar…</option>{estados.map((e) => <option key={e.id} value={e.nombre}>{e.nombre}</option>)}</select></CampoDato>
                <CampoDato label="Resultado"><select value={form.resultado} onChange={(e) => set("resultado", e.target.value)} className="h-10 w-full rounded-lg border border-black-10 px-3 text-sm focus:border-primary focus:outline-none"><option value="">Seleccionar…</option>{resultados.map((r) => <option key={r.id} value={r.nombre}>{r.nombre}</option>)}</select></CampoDato>
              </div>
            </div>

            <div className="rounded-xl border border-black-10 p-4">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.07em] text-black-45">{tipo === "devolucion" ? "Devolución" : "Queja"}</p>
              {tipo === "devolucion" ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <CampoDato label="Moneda"><select value={form.moneda} onChange={(e) => set("moneda", e.target.value)} className="h-10 w-full rounded-lg border border-black-10 px-3 text-sm focus:border-primary focus:outline-none"><option value="PEN">PEN — Soles</option><option value="USD">USD — Dólares</option></select></CampoDato>
                    <CampoDato label="Monto solicitado"><input value={form.montoPagado} onChange={(e) => set("montoPagado", e.target.value)} type="number" min="0" step="0.01" placeholder="0.00" className="h-10 w-full rounded-lg border border-black-10 px-3 text-sm focus:border-primary focus:outline-none" /></CampoDato>
                    <CampoDato label="Tipo de monto"><select value={form.tipoMonto} onChange={(e) => set("tipoMonto", e.target.value)} className="h-10 w-full rounded-lg border border-black-10 px-3 text-sm focus:border-primary focus:outline-none"><option value="">—</option><option value="ARR">ARR</option><option value="MRR">MRR</option></select></CampoDato>
                    <CampoDato label="Área causante"><select value={form.area} onChange={(e) => set("area", e.target.value)} className="h-10 w-full rounded-lg border border-black-10 px-3 text-sm focus:border-primary focus:outline-none"><option value="">—</option>{areas.filter((a) => a.activo).map((a) => <option key={a.id} value={a.nombre}>{a.nombre}</option>)}</select></CampoDato>
                    <CampoDato label="% devolución"><input value={form.porcentaje} onChange={(e) => set("porcentaje", e.target.value)} type="number" min="0" max="100" step="0.01" placeholder="0" className="h-10 w-full rounded-lg border border-black-10 px-3 text-sm focus:border-primary focus:outline-none" /></CampoDato>
                    <CampoDato label="Monto a devolver"><input value={form.montoDevuelto !== "" ? form.montoDevuelto : calculado ?? ""} onChange={(e) => set("montoDevuelto", e.target.value)} type="number" min="0" step="0.01" placeholder="0.00" className="h-10 w-full rounded-lg border border-black-10 px-3 text-sm focus:border-primary focus:outline-none" /></CampoDato>
                  </div>
                  <CampoDato label="Motivo"><textarea value={form.motivo} onChange={(e) => set("motivo", e.target.value)} placeholder="Describe el motivo de la devolución" className="min-h-[80px] w-full rounded-lg border border-black-10 px-3 py-2 text-sm focus:border-primary focus:outline-none" /></CampoDato>
                  {calculado != null && <p className="text-[12px] text-black-45">Monto calculado: <span className="font-medium text-primary">{fmtMoneda(calculado)}</span></p>}
                </div>
              ) : (
                <div className="space-y-3">
                  <CampoDato label="Tipo de queja"><select value={form.clasificacion} onChange={(e) => set("clasificacion", e.target.value)} className="h-10 w-full rounded-lg border border-black-10 px-3 text-sm focus:border-primary focus:outline-none"><option value="">Seleccionar…</option>{tiposQueja.map((t) => <option key={t.id} value={t.nombre}>{t.nombre}</option>)}</select></CampoDato>
                  {form.clasificacion === "Servicio" && <CampoDato label="Área responsable"><select value={form.area} onChange={(e) => set("area", e.target.value)} className="h-10 w-full rounded-lg border border-black-10 px-3 text-sm focus:border-primary focus:outline-none"><option value="">—</option>{areas.filter((a) => a.activo).map((a) => <option key={a.id} value={a.nombre}>{a.nombre}</option>)}</select></CampoDato>}
                  {form.clasificacion === "Producto" && <CampoDato label="Producto"><select value={form.producto} onChange={(e) => set("producto", e.target.value)} className="h-10 w-full rounded-lg border border-black-10 px-3 text-sm focus:border-primary focus:outline-none"><option value="">—</option>{productos.map((p) => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}</select></CampoDato>}
                  <CampoDato label="Motivo"><textarea value={form.motivo} onChange={(e) => set("motivo", e.target.value)} placeholder="Describe el motivo de la queja" className="min-h-[80px] w-full rounded-lg border border-black-10 px-3 py-2 text-sm focus:border-primary focus:outline-none" /></CampoDato>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-black-10 p-4">
              <CampoDato label="Observación"><textarea value={form.observacion} onChange={(e) => set("observacion", e.target.value)} placeholder="Notas internas del expediente" className="min-h-[70px] w-full rounded-lg border border-black-10 px-3 py-2 text-sm focus:border-primary focus:outline-none" /></CampoDato>
            </div>

            {error && <p className="rounded-lg border border-danger-10 bg-danger-5 px-3 py-2 text-[13px] text-danger">{error}</p>}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setTipo(null)} className="h-10 rounded-lg border border-black-10 px-4 text-sm text-black-45 hover:bg-light">Volver</button>
              <button type="button" onClick={guardar} disabled={guardando} className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary-85 disabled:opacity-50">
                {guardando ? <RefreshCcw size={15} className="animate-spin" /> : <Plus size={15} />}
                {guardando ? "Creando…" : "Crear expediente"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ============================================================ */

function CasoDetalle({ caso, interacciones, auditoria, dominios, puedeEditar, puedeEliminar, confirmandoEliminar, setConfirmandoEliminar, onEliminar, confirmandoCerrar, setConfirmandoCerrar, onCerrarCaso, confirmandoReabrir, setConfirmandoReabrir, onReabrirCaso, onVincularTicket, estados, resultados, areas, productos, tiposQueja, onActualizar, onCerrar }: {
  caso: QdCaso;
  interacciones: QdInteraccion[];
  auditoria: any[];
  dominios: string[];
  puedeEditar: boolean;
  puedeEliminar: boolean;
  confirmandoEliminar: boolean;
  setConfirmandoEliminar: (v: boolean) => void;
  onEliminar: () => Promise<unknown>;
  confirmandoCerrar: boolean;
  setConfirmandoCerrar: (v: boolean) => void;
  onCerrarCaso: () => Promise<unknown>;
  confirmandoReabrir: boolean;
  setConfirmandoReabrir: (v: boolean) => void;
  onReabrirCaso: () => Promise<unknown>;
  onVincularTicket: (ticketId: string, canal: string | null) => Promise<unknown>;
  estados: any[];
  resultados: any[];
  areas: any[];
  productos: any[];
  tiposQueja: any[];
  onActualizar: (input: any) => Promise<unknown>;
  onCerrar: () => void;
}) {
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null);
  const [eliminando, setEliminando] = useState(false);
  const [cerrando, setCerrando] = useState(false);
  const [errorCerrar, setErrorCerrar] = useState<string | null>(null);
  const [errorReabrir, setErrorReabrir] = useState<string | null>(null);
  const [errorVincular, setErrorVincular] = useState<string | null>(null);
  const [vincularTicket, setVincularTicket] = useState("");
  const [vincularCanal, setVincularCanal] = useState("");

  // Dominio — se edita inline pero se guarda junto con todo.
  const [dominioSel, setDominioSel] = useState(caso.dominio ?? "");
  const [dominioBusqueda, setDominioBusqueda] = useState(caso.dominio ?? "");
  const [dominioAbierto, setDominioAbierto] = useState(false);

  // Datos propios del caso (Devolución / Queja) — se sincroniza con el caso al cargar.
  const [datos, setDatos] = useState<any>({
    moneda: caso.moneda ?? "PEN",
    montoPagado: caso.monto_pagado,
    tipoMonto: caso.tipo_monto ?? "",
    porcentaje: caso.porcentaje,
    montoDevuelto: caso.monto_devuelto,
    area: caso.area ?? "",
    motivo: caso.motivo ?? "",
    clasificacion: caso.clasificacion ?? "",
    producto: caso.producto ?? "",
  });

  // Gestión (estado/resultado/observación) — se sincroniza con el caso al cargar.
  const [gestion, setGestion] = useState<any>({
    estado: caso.estado ?? "",
    resultado: caso.resultado ?? "",
    observacion: caso.observacion ?? "",
  });
  const setGestionCampo = (k: string, v: any) => setGestion((f: any) => ({ ...f, [k]: v }));
  const setDato = (k: string, v: any) => setDatos((f: any) => ({ ...f, [k]: v }));

  // Estado unificado de guardado.
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [tabDetalle, setTabDetalle] = useState<"resumen" | "interacciones" | "historial">("resumen");

  // Sincroniza la gestión con el caso cuando se refresca (React Query).
  useEffect(() => {
    setGestion({ estado: caso.estado ?? "", resultado: caso.resultado ?? "", observacion: caso.observacion ?? "" });
  }, [caso.id, caso.estado, caso.resultado, caso.observacion]);

  // Sincroniza el dominio con el caso cuando se refresca.
  useEffect(() => {
    setDominioSel(caso.dominio ?? "");
    setDominioBusqueda(caso.dominio ?? "");
  }, [caso.id, caso.dominio]);

  // Sincroniza los datos económicos/operativos al abrir otro expediente.
  useEffect(() => {
    setDatos({
      moneda: caso.moneda ?? "PEN",
      montoPagado: caso.monto_pagado,
      tipoMonto: caso.tipo_monto ?? "",
      porcentaje: caso.porcentaje,
      montoDevuelto: caso.monto_devuelto,
      area: caso.area ?? "",
      motivo: caso.motivo ?? "",
      clasificacion: caso.clasificacion ?? "",
      producto: caso.producto ?? "",
    });
    setTabDetalle("resumen");
  }, [caso.id, caso.moneda, caso.monto_pagado, caso.tipo_monto, caso.porcentaje, caso.monto_devuelto, caso.area, caso.motivo, caso.clasificacion, caso.producto]);

  /** Handler unificado: guarda dominio + datos + gestión en una sola llamada. */
  const guardarTodo = async () => {
    setErrorGeneral(null);
    setGuardando(true);
    try {
      const input: any = {};
      // Dominio
      input.dominio = dominioSel.trim() || null;
      // Datos del caso
      if (caso.tipo === "devolucion") {
        input.moneda = datos.moneda || "PEN";
        input.montoPagado = datos.montoPagado === "" || datos.montoPagado == null ? null : Number(datos.montoPagado);
        input.tipoMonto = datos.tipoMonto || null;
        input.porcentaje = datos.porcentaje === "" || datos.porcentaje == null ? null : Number(datos.porcentaje);
        input.montoDevuelto = datos.montoDevuelto === "" || datos.montoDevuelto == null ? null : Number(datos.montoDevuelto);
        input.area = datos.area || null;
        input.motivo = datos.motivo || null;
      } else {
        input.clasificacion = datos.clasificacion || null;
        input.producto = datos.producto || null;
        input.area = datos.area || null;
        input.motivo = datos.motivo || null;
      }
      // Gestión
      input.estado = gestion.estado || null;
      input.resultado = gestion.resultado || null;
      input.observacion = gestion.observacion || null;
      await onActualizar(input);
    } catch (e: any) {
      setErrorGeneral(e?.response?.data?.error ?? e.message ?? "Error al guardar");
    } finally {
      setGuardando(false);
    }
  };

  /** Redondea a 2 decimales evitando errores de floating point. */
  const round2 = (n: number): number => Math.round(n * 100) / 100;

  /** Cambió el % devolución → recalcular monto real a devolver. */
  const onPorcentaje = (v: string) => {
    setDato("porcentaje", v);
    const mp = Number(datos.montoPagado);
    const pct = v === "" ? null : Number(v);
    if (mp && pct != null && !isNaN(pct)) {
      setDato("montoDevuelto", round2(mp * (pct / 100)));
    } else {
      setDato("montoDevuelto", "");
    }
  };

  /** Cambió el monto real a devolver → recalcular % devolución. */
  const onMontoDevuelto = (v: string) => {
    setDato("montoDevuelto", v);
    const mp = Number(datos.montoPagado);
    const md = v === "" ? null : Number(v);
    if (mp && md != null && !isNaN(md) && mp > 0) {
      const pct = round2((md / mp) * 100);
      setDato("porcentaje", pct > 100 ? 100 : pct < 0 ? 0 : pct);
    } else {
      setDato("porcentaje", "");
    }
  };

  /** Descarta todos los cambios no guardados y restaura los valores del caso. */
  const descartarTodo = () => {
    setDominioSel(caso.dominio ?? "");
    setDominioBusqueda(caso.dominio ?? "");
    setDatos({
      moneda: caso.moneda ?? "PEN",
      montoPagado: caso.monto_pagado,
      tipoMonto: caso.tipo_monto ?? "",
      porcentaje: caso.porcentaje,
      montoDevuelto: caso.monto_devuelto,
      area: caso.area ?? "",
      motivo: caso.motivo ?? "",
      clasificacion: caso.clasificacion ?? "",
      producto: caso.producto ?? "",
    });
    setGestion({ estado: caso.estado ?? "", resultado: caso.resultado ?? "", observacion: caso.observacion ?? "" });
    setErrorGeneral(null);
  };

  const vincular = async () => {
    if (!vincularTicket.trim()) return;
    setErrorVincular(null);
    try {
      await onVincularTicket(vincularTicket.trim(), vincularCanal.trim() || null);
      setVincularTicket("");
      setVincularCanal("");
    } catch (e: any) {
      setErrorVincular(e?.response?.data?.error ?? e.message ?? "Error");
    }
  };

  return (
    <div className="flex w-full shrink-0 flex-col border-t border-black-10 bg-white xl:w-[560px] xl:border-l xl:border-t-0">
      <div className="border-b border-black-10 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-mono text-[19px] font-semibold tracking-tight text-primary">{caso.numero}</h2>
              <TipoBadge tipo={caso.tipo} />
              <CasoAbiertoBadge cerrado={caso.caso_cerrado} />
            </div>
            <p className="mt-1.5 text-[13px] text-black-45">
              {fechaCasoSolicitud(caso)} · {caso.asesor || "Sin asesor"} · {caso.pais || "Sin país"}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <EstadoBadge estado={caso.estado} />
              <ResultadoBadge resultado={caso.resultado} />
              <OrigenBadge origen={caso.origen} />
              {caso.consolidado_en && (
                <span className="rounded-full border border-black-10 bg-black-5 px-2 py-0.5 text-[11px] font-medium text-black-45">Consolidado</span>
              )}
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
            {puedeEditar && caso.caso_cerrado && (
              <button type="button" onClick={() => { setErrorReabrir(null); setConfirmandoReabrir(true); }} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-black-10 bg-white px-2.5 text-[12px] font-medium text-black-65 hover:bg-light">
                <RotateCcw size={14} /> Reabrir
              </button>
            )}
            {puedeEditar && !caso.caso_cerrado && (
              <button type="button" onClick={() => { setErrorCerrar(null); setConfirmandoCerrar(true); }} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-black-10 bg-white px-2.5 text-[12px] font-medium text-black-65 hover:bg-light">
                <CheckCircle2 size={14} /> Cerrar
              </button>
            )}
            {puedeEliminar && (
              <button type="button" onClick={() => { setErrorEliminar(null); setConfirmandoEliminar(true); }} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-danger-25 bg-white px-2.5 text-[12px] font-medium text-danger hover:bg-danger-5">
                <Trash2 size={14} /> Eliminar
              </button>
            )}
            <button type="button" onClick={onCerrar} className="rounded-lg p-1.5 text-black-45 transition-colors hover:bg-light hover:text-black-85"><X size={18} /></button>
          </div>
        </div>
      </div>

      <div className="flex border-b border-black-10 px-5" role="tablist" aria-label="Secciones del expediente">
        {([
          ["resumen", "Resumen", FileText],
          ["interacciones", `Interacciones${interacciones.length ? ` (${interacciones.length})` : ""}`, Link2],
          ["historial", `Historial${auditoria.length ? ` (${auditoria.length})` : ""}`, History],
        ] as const).map(([key, label, Icon]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tabDetalle === key}
            onClick={() => setTabDetalle(key)}
            className={cn(
              "inline-flex h-11 items-center gap-1.5 border-b-2 px-3 text-[13px] font-medium transition-colors",
              tabDetalle === key ? "border-primary text-primary" : "border-transparent text-black-45 hover:text-black-85",
            )}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        {tabDetalle === "resumen" && (
          <>
            <Section titulo="Identificación" icon={FileText}>
              <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
                <Info label="Ticket">
                  {caso.ticket_id ? (
                    <Link className="inline-flex items-center gap-1 text-primary hover:underline" to="/atenciones">
                      #{caso.ticket_id} <ArrowUpRight size={12} />
                    </Link>
                  ) : "—"}
                </Info>
                <Info label="Fecha original">{fechaCasoSolicitud(caso)}</Info>
                <Info label="País">{caso.pais || "—"}</Info>
                <Info label="Asesor">{caso.asesor || "—"}</Info>
                <Info label="Origen"><OrigenBadge origen={caso.origen} /></Info>
                <Info label="Última actualización">{fmtFecha(caso.updated_at)}</Info>
              </div>
              <div className="mt-3 border-t border-black-5 pt-3">
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-black-45">Dominio</p>
                {puedeEditar ? (
                  <div className="relative">
                    <input
                      value={dominioBusqueda}
                      onChange={(e) => { setDominioBusqueda(e.target.value); setDominioSel(e.target.value.trim()); setDominioAbierto(true); }}
                      onFocus={() => setDominioAbierto(true)}
                      placeholder="Buscar o escribir dominio…"
                      className="h-10 w-full rounded-lg border border-black-10 bg-white px-3 pr-9 text-sm focus:border-primary focus:outline-none"
                    />
                    <button type="button" onClick={() => setDominioAbierto((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-black-45 hover:text-black-85" aria-label="Alternar lista de dominios">
                      <ChevronDown size={16} />
                    </button>
                    {dominioAbierto && (
                      <div className="absolute left-0 top-full z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-lg border border-black-10 bg-white py-1 shadow-lg">
                        <button type="button" onClick={() => { setDominioSel(""); setDominioBusqueda(""); setDominioAbierto(false); }} className="block w-full px-3 py-2 text-left text-[13px] text-black-45 hover:bg-light">
                          SIN DOMINIO
                        </button>
                        {dominios
                          .filter((d) => (normalizeDomain(d) ?? "").includes(normalizeDomain(dominioBusqueda) ?? ""))
                          .slice(0, 50)
                          .map((d) => (
                            <button
                              key={d}
                              type="button"
                              onClick={() => { setDominioSel(d); setDominioBusqueda(d); setDominioAbierto(false); }}
                              className={cn("block w-full truncate px-3 py-2 text-left text-[13px]", dominioSel === d ? "bg-primary-5 font-medium text-primary" : "text-black-65 hover:bg-light")}
                            >
                              {d}
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {caso.dominio ? <span className="break-all text-[13px] font-medium text-black-85">{caso.dominio}</span> : <SinDominioBadge />}
                  </div>
                )}
              </div>
            </Section>

            {caso.caso_cerrado && (
              <Section titulo="Cierre" icon={CheckCircle2}>
                <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
                  <Info label="Estado"><CasoAbiertoBadge cerrado /></Info>
                  <Info label="Cerrado el">{fmtFecha(caso.cerrado_at)}</Info>
                  <Info label="Cerrado por">{caso.cerrado_por || "—"}</Info>
                </div>
              </Section>
            )}

            {caso.tipo === "devolucion" ? (
              <Section titulo="Devolución" icon={RotateCcw}>
                {puedeEditar ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <CampoDato label="Moneda">
                      <select value={datos.moneda} onChange={(e) => setDato("moneda", e.target.value)} className="h-10 w-full rounded-lg border border-black-10 px-3 text-sm focus:border-primary focus:outline-none">
                        <option value="PEN">PEN — Soles</option>
                        <option value="USD">USD — Dólares</option>
                      </select>
                    </CampoDato>
                    <CampoDato label="Monto solicitado">
                      <input value={datos.montoPagado ?? ""} onChange={(e) => setDato("montoPagado", e.target.value)} type="number" min="0" step="0.01" placeholder="0.00" className="h-10 w-full rounded-lg border border-black-10 px-3 text-sm focus:border-primary focus:outline-none" />
                    </CampoDato>
                    <CampoDato label="Tipo de monto">
                      <select value={datos.tipoMonto} onChange={(e) => setDato("tipoMonto", e.target.value)} className="h-10 w-full rounded-lg border border-black-10 px-3 text-sm focus:border-primary focus:outline-none">
                        <option value="">—</option>
                        <option value="ARR">ARR</option>
                        <option value="MRR">MRR</option>
                      </select>
                    </CampoDato>
                    <CampoDato label="% devolución / conciliación">
                      <input value={datos.porcentaje ?? ""} onChange={(e) => onPorcentaje(e.target.value)} type="number" min="0" max="100" step="0.01" placeholder="0" className="h-10 w-full rounded-lg border border-black-10 px-3 text-sm focus:border-primary focus:outline-none" />
                    </CampoDato>
                    <CampoDato label="Monto real a devolver">
                      <input value={datos.montoDevuelto ?? ""} onChange={(e) => onMontoDevuelto(e.target.value)} type="number" min="0" step="0.01" placeholder="0.00" className="h-10 w-full rounded-lg border border-black-10 px-3 text-sm focus:border-primary focus:outline-none" />
                    </CampoDato>
                    <CampoDato label="Área causante">
                      <select value={datos.area} onChange={(e) => setDato("area", e.target.value)} className="h-10 w-full rounded-lg border border-black-10 px-3 text-sm focus:border-primary focus:outline-none">
                        <option value="">—</option>
                        {areas.filter((a) => a.activo).map((a) => <option key={a.id} value={a.nombre}>{a.nombre}</option>)}
                        {datos.area && !areas.some((a) => a.activo && a.nombre === datos.area) && <option value={datos.area}>{datos.area}</option>}
                      </select>
                    </CampoDato>
                    <div className="sm:col-span-2">
                      <CampoDato label="Motivo">
                        <textarea value={datos.motivo} onChange={(e) => setDato("motivo", e.target.value)} placeholder="Describe el motivo" className="min-h-[80px] w-full rounded-lg border border-black-10 px-3 py-2 text-sm focus:border-primary focus:outline-none" />
                      </CampoDato>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
                    <Info label="Moneda">{caso.moneda === "USD" ? "USD — Dólares" : "PEN — Soles"}</Info>
                    <Info label="Monto solicitado">{fmtMoneda(caso.monto_pagado, caso.moneda)}</Info>
                    <Info label="Tipo">{caso.tipo_monto || "—"}</Info>
                    <Info label="% devolución">{fmtPct(caso.porcentaje)}</Info>
                    <Info label="Monto real a devolver">{caso.monto_devuelto == null ? "—" : fmtMoneda(caso.monto_devuelto, caso.moneda)}</Info>
                    <Info label="Área causante">{caso.area || "—"}</Info>
                    <div className="sm:col-span-2"><Info label="Motivo">{caso.motivo || "—"}</Info></div>
                  </div>
                )}
              </Section>
            ) : (
              <Section titulo="Queja" icon={MessageSquare}>
                {puedeEditar ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <CampoDato label="Tipo de queja">
                      <select value={datos.clasificacion} onChange={(e) => setDato("clasificacion", e.target.value)} className="h-10 w-full rounded-lg border border-black-10 px-3 text-sm focus:border-primary focus:outline-none">
                        <option value="">—</option>
                        {tiposQueja.map((t) => <option key={t.id} value={t.nombre}>{t.nombre}</option>)}
                      </select>
                    </CampoDato>
                    {datos.clasificacion === "Servicio" && (
                      <CampoDato label="Área responsable">
                        <select value={datos.area} onChange={(e) => setDato("area", e.target.value)} className="h-10 w-full rounded-lg border border-black-10 px-3 text-sm focus:border-primary focus:outline-none">
                          <option value="">—</option>
                          {areas.filter((a) => a.activo).map((a) => <option key={a.id} value={a.nombre}>{a.nombre}</option>)}
                          {datos.area && !areas.some((a) => a.activo && a.nombre === datos.area) && <option value={datos.area}>{datos.area}</option>}
                        </select>
                      </CampoDato>
                    )}
                    {datos.clasificacion === "Producto" && (
                      <CampoDato label="Producto">
                        <select value={datos.producto} onChange={(e) => setDato("producto", e.target.value)} className="h-10 w-full rounded-lg border border-black-10 px-3 text-sm focus:border-primary focus:outline-none">
                          <option value="">—</option>
                          {productos.map((p) => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}
                        </select>
                      </CampoDato>
                    )}
                    <div className="sm:col-span-2">
                      <CampoDato label="Motivo">
                        <textarea value={datos.motivo} onChange={(e) => setDato("motivo", e.target.value)} placeholder="Describe el motivo" className="min-h-[80px] w-full rounded-lg border border-black-10 px-3 py-2 text-sm focus:border-primary focus:outline-none" />
                      </CampoDato>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
                    <Info label="Tipo de queja">{caso.clasificacion || "—"}</Info>
                    <Info label="Área / Producto">{caso.area || caso.producto || "—"}</Info>
                    <div className="sm:col-span-2"><Info label="Motivo">{caso.motivo || "—"}</Info></div>
                  </div>
                )}
              </Section>
            )}

            <Section titulo="Gestión" icon={CheckCircle2}>
              {puedeEditar ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <CampoDato label="Estado del caso">
                    <div className="flex flex-wrap items-center gap-2">
                      <CasoAbiertoBadge cerrado={caso.caso_cerrado} />
                      {!caso.caso_cerrado && (
                        <button type="button" onClick={() => { setErrorCerrar(null); setConfirmandoCerrar(true); }} className="h-8 rounded-lg border border-black-10 px-2.5 text-[12px] text-black-45 hover:bg-light">Cerrar caso</button>
                      )}
                      {caso.caso_cerrado && (
                        <button type="button" onClick={() => { setErrorReabrir(null); setConfirmandoReabrir(true); }} className="h-8 rounded-lg border border-black-10 px-2.5 text-[12px] text-black-45 hover:bg-light">Reabrir caso</button>
                      )}
                    </div>
                  </CampoDato>
                  <CampoDato label="Estado">
                    <select value={gestion.estado} onChange={(e) => setGestionCampo("estado", e.target.value)} className="h-10 w-full rounded-lg border border-black-10 px-3 text-sm focus:border-primary focus:outline-none">
                      <option value="">Estado…</option>
                      {estados.map((e) => <option key={e.id} value={e.nombre}>{e.nombre}</option>)}
                    </select>
                  </CampoDato>
                  <CampoDato label="Resultado">
                    <select value={gestion.resultado} onChange={(e) => setGestionCampo("resultado", e.target.value)} className="h-10 w-full rounded-lg border border-black-10 px-3 text-sm focus:border-primary focus:outline-none">
                      <option value="">Resultado…</option>
                      {resultados.map((r) => <option key={r.id} value={r.nombre}>{r.nombre}</option>)}
                    </select>
                  </CampoDato>
                  <div className="sm:col-span-2">
                    <CampoDato label="Observación">
                      <textarea value={gestion.observacion} onChange={(e) => setGestionCampo("observacion", e.target.value)} placeholder="Notas de gestión" className="min-h-[70px] w-full rounded-lg border border-black-10 px-3 py-2 text-sm focus:border-primary focus:outline-none" />
                    </CampoDato>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
                  <Info label="Estado del caso"><CasoAbiertoBadge cerrado={caso.caso_cerrado} /></Info>
                  <Info label="Estado"><EstadoBadge estado={caso.estado} /></Info>
                  <Info label="Resultado"><ResultadoBadge resultado={caso.resultado} /></Info>
                  {caso.observacion && <div className="sm:col-span-2"><Info label="Observación">{caso.observacion}</Info></div>}
                </div>
              )}
            </Section>

            {puedeEditar && !caso.caso_cerrado && (
              <div className="rounded-xl border border-black-10 bg-light-5 p-3">
                {errorGeneral && <p className="mb-2 rounded-lg border border-danger-10 bg-danger-5 px-3 py-2 text-[13px] text-danger">{errorGeneral}</p>}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[12px] text-black-45">Los cambios se guardan en una sola operación.</p>
                  <div className="flex gap-2">
                    <button type="button" onClick={descartarTodo} disabled={guardando} className="h-10 rounded-lg border border-black-10 bg-white px-3 text-sm text-black-45 hover:bg-light disabled:opacity-50">Descartar</button>
                    <button type="button" onClick={guardarTodo} disabled={guardando} className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary-85 disabled:opacity-50">
                      {guardando ? <RefreshCcw size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                      {guardando ? "Guardando…" : "Guardar cambios"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {tabDetalle === "interacciones" && (
          <Section titulo="Interacciones relacionadas" icon={Link2}>
            <div className="space-y-2">
              {caso.ticket_id && (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-primary-10 bg-primary-5/50 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="font-mono text-[13px] font-semibold text-primary">#{caso.ticket_id}</p>
                    <p className="text-[12px] text-black-45">Ticket principal</p>
                  </div>
                  <Link to="/atenciones" className="inline-flex items-center gap-1 text-[12px] font-medium text-primary hover:underline">Ver ticket <ArrowUpRight size={12} /></Link>
                </div>
              )}
              {interacciones.length === 0 ? (
                <div className="rounded-lg border border-dashed border-black-10 px-4 py-8 text-center">
                  <p className="text-[13px] text-black-45">Sin interacciones relacionadas</p>
                </div>
              ) : (
                interacciones.map((it) => (
                  <div key={it.id} className="flex items-center justify-between gap-3 rounded-lg border border-black-5 px-3 py-2.5 transition-colors hover:bg-light/60">
                    <div className="min-w-0">
                      <p className="font-mono text-[13px] font-semibold text-black-85">#{it.ticket_id}</p>
                      <p className="text-[12px] text-black-45">
                        {it.tipo_relacion === "principal" ? "Ticket principal" : "Interacción relacionada"}
                        {it.canal ? ` · ${it.canal}` : ""}
                        {it.created_by ? ` · ${it.created_by}` : ""}
                      </p>
                      <p className="text-[11px] text-black-25">{it.fecha ? fmtFecha(it.fecha) : fmtFecha(it.created_at)}</p>
                    </div>
                    <Link to="/atenciones" className="shrink-0 text-[12px] font-medium text-primary hover:underline">Ver ticket</Link>
                  </div>
                ))
              )}
            </div>
            {puedeEditar && !caso.caso_cerrado && (
              <div className="mt-3 rounded-lg border border-black-10 bg-light-5 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-black-45">Vincular ticket al caso</p>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                  <input value={vincularTicket} onChange={(e) => setVincularTicket(e.target.value)} placeholder="Número de ticket" className="h-10 w-full rounded-lg border border-black-10 bg-white px-3 text-sm focus:border-primary focus:outline-none sm:w-32" />
                  <input value={vincularCanal} onChange={(e) => setVincularCanal(e.target.value)} placeholder="Canal (WhatsApp, Correo…)" className="h-10 min-w-0 flex-1 rounded-lg border border-black-10 bg-white px-3 text-sm focus:border-primary focus:outline-none" />
                  <button type="button" onClick={vincular} disabled={!vincularTicket.trim()} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white disabled:opacity-40">
                    <Link2 size={15} /> Vincular
                  </button>
                </div>
                {errorVincular && <p className="mt-2 text-[12px] text-danger">{errorVincular}</p>}
              </div>
            )}
          </Section>
        )}

        {tabDetalle === "historial" && (
          <Section titulo="Historial de cambios" icon={History}>
            {auditoria.length === 0 ? (
              <div className="rounded-lg border border-dashed border-black-10 px-4 py-8 text-center">
                <p className="text-[13px] text-black-45">Sin eventos registrados</p>
              </div>
            ) : (
              <div className="relative space-y-3 before:absolute before:bottom-2 before:left-[7px] before:top-2 before:w-px before:bg-black-10">
                {auditoria.map((a) => (
                  <div key={a.id} className="relative pl-6">
                    <span className="absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-primary-25" />
                    <div className="rounded-lg border border-black-5 bg-white p-3">
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <p className="text-[13px] font-medium text-black-85">{a.usuario || "Sistema"}</p>
                        <span className="text-[11px] text-black-25">{new Date(a.created_at).toLocaleString("es-PE", { dateStyle: "short", timeStyle: "short" })}</span>
                      </div>
                      <p className="mt-0.5 text-[12px] text-black-45">{a.accion}{a.campo ? ` · ${a.campo}` : ""}</p>
                      {(a.valor_anterior || a.valor_nuevo) && (
                        <p className="mt-1 break-words text-[12px] text-black-65">
                          <span className="text-black-25">{a.valor_anterior || "—"}</span> → <span className="font-medium text-black-85">{a.valor_nuevo || "—"}</span>
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>
        )}
      </div>

      {confirmandoEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black-65/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-[440px] rounded-xl border border-black-10 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-black-10 px-5 py-4">
              <h3 className="text-[16px] font-semibold text-danger">¿Eliminar este caso?</h3>
              <button type="button" onClick={() => setConfirmandoEliminar(false)} disabled={eliminando} className="rounded-lg p-1.5 text-black-45 hover:bg-light hover:text-black-85"><X size={18} /></button>
            </div>
            <div className="space-y-3 p-5">
              <p className="text-[13px] leading-6 text-black-65">
                Esta acción eliminará el caso manual de Quejas y Devoluciones. No aplica a casos creados desde una categorización de atención.
              </p>
              <div className="space-y-1 rounded-lg border border-black-5 bg-light-5 px-3 py-2.5 text-[13px]">
                <p><span className="text-black-45">Caso: </span><span className="font-mono font-semibold text-primary">{caso.numero}</span></p>
                <p><span className="text-black-45">Tipo: </span><span className="font-medium text-black-85">{caso.tipo === "devolucion" ? "Devolución" : "Queja"}</span></p>
                <p><span className="text-black-45">Dominio: </span><span className="font-medium text-black-85">{caso.dominio || "SIN DOMINIO"}</span></p>
                <p><span className="text-black-45">Ticket: </span><span className="font-mono text-black-85">{caso.ticket_id || "—"}</span></p>
              </div>
              {errorEliminar && <p className="text-[12px] text-danger">{errorEliminar}</p>}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setConfirmandoEliminar(false)} disabled={eliminando} className="h-10 rounded-lg border border-black-10 px-4 text-sm text-black-45 hover:bg-light disabled:opacity-50">Cancelar</button>
                <button type="button" onClick={async () => {
                  setEliminando(true);
                  setErrorEliminar(null);
                  try {
                    await onEliminar();
                  } catch (e: any) {
                    setErrorEliminar(e?.response?.data?.error ?? e.message ?? "Error al eliminar");
                  } finally {
                    setEliminando(false);
                  }
                }} disabled={eliminando} className="inline-flex h-10 items-center gap-2 rounded-lg bg-danger px-4 text-sm font-medium text-white hover:bg-danger-85 disabled:opacity-50">
                  <Trash2 size={15} /> {eliminando ? "Eliminando…" : "Eliminar caso"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmandoCerrar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black-65/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-[440px] rounded-xl border border-black-10 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-black-10 px-5 py-4">
              <h3 className="text-[16px] font-semibold text-black-85">¿Cerrar el caso {caso.numero}?</h3>
              <button type="button" onClick={() => setConfirmandoCerrar(false)} disabled={cerrando} className="rounded-lg p-1.5 text-black-45 hover:bg-light hover:text-black-85"><X size={18} /></button>
            </div>
            <div className="space-y-3 p-5">
              <p className="text-[13px] leading-6 text-black-65">
                Al cerrar el caso, los nuevos asuntos del mismo dominio y tipo crearán un caso nuevo en lugar de vincularse automáticamente.
              </p>
              {errorCerrar && <p className="text-[12px] text-danger">{errorCerrar}</p>}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setConfirmandoCerrar(false)} disabled={cerrando} className="h-10 rounded-lg border border-black-10 px-4 text-sm text-black-45 hover:bg-light disabled:opacity-50">Cancelar</button>
                <button type="button" onClick={async () => {
                  setCerrando(true);
                  setErrorCerrar(null);
                  try {
                    await onCerrarCaso();
                  } catch (e: any) {
                    setErrorCerrar(e?.response?.data?.error ?? e.message ?? "Error al cerrar");
                  } finally {
                    setCerrando(false);
                  }
                }} disabled={cerrando} className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary-85 disabled:opacity-50">
                  <CheckCircle2 size={15} /> {cerrando ? "Cerrando…" : "Cerrar caso"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmandoReabrir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black-65/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-[440px] rounded-xl border border-black-10 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-black-10 px-5 py-4">
              <h3 className="text-[16px] font-semibold text-black-85">¿Reabrir el caso {caso.numero}?</h3>
              <button type="button" onClick={() => setConfirmandoReabrir(false)} className="rounded-lg p-1.5 text-black-45 hover:bg-light hover:text-black-85"><X size={18} /></button>
            </div>
            <div className="space-y-3 p-5">
              <p className="text-[13px] leading-6 text-black-65">
                El caso volverá a estado ABIERTO y podrá recibir nuevos tickets relacionados. No se modifican tickets ni interacciones.
              </p>
              {errorReabrir && <p className="text-[12px] text-danger">{errorReabrir}</p>}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setConfirmandoReabrir(false)} className="h-10 rounded-lg border border-black-10 px-4 text-sm text-black-45 hover:bg-light">Cancelar</button>
                <button type="button" onClick={async () => {
                  setErrorReabrir(null);
                  try {
                    await onReabrirCaso();
                  } catch (e: any) {
                    setErrorReabrir(e?.response?.data?.error ?? e.message ?? "Error al reabrir");
                  }
                }} className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary-85">
                  <RotateCcw size={15} /> Reabrir caso
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ConsolidarModal({ casos, onClose, onConfirmar }: {
  casos: QdCaso[];
  onClose: () => void;
  onConfirmar: (principalId: string, motivo: string | null) => Promise<unknown>;
}) {
  const [principalId, setPrincipalId] = useState<string>("");
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const tipos = new Set(casos.map((c) => c.tipo));
  const incompatible = tipos.size > 1;
  const hayCerrados = casos.some((c) => c.caso_cerrado);
  const hayConsolidados = casos.some((c) => c.consolidado_en);

  const confirmar = async () => {
    if (incompatible || hayCerrados || hayConsolidados || !principalId) return;
    setError(null);
    setEnviando(true);
    try {
      await onConfirmar(principalId, motivo.trim() || null);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? e.message ?? "Error al consolidar");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black-65/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-[520px] rounded-xl border border-black-10 bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-black-10 px-5 py-4">
          <div>
            <h3 className="flex items-center gap-2 text-[17px] font-semibold text-black-85"><GitMerge size={18} className="text-primary" /> Consolidar expedientes</h3>
            <p className="mt-0.5 text-[13px] text-black-45">Selecciona el expediente que será el principal. Los demás quedarán vinculados a él.</p>
          </div>
          <button type="button" onClick={onClose} disabled={enviando} className="rounded-lg p-1.5 text-black-45 hover:bg-light hover:text-black-85"><X size={18} /></button>
        </div>
        <div className="space-y-3 p-5">
          {incompatible && (
            <p className="rounded-lg border border-danger-10 bg-danger-5 px-3 py-2 text-[13px] text-danger">No se pueden consolidar casos de distinto tipo (Queja ≠ Devolución).</p>
          )}
          {hayCerrados && (
            <p className="rounded-lg border border-warning-10 bg-warning-5 px-3 py-2 text-[13px] text-warning-65">Uno o más casos seleccionados están cerrados. Reábrelos antes de consolidar.</p>
          )}
          {hayConsolidados && (
            <p className="rounded-lg border border-danger-10 bg-danger-5 px-3 py-2 text-[13px] text-danger">Uno o más casos seleccionados ya fueron consolidados.</p>
          )}

          <div className="max-h-[280px] overflow-y-auto rounded-lg border border-black-10">
            {casos.map((c) => (
              <label key={c.id} className={cn("flex cursor-pointer items-start gap-3 border-b border-black-5 px-3 py-3 transition-colors last:border-0 hover:bg-light/60", principalId === c.id && "bg-primary-5/60")}>
                <input type="radio" name="principal" checked={principalId === c.id} onChange={() => setPrincipalId(c.id)} className="mt-1 h-4 w-4 accent-primary" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-mono text-[13px] font-semibold text-primary">{c.numero}</span>
                    <TipoBadge tipo={c.tipo} />
                    <CasoAbiertoBadge cerrado={c.caso_cerrado} />
                  </div>
                  <p className="mt-1 truncate text-[13px] text-black-65">{c.dominio ? c.dominio : "SIN DOMINIO"} · {c.pais || "sin país"}</p>
                  <p className="text-[12px] text-black-45">
                    Apertura {fechaCasoSolicitud(c)} · {c.total_interacciones != null ? `${c.total_interacciones} ticket(s)` : "1 ticket"} · {c.asesor || "sin asesor"}
                  </p>
                </div>
                {principalId === c.id && <span className="shrink-0 rounded-full bg-primary-5 px-2 py-0.5 text-[10px] font-semibold text-primary">PRINCIPAL</span>}
              </label>
            ))}
          </div>

          <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Motivo de la consolidación (opcional)" className="min-h-[60px] w-full rounded-lg border border-black-10 px-3 py-2 text-sm focus:border-primary focus:outline-none" />

          {error && <p className="rounded-lg border border-danger-10 bg-danger-5 px-3 py-2 text-[13px] text-danger">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} disabled={enviando} className="h-10 rounded-lg border border-black-10 px-4 text-sm text-black-45 hover:bg-light disabled:opacity-50">Cancelar</button>
            <button type="button" onClick={confirmar} disabled={enviando || !principalId || incompatible || hayCerrados || hayConsolidados} className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary-85 disabled:opacity-50">
              <GitMerge size={15} /> {enviando ? "Consolidando…" : "Consolidar en principal"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5 py-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-black-45">{label}</span>
      <span className="break-words text-[13px] font-medium text-black-85">{children}</span>
    </div>
  );
}

function CampoDato({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-black-45">{label}</p>
      {children}
    </div>
  );
}

function Section({ titulo, icon: Icon, children }: { titulo: string; icon?: React.ElementType; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-xl border border-black-10 bg-white">
      <div className="flex items-center gap-2 border-b border-black-5 bg-light-5/40 px-4 py-2.5">
        {Icon && (
          <span className="flex h-6 w-6 items-center justify-center rounded-md border border-primary-10 bg-primary-5 text-primary">
            <Icon size={13} />
          </span>
        )}
        <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-black-45">{titulo}</p>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}
