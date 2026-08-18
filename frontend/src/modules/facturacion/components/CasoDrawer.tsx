import { useState } from "react";
import { X } from "lucide-react";
import type { CasoDetalle, CategoriaItem } from "@/modules/facturacion";
import { CasoBadge } from "./CasoBadge";
import { AsignarCasoModal, CambiarEstadoModal, CategorizarCasoModal, RegistrarSnapshotModal } from "./CasoModals";

function fmtFecha(v: string | null | undefined): string {
  if (!v) return "—";
  const d = new Date(v);
  if (isNaN(d.getTime())) return v;
  return d.toLocaleString("es-PE", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function Fila({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="shrink-0 text-[9px] text-black-25">{label}</span>
      <span className="ml-2 max-w-[60%] truncate text-right text-[10px] font-medium text-black-85">{children}</span>
    </div>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-wider text-black-45">{titulo}</p>
      <div className="rounded-lg border border-black-10 bg-light p-3">{children}</div>
    </div>
  );
}

/** Gráfico de barras sencillo de la evolución del total por fecha. */
function EvolucionTotal({ totales }: { totales: { fecha: string; total: number }[] }) {
  if (totales.length === 0) return <p className="text-[10px] text-black-25">Sin evolución registrada.</p>;
  const max = Math.max(...totales.map((t) => t.total), 1);
  return (
    <div className="flex items-end gap-1.5">
      {totales.map((t, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-0.5">
          <span className="text-[8px] text-black-45">{t.total}</span>
          <div className="w-full rounded-sm bg-primary" style={{ height: `${Math.max(3, (t.total / max) * 60)}px` }} />
          <span className="text-[8px] text-black-25">
            {new Date(t.fecha).toLocaleDateString("es-PE", { day: "numeric", month: "short" })}
          </span>
        </div>
      ))}
    </div>
  );
}

type ModalAccion = "asignar" | "estado" | "categoria" | "snapshot" | null;

export function CasoDrawer({
  detalle,
  puedeEditar,
  asesores,
  categorias,
  subcategorias,
  estadosPermitidos,
  onCategoriaChange,
  onAsignar,
  onCambiarEstado,
  onCategorizar,
  onRegistrarSnapshot,
  onCerrar,
}: {
  detalle: CasoDetalle;
  puedeEditar: boolean;
  asesores: string[];
  categorias: CategoriaItem[];
  subcategorias: { id: string; nombre: string }[];
  estadosPermitidos: string[];
  onCategoriaChange: (categoriaId: string) => void;
  onAsignar: (asesor: string) => Promise<void>;
  onCambiarEstado: (estado: string) => Promise<void>;
  onCategorizar: (categoriaId: string | null, subcategoriaId: string | null) => Promise<void>;
  onRegistrarSnapshot: (facturas: number | null, boletas: number | null) => Promise<void>;
  onCerrar: () => void;
}) {
  const { caso, snapshots, auditoria } = detalle;
  const [modal, setModal] = useState<ModalAccion>(null);

  const totales = snapshots.map((s) => ({ fecha: s.fecha_snapshot, total: s.total ?? 0 }));

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onCerrar} />
      <div className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-black-10 bg-white">
        <div className="flex items-center justify-between border-b border-black-10 px-4 py-3">
          <div className="min-w-0">
            <h3 className="truncate text-xs font-semibold text-primary">{caso.dominio}</h3>
            <div className="mt-0.5 flex items-center gap-1.5"><CasoBadge estado={caso.estado_operativo} /></div>
          </div>
          <button type="button" onClick={onCerrar} className="rounded p-1 text-black-45 hover:bg-light"><X size={14} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {/* Identificación */}
          <Seccion titulo="Identificación">
            <Fila label="Dominio">{caso.dominio}</Fila>
            <Fila label="Cliente">{caso.cliente_nombre || "—"}</Fila>
            <Fila label="RUC">{caso.ruc || "—"}</Fila>
            <Fila label="Proveedor">{caso.proveedor || "—"}</Fila>
            <Fila label="Unidad de negocio">{caso.unidad_negocio_id || "—"}</Fila>
          </Seccion>

          {/* Estado actual */}
          <Seccion titulo="Estado actual">
            <Fila label="Estado"><CasoBadge estado={caso.estado_operativo} /></Fila>
            <Fila label="Asesor">{caso.asesor_actual || "Sin responsable"}</Fila>
            <Fila label="Fecha asignación">{fmtFecha(caso.fecha_asignacion)}</Fila>
            <Fila label="Primera detección">{fmtFecha(caso.primera_deteccion)}</Fila>
            <Fila label="Última detección">{fmtFecha(caso.ultima_deteccion)}</Fila>
          </Seccion>

          {/* Clasificación */}
          <Seccion titulo="Clasificación">
            <Fila label="Categoría">{caso.categoria_nombre || "—"}</Fila>
            <Fila label="Subcategoría">{caso.subcategoria_nombre || "—"}</Fila>
          </Seccion>

          {/* Pendientes */}
          <Seccion titulo="Pendientes">
            <Fila label="Facturas">{caso.ultimas_facturas ?? "—"}</Fila>
            <Fila label="Boletas">{caso.ultimas_boletas ?? "—"}</Fila>
            <Fila label="Total"><span className={caso.ultimo_total ? "text-danger" : "text-success"}>{caso.ultimo_total ?? 0}</span></Fila>
          </Seccion>

          {/* Acciones */}
          {puedeEditar && (
            <Seccion titulo="Acciones">
              <div className="flex flex-wrap gap-1.5">
                <button type="button" onClick={() => setModal("asignar")} className="rounded bg-primary px-2.5 py-1 text-[10px] font-medium text-white hover:bg-primary-85">Asignar asesor</button>
                <button type="button" onClick={() => setModal("estado")} className="rounded border border-black-10 px-2.5 py-1 text-[10px] text-black-65 hover:bg-light">Cambiar estado</button>
                <button type="button" onClick={() => setModal("categoria")} className="rounded border border-black-10 px-2.5 py-1 text-[10px] text-black-65 hover:bg-light">Categorizar</button>
                <button type="button" onClick={() => setModal("snapshot")} className="rounded border border-black-10 px-2.5 py-1 text-[10px] text-black-65 hover:bg-light">Registrar snapshot</button>
              </div>
            </Seccion>
          )}

          {/* Evolución de pendientes */}
          <Seccion titulo="Evolución de pendientes">
            {snapshots.length === 0 ? (
              <p className="text-[10px] text-black-25">Sin snapshots registrados.</p>
            ) : (
              <div className="space-y-3">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[8px] uppercase tracking-wider text-black-45">
                      <th className="py-1 font-medium">Fecha</th>
                      <th className="py-1 text-right font-medium">Facturas</th>
                      <th className="py-1 text-right font-medium">Boletas</th>
                      <th className="py-1 text-right font-medium">Total</th>
                      <th className="py-1 text-right font-medium">Origen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {snapshots.map((s) => (
                      <tr key={s.id} className="border-t border-black-5 text-[10px] text-black-85">
                        <td className="py-1">{new Date(s.fecha_snapshot).toLocaleDateString("es-PE", { day: "numeric", month: "short" })}</td>
                        <td className="py-1 text-right">{s.facturas ?? 0}</td>
                        <td className="py-1 text-right">{s.boletas ?? 0}</td>
                        <td className="py-1 text-right font-semibold">{s.total ?? 0}</td>
                        <td className="py-1 text-right text-[8px] text-black-45">{s.origen}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <EvolucionTotal totales={totales} />
              </div>
            )}
          </Seccion>

          {/* Intervenciones */}
          <Seccion titulo="Intervenciones">
            {detalle.intervenciones.length === 0 ? (
              <p className="text-[10px] text-black-25">Sin intervenciones vinculadas.</p>
            ) : (
              <div className="space-y-1">
                {detalle.intervenciones.map((iv) => (
                  <div key={iv.intervencion_id} className="flex items-center justify-between text-[10px] text-black-85">
                    <span className="font-mono">{iv.intervencion_id.slice(0, 8)}</span>
                    <span className="text-[9px] text-black-45">{fmtFecha(iv.created_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </Seccion>

          {/* Auditoría */}
          <Seccion titulo="Historial de gestión">
            {auditoria.length === 0 ? (
              <p className="text-[10px] text-black-25">Sin eventos registrados.</p>
            ) : (
              <div className="space-y-1.5">
                {auditoria.map((a) => (
                  <div key={a.id} className="border-b border-black-5 py-1 last:border-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-medium text-black-85">{a.accion}</span>
                      <span className="text-[8px] text-black-25">{fmtFecha(a.created_at)}</span>
                    </div>
                    {a.asesor && <p className="text-[8px] text-black-45">{a.asesor}</p>}
                    {(a.valor_anterior || a.valor_nuevo) && (
                      <p className="text-[8px] text-black-45">{a.valor_anterior || "—"} → {a.valor_nuevo || "—"}</p>
                    )}
                    {a.detalle && <p className="text-[8px] text-black-25">{a.detalle}</p>}
                  </div>
                ))}
              </div>
            )}
          </Seccion>
        </div>

        {/* Modales */}
        {modal === "asignar" && (
          <AsignarCasoModal caso={caso} asesores={asesores} onConfirmar={onAsignar} onClose={() => setModal(null)} />
        )}
        {modal === "estado" && (
          <CambiarEstadoModal caso={caso} estadosPermitidos={estadosPermitidos} onConfirmar={onCambiarEstado} onClose={() => setModal(null)} />
        )}
        {modal === "categoria" && (
          <CategorizarCasoModal
            caso={caso} categorias={categorias} subcategorias={subcategorias}
            onCategoriaChange={onCategoriaChange}
            onConfirmar={onCategorizar}
            onClose={() => setModal(null)}
          />
        )}
        {modal === "snapshot" && (
          <RegistrarSnapshotModal caso={caso} onConfirmar={onRegistrarSnapshot} onClose={() => setModal(null)} />
        )}
      </div>
    </div>
  );
}
