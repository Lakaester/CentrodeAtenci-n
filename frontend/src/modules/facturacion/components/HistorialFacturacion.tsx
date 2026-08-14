import { useHistorialCliente } from "../hooks/useFacturacion";

function fmtDuracion(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

function fmtFecha(v: string | null | undefined): string {
  if (!v) return "—";
  const d = new Date(v);
  if (isNaN(d.getTime())) return v;
  return d.toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" });
}

interface Props {
  unidadNegocioId: string | null;
  dominios: string[];
}

export function HistorialFacturacion({ unidadNegocioId, dominios }: Props) {
  const { data, isLoading } = useHistorialCliente(unidadNegocioId, dominios);

  if (isLoading) {
    return <p className="px-2.5 py-1 text-[10px] text-black-25">Cargando historial de facturación…</p>;
  }

  if (!data || data.length === 0) {
    return <p className="px-2.5 py-1 text-[10px] text-black-25">Sin intervenciones de facturación</p>;
  }

  return (
    <div className="space-y-1 px-2.5 pb-2">
      {data.map((d) => {
        const i = d.intervencion;
        const acciones = d.actividades.map((a) => a.tipo).join(", ");
        return (
          <div key={i.id} className="rounded border border-black-10 bg-light p-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[9px] text-black-45">{fmtFecha(i.started_at)}</span>
              <span className="shrink-0 text-[9px] font-medium text-black-85">{i.asesor}</span>
            </div>
            <div className="mt-0.5 flex items-center justify-between gap-2">
              <span className="truncate text-[10px] font-medium text-black-85">{i.dominio}</span>
              <span className="shrink-0 font-mono text-[9px] text-black-45">{fmtDuracion(d.duraciones.duracionEfectivaMs)}</span>
            </div>
            <div className="mt-1 space-y-0.5 text-[9px] text-black-45">
              <div className="flex gap-1.5">
                <span className="text-black-25">Causa:</span>
                <span className="text-black-85">{i.causa || "—"}</span>
              </div>
              {acciones && (
                <div className="flex gap-1.5">
                  <span className="text-black-25">Acciones:</span>
                  <span className="text-black-85">{acciones}</span>
                </div>
              )}
              <div className="flex gap-1.5">
                <span className="text-black-25">Resultado:</span>
                <span className="text-black-85">{i.resultado || "—"}</span>
              </div>
              {(i.facturas_pendientes != null || i.boletas_pendientes != null) && (
                <div className="flex gap-1.5">
                  <span className="text-black-25">Docs:</span>
                  <span className="text-black-85">
                    FV {i.facturas_pendientes ?? "—"} · BV {i.boletas_pendientes ?? "—"}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
