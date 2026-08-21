import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { X, Plus, RefreshCcw, ArrowUpRight, Download, Trash2, CheckCircle2, RotateCcw, GitMerge, Link2, ChevronDown, ChevronRight } from "lucide-react";
import {
  useQdLista, useQdDetalle, useQdCrear, useQdActualizar, useQdEliminar,
  useQdEstados, useQdResultados, useQdAreas, useQdProductos, useQdTiposQueja,
  useQdDominios, useQdCerrarCaso, useQdReabrirCaso, useQdConsolidarCasos,
  useQdVincularTicket, useQdAsignarDominio,
  qdService,
} from "@/modules/quejas-devoluciones";
import type { QdCaso, QdInteraccion, QdTipo } from "@/modules/quejas-devoluciones";
import { EstadoBadge, ResultadoBadge, fmtFecha, fmtMoneda, fmtPct } from "@/modules/quejas-devoluciones/components/qdUI";
import { useAuth, authService } from "@/modules/auth";
import { cn } from "@/lib/utils";

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

export default function QuejasDevoluciones() {
  const { user } = useAuth();
  const puedeCrear = authService.hasPermiso(user, "Quejas y Devoluciones", "crear");
  const puedeEditar = authService.hasPermiso(user, "Quejas y Devoluciones", "editar");
  const puedeEliminar = authService.hasPermiso(user, "Quejas y Devoluciones", "eliminar");
  const puedeExportar = authService.hasPermiso(user, "Quejas y Devoluciones", "exportar");
  const puedeAdministrar = authService.hasPermiso(user, "Quejas y Devoluciones", "administrar");

  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [casoId, setCasoId] = useState<string | null>(null);
  const [creando, setCreando] = useState(false);
  const [buscador, setBuscador] = useState("");
  const [draft, setDraft] = useState<Filtros>(() => filtrosIniciales());
  const [applied, setApplied] = useState<Filtros>(() => filtrosIniciales());
  const [aplicando, setAplicando] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [errorExport, setErrorExport] = useState<string | null>(null);

  const [selCasos, setSelCasos] = useState<Set<string>>(new Set());
  const [consolidando, setConsolidando] = useState(false);
  const [confirmandoCerrar, setConfirmandoCerrar] = useState(false);
  const [confirmandoReabrir, setConfirmandoReabrir] = useState(false);

  const { data: devoluciones, isLoading: loadD, error: errD, refetch: refD } = useQdLista("devolucion");
  const { data: quejas, isLoading: loadQ, error: errQ, refetch: refQ } = useQdLista("queja");
  const { data: detalle } = useQdDetalle(casoId);
  const crear = useQdCrear();
  const actualizar = useQdActualizar();
  const eliminar = useQdEliminar();
  const cerrar = useQdCerrarCaso();
  const reabrir = useQdReabrirCaso();
  const consolidar = useQdConsolidarCasos();
  const vincular = useQdVincularTicket();
  const asignarDominio = useQdAsignarDominio();
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false);

  const estados = useQdEstados().data ?? [];
  const resultados = useQdResultados().data ?? [];
  const areas = useQdAreas().data ?? [];
  const productos = useQdProductos().data ?? [];
  const tiposQueja = useQdTiposQueja().data ?? [];
  const dominios = useQdDominios().data ?? [];

  const todos = useMemo(() => [...(devoluciones ?? []), ...(quejas ?? [])], [devoluciones, quejas]);
  const lista = filtro === "todas" ? todos : filtro === "devolucion" ? (devoluciones ?? []) : (quejas ?? []);
  const cargando = filtro === "todas" ? loadD || loadQ : filtro === "devolucion" ? loadD : loadQ;
  const error = filtro === "todas" ? errD ?? errQ : filtro === "devolucion" ? errD : errQ;
  const reintentar = () => { refD(); refQ(); };

  const filtrada = useMemo(() => {
    return lista.filter((c) => {
      const q = buscador.trim().toLowerCase();
      if (q && ![c.numero, c.ticket_id, c.dominio, c.pais, c.motivo, c.clasificacion, c.producto, c.area]
        .some((v) => (v ?? "").toLowerCase().includes(q))) return false;
      if (applied.desde && new Date(c.created_at) < new Date(applied.desde)) return false;
      if (applied.hasta && new Date(c.created_at) > new Date(applied.hasta)) return false;
      if (applied.pais && c.pais !== applied.pais) return false;
      if (applied.estado && c.estado !== applied.estado) return false;
      if (applied.resultado && c.resultado !== applied.resultado) return false;
      if (applied.asesor && c.asesor !== applied.asesor) return false;
      if (applied.area && c.area !== applied.area) return false;
      if (applied.producto && c.producto !== applied.producto) return false;
      if (applied.tipoQueja && c.clasificacion !== applied.tipoQueja) return false;
      return true;
    });
  }, [lista, buscador, applied]);

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

  /** Limpiar: restaura draft a los valores iniciales; NO actualiza la tabla todavía. */
  const limpiar = () => setDraft(filtrosIniciales());

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

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      {/* Header del módulo */}
      <div className="shrink-0 border-b border-black-10 px-6 py-3">
        <div className="flex items-center gap-2">
          <RefreshCcw size={16} className="text-primary" />
          <h1 className="text-sm font-semibold text-black-85">Quejas y Devoluciones</h1>
        </div>
        <p className="mt-0.5 text-[11px] text-black-45">Gestión y seguimiento de casos de clientes.</p>
      </div>

      {/* Barra tipo + búsqueda */}
      <div className="shrink-0 border-b border-black-10 px-6 py-2">
        <div className="flex items-center gap-1">
          {(["todas", "queja", "devolucion"] as Filtro[]).map((t) => (
            <button key={t} type="button" onClick={() => cambiarFiltro(t)}
              className={cn("inline-flex items-center gap-1 rounded px-2.5 py-1 text-[11px] font-medium", filtro === t ? "bg-primary text-white" : "bg-black-5 text-black-45 hover:bg-black-10")}>
              {t === "todas" ? "Todas" : t === "queja" ? "Quejas" : "Devoluciones"}
              <span className={cn("rounded-full px-1.5 text-[9px] leading-4", filtro === t ? "bg-white/20 text-white" : "bg-black-10 text-black-45")}>
                {t === "todas" ? todos.length : t === "queja" ? (quejas?.length ?? 0) : (devoluciones?.length ?? 0)}
              </span>
            </button>
          ))}
          <div className="ml-auto flex items-center gap-1.5">
            {puedeAdministrar && seleccionados.length > 0 && (
              <button
                type="button"
                onClick={() => setConsolidando(true)}
                title={`Consolidar ${seleccionados.length} caso(s) seleccionado(s)`}
                className="inline-flex items-center gap-1 rounded border border-black-10 bg-white px-2.5 py-1 text-[10px] font-medium text-black-65 hover:bg-light"
              >
                <GitMerge size={12} /> Consolidar ({seleccionados.length})
              </button>
            )}
            <input value={buscador} onChange={(e) => setBuscador(e.target.value)} placeholder="Buscar ticket, cliente, dominio o RUC..." className="h-7 w-64 rounded border border-black-10 px-2 text-[11px] focus:border-primary focus:outline-none" />
            {puedeExportar && (
              <button
                type="button"
                onClick={() => exportarExcel(false)}
                disabled={exportando}
                title={hayFiltros ? "Exportar los casos que cumplen los filtros activos" : "Exportar todos los casos (sin filtros)"}
                className="inline-flex items-center gap-1 rounded border border-black-10 bg-white px-2.5 py-1 text-[10px] font-medium text-black-65 hover:bg-light disabled:opacity-50"
              >
                <Download size={12} /> {exportando ? "Exportando…" : "Exportar Excel"}
              </button>
            )}
            {puedeAdministrar && (
              <button
                type="button"
                onClick={() => exportarExcel(true)}
                disabled={exportando}
                title="Exportar el histórico completo sin aplicar filtros"
                className="inline-flex items-center gap-1 rounded border border-black-10 bg-white px-2.5 py-1 text-[10px] font-medium text-black-65 hover:bg-light disabled:opacity-50"
              >
                <Download size={12} /> Exportar todo
              </button>
            )}
            {puedeCrear && (
              <button type="button" onClick={() => setCreando(true)} className="inline-flex items-center gap-1 rounded bg-primary px-2.5 py-1 text-[10px] font-medium text-white hover:bg-primary-85">
                <Plus size={12} /> Nuevo caso
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filtros compactos */}
      <div className="shrink-0 border-b border-black-10 px-6 py-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <input type="date" value={datePart(draft.desde)} onChange={(e) => e.target.value ? setFiltroVal("desde", `${e.target.value}T00:00`) : setFiltroVal("desde", "")} className="h-7 rounded border border-black-10 px-1.5 text-[10px]" title={`Desde · ${draft.desde || ""}`} />
          <input type="date" value={datePart(draft.hasta)} onChange={(e) => e.target.value ? setFiltroVal("hasta", `${e.target.value}T23:59`) : setFiltroVal("hasta", "")} className="h-7 rounded border border-black-10 px-1.5 text-[10px]" title={`Hasta · ${draft.hasta || ""}`} />
          <Select value={draft.pais} onChange={(v) => setFiltroVal("pais", v)} options={paises(todos)} placeholder="País" />
          <Select value={draft.estado} onChange={(v) => setFiltroVal("estado", v)} options={estados.map((e) => ({ value: e.nombre, label: e.nombre }))} placeholder="Estado" />
          <Select value={draft.resultado} onChange={(v) => setFiltroVal("resultado", v)} options={resultados.map((r) => ({ value: r.nombre, label: r.nombre }))} placeholder="Resultado" />
          <Select value={draft.asesor} onChange={(v) => setFiltroVal("asesor", v)} options={asesores(todos)} placeholder="Asesor" />
          <Select value={draft.area} onChange={(v) => setFiltroVal("area", v)} options={areas.map((a) => ({ value: a.nombre, label: a.nombre }))} placeholder="Área" />
          <Select value={draft.producto} onChange={(v) => setFiltroVal("producto", v)} options={productos.map((p) => ({ value: p.nombre, label: p.nombre }))} placeholder="Producto" />
          <Select value={draft.tipoQueja} onChange={(v) => setFiltroVal("tipoQueja", v)} options={tiposQueja.map((t) => ({ value: t.nombre, label: t.nombre }))} placeholder="Tipo queja" />
          <button type="button" onClick={aplicar} disabled={aplicando} className="inline-flex items-center gap-1 rounded bg-primary px-2.5 py-1 text-[10px] font-medium text-white hover:bg-primary-85 disabled:opacity-50">
            {aplicando ? "Aplicando…" : "Aplicar filtros"}
          </button>
          <button type="button" onClick={limpiar} disabled={aplicando} className="rounded border border-black-10 px-2 py-1 text-[10px] text-black-45 hover:bg-light disabled:opacity-50">Limpiar</button>
        </div>
        {errorExport && <p className="mt-1.5 text-[10px] text-danger">{errorExport}</p>}
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Listado */}
        <div className="flex min-w-0 flex-1 flex-col bg-white">
          {cargando ? (
            <div className="p-4 text-[11px] text-black-25">Cargando…</div>
          ) : error ? (
            <div className="flex flex-1 flex-col items-center justify-center p-8">
              <p className="text-[12px] font-medium text-danger">No pudimos cargar los casos.</p>
              <button type="button" onClick={reintentar} className="mt-2 rounded bg-primary px-3 py-1 text-[10px] font-medium text-white">Reintentar</button>
            </div>
          ) : filtrada.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
              <p className="text-[12px] text-black-45">No hay casos registrados.</p>
              {puedeCrear && (
                <button type="button" onClick={() => setCreando(true)} className="mt-2 inline-flex items-center gap-1 rounded bg-primary px-3 py-1 text-[10px] font-medium text-white">
                  <Plus size={12} /> Nuevo caso
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full border-collapse text-left">
                <thead className="sticky top-0 z-10 bg-white">
                  <tr className="border-b border-black-10 text-[9px] uppercase tracking-wider text-black-45">
                    {puedeAdministrar && <th className="w-8 px-3 py-2 font-medium" title="Seleccionar para consolidar">Sel.</th>}
                    <th className="px-3 py-2 font-medium">Caso</th>
                    <th className="px-3 py-2 font-medium">Tipo</th>
                    <th className="px-3 py-2 font-medium">Fecha</th>
                    <th className="px-3 py-2 font-medium">Ticket</th>
                    <th className="px-3 py-2 font-medium">Cliente / Dominio</th>
                    <th className="px-3 py-2 font-medium">País</th>
                    <th className="px-3 py-2 font-medium">Monto / Detalle</th>
                    <th className="px-3 py-2 font-medium">Estado</th>
                    <th className="px-3 py-2 font-medium">Resultado</th>
                    <th className="px-3 py-2 font-medium">Asesor</th>
                    <th className="px-3 py-2 font-medium">Últ. actualización</th>
                    <th className="px-3 py-2 font-medium">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrada.map((c) => (
                    <tr key={c.id} onClick={() => { setCasoId(c.id); setCreando(false); }} className={cn("cursor-pointer border-b border-black-5 hover:bg-light", selCasos.has(c.id) && "bg-primary-5")}>
                      {puedeAdministrar && (
                        <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                          <input type="checkbox" checked={selCasos.has(c.id)} disabled={c.caso_cerrado} onChange={() => toggleSel(c)}
                            title={c.caso_cerrado ? "Los casos cerrados no se pueden consolidar" : "Seleccionar para consolidar"} className="accent-primary" />
                        </td>
                      )}
                      <td className="px-3 py-2">
                        <div className="font-mono text-[10px] font-semibold text-primary">{c.numero}</div>
                        <CasoEstadoBadge cerrado={c.caso_cerrado} />
                      </td>
                      <td className="px-3 py-2 text-[10px] text-black-85">{c.tipo === "devolucion" ? "Devolución" : "Queja"}</td>
                      <td className="px-3 py-2 text-[10px] text-black-45">{fmtFecha(c.created_at)}</td>
                      <td className="px-3 py-2 font-mono text-[10px] text-black-45">
                        {c.ticket_id || "—"}
                        {c.total_interacciones != null && c.total_interacciones > 1 && (
                          <span className="ml-1 rounded bg-primary-5 px-1 text-[8px] font-medium text-primary">{c.total_interacciones} tickets</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-[10px] text-black-85">{c.dominio ? c.dominio : <SinDominioBadge />}</td>
                      <td className="px-3 py-2 text-[10px] text-black-45">{c.pais || "—"}</td>
                      <td className="px-3 py-2 text-[10px] text-black-85">
                        {c.tipo === "devolucion" ? (
                          <div className="space-y-0.5">
                            <div className="text-[10px] font-medium text-black-85">
                              Solicitado: {fmtMoneda(c.monto_pagado, c.moneda)}
                            </div>
                            <div className="text-[9px] text-black-65">
                              A devolver: {c.monto_devuelto == null ? "—" : fmtMoneda(c.monto_devuelto, c.moneda)}
                            </div>
                            {c.porcentaje != null && (
                              <div className="text-[9px] font-medium text-primary">{fmtPct(c.porcentaje)} conciliado</div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <div>{c.clasificacion || "—"}</div>
                            <div className="text-[9px] text-black-45">{c.area || c.producto || (c.motivo ? c.motivo.slice(0, 40) : "")}</div>
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <div className="space-y-0.5">
                          <EstadoBadge estado={c.estado} />
                        </div>
                      </td>
                      <td className="px-3 py-2"><ResultadoBadge resultado={c.resultado} /></td>
                      <td className="px-3 py-2 text-[10px] text-black-45">{c.asesor || "—"}</td>
                      <td className="px-3 py-2 text-[10px] text-black-45">{fmtFecha(c.updated_at)}</td>
                      <td className="px-3 py-2">
                        <button type="button" onClick={(e) => { e.stopPropagation(); setCasoId(c.id); setCreando(false); }} className="rounded border border-black-10 px-2 py-0.5 text-[10px] text-primary hover:bg-primary-5">
                          Abrir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Drawer detalle / formulario */}
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
            onAsignarDominio={async (dominio) => {
              await asignarDominio.mutateAsync({ id: detalle.caso.id, dominio });
            }}
            estados={estados} resultados={resultados} areas={areas} productos={productos} tiposQueja={tiposQueja}
            onActualizar={async (input) => actualizar.mutateAsync({ id: detalle.caso.id, input })}
            onCerrar={() => setCasoId(null)}
          />
        )}
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

function Select({ value, onChange, options, placeholder }: {
  value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; placeholder: string;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="h-7 rounded border border-black-10 px-1.5 text-[10px] text-black-65 focus:border-primary focus:outline-none">
      <option value="">{placeholder}</option>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function paises(casos: QdCaso[]): { value: string; label: string }[] {
  return [...new Set(casos.map((c) => c.pais).filter(Boolean) as string[])].map((p) => ({ value: p, label: p }));
}
function asesores(casos: QdCaso[]): { value: string; label: string }[] {
  return [...new Set(casos.map((c) => c.asesor).filter(Boolean) as string[])].map((a) => ({ value: a, label: a }));
}

/* ============================================================ */

function CasoForm({ estados, resultados, areas, productos, tiposQueja, onClose, onSave }: {
  estados: any[]; resultados: any[]; areas: any[]; productos: any[]; tiposQueja: any[];
  onClose: () => void; onSave: (input: any) => Promise<unknown>;
}) {
  const crear = useQdCrear();
  const [tipo, setTipo] = useState<QdTipo | null>(null);
  const [form, setForm] = useState<any>({
    ticketId: "", dominio: "", pais: "", estado: "", resultado: "",
    moneda: "PEN", montoPagado: "", tipoMonto: "", area: "", motivo: "", porcentaje: "", montoDevuelto: "",
    clasificacion: "", producto: "", observacion: "",
  });
  const [error, setError] = useState<string | null>(null);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const montoPagado = form.montoPagado ? Number(form.montoPagado) : null;
  const porcentaje = form.porcentaje !== "" ? Number(form.porcentaje) : null;
  const calculado = montoPagado != null && porcentaje != null ? montoPagado * (porcentaje / 100) : null;

  const guardar = async () => {
    setError(null);
    if (!tipo) { setError("Selecciona el tipo de caso."); return; }
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
    }
  };

  return (
    <div className="flex w-[440px] shrink-0 flex-col border-l border-black-10 bg-white">
      <div className="flex items-center justify-between border-b border-black-10 px-4 py-3">
        <h2 className="text-sm font-semibold text-black-85">Nuevo caso</h2>
        <button type="button" onClick={onClose} className="text-black-45 hover:text-black-65"><X size={16} /></button>
      </div>
      <div className="flex-1 overflow-y-auto space-y-3 p-4">
        {!tipo ? (
          <div className="space-y-2">
            <p className="text-[10px] text-black-45">¿Qué tipo de caso vas a crear?</p>
            <button type="button" onClick={() => setTipo("queja")} className="w-full rounded border border-black-10 px-3 py-2 text-left text-[12px] font-medium text-black-85 hover:bg-light">Queja</button>
            <button type="button" onClick={() => setTipo("devolucion")} className="w-full rounded border border-black-10 px-3 py-2 text-left text-[12px] font-medium text-black-85 hover:bg-light">Devolución</button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              <input value={form.ticketId} onChange={(e) => set("ticketId", e.target.value)} placeholder="Ticket" className="h-8 rounded border border-black-10 px-2 text-[11px] focus:border-primary focus:outline-none" />
              <input value={form.dominio} onChange={(e) => set("dominio", e.target.value)} placeholder="Dominio" className="h-8 rounded border border-black-10 px-2 text-[11px] focus:border-primary focus:outline-none" />
            </div>
            <input value={form.pais} onChange={(e) => set("pais", e.target.value)} placeholder="País" className="h-8 w-full rounded border border-black-10 px-2 text-[11px] focus:border-primary focus:outline-none" />
            <select value={form.estado} onChange={(e) => set("estado", e.target.value)} className="h-8 w-full rounded border border-black-10 px-2 text-[11px] focus:border-primary focus:outline-none">
              <option value="">Estado…</option>
              {estados.map((e) => <option key={e.id} value={e.nombre}>{e.nombre}</option>)}
            </select>

            {tipo === "devolucion" ? (
              <>
                <select value={form.moneda} onChange={(e) => set("moneda", e.target.value)} className="h-8 w-full rounded border border-black-10 px-2 text-[11px] focus:border-primary focus:outline-none">
                  <option value="PEN">PEN — Soles</option>
                  <option value="USD">USD — Dólares</option>
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <input value={form.montoPagado} onChange={(e) => set("montoPagado", e.target.value)} type="number" min="0" placeholder="Monto solicitado" className="h-8 rounded border border-black-10 px-2 text-[11px] focus:border-primary focus:outline-none" />
                  <select value={form.tipoMonto} onChange={(e) => set("tipoMonto", e.target.value)} className="h-8 rounded border border-black-10 px-2 text-[11px] focus:border-primary focus:outline-none">
                    <option value="">Tipo…</option>
                    <option value="ARR">ARR</option>
                    <option value="MRR">MRR</option>
                  </select>
                </div>
                <select value={form.area} onChange={(e) => set("area", e.target.value)} className="h-8 w-full rounded border border-black-10 px-2 text-[11px] focus:border-primary focus:outline-none">
                  <option value="">Área causante…</option>
                  {areas.filter((a) => a.activo).map((a) => <option key={a.id} value={a.nombre}>{a.nombre}</option>)}
                </select>
                <textarea value={form.motivo} onChange={(e) => set("motivo", e.target.value)} placeholder="Motivo" className="min-h-[60px] w-full rounded border border-black-10 px-2 py-1.5 text-[11px] focus:border-primary focus:outline-none" />
                <select value={form.resultado} onChange={(e) => set("resultado", e.target.value)} className="h-8 w-full rounded border border-black-10 px-2 text-[11px] focus:border-primary focus:outline-none">
                  <option value="">Resultado…</option>
                  {resultados.map((r) => <option key={r.id} value={r.nombre}>{r.nombre}</option>)}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <input value={form.porcentaje} onChange={(e) => set("porcentaje", e.target.value)} type="number" min="0" max="100" placeholder="% devolución" className="h-8 rounded border border-black-10 px-2 text-[11px] focus:border-primary focus:outline-none" />
                  <input value={form.montoDevuelto !== "" ? form.montoDevuelto : calculado ?? ""} onChange={(e) => set("montoDevuelto", e.target.value)} type="number" min="0" placeholder="Monto devuelto" className="h-8 rounded border border-black-10 px-2 text-[11px] focus:border-primary focus:outline-none" />
                </div>
                {calculado != null && <p className="text-[10px] text-black-45">Calculado: {fmtMoneda(calculado)}</p>}
              </>
            ) : (
              <>
                <select value={form.clasificacion} onChange={(e) => set("clasificacion", e.target.value)} className="h-8 w-full rounded border border-black-10 px-2 text-[11px] focus:border-primary focus:outline-none">
                  <option value="">Tipo de queja…</option>
                  {tiposQueja.map((t) => <option key={t.id} value={t.nombre}>{t.nombre}</option>)}
                </select>
                {form.clasificacion === "Servicio" && (
                  <select value={form.area} onChange={(e) => set("area", e.target.value)} className="h-8 w-full rounded border border-black-10 px-2 text-[11px] focus:border-primary focus:outline-none">
                    <option value="">Área responsable…</option>
                    {areas.filter((a) => a.activo).map((a) => <option key={a.id} value={a.nombre}>{a.nombre}</option>)}
                  </select>
                )}
                {form.clasificacion === "Producto" && (
                  <select value={form.producto} onChange={(e) => set("producto", e.target.value)} className="h-8 w-full rounded border border-black-10 px-2 text-[11px] focus:border-primary focus:outline-none">
                    <option value="">Producto…</option>
                    {productos.map((p) => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}
                  </select>
                )}
                <textarea value={form.motivo} onChange={(e) => set("motivo", e.target.value)} placeholder="Motivo" className="min-h-[60px] w-full rounded border border-black-10 px-2 py-1.5 text-[11px] focus:border-primary focus:outline-none" />
              </>
            )}

            <textarea value={form.observacion} onChange={(e) => set("observacion", e.target.value)} placeholder="Observación" className="min-h-[50px] w-full rounded border border-black-10 px-2 py-1.5 text-[11px] focus:border-primary focus:outline-none" />

            {error && <p className="text-[10px] text-danger">{error}</p>}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setTipo(null)} className="rounded border border-black-10 px-3 py-1 text-[10px] text-black-45 hover:bg-light">Volver</button>
              <button type="button" onClick={guardar} disabled={crear.isPending} className="rounded bg-primary px-3 py-1 text-[10px] font-medium text-white disabled:opacity-50">Crear</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ============================================================ */

function CasoDetalle({ caso, interacciones, auditoria, dominios, puedeEditar, puedeEliminar, confirmandoEliminar, setConfirmandoEliminar, onEliminar, confirmandoCerrar, setConfirmandoCerrar, onCerrarCaso, confirmandoReabrir, setConfirmandoReabrir, onReabrirCaso, onVincularTicket, onAsignarDominio, estados, resultados, areas, productos, tiposQueja, onActualizar, onCerrar }: {
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
  onAsignarDominio: (dominio: string | null) => Promise<unknown>;
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
  const [editandoDominio, setEditandoDominio] = useState(false);
  const [dominioSel, setDominioSel] = useState(caso.dominio ?? "");
  const [dominioBusqueda, setDominioBusqueda] = useState("");
  const [dominioAbierto, setDominioAbierto] = useState(false);
  const [errorDominio, setErrorDominio] = useState<string | null>(null);
  const [guardandoDominio, setGuardandoDominio] = useState(false);

  // Datos propios del caso (Devolución / Queja) — edición desde el detalle.
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
  const [errorDatos, setErrorDatos] = useState<string | null>(null);
  const [guardandoDatos, setGuardandoDatos] = useState(false);

  // Gestión (estado/resultado/observación) — edición desde el detalle.
  const [gestion, setGestion] = useState<any>({
    estado: caso.estado ?? "",
    resultado: caso.resultado ?? "",
    observacion: caso.observacion ?? "",
  });
  const [errorGestion, setErrorGestion] = useState<string | null>(null);
  const [guardandoGestion, setGuardandoGestion] = useState(false);
  const setGestionCampo = (k: string, v: any) => setGestion((f: any) => ({ ...f, [k]: v }));
  const [historialAbierto, setHistorialAbierto] = useState(false);

  // Sincroniza la gestión con el caso cuando se refresca (React Query).
  useEffect(() => {
    setGestion({ estado: caso.estado ?? "", resultado: caso.resultado ?? "", observacion: caso.observacion ?? "" });
  }, [caso.id, caso.estado, caso.resultado, caso.observacion]);

  const guardarGestion = async () => {
    setErrorGestion(null);
    setGuardandoGestion(true);
    try {
      await onActualizar({
        estado: gestion.estado || null,
        resultado: gestion.resultado || null,
        observacion: gestion.observacion || null,
      });
    } catch (e: any) {
      setErrorGestion(e?.response?.data?.error ?? e.message ?? "Error");
    } finally {
      setGuardandoGestion(false);
    }
  };

  // Sincroniza el formulario de datos con el caso cuando se refresca (React Query).
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
  }, [caso.id, caso.moneda, caso.monto_pagado, caso.porcentaje, caso.monto_devuelto, caso.tipo_monto, caso.area, caso.motivo, caso.clasificacion, caso.producto]);

  const setDato = (k: string, v: any) => setDatos((f: any) => ({ ...f, [k]: v }));

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

  /** Guarda los datos propios del caso (actualización parcial). */
  const guardarDatos = async () => {
    setErrorDatos(null);
    setGuardandoDatos(true);
    try {
      const input: any = {};
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
      await onActualizar(input);
    } catch (e: any) {
      setErrorDatos(e?.response?.data?.error ?? e.message ?? "Error");
    } finally {
      setGuardandoDatos(false);
    }
  };

  const guardarDominio = async () => {
    setErrorDominio(null);
    setGuardandoDominio(true);
    try {
      await onAsignarDominio(dominioSel.trim() || null);
      setEditandoDominio(false);
    } catch (e: any) {
      setErrorDominio(e?.response?.data?.error ?? e.message ?? "Error");
    } finally {
      setGuardandoDominio(false);
    }
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
    <div className="flex w-[440px] shrink-0 flex-col border-l border-black-10 bg-white">
      <div className="flex items-center justify-between border-b border-black-10 px-4 py-3">
        <div>
          <h2 className="flex items-center gap-2 font-mono text-sm font-semibold text-primary">{caso.numero}</h2>
          <div className="mt-0.5 flex items-center gap-1.5">
            <CasoEstadoBadge cerrado={caso.caso_cerrado} />
            <span className="text-[10px] text-black-45">{caso.tipo === "devolucion" ? "Devolución" : "Queja"} · {fmtFecha(caso.created_at)}</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {puedeEditar && caso.caso_cerrado && (
            <button type="button" onClick={() => { setErrorReabrir(null); setConfirmandoReabrir(true); }} className="inline-flex items-center gap-1 rounded border border-black-10 px-2 py-1 text-[10px] text-black-45 hover:bg-light">
              <RotateCcw size={11} /> Reabrir caso
            </button>
          )}
          {puedeEditar && !caso.caso_cerrado && (
            <button type="button" onClick={() => { setErrorCerrar(null); setConfirmandoCerrar(true); }} className="inline-flex items-center gap-1 rounded border border-black-10 px-2 py-1 text-[10px] text-black-45 hover:bg-light">
              <CheckCircle2 size={11} /> Cerrar caso
            </button>
          )}
          {puedeEliminar && (
            <button type="button" onClick={() => { setErrorEliminar(null); setConfirmandoEliminar(true); }} className="inline-flex items-center gap-1 rounded border border-danger-25 px-2 py-1 text-[10px] text-danger hover:bg-danger-5">
              <Trash2 size={11} /> Eliminar caso
            </button>
          )}
          <button type="button" onClick={onCerrar} className="text-black-45 hover:text-black-65"><X size={16} /></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {/* Identificación */}
        <Section titulo="Identificación">
          <Info label="Ticket">{caso.ticket_id ? <Link className="text-primary hover:underline" to={`/atenciones`}><ArrowUpRight size={10} className="inline" /> #{caso.ticket_id}</Link> : "—"}</Info>
          <div className="flex items-center justify-between border-b border-black-5 py-1">
            <span className="text-[10px] text-black-25">Dominio</span>
            {editandoDominio ? (
              <div className="relative flex items-center gap-1">
                <div className="relative w-56">
                  <input
                    value={dominioBusqueda}
                    onChange={(e) => { setDominioBusqueda(e.target.value); setDominioSel(e.target.value.trim()); setDominioAbierto(true); }}
                    onFocus={() => setDominioAbierto(true)}
                    placeholder="Buscar o escribir dominio..."
                    className="h-7 w-full rounded border border-black-10 px-1.5 pr-6 text-[10px] focus:border-primary focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setDominioAbierto((v) => !v)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 text-black-45 hover:text-black-65"
                    aria-label="Alternar lista de dominios"
                  >
                    <ChevronDown size={12} />
                  </button>
                  {dominioAbierto && (
                    <div className="absolute right-0 top-full z-20 mt-1 max-h-44 w-full overflow-y-auto rounded border border-black-10 bg-white shadow">
                      <button
                        type="button"
                        onClick={() => { setDominioSel(""); setDominioBusqueda(""); setDominioAbierto(false); }}
                        className="block w-full px-2 py-1 text-left text-[10px] text-black-45 hover:bg-light"
                      >
                        SIN DOMINIO
                      </button>
                      {dominios
                        .filter((d) => d.toLowerCase().includes(dominioBusqueda.toLowerCase()))
                        .slice(0, 50)
                        .map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => { setDominioSel(d); setDominioBusqueda(d); setDominioAbierto(false); }}
                            className={cn("block w-full truncate px-2 py-1 text-left text-[10px]", dominioSel === d ? "bg-primary-5 font-medium text-primary" : "text-black-65 hover:bg-light")}
                          >
                            {d}
                          </button>
                        ))}
                    </div>
                  )}
                </div>
                <button type="button" onClick={guardarDominio} disabled={guardandoDominio} className="rounded bg-primary px-2 py-1 text-[9px] font-medium text-white disabled:opacity-50">{guardandoDominio ? "…" : "Guardar"}</button>
                <button type="button" onClick={() => { setEditandoDominio(false); setDominioSel(caso.dominio ?? ""); setDominioBusqueda(caso.dominio ?? ""); }} className="rounded border border-black-10 px-1.5 py-1 text-[9px] text-black-45 hover:bg-light">×</button>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <span className="ml-2 max-w-[55%] truncate text-right text-[10px] font-medium text-black-85">{caso.dominio ? caso.dominio : <SinDominioBadge />}</span>
                {puedeEditar && (
                  <button type="button" onClick={() => { setDominioSel(caso.dominio ?? ""); setDominioBusqueda(caso.dominio ?? ""); setErrorDominio(null); setEditandoDominio(true); setDominioAbierto(true); }} className="rounded border border-black-10 px-1.5 py-0.5 text-[9px] text-primary hover:bg-light">Asignar</button>
                )}
              </div>
            )}
            {errorDominio && <p className="mt-0.5 w-full text-right text-[9px] text-danger">{errorDominio}</p>}
          </div>
          <Info label="País">{caso.pais || "—"}</Info>
          <Info label="Asesor">{caso.asesor || "—"}</Info>
        </Section>

        {caso.caso_cerrado && (
          <Section titulo="Cierre">
            <Info label="Estado"><CasoEstadoBadge cerrado /></Info>
            <Info label="Cerrado el">{fmtFecha(caso.cerrado_at)}</Info>
            <Info label="Cerrado por">{caso.cerrado_por || "—"}</Info>
          </Section>
        )}

        {caso.tipo === "devolucion" && (
          <Section titulo="Devolución">
            {puedeEditar ? (
              <>
                <div className="space-y-2">
                  <CampoDato label="Moneda">
                    <select value={datos.moneda} onChange={(e) => setDato("moneda", e.target.value)} className="h-8 w-full rounded border border-black-10 px-2 text-[11px] focus:border-primary focus:outline-none">
                      <option value="PEN">PEN — Soles</option>
                      <option value="USD">USD — Dólares</option>
                    </select>
                  </CampoDato>
                  <CampoDato label="Monto solicitado">
                    <input value={datos.montoPagado ?? ""} onChange={(e) => setDato("montoPagado", e.target.value)} type="number" min="0" step="0.01" placeholder="Monto solicitado" className="h-8 w-full rounded border border-black-10 px-2 text-[11px] focus:border-primary focus:outline-none" />
                  </CampoDato>
                  <CampoDato label="Tipo">
                    <select value={datos.tipoMonto} onChange={(e) => setDato("tipoMonto", e.target.value)} className="h-8 w-full rounded border border-black-10 px-2 text-[11px] focus:border-primary focus:outline-none">
                      <option value="">—</option>
                      <option value="ARR">ARR</option>
                      <option value="MRR">MRR</option>
                    </select>
                  </CampoDato>
                  <CampoDato label="% devolución / conciliación">
                    <input value={datos.porcentaje ?? ""} onChange={(e) => onPorcentaje(e.target.value)} type="number" min="0" max="100" step="0.01" placeholder="%" className="h-8 w-full rounded border border-black-10 px-2 text-[11px] focus:border-primary focus:outline-none" />
                  </CampoDato>
                  <CampoDato label="Monto real a devolver">
                    <input value={datos.montoDevuelto ?? ""} onChange={(e) => onMontoDevuelto(e.target.value)} type="number" min="0" step="0.01" placeholder="Monto real a devolver" className="h-8 w-full rounded border border-black-10 px-2 text-[11px] focus:border-primary focus:outline-none" />
                  </CampoDato>
                  <CampoDato label="Área causante">
                    <select value={datos.area} onChange={(e) => setDato("area", e.target.value)} className="h-8 w-full rounded border border-black-10 px-2 text-[11px] focus:border-primary focus:outline-none">
                      <option value="">—</option>
                      {areas.filter((a) => a.activo).map((a) => <option key={a.id} value={a.nombre}>{a.nombre}</option>)}
                      {datos.area && !areas.some((a) => a.activo && a.nombre === datos.area) && <option value={datos.area}>{datos.area}</option>}
                    </select>
                  </CampoDato>
                  <CampoDato label="Motivo">
                    <textarea value={datos.motivo} onChange={(e) => setDato("motivo", e.target.value)} placeholder="Motivo" className="min-h-[56px] w-full rounded border border-black-10 px-2 py-1.5 text-[11px] focus:border-primary focus:outline-none" />
                  </CampoDato>
                  {errorDatos && <p className="text-[10px] text-danger">{errorDatos}</p>}
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => { setDatos({ montoPagado: caso.monto_pagado, tipoMonto: caso.tipo_monto ?? "", porcentaje: caso.porcentaje, montoDevuelto: caso.monto_devuelto, area: caso.area ?? "", motivo: caso.motivo ?? "", clasificacion: caso.clasificacion ?? "", producto: caso.producto ?? "" }); setErrorDatos(null); }} disabled={guardandoDatos} className="rounded border border-black-10 px-3 py-1 text-[10px] text-black-45 hover:bg-light disabled:opacity-50">Descartar</button>
                    <button type="button" onClick={guardarDatos} disabled={guardandoDatos} className="rounded bg-primary px-3 py-1 text-[10px] font-medium text-white disabled:opacity-50">{guardandoDatos ? "Guardando…" : "Guardar"}</button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Info label="Moneda">{caso.moneda === "USD" ? "USD — Dólares" : "PEN — Soles"}</Info>
                <Info label="Monto solicitado">{fmtMoneda(caso.monto_pagado, caso.moneda)}</Info>
                <Info label="Tipo">{caso.tipo_monto || "—"}</Info>
                <Info label="% devolución">{fmtPct(caso.porcentaje)}</Info>
                <Info label="Monto real a devolver">{caso.monto_devuelto == null ? "—" : fmtMoneda(caso.monto_devuelto, caso.moneda)}</Info>
                <Info label="Área causante">{caso.area || "—"}</Info>
                <Info label="Motivo">{caso.motivo || "—"}</Info>
              </>
            )}
          </Section>
        )}

        {caso.tipo === "queja" && (
          <Section titulo="Queja">
            {puedeEditar ? (
              <>
                <div className="space-y-2">
                  <CampoDato label="Tipo de queja">
                    <select value={datos.clasificacion} onChange={(e) => setDato("clasificacion", e.target.value)} className="h-8 w-full rounded border border-black-10 px-2 text-[11px] focus:border-primary focus:outline-none">
                      <option value="">—</option>
                      {tiposQueja.map((t) => <option key={t.id} value={t.nombre}>{t.nombre}</option>)}
                    </select>
                  </CampoDato>
                  {datos.clasificacion === "Servicio" && (
                    <CampoDato label="Área responsable">
                      <select value={datos.area} onChange={(e) => setDato("area", e.target.value)} className="h-8 w-full rounded border border-black-10 px-2 text-[11px] focus:border-primary focus:outline-none">
                        <option value="">—</option>
                        {areas.filter((a) => a.activo).map((a) => <option key={a.id} value={a.nombre}>{a.nombre}</option>)}
                        {datos.area && !areas.some((a) => a.activo && a.nombre === datos.area) && <option value={datos.area}>{datos.area}</option>}
                      </select>
                    </CampoDato>
                  )}
                  {datos.clasificacion === "Producto" && (
                    <CampoDato label="Producto">
                      <select value={datos.producto} onChange={(e) => setDato("producto", e.target.value)} className="h-8 w-full rounded border border-black-10 px-2 text-[11px] focus:border-primary focus:outline-none">
                        <option value="">—</option>
                        {productos.map((p) => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}
                      </select>
                    </CampoDato>
                  )}
                  <CampoDato label="Motivo">
                    <textarea value={datos.motivo} onChange={(e) => setDato("motivo", e.target.value)} placeholder="Motivo" className="min-h-[56px] w-full rounded border border-black-10 px-2 py-1.5 text-[11px] focus:border-primary focus:outline-none" />
                  </CampoDato>
                  {errorDatos && <p className="text-[10px] text-danger">{errorDatos}</p>}
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => { setDatos({ montoPagado: caso.monto_pagado, tipoMonto: caso.tipo_monto ?? "", porcentaje: caso.porcentaje, montoDevuelto: caso.monto_devuelto, area: caso.area ?? "", motivo: caso.motivo ?? "", clasificacion: caso.clasificacion ?? "", producto: caso.producto ?? "" }); setErrorDatos(null); }} disabled={guardandoDatos} className="rounded border border-black-10 px-3 py-1 text-[10px] text-black-45 hover:bg-light disabled:opacity-50">Descartar</button>
                    <button type="button" onClick={guardarDatos} disabled={guardandoDatos} className="rounded bg-primary px-3 py-1 text-[10px] font-medium text-white disabled:opacity-50">{guardandoDatos ? "Guardando…" : "Guardar"}</button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Info label="Tipo de queja">{caso.clasificacion || "—"}</Info>
                <Info label="Área / Producto">{caso.area || caso.producto || "—"}</Info>
                <Info label="Motivo">{caso.motivo || "—"}</Info>
              </>
            )}
          </Section>
        )}

        {/* Gestión */}
        <Section titulo="Gestión">
          {puedeEditar ? (
            <>
              <div className="space-y-2">
                <CampoDato label="Estado del caso">
                  <div className="flex items-center gap-2">
                    <CasoEstadoBadge cerrado={caso.caso_cerrado} />
                    {!caso.caso_cerrado && (
                      <button type="button" onClick={() => { setErrorCerrar(null); setConfirmandoCerrar(true); }} className="rounded border border-black-10 px-2 py-0.5 text-[9px] text-black-45 hover:bg-light">Cerrar caso</button>
                    )}
                    {caso.caso_cerrado && (
                      <button type="button" onClick={() => { setErrorReabrir(null); setConfirmandoReabrir(true); }} className="rounded border border-black-10 px-2 py-0.5 text-[9px] text-black-45 hover:bg-light">Reabrir caso</button>
                    )}
                  </div>
                </CampoDato>
                <CampoDato label="Estado">
                  <select value={gestion.estado} onChange={(e) => setGestionCampo("estado", e.target.value)} className="h-8 w-full rounded border border-black-10 px-2 text-[11px] focus:border-primary focus:outline-none">
                    <option value="">Estado…</option>
                    {estados.map((e) => <option key={e.id} value={e.nombre}>{e.nombre}</option>)}
                  </select>
                </CampoDato>
                <CampoDato label="Resultado">
                  <select value={gestion.resultado} onChange={(e) => setGestionCampo("resultado", e.target.value)} className="h-8 w-full rounded border border-black-10 px-2 text-[11px] focus:border-primary focus:outline-none">
                    <option value="">Resultado…</option>
                    {resultados.map((r) => <option key={r.id} value={r.nombre}>{r.nombre}</option>)}
                  </select>
                </CampoDato>
                <CampoDato label="Observación">
                  <textarea value={gestion.observacion} onChange={(e) => setGestionCampo("observacion", e.target.value)} placeholder="Observación" className="min-h-[50px] w-full rounded border border-black-10 px-2 py-1.5 text-[11px] focus:border-primary focus:outline-none" />
                </CampoDato>
                {errorGestion && <p className="text-[10px] text-danger">{errorGestion}</p>}
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => { setGestion({ estado: caso.estado ?? "", resultado: caso.resultado ?? "", observacion: caso.observacion ?? "" }); setErrorGestion(null); }} disabled={guardandoGestion} className="rounded border border-black-10 px-3 py-1 text-[10px] text-black-45 hover:bg-light disabled:opacity-50">Descartar</button>
                  <button type="button" onClick={guardarGestion} disabled={guardandoGestion} className="rounded bg-primary px-3 py-1 text-[10px] font-medium text-white disabled:opacity-50">{guardandoGestion ? "Guardando…" : "Guardar"}</button>
                </div>
              </div>
            </>
          ) : (
            <>
              <Info label="Estado del caso"><CasoEstadoBadge cerrado={caso.caso_cerrado} /></Info>
              <Info label="Estado"><EstadoBadge estado={caso.estado} /></Info>
              <Info label="Resultado"><ResultadoBadge resultado={caso.resultado} /></Info>
              {caso.observacion && <Info label="Observación">{caso.observacion}</Info>}
            </>
          )}
        </Section>

        {/* Interacciones relacionadas */}
        <Section titulo="Interacciones relacionadas">
          <div className="space-y-1.5">
            {caso.ticket_id && (
              <div className="flex items-center justify-between gap-2 rounded border border-primary-20 bg-primary-5 px-2 py-1.5">
                <div className="min-w-0">
                  <p className="font-mono text-[10px] font-semibold text-primary">#{caso.ticket_id}</p>
                  <p className="text-[9px] text-black-45">Ticket principal</p>
                </div>
                <Link to={`/atenciones`} className="shrink-0 text-[9px] text-primary hover:underline"><ArrowUpRight size={10} className="inline" /> Ver ticket</Link>
              </div>
            )}
            {interacciones.length === 0 ? (
              <p className="text-[10px] text-black-25">Sin interacciones relacionadas</p>
            ) : (
              interacciones.map((it) => (
                <div key={it.id} className="flex items-center justify-between gap-2 rounded border border-black-5 px-2 py-1.5">
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] font-semibold text-black-85">#{it.ticket_id}</p>
                    <p className="text-[9px] text-black-45">
                      {it.tipo_relacion === "principal" ? "Ticket principal" : "Interacción relacionada"}
                      {it.canal ? ` · ${it.canal}` : ""}
                      {it.created_by ? ` · ${it.created_by}` : ""}
                    </p>
                    <p className="text-[8px] text-black-25">{it.fecha ? fmtFecha(it.fecha) : fmtFecha(it.created_at)}</p>
                  </div>
                  <Link to={`/atenciones`} className="shrink-0 text-[9px] text-primary hover:underline"><ArrowUpRight size={10} className="inline" /> Ver ticket</Link>
                </div>
              ))
            )}
            {puedeEditar && !caso.caso_cerrado && (
              <div className="space-y-1 rounded border border-black-5 bg-light p-2">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-black-45">Vincular ticket al caso</p>
                <div className="flex gap-1">
                  <input value={vincularTicket} onChange={(e) => setVincularTicket(e.target.value)} placeholder="Ticket" className="h-7 w-24 rounded border border-black-10 px-1.5 text-[10px] focus:border-primary focus:outline-none" />
                  <input value={vincularCanal} onChange={(e) => setVincularCanal(e.target.value)} placeholder="Canal (WhatsApp, Correo…)" className="h-7 min-w-0 flex-1 rounded border border-black-10 px-1.5 text-[10px] focus:border-primary focus:outline-none" />
                  <button type="button" onClick={vincular} disabled={!vincularTicket.trim()} className="inline-flex items-center gap-1 rounded bg-primary px-2 py-1 text-[9px] font-medium text-white disabled:opacity-40">
                    <Link2 size={10} /> Vincular
                  </button>
                </div>
                {errorVincular && <p className="text-[9px] text-danger">{errorVincular}</p>}
              </div>
            )}
          </div>
        </Section>

        {/* Historial */}
        {/* Historial (accordion, colapsado por defecto) */}
        <div className="rounded border border-black-10">
          <button
            type="button"
            onClick={() => setHistorialAbierto((v) => !v)}
            className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-light"
          >
            <span className="text-[10px] font-semibold uppercase tracking-wider text-black-45">
              Historial{auditoria.length > 0 ? ` (${auditoria.length})` : ""}
            </span>
            <span className="text-black-45">{historialAbierto ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</span>
          </button>
          {historialAbierto && (
            <div className="max-h-[220px] overflow-y-auto border-t border-black-10 px-3 py-2">
              {auditoria.length === 0 ? (
                <p className="text-[10px] text-black-25">Sin eventos registrados</p>
              ) : (
                <div className="space-y-1">
                  {auditoria.map((a) => (
                    <div key={a.id} className="flex items-start justify-between gap-2 text-[9px]">
                      <div className="min-w-0">
                        <p className="text-black-85">{a.usuario || "—"} · {a.accion}</p>
                        {a.campo && <p className="text-black-45">{a.campo}: {a.valor_anterior || "—"} → {a.valor_nuevo || "—"}</p>}
                      </div>
                      <span className="shrink-0 text-black-25">{new Date(a.created_at).toLocaleString("es-PE", { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de confirmación de eliminación */}
      {confirmandoEliminar && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black-65/40 p-4">
          <div className="w-[400px] rounded-lg border border-black-10 bg-white shadow-lg">
            <div className="flex items-center justify-between border-b border-black-10 px-4 py-3">
              <h3 className="text-sm font-semibold text-danger">¿Eliminar este caso?</h3>
              <button type="button" onClick={() => setConfirmandoEliminar(false)} disabled={eliminando} className="text-black-45 hover:text-black-65"><X size={16} /></button>
            </div>
            <div className="space-y-2 p-4">
              <p className="text-[11px] text-black-65">
                Esta acción eliminará el caso manual de Quejas y Devoluciones. Esta acción no aplica a casos creados desde una categorización de atención.
              </p>
              <div className="space-y-1 rounded border border-black-5 bg-light px-3 py-2 text-[11px]">
                <p><span className="text-black-45">Caso: </span><span className="font-mono font-semibold text-primary">{caso.numero}</span></p>
                <p><span className="text-black-45">Tipo: </span><span className="font-medium text-black-85">{caso.tipo === "devolucion" ? "Devolución" : "Queja"}</span></p>
                <p><span className="text-black-45">Dominio: </span><span className="font-medium text-black-85">{caso.dominio || "SIN DOMINIO"}</span></p>
                <p><span className="text-black-45">Ticket: </span><span className="font-mono text-black-85">{caso.ticket_id || "—"}</span></p>
              </div>
              {errorEliminar && <p className="text-[10px] text-danger">{errorEliminar}</p>}
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setConfirmandoEliminar(false)} disabled={eliminando} className="rounded border border-black-10 px-3 py-1 text-[10px] text-black-45 hover:bg-light disabled:opacity-50">Cancelar</button>
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
                }} disabled={eliminando} className="inline-flex items-center gap-1 rounded bg-danger px-3 py-1 text-[10px] font-medium text-white hover:bg-danger-85 disabled:opacity-50">
                  <Trash2 size={11} /> {eliminando ? "Eliminando…" : "Eliminar caso"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de cierre */}
      {confirmandoCerrar && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black-65/40 p-4">
          <div className="w-[400px] rounded-lg border border-black-10 bg-white shadow-lg">
            <div className="flex items-center justify-between border-b border-black-10 px-4 py-3">
              <h3 className="text-sm font-semibold text-black-85">¿Cerrar el caso {caso.numero}?</h3>
              <button type="button" onClick={() => setConfirmandoCerrar(false)} disabled={cerrando} className="text-black-45 hover:text-black-65"><X size={16} /></button>
            </div>
            <div className="space-y-2 p-4">
              <p className="text-[11px] text-black-65">
                Al cerrar el caso, los nuevos asuntos del mismo dominio y tipo crearán un caso nuevo en lugar de vincularse automáticamente.
              </p>
              {errorCerrar && <p className="text-[10px] text-danger">{errorCerrar}</p>}
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setConfirmandoCerrar(false)} disabled={cerrando} className="rounded border border-black-10 px-3 py-1 text-[10px] text-black-45 hover:bg-light disabled:opacity-50">Cancelar</button>
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
                }} disabled={cerrando} className="inline-flex items-center gap-1 rounded bg-primary px-3 py-1 text-[10px] font-medium text-white hover:bg-primary-85 disabled:opacity-50">
                  <CheckCircle2 size={11} /> {cerrando ? "Cerrando…" : "Cerrar caso"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de reapertura */}
      {confirmandoReabrir && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black-65/40 p-4">
          <div className="w-[400px] rounded-lg border border-black-10 bg-white shadow-lg">
            <div className="flex items-center justify-between border-b border-black-10 px-4 py-3">
              <h3 className="text-sm font-semibold text-black-85">¿Reabrir el caso {caso.numero}?</h3>
              <button type="button" onClick={() => setConfirmandoReabrir(false)} className="text-black-45 hover:text-black-65"><X size={16} /></button>
            </div>
            <div className="space-y-2 p-4">
              <p className="text-[11px] text-black-65">
                El caso volverá a estado ABIERTO y podrá recibir nuevos tickets relacionados. No se modifican tickets ni interacciones.
              </p>
              {errorReabrir && <p className="text-[10px] text-danger">{errorReabrir}</p>}
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setConfirmandoReabrir(false)} className="rounded border border-black-10 px-3 py-1 text-[10px] text-black-45 hover:bg-light">Cancelar</button>
                <button type="button" onClick={async () => {
                  setErrorReabrir(null);
                  try {
                    await onReabrirCaso();
                  } catch (e: any) {
                    setErrorReabrir(e?.response?.data?.error ?? e.message ?? "Error al reabrir");
                  }
                }} className="inline-flex items-center gap-1 rounded bg-primary px-3 py-1 text-[10px] font-medium text-white hover:bg-primary-85">
                  <RotateCcw size={11} /> Reabrir caso
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CasoEstadoBadge({ cerrado }: { cerrado: boolean }) {
  return cerrado
    ? <span className="inline-flex items-center gap-1 rounded bg-black-10 px-1.5 py-0.5 text-[9px] font-medium text-black-45"><CheckCircle2 size={9} /> CERRADO</span>
    : <span className="inline-flex items-center gap-1 rounded bg-success-5 px-1.5 py-0.5 text-[9px] font-medium text-success"><CheckCircle2 size={9} /> ABIERTO</span>;
}

function SinDominioBadge() {
  return <span className="rounded bg-warning-5 px-1.5 py-0.5 text-[9px] font-medium text-warning-65">SIN DOMINIO</span>;
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
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black-65/40 p-4">
      <div className="w-[480px] rounded-lg border border-black-10 bg-white shadow-lg">
        <div className="flex items-center justify-between border-b border-black-10 px-4 py-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-black-85"><GitMerge size={14} className="text-primary" /> Consolidar casos ({casos.length})</h3>
          <button type="button" onClick={onClose} disabled={enviando} className="text-black-45 hover:text-black-65"><X size={16} /></button>
        </div>
        <div className="space-y-2 p-4">
          {incompatible && (
            <p className="rounded border border-danger-25 bg-danger-5 px-2 py-1.5 text-[10px] text-danger">No se pueden consolidar casos de distinto tipo (QUEJA ≠ DEVOLUCIÓN).</p>
          )}
          {hayCerrados && (
            <p className="rounded border border-danger-25 bg-danger-5 px-2 py-1.5 text-[10px] text-danger">Uno o más casos seleccionados están cerrados. Reábrelos antes de consolidar.</p>
          )}
          {hayConsolidados && (
            <p className="rounded border border-danger-25 bg-danger-5 px-2 py-1.5 text-[10px] text-danger">Uno o más casos seleccionados ya fueron consolidados.</p>
          )}

          <div className="max-h-[240px] overflow-y-auto rounded border border-black-10">
            {casos.map((c) => (
              <label key={c.id} className={cn("flex cursor-pointer items-start gap-2 border-b border-black-5 px-3 py-2 hover:bg-light", principalId === c.id && "bg-primary-5")}>
                <input type="radio" name="principal" checked={principalId === c.id} onChange={() => setPrincipalId(c.id)} className="mt-0.5 accent-primary" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] font-semibold text-primary">{c.numero}</span>
                    <span className="text-[9px] text-black-45">{c.tipo === "devolucion" ? "Devolución" : "Queja"}</span>
                    <CasoEstadoBadge cerrado={c.caso_cerrado} />
                  </div>
                  <p className="truncate text-[10px] text-black-65">{c.dominio ? c.dominio : "SIN DOMINIO"} · {c.pais || "sin país"}</p>
                  <p className="text-[9px] text-black-45">
                    Apertura {fmtFecha(c.created_at)} · {c.total_interacciones != null ? `${c.total_interacciones} ticket(s)` : "1 ticket"} · {c.asesor || "sin asesor"}
                  </p>
                </div>
                {principalId === c.id && <span className="shrink-0 text-[9px] font-semibold text-primary">PRINCIPAL</span>}
              </label>
            ))}
          </div>

          <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Motivo de la consolidación (opcional)" className="min-h-[44px] w-full rounded border border-black-10 px-2 py-1.5 text-[11px] focus:border-primary focus:outline-none" />

          {error && <p className="text-[10px] text-danger">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} disabled={enviando} className="rounded border border-black-10 px-3 py-1 text-[10px] text-black-45 hover:bg-light disabled:opacity-50">Cancelar</button>
            <button type="button" onClick={confirmar} disabled={enviando || !principalId || incompatible || hayCerrados || hayConsolidados} className="inline-flex items-center gap-1 rounded bg-primary px-3 py-1 text-[10px] font-medium text-white hover:bg-primary-85 disabled:opacity-50">
              <GitMerge size={11} /> {enviando ? "Consolidando…" : "Consolidar en caso principal"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-black-5 py-1">
      <span className="text-[10px] text-black-25">{label}</span>
      <span className="ml-2 max-w-[65%] truncate text-right text-[10px] font-medium text-black-85">{children}</span>
    </div>
  );
}

function CampoDato({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-0.5 text-[9px] font-medium uppercase tracking-wider text-black-25">{label}</p>
      {children}
    </div>
  );
}

function Section({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-black-45">{titulo}</p>
      {children}
    </div>
  );
}
