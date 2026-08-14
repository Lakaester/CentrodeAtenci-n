import { useState } from "react";
import { Play, Pause, CheckCircle2, Send } from "lucide-react";
import {
  useIntervencionActiva,
  useCrearIntervencion,
  usePausarIntervencion,
  useReanudarIntervencion,
  useFinalizarIntervencion,
  useActualizarIntervencion,
  useRegistrarActividad,
  useSubcategoriasConfig,
  useEstadosConfig,
} from "@/modules/facturacion";
import type { IntervencionDetalle } from "@/modules/facturacion";
import { Cronometro } from "@/modules/facturacion/components/Cronometro";
import { ACCIONES_FACTURACION, RESULTADOS_FACTURACION, MOTIVOS_PAUSA } from "@/config/facturacionCatalog";
import { cn } from "@/lib/utils";

function estadoBadge(status: string): { label: string; cls: string } {
  switch (status) {
    case "EN_DIAGNOSTICO": return { label: "En diagnóstico", cls: "bg-primary-5 text-primary" };
    case "PAUSADA": return { label: "Pausada", cls: "bg-warning-5 text-warning-65" };
    case "RESUELTA": return { label: "Resuelta", cls: "bg-success-5 text-success" };
    case "NO_RESUELTA": return { label: "No resuelta", cls: "bg-danger-5 text-danger" };
    case "DERIVADA": return { label: "Derivada", cls: "bg-purple-5 text-purple" };
    case "CANCELADA": return { label: "Cancelada", cls: "bg-black-5 text-black-65" };
    default: return { label: status, cls: "bg-black-5 text-black-45" };
  }
}

function Chip({ active, onClick, children }: { active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded px-2 py-0.5 text-[10px] font-medium transition-colors",
        active ? "bg-primary text-white" : "bg-black-5 text-black-45 hover:bg-black-10",
      )}
    >
      {children}
    </button>
  );
}

