import { useEffect, useMemo, useState } from "react";
import { RefreshCcw, Search, Stethoscope, Activity, LayoutGrid, History, AlertCircle, ChevronRight, ChevronLeft, User, Plus, X, Loader2, CheckCircle2, ListChecks, Pencil, Trash2 } from "lucide-react";
import type { CustomerInfo, TicketDetail } from "@/hooks/useTicketDetail";
import { localbiService } from "@/modules/localbi/services/LocalbiService";
import { useHistoriaClinica } from "@/modules/localbi/hooks/useHistoriaClinica";
import { HistoriaClinicaView } from "@/modules/localbi/components/HistoriaClinicaView";
import { HistoriaClientePanel } from "./HistoriaClientePanel";
import { SegmentoBadge, fmtMoneda } from "@/modules/localbi/components/HistoriaClinicaUI";
import type { LocalbiHistoriaClinica } from "@/modules/localbi";
import { api } from "@/lib/api";
import { useAuth } from "@/modules/auth";
import * as ticketbiCatalog from "@/modules/ticketbi/ticketbiService";
import { cn } from "@/lib/utils";

interface Props {
  customer: CustomerInfo | null;
  ticket: TicketDetail | null;
  clienteCope?: Record<string, any> | null;
  onOpenTicket?: (ticketId: string) => void;
  panelOpen: boolean;
  onTogglePanel: () => void;
}

type Tab = "resumen" | "actividad" | "operacion" | "historial";

/** Fila de tarea de la grilla (estado temporal del ticket en COPE). */
interface TareaLinea {
  id: string;
  proyecto: string;
  version: string;
  tipo: string;
  etapaError: string;
  fechaEntrega: string;
  referencia: string;
  descripcion: string;
  casos: string;
}

