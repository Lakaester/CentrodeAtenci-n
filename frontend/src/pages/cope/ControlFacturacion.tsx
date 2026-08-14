import { useState } from "react";
import { ReceiptText, Inbox, Activity, History, Search, ChevronDown } from "lucide-react";
import {
  useFacturacionSource,
} from "@/modules/facturacion";
import type { FacturacionDominioPendiente } from "@/modules/facturacion";
import { PanelIntervencion } from "@/modules/facturacion/components/PanelIntervencion";
import { DrawerDetalleCaso } from "@/modules/facturacion/components/DrawerDetalleCaso";
import { FuenteNotConfigured, FuenteUnavailable } from "@/modules/facturacion/components/FuenteUI";
import { useHistorial } from "@/modules/facturacion";
import { cn } from "@/lib/utils";

/** Umbral de alerta por acumulación (centralizado; configurable en el futuro). */
export const UMBRAL_ALERTA_PENDIENTES = 10;

type Vista = "pendientes" | "intervencion" | "historial";

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

export default function ControlFacturacion() {
  const { data: source, isLoading: cargandoSource, refetch: refetchSource } = useFacturacionSource();
  const { data: historial, isLoading: cargandoHistorial } = useHistorial();

  const [vista, setVista] = useState<Vista>("pendientes");
  const [proveedorSel, setProveedorSel] = useState<string>("__todos__");
  const [busqueda, setBusqueda] = useState("");
  const [casoSeleccionado, setCasoSeleccionado] = useState<FacturacionDominioPendiente | null>(null);
  const [verMas, setVerMas] = useState(false);
  const [prefill, setPrefill] = useState<{ dominio?: string; ruc?: string; proveedor?: string } | undefined>(undefined);

  const proveedores = [] as { proveedor: string; dominiosAfectados: number; totalDocumentosPendientes: number }[];
  const dominios = [] as FacturacionDominioPendiente[];

  const fuenteConectada = source?.estado === "DISPONIBLE";

  const iniciarDiagnostico = (pre?: { dominio?: string; ruc?: string; proveedor?: string }) => {
    setPrefill(pre);
    setVista("intervencion");
  };

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      {/* Header */}
      <div className="shrink-0 border-b border-black-10 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-10 text-primary">
            <ReceiptText size={18} />
          </div>
          <div>
            <h1 className="text-base font-semibold text-black-85">Control de Facturación</h1>
            <p className="mt-0.5 text-xs text-black-45">Monitoreo y atención de documentos electrónicos.</p>
          </div>
        </div>
      </div>

      {/* Navegación interna */}
      <div className="flex shrink-0 items-center gap-1 border-b border-black-10 px-6 py-2">
        <button type="button" onClick={() => setVista("pendientes")} className={cn("inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-[11px] font-medium", vista === "pendientes" ? "bg-primary text-white" : "text-black-45 hover:bg-light")}>
          <Inbox size={13} /> Pendientes
        </button>
        <button type="button" onClick={() => setVista("intervencion")} className={cn("inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-[11px] font-medium", vista === "intervencion" ? "bg-primary text-white" : "text-black-45 hover:bg-light")}>
          <Activity size={13} /> Intervención
        </button>
        <button type="button" onClick={() => setVista("historial")} className={cn("inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-[11px] font-medium", vista === "historial" ? "bg-primary text-white" : "text-black-45 hover:bg-light")}>
          <History size={13} /> Historial
        </button>
      </div>

      {vista === "intervencion" ? (
        <PanelIntervencion prefill={prefill} />
      ) : vista === "historial" ? (
        <div className="flex-1 min-h-0 overflow-y-auto bg-light p-6">
          <div className="mx-auto max-w-3xl space-y-1">
            {cargandoHistorial && <p className="text-[11px] text-black-25">Cargando historial…</p>}
            {!cargandoHistorial && (!historial || historial.length === 0) && (
              <p className="text-[11px] text-black-25">Sin intervenciones registradas</p>
            )}
            {!cargandoHistorial && historial?.map((h) => {
              const b = estadoBadge(h.intervencion.status);
              return (
                <div key={h.intervencion.id} className="flex items-center justify-between gap-2 rounded border border-black-10 bg-white px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-medium text-black-85">{h.intervencion.dominio}</p>
                    <p className="truncate text-[9px] text-black-45">
                      {h.intervencion.asesor} · {h.intervencion.ruc || "—"} · {h.intervencion.causa || "sin causa"}
                    </p>
                  </div>
                  <span className={cn("shrink-0 rounded px-1.5 py-0.5 text-[9px] font-medium", b.cls)}>{b.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Vista Pendientes */
        <div className="flex flex-1 min-h-0 flex-col">
          {cargandoSource ? (
            <div className="flex flex-1 items-center justify-center text-[12px] text-black-25">Cargando…</div>
          ) : source?.estado === "NO_CONECTADA" ? (
            <FuenteNotConfigured mensaje={source.mensaje} onReintentar={refetchSource} />
          ) : source?.estado === "ERROR" ? (
            <FuenteUnavailable mensaje={source.mensaje} onReintentar={refetchSource} />
          ) : fuenteConectada ? (
            <>
              {/* Selector de proveedores (pestañas compactas) */}
              <div className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-black-10 px-6 py-2">
                <button
                  type="button"
                  onClick={() => setProveedorSel("__todos__")}
                  className={cn("shrink-0 rounded px-3 py-1.5 text-[11px] font-medium", proveedorSel === "__todos__" ? "bg-primary text-white" : "bg-black-5 text-black-45 hover:bg-black-10")}
                >
                  Todos
                </button>
                {proveedores.map((p) => (
                  <button
                    key={p.proveedor}
                    type="button"
                    onClick={() => setProveedorSel(p.proveedor)}
                    className={cn("shrink-0 rounded px-3 py-1.5 text-[11px] font-medium", proveedorSel === p.proveedor ? "bg-primary text-white" : "bg-black-5 text-black-45 hover:bg-black-10")}
                  >
                    {p.proveedor}
                    <span className="ml-1.5 text-[9px] opacity-70">{p.totalDocumentosPendientes} pend · {p.dominiosAfectados} dom</span>
                  </button>
                ))}
              </div>

              {/* Filtros */}
              <div className="flex shrink-0 flex-wrap items-center gap-1.5 border-b border-black-10 px-6 py-2">
                <div className="relative">
                  <Search size={12} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-black-45" />
                  <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar dominio / RUC" className="h-7 w-52 rounded border border-black-10 bg-white py-1 pl-7 pr-2 text-[11px] focus:border-primary focus:outline-none" />
                </div>
                <button type="button" className="inline-flex items-center gap-1 rounded border border-black-10 px-2 py-1 text-[10px] text-black-45 hover:bg-light">
                  Estado <ChevronDown size={11} />
                </button>
                <button type="button" className="inline-flex items-center gap-1 rounded border border-black-10 px-2 py-1 text-[10px] text-black-45 hover:bg-light">
                  Subcategoría <ChevronDown size={11} />
                </button>
                <button type="button" className="rounded border border-black-10 px-2 py-1 text-[10px] text-black-45 hover:bg-light">Solo pendientes</button>
                <button type="button" className="rounded border border-black-10 px-2 py-1 text-[10px] text-black-45 hover:bg-light">Solo errores</button>
                <button type="button" className="rounded border border-black-10 px-2 py-1 text-[10px] text-black-45 hover:bg-light">Sin diagnosticar</button>
              </div>

              {/* Tabla de dominios */}
              <div className="flex-1 min-h-0 overflow-auto">
                <table className="w-full border-collapse text-left">
                  <thead className="sticky top-0 z-10 bg-white">
                    <tr className="border-b border-black-10 text-[9px] uppercase tracking-wider text-black-45">
                      <th className="px-3 py-2 font-medium">#</th>
                      <th className="px-3 py-2 font-medium">Dominio</th>
                      <th className="px-3 py-2 font-medium">RUC</th>
                      <th className="px-3 py-2 text-right font-medium">FV</th>
                      <th className="px-3 py-2 text-right font-medium">BV</th>
                      <th className="px-3 py-2 text-right font-medium">Total</th>
                      <th className="px-3 py-2 font-medium">Diagnóstico</th>
                      <th className="px-3 py-2 font-medium">Estado</th>
                      <th className="px-3 py-2 font-medium">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dominios.length === 0 && (
                      <tr><td colSpan={9} className="px-3 py-6 text-center text-[11px] text-black-25">Sin documentos pendientes</td></tr>
                    )}
                    {dominios.map((d, i) => (
                      <tr key={d.dominio} className="border-b border-black-5 hover:bg-light">
                        <td className="px-3 py-1.5 text-[10px] text-black-45">{i + 1}</td>
                        <td className="px-3 py-1.5 text-[11px] font-medium text-black-85">{d.dominio}</td>
                        <td className="px-3 py-1.5 font-mono text-[10px] text-black-45">{d.ruc || "—"}</td>
                        <td className="px-3 py-1.5 text-right text-[10px] text-black-85">{d.facturasPendientes ?? 0}</td>
                        <td className="px-3 py-1.5 text-right text-[10px] text-black-85">{d.boletasPendientes ?? 0}</td>
                        <td className={cn("px-3 py-1.5 text-right text-[10px] font-semibold", (d.totalPendiente ?? 0) >= UMBRAL_ALERTA_PENDIENTES ? "text-danger" : "text-black-85")}>
                          {d.totalPendiente ?? 0}
                        </td>
                        <td className="px-3 py-1.5">
                          <span className="rounded bg-black-5 px-1.5 py-0.5 text-[9px] text-black-45">{d.subcategoria || "Sin diagnosticar"}</span>
                        </td>
                        <td className="px-3 py-1.5">
                          <span className="rounded bg-black-5 px-1.5 py-0.5 text-[9px] text-black-45">{d.estado || "Pendiente"}</span>
                        </td>
                        <td className="px-3 py-1.5">
                          <button type="button" onClick={() => setCasoSeleccionado(d)} className="rounded border border-black-10 px-2 py-0.5 text-[10px] text-primary hover:bg-primary-5">
                            Revisar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {dominios.length > 0 && !verMas && (
                  <div className="border-t border-black-10 px-3 py-2">
                    <button type="button" onClick={() => setVerMas(true)} className="text-[10px] text-primary hover:underline">Ver 18 restantes</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <FuenteUnavailable mensaje="Estado desconocido de la fuente." onReintentar={refetchSource} />
          )}
        </div>
      )}

      {/* Drawer detalle */}
      <DrawerDetalleCaso
        caso={casoSeleccionado}
        onClose={() => setCasoSeleccionado(null)}
        onIniciarDiagnostico={() => {
          if (casoSeleccionado) iniciarDiagnostico({ dominio: casoSeleccionado.dominio, ruc: casoSeleccionado.ruc ?? undefined, proveedor: casoSeleccionado.proveedor ?? undefined });
        }}
        onReenviar={() => {}}
      />
    </div>
  );
}