export function PanelIntervencion({
  prefill,
}: {
  prefill?: { dominio?: string; ruc?: string; proveedor?: string } | null;
}) {
  const { data: activa, isLoading: cargandoActiva } = useIntervencionActiva();
  const crear = useCrearIntervencion();
  const pausar = usePausarIntervencion();
  const reanudar = useReanudarIntervencion();
  const finalizar = useFinalizarIntervencion();
  const actualizar = useActualizarIntervencion();
  const registrarActividad = useRegistrarActividad();
  const { data: subcategorias } = useSubcategoriasConfig();
  const { data: estados } = useEstadosConfig();

  const [formInicio, setFormInicio] = useState({ dominio: prefill?.dominio ?? "", clienteNombre: "", ruc: prefill?.ruc ?? "", proveedor: prefill?.proveedor ?? "", facturas: "", boletas: "" });
  const [formInicioAbierto, setFormInicioAbierto] = useState(Boolean(prefill?.dominio));
  const [subcategoriaId, setSubcategoriaId] = useState<string | null>(null);
  const [estadoConfigId, setEstadoConfigId] = useState<string | null>(null);
  const [resultado, setResultado] = useState<string | null>(null);
  const [observacion, setObservacion] = useState("");
  const [pausaMotivo, setPausaMotivo] = useState<string | null>(null);
  const [pausaAbierta, setPausaAbierta] = useState(false);
  const [finalAbierto, setFinalAbierto] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activaDetalle = activa as IntervencionDetalle | null | undefined;
  const subcategoriasActivas = (subcategorias ?? []).filter((s) => s.activo);
  const estadosActivos = (estados ?? []).filter((e) => e.activo);
  const subcategoriaLabel = (id: string | null) => subcategorias?.find((s) => s.id === id)?.nombre ?? null;

  const guardarDiagnostico = async (patch: Record<string, unknown>) => {
    if (!activaDetalle) return;
    setError(null);
    try {
      await actualizar.mutateAsync({ id: activaDetalle.intervencion.id, patch });
    } catch (e: any) {
      setError(e?.response?.data?.error ?? e.message ?? "Error al guardar");
    }
  };

  const elegirSubcategoria = (id: string) => {
    setSubcategoriaId(id);
    const nombre = subcategorias?.find((s) => s.id === id)?.nombre ?? null;
    guardarDiagnostico({ subcategoriaId: id, causa: nombre });
  };

  const elegirEstadoConfig = (id: string) => {
    setEstadoConfigId(id);
    guardarDiagnostico({ estadoId: id });
  };

  const iniciar = async () => {
    setError(null);
    if (!formInicio.dominio.trim()) {
      setError("El dominio es obligatorio para iniciar la intervención.");
      return;
    }
    try {
      await crear.mutateAsync({
        dominio: formInicio.dominio.trim(),
        clienteNombre: formInicio.clienteNombre.trim() || null,
        ruc: formInicio.ruc.trim() || null,
        proveedor: formInicio.proveedor.trim() || null,
        facturasPendientes: formInicio.facturas.trim() ? Number(formInicio.facturas) : null,
        boletasPendientes: formInicio.boletas.trim() ? Number(formInicio.boletas) : null,
      });
      setFormInicio({ dominio: "", clienteNombre: "", ruc: "", proveedor: "", facturas: "", boletas: "" });
      setFormInicioAbierto(false);
      setSubcategoriaId(null);
      setObservacion("");
    } catch (e: any) {
      setError(e?.response?.data?.error ?? e.message ?? "Error al iniciar");
    }
  };

  const onPausar = async () => {
    if (!activaDetalle) return;
    try {
      await pausar.mutateAsync({ id: activaDetalle.intervencion.id, motivo: pausaMotivo });
      setPausaAbierta(false);
      setPausaMotivo(null);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? e.message ?? "Error al pausar");
    }
  };

  const onReanudar = async () => {
    if (!activaDetalle) return;
    try {
      await reanudar.mutateAsync(activaDetalle.intervencion.id);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? e.message ?? "Error al reanudar");
    }
  };

  const onFinalizar = async () => {
    if (!activaDetalle || !resultado) return;
    try {
      const status = resultado === "RESUELTO" ? "RESUELTA"
        : resultado === "DERIVADO" ? "DERIVADA"
        : resultado === "PENDIENTE" ? "DERIVADA"
        : "NO_RESUELTA";
      const estadoIdFinal = resultado === "RESUELTO"
        ? (estados?.find((e) => e.nombre.toLowerCase() === "resuelto")?.id ?? estadoConfigId)
        : resultado === "DERIVADO"
        ? (estados?.find((e) => e.nombre.toLowerCase() === "derivado")?.id ?? estadoConfigId)
        : resultado === "PENDIENTE"
        ? (estados?.find((e) => e.nombre.toLowerCase() === "en solución")?.id ?? estadoConfigId)
        : (estados?.find((e) => e.nombre.toLowerCase() === "error")?.id ?? estadoConfigId);
      await finalizar.mutateAsync({
        id: activaDetalle.intervencion.id,
        input: {
          status,
          causa: subcategoriaLabel(subcategoriaId) ?? null,
          resultado,
          observacion: observacion || null,
          subcategoriaId,
          estadoId: estadoIdFinal,
        },
      });
      setFinalAbierto(false);
      setResultado(null);
      setObservacion("");
    } catch (e: any) {
      setError(e?.response?.data?.error ?? e.message ?? "Error al finalizar");
    }
  };

  const registrarAccion = async (tipo: string) => {
    if (!activaDetalle) return;
    try {
      await registrarActividad.mutateAsync({ id: activaDetalle.intervencion.id, tipo });
    } catch (e: any) {
      setError(e?.response?.data?.error ?? e.message ?? "Error al registrar acción");
    }
  };

  return (
    <div className="flex flex-1 min-h-0 flex-col bg-light">
      {error && (
        <div className="shrink-0 border-b border-danger-25 bg-danger-5 px-4 py-2 text-[11px] text-danger">{error}</div>
      )}

      {!activaDetalle && !cargandoActiva && (
        <div className="flex flex-1 items-center justify-center">
          <div className="max-w-sm text-center">
            <p className="text-[12px] text-black-25">Sin intervención en curso.</p>
            <button type="button" onClick={() => setFormInicioAbierto(true)} className="mt-3 inline-flex items-center gap-1.5 rounded bg-primary px-3 py-1.5 text-[11px] font-medium text-white hover:bg-primary-85">
              Iniciar diagnóstico
            </button>
          </div>
        </div>
      )}

      {cargandoActiva && (
        <div className="flex flex-1 items-center justify-center text-[12px] text-black-25">Cargando…</div>
      )}

      {formInicioAbierto && !activaDetalle && (
        <div className="shrink-0 space-y-1.5 border-b border-black-10 bg-white p-3">
          <input value={formInicio.dominio} onChange={(e) => setFormInicio((f) => ({ ...f, dominio: e.target.value }))} placeholder="Dominio *" className="h-8 w-full rounded border border-black-10 px-2 py-1.5 text-[11px] focus:border-primary focus:outline-none" />
          <input value={formInicio.clienteNombre} onChange={(e) => setFormInicio((f) => ({ ...f, clienteNombre: e.target.value }))} placeholder="Cliente (opcional)" className="h-8 w-full rounded border border-black-10 px-2 py-1.5 text-[11px] focus:border-primary focus:outline-none" />
          <input value={formInicio.ruc} onChange={(e) => setFormInicio((f) => ({ ...f, ruc: e.target.value }))} placeholder="RUC (opcional)" className="h-8 w-full rounded border border-black-10 px-2 py-1.5 text-[11px] focus:border-primary focus:outline-none" />
          <input value={formInicio.proveedor} onChange={(e) => setFormInicio((f) => ({ ...f, proveedor: e.target.value }))} placeholder="Proveedor (opcional)" className="h-8 w-full rounded border border-black-10 px-2 py-1.5 text-[11px] focus:border-primary focus:outline-none" />
          <div className="flex gap-1.5">
            <input value={formInicio.facturas} onChange={(e) => setFormInicio((f) => ({ ...f, facturas: e.target.value }))} type="number" min="0" placeholder="Facturas pend." className="h-8 w-full rounded border border-black-10 px-2 py-1.5 text-[11px] focus:border-primary focus:outline-none" />
            <input value={formInicio.boletas} onChange={(e) => setFormInicio((f) => ({ ...f, boletas: e.target.value }))} type="number" min="0" placeholder="Boletas pend." className="h-8 w-full rounded border border-black-10 px-2 py-1.5 text-[11px] focus:border-primary focus:outline-none" />
          </div>
          <div className="flex gap-1.5">
            <button type="button" onClick={iniciar} disabled={crear.isPending} className="flex-1 rounded bg-primary px-2 py-1.5 text-[11px] font-medium text-white hover:bg-primary-85 disabled:opacity-50">
              {crear.isPending ? "Iniciando…" : "Iniciar"}
            </button>
            <button type="button" onClick={() => setFormInicioAbierto(false)} className="rounded border border-black-10 px-2 py-1.5 text-[11px] text-black-45 hover:bg-light">Cancelar</button>
          </div>
        </div>
      )}

      {activaDetalle && (
        <div className="flex flex-1 min-h-0 overflow-y-auto">
          <div className="mx-auto w-full max-w-2xl p-6">
            <div className="rounded-lg border border-black-10 bg-white">
              <div className="flex items-center justify-between border-b border-black-10 px-4 py-3">
                <div>
                  <h2 className="text-sm font-semibold text-black-85">{activaDetalle.intervencion.dominio}</h2>
                  <p className="text-[10px] text-black-45">
                    {activaDetalle.intervencion.cliente_nombre || "Sin cliente"} · {activaDetalle.intervencion.ruc || "Sin RUC"}
                  </p>
                  {(activaDetalle.intervencion.facturas_pendientes != null || activaDetalle.intervencion.boletas_pendientes != null) && (
                    <p className="mt-0.5 text-[10px] text-black-45">
                      FV: {activaDetalle.intervencion.facturas_pendientes ?? "—"} · BV: {activaDetalle.intervencion.boletas_pendientes ?? "—"} pendientes
                    </p>
                  )}
                </div>
                <span className={cn("rounded px-2 py-0.5 text-[10px] font-medium", estadoBadge(activaDetalle.intervencion.status).cls)}>
                  {estadoBadge(activaDetalle.intervencion.status).label}
                </span>
              </div>

              <div className="border-b border-black-10 px-4 py-4">
                <Cronometro
                  startedAt={activaDetalle.intervencion.started_at}
                  pausas={activaDetalle.pausas}
                  finishedAt={activaDetalle.intervencion.finished_at}
                  pausada={activaDetalle.intervencion.status === "PAUSADA"}
                />
                <div className="mt-3 flex justify-center gap-2">
                  {activaDetalle.intervencion.status === "PAUSADA" ? (
                    <button type="button" onClick={onReanudar} className="inline-flex items-center gap-1.5 rounded bg-primary px-3 py-1.5 text-[11px] font-medium text-white hover:bg-primary-85">
                      <Play size={13} /> Reanudar
                    </button>
                  ) : (
                    <button type="button" onClick={() => setPausaAbierta(true)} className="inline-flex items-center gap-1.5 rounded bg-warning px-3 py-1.5 text-[11px] font-medium text-white hover:bg-warning-85">
                      <Pause size={13} /> Pausar
                    </button>
                  )}
                  <button type="button" onClick={() => setFinalAbierto(true)} className="inline-flex items-center gap-1.5 rounded bg-success px-3 py-1.5 text-[11px] font-medium text-white hover:bg-success-85">
                    <CheckCircle2 size={13} /> Finalizar
                  </button>
                </div>
              </div>

              {pausaAbierta && (
                <div className="space-y-1.5 border-b border-black-10 bg-warning-5 px-4 py-3">
                  <p className="text-[10px] font-medium text-warning-65">Motivo de pausa (opcional)</p>
                  <div className="flex flex-wrap gap-1">
                    {MOTIVOS_PAUSA.map((m) => (
                      <Chip key={m} active={pausaMotivo === m} onClick={() => setPausaMotivo(m)}>{m}</Chip>
                    ))}
                  </div>
                  <div className="flex gap-1.5">
                    <button type="button" onClick={onPausar} className="rounded bg-warning px-2 py-1 text-[10px] font-medium text-white">Confirmar pausa</button>
                    <button type="button" onClick={() => { setPausaAbierta(false); setPausaMotivo(null); }} className="rounded border border-black-10 px-2 py-1 text-[10px] text-black-45">Cancelar</button>
                  </div>
                </div>
              )}

              <div className="space-y-4 px-4 py-4">
                <div>
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-black-45">Estado</p>
                  <div className="flex flex-wrap gap-1.5">
                    {estadosActivos.map((e) => (
                      <Chip key={e.id} active={estadoConfigId === e.id} onClick={() => elegirEstadoConfig(e.id)}>{e.nombre}</Chip>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-black-45">Subcategoría / Diagnóstico</p>
                  <div className="flex flex-wrap gap-1.5">
                    {subcategoriasActivas.map((s) => (
                      <Chip key={s.id} active={subcategoriaId === s.id} onClick={() => elegirSubcategoria(s.id)}>{s.nombre}</Chip>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-black-45">Acciones registradas</p>
                  <div className="flex flex-wrap gap-1.5">
                    {ACCIONES_FACTURACION.map((a) => (
                      <Chip key={a} onClick={() => registrarAccion(a)}>{a}</Chip>
                    ))}
                  </div>
                  {activaDetalle.actividades.length > 0 && (
                    <div className="mt-2 space-y-0.5">
                      {activaDetalle.actividades.map((act) => (
                        <div key={act.id} className="flex items-center justify-between text-[9px] text-black-45">
                          <span>{act.tipo}{act.detalle ? ` — ${act.detalle}` : ""}</span>
                          <span className="text-black-25">{new Date(act.created_at).toLocaleTimeString("es-PE")}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-black-45">Observación</p>
                  <textarea
                    value={observacion}
                    onChange={(e) => setObservacion(e.target.value)}
                    onBlur={() => guardarDiagnostico({ observacion: observacion || null })}
                    placeholder="Notas del diagnóstico o resultado…"
                    className="min-h-[70px] w-full rounded border border-black-10 bg-white px-2 py-1.5 text-[11px] focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {finalAbierto && activaDetalle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-lg border border-black-10 bg-white p-4">
            <h3 className="text-sm font-semibold text-black-85">Finalizar intervención</h3>
            <p className="mt-1 text-[11px] text-black-45">{activaDetalle.intervencion.dominio}</p>

            <div className="mt-3">
              <p className="mb-1 text-[10px] font-medium text-black-45">Resultado *</p>
              <div className="flex flex-wrap gap-1.5">
                {RESULTADOS_FACTURACION.map((r) => (
                  <Chip key={r} active={resultado === r} onClick={() => setResultado(r)}>{r}</Chip>
                ))}
              </div>
            </div>

            <div className="mt-3">
              <p className="mb-1 text-[10px] font-medium text-black-45">Subcategoría / Diagnóstico</p>
              <div className="flex flex-wrap gap-1.5">
                {subcategoriasActivas.map((s) => (
                  <Chip key={s.id} active={subcategoriaId === s.id} onClick={() => setSubcategoriaId(s.id)}>{s.nombre}</Chip>
                ))}
              </div>
            </div>

            <div className="mt-3">
              <p className="mb-1 text-[10px] font-medium text-black-45">Observación</p>
              <textarea value={observacion} onChange={(e) => setObservacion(e.target.value)} className="min-h-[60px] w-full rounded border border-black-10 px-2 py-1.5 text-[11px] focus:border-primary focus:outline-none" />
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setFinalAbierto(false)} className="rounded border border-black-10 px-3 py-1.5 text-[11px] text-black-45 hover:bg-light">Cancelar</button>
              <button type="button" onClick={onFinalizar} disabled={!resultado || finalizar.isPending} className="inline-flex items-center gap-1.5 rounded bg-success px-3 py-1.5 text-[11px] font-medium text-white hover:bg-success-85 disabled:opacity-50">
                <Send size={13} /> {finalizar.isPending ? "Finalizando…" : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