/** Extrae el subdominio de un dominio (bobocha.restaurant.pe → bobocha). */
function subdominioDe(dominio: string | null | undefined): string {
  if (!dominio) return "";
  return dominio.trim().toLowerCase().replace(/^https?:\/\//, "").split(".")[0] || "";
}

export function PanelOperativo({ customer: _customer, ticket, clienteCope: _clienteCope, onOpenTicket: _onOpenTicket, panelOpen, onTogglePanel }: Props) {
  const [tab, setTab] = useState<Tab>("resumen");
  const [manual, setManual] = useState(false);
  const [unidadManual, setUnidadManual] = useState<string | null>(null);
  const [resolviendo, setResolviendo] = useState(false);

  // ── Crear ticket a Desarrollo ──
  const { user } = useAuth();
  const [ticketModal, setTicketModal] = useState(false);
  const [ticketPaso, setTicketPaso] = useState<"datos" | "tareas" | "resumen" | "exito">("datos");
  const [ticketAsunto, setTicketAsunto] = useState("");
  const [ticketCategoria, setTicketCategoria] = useState("");
  const [ticketSubcategoria, setTicketSubcategoria] = useState("");
  const [ticketNivel, setTicketNivel] = useState("");
  const [ticketFechaTentativa, setTicketFechaTentativa] = useState("");
  const [ticketDescripcion, setTicketDescripcion] = useState("");
  const [ticketConclusion, setTicketConclusion] = useState("");
  const [ticketTareas, setTicketTareas] = useState<TareaLinea[]>([]);
  const [agregarTarea, setAgregarTarea] = useState(false);
  const [creandoTicket, setCreandoTicket] = useState(false);
  const [ticketError, setTicketError] = useState<string | null>(null);
  const [ticketOk, setTicketOk] = useState<{ ticketbiId: number | string } | null>(null);

  const dominioActual = ticket?.dominio;
  const subdominio = subdominioDe(dominioActual);

  // Resolución automática dominio → unidad de negocio (por subdominio, inequívoca).
  const [unidadDetectada, setUnidadDetectada] = useState<{ unidad_negocio: string; nombre?: string } | null>(null);
  useEffect(() => {
    let activo = true;
    setUnidadDetectada(null);
    setManual(false);
    setResolviendo(Boolean(subdominio));
    if (!subdominio) { setResolviendo(false); return; }
    localbiService
      .buscarUnidades(subdominio, 1, 50)
      .then((res) => {
        if (!activo) return;
        setResolviendo(false);
        if ((res.status === "success" || res.status === "warning") && res.data.unidades.length === 1) {
          const u = res.data.unidades[0];
          setUnidadDetectada({ unidad_negocio: u.unidad_negocio, nombre: u.nombre });
        }
      })
      .catch(() => { if (activo) setResolviendo(false); });
    return () => { activo = false; };
  }, [subdominio, ticket?.ticketOriginalId]);

  // Limpiar selección manual al cambiar de atención.
  useEffect(() => {
    setUnidadManual(null);
    setTab("resumen");
  }, [ticket?.ticketOriginalId]);

  const unidadActiva = unidadManual ?? unidadDetectada?.unidad_negocio ?? null;
  const unidadNombre = unidadManual ? unidadManual : (unidadDetectada?.nombre ?? null);
  const identificado = Boolean(unidadActiva);
  const identificadoAutomatico = !unidadManual && Boolean(unidadDetectada);

  const { data: historiaData, isLoading: historiaLoading } = useHistoriaClinica(unidadActiva);
  const ficha = historiaData?.status === "success" || historiaData?.status === "warning"
    ? (historiaData.data as LocalbiHistoriaClinica) : null;

  // Deriva el localbi_id de la atención desde la ficha del cliente (Nivel 1).
  // Prioriza el local cuyo link_dominio coincide con el dominio de la atención;
  // si no hay coincidencia, usa el primer local de la unidad de negocio.
  const localbiId = useMemo<string | null>(() => {
    if (!ficha) return null;
    const locales = (ficha.dominios ?? []).flatMap((d) => d.locales ?? []);
    if (locales.length === 0) return null;
    const dom = (ticket?.dominio ?? "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/+$/, "");
    const porDominio = locales.find((l) => (l.link_dominio ?? "").trim().toLowerCase().includes(dom) && dom);
    return (porDominio ?? locales[0])?.localbi_id ?? null;
  }, [ficha, ticket?.dominio]);

  const kpis = useMemo(() => {
    if (!ficha) return null;
    const totalLocales = ficha.resumen?.total ?? 0;
    const totalTickets = (ficha.dominios ?? []).reduce((acc, d) => acc + (d.locales ?? []).reduce((a, l) => a + (l.tickets?.length ?? 0), 0), 0);
    const nps = ficha.resumen?.nps?.promedio ?? null;
    return { totalLocales, totalTickets, nps, plan: ficha.plan, segmento: ficha.segmento, kam: ficha.kam?.localbi_kam, pago: ficha.pago_mensual };
  }, [ficha]);

  // ── Catálogos del formulario (capa desacoplada) ──
  const [categorias, setCategorias] = useState<string[]>([]);
  const [subcategorias, setSubcategorias] = useState<string[]>([]);
  const [niveles, setNiveles] = useState<string[]>([]);
  const [proyectos, setProyectos] = useState<string[]>([]);
  const [tipos, setTipos] = useState<string[]>([]);

  const cargarCatalogos = async () => {
    try {
      const [cats, nvs, proy, tips] = await Promise.all([
        ticketbiCatalog.obtenerCategorias(),
        ticketbiCatalog.obtenerNiveles(),
        ticketbiCatalog.obtenerProyectos(),
        ticketbiCatalog.obtenerTipos(),
      ]);
      setCategorias(cats);
      setNiveles(nvs);
      setProyectos(proy);
      setTipos(tips);
    } catch {
      // Los catálogos se dejan vacíos; el usuario verá selects sin opciones si fallan.
    }
  };

  const cambiarCategoria = async (cat: string) => {
    setTicketCategoria(cat);
    setTicketSubcategoria("");
    setSubcategorias([]);
    if (!cat) return;
    try {
      const subs = await ticketbiCatalog.obtenerSubcategorias(cat);
      setSubcategorias(subs);
    } catch {
      setSubcategorias([]);
    }
  };

  // ── Apertura / reseteo del modal ──
  const abrirTicketModal = () => {
    setTicketError(null);
    setTicketOk(null);
    setTicketPaso("datos");
    setTicketAsunto(ticket?.asunto ?? "");
    setTicketCategoria("");
    setTicketSubcategoria("");
    setTicketNivel("");
    setTicketFechaTentativa("");
    setTicketDescripcion("");
    setTicketConclusion("");
    setTicketTareas([]);
    cargarCatalogos();
    setTicketModal(true);
  };

  // ── Gestión de tareas (estado temporal) ──
  const agregarTareaALista = (t: Omit<TareaLinea, "id">) => {
    setTicketTareas((prev) => [...prev, { ...t, id: `${Date.now()}-${Math.random().toString(36).slice(2)}` }]);
    setAgregarTarea(false);
  };

  const eliminarTarea = (id: string) => {
    setTicketTareas((prev) => prev.filter((t) => t.id !== id));
  };

  // ── Creación del ticket (POST) ──
  const crearTicketDesarrollo = async () => {
    if (!localbiId) {
      setTicketError("No se puede crear el ticket porque no se pudo identificar el local del cliente.");
      return;
    }
    if (!user?.personabi_id) {
      setTicketError("Tu usuario no tiene configurado el identificador de Micro-Services (personabi_id).");
      return;
    }
    if (!ticketAsunto.trim()) {
      setTicketError("Ingresa un asunto para el ticket.");
      setTicketPaso("datos");
      return;
    }
    if (ticketTareas.length === 0) {
      setTicketError("Agrega al menos una tarea antes de crear el ticket.");
      setTicketPaso("tareas");
      return;
    }
    if (ticketTareas.some((t) => !t.descripcion.trim())) {
      setTicketError("Cada tarea debe tener una descripción.");
      return;
    }
    setCreandoTicket(true);
    setTicketError(null);
    try {
      const res = await api.post("/atenciones/ticket-desarrollo", {
        localbi_id: localbiId,
        personabi_id: user.personabi_id,
        ticketbi_asunto: ticketAsunto.trim(),
        ticketbi_categoria: (ticketCategoria || "DESARROLLO").toUpperCase(),
        subcategoria: ticketSubcategoria,
        nivel: ticketNivel,
        fecha_tentativa: ticketFechaTentativa,
        descripcion: ticketDescripcion,
        conclusion: ticketConclusion,
        detalleList: ticketTareas.map((t) => ({
          tarea_nombre: t.descripcion.trim(),
          tarea_descripcion: t.descripcion.trim(),
          area: "DESARROLLO",
          proyecto: t.proyecto,
          tipo: t.tipo,
        })),
      });
      const data = res.data?.data;
      setTicketOk({ ticketbiId: data?.ticketbi_id ?? "" });
      setTicketPaso("exito");
    } catch (e: any) {
      const msg = e?.response?.data?.error ?? e?.message ?? "No fue posible crear el ticket. Inténtalo nuevamente o contacta al administrador.";
      setTicketError(String(msg));
    } finally {
      setCreandoTicket(false);
    }
  };

  // ── MODO COMPACTO (48px): barra lateral permanente ──
  if (!panelOpen) {
    return (
      <div className="flex h-full w-full flex-col items-center border-r border-black-10 bg-white">
        <button
          type="button"
          onClick={onTogglePanel}
          className="mt-2 flex h-8 w-8 items-center justify-center rounded text-black-45 hover:bg-light"
          title="Expandir panel operativo"
          aria-label="Expandir panel operativo"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="mt-3 flex flex-col items-center gap-3 text-black-25">
          <Stethoscope size={16} className={cn("text-primary", identificado && "text-success")} />
          <LayoutGrid size={16} />
          <Activity size={16} />
          <History size={16} />
          <User size={16} />
        </div>
        <div className="mt-auto pb-3">
          <span className="block h-1.5 w-1.5 rounded-full bg-black-10" />
        </div>
      </div>
    );
  }

  // ── MODO EXPANDIDO (420-520px): contenido completo ──
  return (
    <div className="relative flex h-full min-h-0 flex-col">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-black-10 px-3 py-2">
        <div className="flex items-center gap-1.5">
          <span className="text-primary"><Stethoscope size={11} /></span>
          <span className="uppercase tracking-wider text-[10px] font-medium text-black-45">Panel Operativo</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={abrirTicketModal}
            className="inline-flex items-center gap-1 rounded bg-primary px-2 py-1 text-[9px] font-medium text-white hover:bg-primary-85"
            title="Crear un ticket interno para el área de Desarrollo"
          >
            <Plus size={10} /> Crear ticket a Desarrollo
          </button>
          <button
            type="button"
            onClick={onTogglePanel}
            className="flex h-6 w-6 items-center justify-center rounded text-black-45 hover:bg-light"
            title="Abatir panel operativo"
            aria-label="Abatir panel operativo"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Cabecera contextual */}
      <div className="shrink-0 border-b border-black-10 px-3 py-2">
        {resolviendo ? (
          <p className="text-[10px] text-black-45">Identificando cliente…</p>
        ) : identificado ? (
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-[11px] font-semibold text-black-85">{unidadNombre || unidadActiva}</span>
              <button type="button" onClick={() => { setUnidadManual(null); setTab("resumen"); }} className="shrink-0 text-[9px] text-primary hover:underline">Cambiar</button>
            </div>
            {identificadoAutomatico ? (
              <p className="inline-flex items-center gap-1 rounded bg-success-5 px-1.5 py-0.5 text-[8px] font-medium text-success">
                <AlertCircle size={9} /> Cliente identificado automáticamente
              </p>
            ) : (
              <p className="inline-flex items-center gap-1 rounded bg-primary-10 px-1.5 py-0.5 text-[8px] font-medium text-primary">
                <AlertCircle size={9} /> Cliente vinculado manualmente
              </p>
            )}
            {dominioActual && <p className="font-mono text-[9px] text-black-45">{dominioActual}</p>}
            {kpis && (
              <div className="flex flex-wrap items-center gap-1.5 text-[9px] text-black-45">
                {kpis.segmento && <SegmentoBadge segmento={kpis.segmento} />}
                {kpis.plan && <span className="rounded bg-black-5 px-1.5 py-0.5">Plan: {kpis.plan}</span>}
                {kpis.kam && <span className="rounded bg-black-5 px-1.5 py-0.5">KAM: {kpis.kam}</span>}
                {kpis.pago != null && <span className="rounded bg-black-5 px-1.5 py-0.5">{fmtMoneda(kpis.pago)}</span>}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {dominioActual ? (
              <p className="text-[10px] text-warning-65">Cliente no identificado automáticamente para «{subdominio || dominioActual}».</p>
            ) : (
              <p className="text-[10px] text-black-45">Esta atención no tiene dominio.</p>
            )}
            <div>
              <HistoriaClientePanel unidadInicial={null} />
            </div>
          </div>
        )}

        <div className="mt-1.5 flex items-center gap-1.5">
          <button type="button" onClick={() => setManual(true)} className="rounded border border-black-10 px-2 py-0.5 text-[9px] text-black-65 hover:bg-light">
            <Search size={9} className="mr-0.5 inline" /> Buscar
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex shrink-0 items-center gap-1 border-b border-black-10 px-2.5 py-1.5">
        {([
          ["resumen", "Resumen", LayoutGrid],
          ["actividad", "Actividad", Activity],
          ["operacion", "Operación", Stethoscope],
          ["historial", "Historial", History],
        ] as [Tab, string, typeof Activity][]).map(([key, label, Icon]) => (
          <button key={key} type="button" onClick={() => setTab(key)}
            className={cn("inline-flex items-center gap-1 rounded px-2 py-1 text-[10px] font-medium", tab === key ? "bg-primary text-white" : "text-black-45 hover:bg-light")}>
            <Icon size={11} /> {label}
          </button>
        ))}
        <div className="ml-auto">
          <button type="button" onClick={() => setUnidadManual(null)} className="rounded p-1 text-black-45 hover:bg-light" title="Actualizar"><RefreshCcw size={11} /></button>
        </div>
      </div>

      {/* Contenido con scroll propio */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {!identificado ? (
          <div className="p-4 text-center text-[10px] text-black-45">
            {manual ? (
              <p>Selecciona un cliente de la búsqueda manual.</p>
            ) : (
              <p>{resolviendo ? "Identificando…" : "No hay cliente identificado para esta atención."}</p>
            )}
          </div>
        ) : historiaLoading ? (
          <div className="space-y-2 p-3">
            {[0, 1, 2].map((i) => <div key={i} className="h-10 animate-pulse rounded bg-black-5" />)}
          </div>
        ) : !ficha ? (
          <div className="p-4 text-center text-[10px] text-danger">No pudimos cargar la información del cliente.</div>
        ) : (
          <HistoriaClinicaView unidadNegocio={unidadActiva as string} />
        )}
      </div>

      {/* Modal: Crear ticket a Desarrollo (estilo Micro-Services) */}
      {ticketModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black-65/40 p-4">
          <div className="flex max-h-[90%] w-[880px] max-w-full flex-col overflow-hidden rounded-lg border border-black-10 bg-white shadow-lg">
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-black-10 px-4 py-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-black-85"><Plus size={14} className="text-primary" /> Crear ticket a Desarrollo</h3>
              <button type="button" onClick={() => setTicketModal(false)} disabled={creandoTicket} className="text-black-45 hover:text-black-65"><X size={16} /></button>
            </div>

            {/* Paso: Éxito */}
            {ticketPaso === "exito" && (
              <div className="flex flex-1 flex-col items-center justify-center space-y-3 p-8 text-center">
                <CheckCircle2 size={36} className="text-success" />
                <p className="text-[13px] font-medium text-black-85">
                  Ticket {ticketOk?.ticketbiId ? `#${ticketOk.ticketbiId} ` : ""}creado correctamente para Desarrollo.
                </p>
                <button type="button" onClick={() => setTicketModal(false)} className="rounded bg-primary px-4 py-1.5 text-[11px] font-medium text-white">Cerrar</button>
              </div>
            )}

            {/* Paso: Datos */}
            {ticketPaso === "datos" && (
              <div className="flex-1 overflow-y-auto p-4">
                <div className="mb-3 rounded border border-black-5 bg-light px-3 py-2 text-[10px] text-black-65">
                  <p><span className="text-black-25">Cliente: </span>{unidadNombre || unidadActiva || "—"}</p>
                  <p><span className="text-black-25">Local: </span>{localbiId || "—"}</p>
                  <p><span className="text-black-25">Dominio: </span>{ticket?.dominio || "—"}</p>
                  <p><span className="text-black-25">Canal: </span>{ticket?.tipo || "—"}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="mb-1 block text-[10px] font-medium text-black-45">Asunto del ticket *</label>
                    <input value={ticketAsunto} onChange={(e) => setTicketAsunto(e.target.value)} placeholder="Ej: Error al emitir factura electrónica" className="h-8 w-full rounded border border-black-10 px-2 text-[11px] focus:border-primary focus:outline-none" />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-medium text-black-45">Categoría</label>
                    <select value={ticketCategoria} onChange={(e) => cambiarCategoria(e.target.value)} className="h-8 w-full rounded border border-black-10 px-2 text-[11px] focus:border-primary focus:outline-none">
                      <option value="">—</option>
                      {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-medium text-black-45">Subcategoría</label>
                    <select value={ticketSubcategoria} onChange={(e) => setTicketSubcategoria(e.target.value)} disabled={!ticketCategoria} className="h-8 w-full rounded border border-black-10 px-2 text-[11px] focus:border-primary focus:outline-none disabled:opacity-50">
                      <option value="">—</option>
                      {subcategorias.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-medium text-black-45">Nivel</label>
                    <select value={ticketNivel} onChange={(e) => setTicketNivel(e.target.value)} className="h-8 w-full rounded border border-black-10 px-2 text-[11px] focus:border-primary focus:outline-none">
                      <option value="">—</option>
                      {niveles.map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-medium text-black-45">Fecha tentativa de solución</label>
                    <input type="date" value={ticketFechaTentativa} onChange={(e) => setTicketFechaTentativa(e.target.value)} className="h-8 w-full rounded border border-black-10 px-2 text-[11px] focus:border-primary focus:outline-none" />
                  </div>
                  <div className="col-span-2">
                    <label className="mb-1 block text-[10px] font-medium text-black-45">Descripción</label>
                    <textarea value={ticketDescripcion} onChange={(e) => setTicketDescripcion(e.target.value)} placeholder="Detalle principal del ticket" className="min-h-[70px] w-full rounded border border-black-10 px-2 py-1.5 text-[11px] focus:border-primary focus:outline-none" />
                  </div>
                  <div className="col-span-2">
                    <label className="mb-1 block text-[10px] font-medium text-black-45">Conclusión</label>
                    <textarea value={ticketConclusion} onChange={(e) => setTicketConclusion(e.target.value)} placeholder="Solución conocida al momento de derivar (opcional)" className="min-h-[50px] w-full rounded border border-black-10 px-2 py-1.5 text-[11px] focus:border-primary focus:outline-none" />
                  </div>
                </div>
                {ticketError && <p className="mt-2 text-[10px] text-danger">{ticketError}</p>}
                <div className="mt-3 flex justify-end gap-2">
                  <button type="button" onClick={() => setTicketModal(false)} className="rounded border border-black-10 px-3 py-1 text-[10px] text-black-45 hover:bg-light">Cancelar</button>
                  <button type="button" onClick={() => { setTicketError(null); setTicketPaso("tareas"); }} className="rounded bg-primary px-3 py-1 text-[10px] font-medium text-white">Continuar → Tareas</button>
                </div>
              </div>
            )}

            {/* Paso: Tareas */}
            {ticketPaso === "tareas" && (
              <div className="flex flex-1 flex-col overflow-hidden">
                <div className="flex shrink-0 items-center justify-between border-b border-black-10 px-4 py-2">
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold text-black-85"><ListChecks size={12} className="text-primary" /> Tareas ({ticketTareas.length})</p>
                  <button type="button" onClick={() => { setTicketError(null); setAgregarTarea(true); }} className="inline-flex items-center gap-1 rounded bg-primary px-2 py-1 text-[10px] font-medium text-white hover:bg-primary-85">
                    <Plus size={10} /> Agregar tarea
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  {ticketTareas.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <p className="text-[11px] text-black-45">No hay tareas agregadas</p>
                      <button type="button" onClick={() => { setTicketError(null); setAgregarTarea(true); }} className="mt-2 inline-flex items-center gap-1 rounded border border-black-10 px-3 py-1 text-[10px] text-primary hover:bg-light">
                        <Plus size={10} /> Agregar tarea
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {ticketTareas.map((t, i) => (
                        <div key={t.id} className="rounded border border-black-10 p-2">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-[11px] font-medium text-black-85">
                              <span className="mr-1 text-black-25">#{i + 1}</span>
                              {[t.proyecto, t.tipo].filter(Boolean).join(" — ") || "Tarea"}
                            </p>
                            <div className="flex items-center gap-1">
                              <button type="button" onClick={() => { setTicketError(null); setAgregarTarea(true); }} className="rounded p-1 text-black-45 hover:bg-light" title="Editar tarea"><Pencil size={12} /></button>
                              <button type="button" onClick={() => eliminarTarea(t.id)} className="rounded p-1 text-danger hover:bg-danger-5" title="Eliminar tarea"><Trash2 size={12} /></button>
                            </div>
                          </div>
                          {t.descripcion && <p className="mt-1 text-[10px] text-black-65">{t.descripcion}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                  {ticketError && <p className="mt-2 text-[10px] text-danger">{ticketError}</p>}
                </div>
                <div className="flex shrink-0 justify-between gap-2 border-t border-black-10 px-4 py-2">
                  <button type="button" onClick={() => setTicketPaso("datos")} className="rounded border border-black-10 px-3 py-1 text-[10px] text-black-45 hover:bg-light">← Datos</button>
                  <button type="button" onClick={() => { setTicketError(null); setTicketPaso("resumen"); }} className="rounded bg-primary px-3 py-1 text-[10px] font-medium text-white">Continuar → Resumen</button>
                </div>
              </div>
            )}

            {/* Paso: Resumen */}
            {ticketPaso === "resumen" && (
              <div className="flex-1 overflow-y-auto p-4">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-black-45">Resumen del ticket</p>
                <div className="space-y-1 rounded border border-black-5 bg-light px-3 py-2 text-[10px] text-black-65">
                  <p><span className="text-black-25">Cliente: </span>{unidadNombre || unidadActiva || "—"}</p>
                  <p><span className="text-black-25">Local: </span>{localbiId || "—"}</p>
                  <p><span className="text-black-25">Asunto: </span>{ticketAsunto}</p>
                  <p><span className="text-black-25">Categoría: </span>{ticketCategoria || "—"} {ticketSubcategoria ? ` / ${ticketSubcategoria}` : ""}</p>
                  <p><span className="text-black-25">Nivel: </span>{ticketNivel || "—"}</p>
                  {ticketDescripcion && <p><span className="text-black-25">Descripción: </span>{ticketDescripcion}</p>}
                </div>
                <p className="mb-1 mt-3 text-[10px] font-semibold uppercase tracking-wider text-black-45">Tareas ({ticketTareas.length})</p>
                <div className="space-y-2">
                  {ticketTareas.map((t, i) => (
                    <div key={t.id} className="rounded border border-black-10 p-2 text-[10px] text-black-65">
                      <p className="font-medium text-black-85">#{i + 1} {[t.proyecto, t.tipo].filter(Boolean).join(" — ") || "Tarea"}</p>
                      <p>{t.descripcion}</p>
                      {t.casos && <p className="text-black-45"><span className="text-black-25">Casos: </span>{t.casos}</p>}
                    </div>
                  ))}
                </div>
                {ticketError && <p className="mt-2 text-[10px] text-danger">{ticketError}</p>}
                <div className="mt-3 flex justify-between gap-2">
                  <button type="button" onClick={() => setTicketPaso("tareas")} disabled={creandoTicket} className="rounded border border-black-10 px-3 py-1 text-[10px] text-black-45 hover:bg-light disabled:opacity-50">← Tareas</button>
                  <button type="button" onClick={crearTicketDesarrollo} disabled={creandoTicket} className="inline-flex items-center gap-1 rounded bg-primary px-4 py-1 text-[10px] font-medium text-white disabled:opacity-50">
                    {creandoTicket ? <><Loader2 size={11} className="animate-spin" /> Creando ticket…</> : "Crear ticket"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Agregar Tarea (grilla estilo Micro-Services) */}
      {agregarTarea && (
        <AgregarTareaModal
          proyectos={proyectos}
          tipos={tipos}
          area="Desarrollo"
          onCancel={() => setAgregarTarea(false)}
          onAgregar={agregarTareaALista}
        />
      )}
    </div>
  );
}

/* ── Modal Agregar Tarea ─────────────────────────────── */
function AgregarTareaModal({ proyectos, tipos, area, onCancel, onAgregar }: {
  proyectos: string[];
  tipos: string[];
  area: string;
  onCancel: () => void;
  onAgregar: (t: Omit<TareaLinea, "id">) => void;
}) {
  const [proyecto, setProyecto] = useState("");
  const [version, setVersion] = useState("");
  const [tipo, setTipo] = useState("");
  const [etapaError, setEtapaError] = useState("");
  const [fechaEntrega, setFechaEntrega] = useState("");
  const [referencia, setReferencia] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [casos, setCasos] = useState("");
  const [error, setError] = useState<string | null>(null);

  const guardar = () => {
    if (!descripcion.trim()) {
      setError("La descripción de la tarea es obligatoria.");
      return;
    }
    onAgregar({ proyecto, version, tipo, etapaError, fechaEntrega, referencia, descripcion: descripcion.trim(), casos });
  };

  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black-65/40 p-4">
      <div className="flex max-h-[90%] w-[820px] max-w-full flex-col overflow-hidden rounded-lg border border-black-10 bg-white shadow-lg">
        <div className="flex shrink-0 items-center justify-between border-b border-black-10 px-4 py-3">
          <h4 className="text-sm font-semibold text-black-85">Agregar Tarea</h4>
          <button type="button" onClick={onCancel} className="text-black-45 hover:text-black-65"><X size={16} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-3">
            <label className="mb-1 block text-[10px] font-medium text-black-45">Área</label>
            <select value={area} disabled className="h-8 w-full rounded border border-black-10 bg-light px-2 text-[11px] text-black-65 disabled:opacity-70">
              <option value={area}>{area}</option>
            </select>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="mb-1 block text-[10px] font-medium text-black-45">Proyecto</label>
              <select value={proyecto} onChange={(e) => setProyecto(e.target.value)} className="h-8 w-full rounded border border-black-10 px-2 text-[11px] focus:border-primary focus:outline-none">
                <option value="">—</option>
                {proyectos.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-medium text-black-45">Versión</label>
              <input value={version} onChange={(e) => setVersion(e.target.value)} className="h-8 w-full rounded border border-black-10 px-2 text-[11px] focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-medium text-black-45">Tipo</label>
              <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="h-8 w-full rounded border border-black-10 px-2 text-[11px] focus:border-primary focus:outline-none">
                <option value="">—</option>
                {tipos.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-medium text-black-45">Etapa Error</label>
              <input value={etapaError} onChange={(e) => setEtapaError(e.target.value)} placeholder="En producción, QA…" className="h-8 w-full rounded border border-black-10 px-2 text-[11px] focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-medium text-black-45">Fecha entrega tentativa</label>
              <input type="date" value={fechaEntrega} onChange={(e) => setFechaEntrega(e.target.value)} className="h-8 w-full rounded border border-black-10 px-2 text-[11px] focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-medium text-black-45">Referencia (Link Drive)</label>
              <input value={referencia} onChange={(e) => setReferencia(e.target.value)} placeholder="https://…" className="h-8 w-full rounded border border-black-10 px-2 text-[11px] focus:border-primary focus:outline-none" />
            </div>
          </div>
          <div className="mt-3">
            <label className="mb-1 block text-[10px] font-medium text-black-45">Descripción *</label>
            <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Qué debe realizar Desarrollo" className="min-h-[70px] w-full rounded border border-black-10 px-2 py-1.5 text-[11px] focus:border-primary focus:outline-none" />
          </div>
          <div className="mt-3">
            <label className="mb-1 block text-[10px] font-medium text-black-45">¿Qué casos deben contemplar una vez implementada esta mejora?</label>
            <textarea value={casos} onChange={(e) => setCasos(e.target.value)} className="min-h-[50px] w-full rounded border border-black-10 px-2 py-1.5 text-[11px] focus:border-primary focus:outline-none" />
          </div>
          {error && <p className="mt-2 text-[10px] text-danger">{error}</p>}
        </div>
        <div className="flex shrink-0 justify-end gap-2 border-t border-black-10 px-4 py-2">
          <button type="button" onClick={onCancel} className="rounded border border-black-10 px-3 py-1 text-[10px] text-black-45 hover:bg-light">Cancelar</button>
          <button type="button" onClick={guardar} className="rounded bg-primary px-3 py-1 text-[10px] font-medium text-white">Agregar tarea</button>
        </div>
      </div>
    </div>
  );
}
