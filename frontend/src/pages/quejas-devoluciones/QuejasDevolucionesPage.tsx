import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { X, Plus, RefreshCcw, ArrowUpRight, Download, Trash2 } from "lucide-react";
import {
  useQdLista, useQdDetalle, useQdCrear, useQdActualizar, useQdEliminar,
  useQdEstados, useQdResultados, useQdAreas, useQdProductos, useQdTiposQueja,
  qdService,
} from "@/modules/quejas-devoluciones";
import type { QdCaso, QdInteraccion, QdTipo } from "@/modules/quejas-devoluciones";
import { EstadoBadge, ResultadoBadge, fmtFecha, fmtMoneda, fmtPct } from "@/modules/quejas-devoluciones/components/qdUI";
import { useAuth, authService } from "@/modules/auth";
import { cn } from "@/lib/utils";

type Filtro = "todas" | QdTipo;

interface Filtros {
  desde: string;
  hasta: string;
  pais: string;
  estado: string;
  resultado: string;
  asesor: string;
  area: string;
  producto: string;
  tipoQueja: string;
}

const VACIO: Filtros = { desde: "", hasta: "", pais: "", estado: "", resultado: "", asesor: "", area: "", producto: "", tipoQueja: "" };

export default function QuejasDevoluciones() {
  const { user } = useAuth();
  const puedeCrear = authService.hasPermiso(user, "Quejas y Devoluciones", "crear");
  const puedeEditar = authService.hasPermiso(user, "Quejas y Devoluciones", "editar");
  const puedeEliminar = authService.hasPermiso(user, "Quejas y Devoluciones", "eliminar");
  const puedeExportar = authService.hasPermiso(user, "Quejas y Devoluciones", "exportar");
  const puedeExportarTodo = authService.hasPermiso(user, "Quejas y Devoluciones", "administrar");

  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [casoId, setCasoId] = useState<string | null>(null);
  const [creando, setCreando] = useState(false);
  const [buscador, setBuscador] = useState("");
  const [f, setF] = useState<Filtros>(VACIO);
  const [exportando, setExportando] = useState(false);
  const [errorExport, setErrorExport] = useState<string | null>(null);

  const { data: devoluciones, isLoading: loadD, error: errD, refetch: refD } = useQdLista("devolucion");
  const { data: quejas, isLoading: loadQ, error: errQ, refetch: refQ } = useQdLista("queja");
  const { data: detalle } = useQdDetalle(casoId);
  const crear = useQdCrear();
  const actualizar = useQdActualizar();
  const eliminar = useQdEliminar();
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false);

  const estados = useQdEstados().data ?? [];
  const resultados = useQdResultados().data ?? [];
  const areas = useQdAreas().data ?? [];
  const productos = useQdProductos().data ?? [];
  const tiposQueja = useQdTiposQueja().data ?? [];

  const todos = useMemo(() => [...(devoluciones ?? []), ...(quejas ?? [])], [devoluciones, quejas]);
  const lista = filtro === "todas" ? todos : filtro === "devolucion" ? (devoluciones ?? []) : (quejas ?? []);
  const cargando = filtro === "todas" ? loadD || loadQ : filtro === "devolucion" ? loadD : loadQ;
  const error = filtro === "todas" ? errD ?? errQ : filtro === "devolucion" ? errD : errQ;
  const reintentar = () => { refD(); refQ(); };

  const filtrada = lista.filter((c) => {
    const q = buscador.trim().toLowerCase();
    if (q && ![c.numero, c.ticket_id, c.dominio, c.pais, c.motivo, c.clasificacion, c.producto, c.area]
      .some((v) => (v ?? "").toLowerCase().includes(q))) return false;
    if (f.desde && new Date(c.created_at) < new Date(f.desde)) return false;
    if (f.hasta && new Date(c.created_at) > new Date(f.hasta + "T23:59:59")) return false;
    if (f.pais && c.pais !== f.pais) return false;
    if (f.estado && c.estado !== f.estado) return false;
    if (f.resultado && c.resultado !== f.resultado) return false;
    if (f.asesor && c.asesor !== f.asesor) return false;
    if (f.area && c.area !== f.area) return false;
    if (f.producto && c.producto !== f.producto) return false;
    if (f.tipoQueja && c.clasificacion !== f.tipoQueja) return false;
    return true;
  });

  const hayFiltros = Object.values(f).some((v) => v !== "");

  const setFiltroVal = (k: keyof Filtros, v: string) => setF((prev) => ({ ...prev, [k]: v }));

  const exportarExcel = async (todo = false) => {
    setErrorExport(null);
    setExportando(true);
    try {
      const res = await qdService.exportar({
        tipo: todo ? "todas" : filtro,
        desde: todo ? "" : f.desde,
        hasta: todo ? "" : f.hasta,
        pais: todo ? "" : f.pais,
        estado: todo ? "" : f.estado,
        resultado: todo ? "" : f.resultado,
        asesor: todo ? "" : f.asesor,
        area: todo ? "" : f.area,
        producto: todo ? "" : f.producto,
        tipoQueja: todo ? "" : f.tipoQueja,
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
            <button key={t} type="button" onClick={() => { setFiltro(t); setCasoId(null); }}
              className={cn("rounded px-2.5 py-1 text-[11px] font-medium", filtro === t ? "bg-primary text-white" : "bg-black-5 text-black-45 hover:bg-black-10")}>
              {t === "todas" ? "Todas" : t === "queja" ? "Quejas" : "Devoluciones"}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-1.5">
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
            {puedeExportarTodo && (
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
          <input type="date" value={f.desde} onChange={(e) => setFiltroVal("desde", e.target.value)} className="h-7 rounded border border-black-10 px-1.5 text-[10px]" title="Desde" />
          <input type="date" value={f.hasta} onChange={(e) => setFiltroVal("hasta", e.target.value)} className="h-7 rounded border border-black-10 px-1.5 text-[10px]" title="Hasta" />
          <Select value={f.pais} onChange={(v) => setFiltroVal("pais", v)} options={paises(todos)} placeholder="País" />
          <Select value={f.estado} onChange={(v) => setFiltroVal("estado", v)} options={estados.map((e) => ({ value: e.nombre, label: e.nombre }))} placeholder="Estado" />
          <Select value={f.resultado} onChange={(v) => setFiltroVal("resultado", v)} options={resultados.map((r) => ({ value: r.nombre, label: r.nombre }))} placeholder="Resultado" />
          <Select value={f.asesor} onChange={(v) => setFiltroVal("asesor", v)} options={asesores(todos)} placeholder="Asesor" />
          <Select value={f.area} onChange={(v) => setFiltroVal("area", v)} options={areas.map((a) => ({ value: a.nombre, label: a.nombre }))} placeholder="Área" />
          <Select value={f.producto} onChange={(v) => setFiltroVal("producto", v)} options={productos.map((p) => ({ value: p.nombre, label: p.nombre }))} placeholder="Producto" />
          <Select value={f.tipoQueja} onChange={(v) => setFiltroVal("tipoQueja", v)} options={tiposQueja.map((t) => ({ value: t.nombre, label: t.nombre }))} placeholder="Tipo queja" />
          {hayFiltros && (
            <button type="button" onClick={() => setF(VACIO)} className="rounded border border-black-10 px-2 py-1 text-[10px] text-black-45 hover:bg-light">Limpiar</button>
          )}
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
                    <tr key={c.id} onClick={() => { setCasoId(c.id); setCreando(false); }} className="cursor-pointer border-b border-black-5 hover:bg-light">
                      <td className="px-3 py-2 font-mono text-[10px] font-semibold text-primary">{c.numero}</td>
                      <td className="px-3 py-2 text-[10px] text-black-85">{c.tipo === "devolucion" ? "Devolución" : "Queja"}</td>
                      <td className="px-3 py-2 text-[10px] text-black-45">{fmtFecha(c.created_at)}</td>
                      <td className="px-3 py-2 font-mono text-[10px] text-black-45">{c.ticket_id || "—"}</td>
                      <td className="px-3 py-2 text-[10px] text-black-85">{c.dominio || "—"}</td>
                      <td className="px-3 py-2 text-[10px] text-black-45">{c.pais || "—"}</td>
                      <td className="px-3 py-2 text-[10px] text-black-85">
                        {c.tipo === "devolucion" ? (
                          <div className="space-y-0.5">
                            <div>{fmtMoneda(c.monto_pagado)}</div>
                            <div className="text-[9px] text-black-45">{fmtPct(c.porcentaje)} · {fmtMoneda(c.monto_devuelto)}</div>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <div>{c.clasificacion || "—"}</div>
                            <div className="text-[9px] text-black-45">{c.area || c.producto || (c.motivo ? c.motivo.slice(0, 40) : "")}</div>
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2"><EstadoBadge estado={c.estado} /></td>
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
            puedeEditar={puedeEditar}
            puedeEliminar={puedeEliminar && detalle.caso.origen === "MANUAL"}
            confirmandoEliminar={confirmandoEliminar}
            setConfirmandoEliminar={setConfirmandoEliminar}
            onEliminar={async () => {
              await eliminar.mutateAsync(detalle.caso.id);
              setConfirmandoEliminar(false);
              setCasoId(null);
            }}
            estados={estados} resultados={resultados}
            onActualizar={async (input) => actualizar.mutateAsync({ id: detalle.caso.id, input })}
            onCerrar={() => setCasoId(null)}
          />
        )}
      </div>
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
    montoPagado: "", tipoMonto: "", area: "", motivo: "", porcentaje: "", montoDevuelto: "",
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
                  {areas.map((a) => <option key={a.id} value={a.nombre}>{a.nombre}</option>)}
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
                    {areas.map((a) => <option key={a.id} value={a.nombre}>{a.nombre}</option>)}
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

function CasoDetalle({ caso, interacciones, auditoria, puedeEditar, puedeEliminar, confirmandoEliminar, setConfirmandoEliminar, onEliminar, estados, resultados, onActualizar, onCerrar }: {
  caso: QdCaso;
  interacciones: QdInteraccion[];
  auditoria: any[];
  puedeEditar: boolean;
  puedeEliminar: boolean;
  confirmandoEliminar: boolean;
  setConfirmandoEliminar: (v: boolean) => void;
  onEliminar: () => Promise<unknown>;
  estados: any[];
  resultados: any[];
  onActualizar: (input: any) => Promise<unknown>;
  onCerrar: () => void;
}) {
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState<any>({ estado: caso.estado ?? "", resultado: caso.resultado ?? "", observacion: caso.observacion ?? "" });
  const [error, setError] = useState<string | null>(null);
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const guardar = async () => {
    setError(null);
    try {
      await onActualizar({
        estado: form.estado || null,
        resultado: form.resultado || null,
        observacion: form.observacion || null,
      });
      setEditando(false);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? e.message ?? "Error");
    }
  };

  return (
    <div className="flex w-[440px] shrink-0 flex-col border-l border-black-10 bg-white">
      <div className="flex items-center justify-between border-b border-black-10 px-4 py-3">
        <div>
          <h2 className="font-mono text-sm font-semibold text-primary">{caso.numero}</h2>
          <p className="text-[10px] text-black-45">{caso.tipo === "devolucion" ? "Devolución" : "Queja"} · {fmtFecha(caso.created_at)}</p>
        </div>
        <div className="flex items-center gap-1">
          {puedeEliminar && !editando && (
            <button type="button" onClick={() => { setErrorEliminar(null); setConfirmandoEliminar(true); }} className="inline-flex items-center gap-1 rounded border border-danger-25 px-2 py-1 text-[10px] text-danger hover:bg-danger-5">
              <Trash2 size={11} /> Eliminar caso
            </button>
          )}
          {puedeEditar && !editando && (
            <button type="button" onClick={() => setEditando(true)} className="rounded border border-black-10 px-2 py-1 text-[10px] text-black-45 hover:bg-light">Editar</button>
          )}
          <button type="button" onClick={onCerrar} className="text-black-45 hover:text-black-65"><X size={16} /></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {/* Identificación */}
        <Section titulo="Identificación">
          <Info label="Ticket">{caso.ticket_id ? <Link className="text-primary hover:underline" to={`/atenciones`}><ArrowUpRight size={10} className="inline" /> #{caso.ticket_id}</Link> : "—"}</Info>
          <Info label="Dominio">{caso.dominio || "—"}</Info>
          <Info label="País">{caso.pais || "—"}</Info>
          <Info label="Asesor">{caso.asesor || "—"}</Info>
        </Section>

        {caso.tipo === "devolucion" && (
          <Section titulo="Devolución">
            <Info label="Monto solicitado">{fmtMoneda(caso.monto_pagado)}</Info>
            <Info label="Tipo">{caso.tipo_monto || "—"}</Info>
            <Info label="% devolución">{fmtPct(caso.porcentaje)}</Info>
            <Info label="Monto devuelto">{fmtMoneda(caso.monto_devuelto)}</Info>
            <Info label="Área causante">{caso.area || "—"}</Info>
            <Info label="Motivo">{caso.motivo || "—"}</Info>
          </Section>
        )}

        {caso.tipo === "queja" && (
          <Section titulo="Queja">
            <Info label="Tipo de queja">{caso.clasificacion || "—"}</Info>
            <Info label="Área / Producto">{caso.area || caso.producto || "—"}</Info>
            <Info label="Motivo">{caso.motivo || "—"}</Info>
          </Section>
        )}

        {/* Gestión */}
        <Section titulo="Gestión">
          {editando ? (
            <div className="space-y-2">
              <select value={form.estado} onChange={(e) => setForm((f: any) => ({ ...f, estado: e.target.value }))} className="h-8 w-full rounded border border-black-10 px-2 text-[11px] focus:border-primary focus:outline-none">
                <option value="">Estado…</option>
                {estados.map((e) => <option key={e.id} value={e.nombre}>{e.nombre}</option>)}
              </select>
              <select value={form.resultado} onChange={(e) => setForm((f: any) => ({ ...f, resultado: e.target.value }))} className="h-8 w-full rounded border border-black-10 px-2 text-[11px] focus:border-primary focus:outline-none">
                <option value="">Resultado…</option>
                {resultados.map((r) => <option key={r.id} value={r.nombre}>{r.nombre}</option>)}
              </select>
              <textarea value={form.observacion} onChange={(e) => setForm((f: any) => ({ ...f, observacion: e.target.value }))} placeholder="Observación" className="min-h-[50px] w-full rounded border border-black-10 px-2 py-1.5 text-[11px] focus:border-primary focus:outline-none" />
              {error && <p className="text-[10px] text-danger">{error}</p>}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setEditando(false)} className="rounded border border-black-10 px-3 py-1 text-[10px] text-black-45 hover:bg-light">Cancelar</button>
                <button type="button" onClick={guardar} className="rounded bg-primary px-3 py-1 text-[10px] font-medium text-white">Guardar</button>
              </div>
            </div>
          ) : (
            <>
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
                      {it.created_by ? ` · ${it.created_by}` : ""}
                    </p>
                    <p className="text-[8px] text-black-25">{fmtFecha(it.created_at)}</p>
                  </div>
                  <Link to={`/atenciones`} className="shrink-0 text-[9px] text-primary hover:underline"><ArrowUpRight size={10} className="inline" /> Ver ticket</Link>
                </div>
              ))
            )}
          </div>
        </Section>

        {/* Historial */}
        <Section titulo="Historial">
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
        </Section>
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
                <p><span className="text-black-45">Dominio: </span><span className="font-medium text-black-85">{caso.dominio || "—"}</span></p>
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

function Section({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-black-45">{titulo}</p>
      {children}
    </div>
  );
}
