import { SeccionColapsable, ND, fmtFecha } from "../HistoriaClinicaUI";
import type { HistoriaClinicaData } from "../../hooks/useHistoriaClinicaData";
import { cn } from "@/lib/utils";

/**
 * Sección HISTORIAL del Panel Operativo.
 *
 * Incorpora el "Historial Transversal": todas las interacciones de la
 * unidad/cliente ordenadas por fecha (Soporte en Línea + Atenciones COPE +
 * Tickets de Desarrollo). Máx. 40 eventos.
 *
 * El contenido funcional se conserva igual que la vista original.
 */
export function HistorialTransversalSeccion({ data }: { data: HistoriaClinicaData }) {
  const eventos = data.eventosTransversales;

  return (
    <SeccionColapsable title={`Historial Transversal`} defaultOpen badge={
      <span className="text-[9px] text-black-45">{eventos.length} eventos</span>
    }>
      {eventos.length === 0 ? (
        <p className="text-[10px] text-black-25">Sin eventos registrados.</p>
      ) : (
        <div className="space-y-1.5">
          {eventos.map((ev, i) => (
            <div key={i} className="flex items-start gap-2 border-b border-black-5 py-1 last:border-0">
              <span className="w-[68px] shrink-0 text-[9px] tabular-nums text-black-45">{fmtFecha(ev.fecha)}</span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className={cn("rounded px-1.5 py-0.5 text-[8px] font-medium", tonoArea(ev.area))}>{ev.area}</span>
                  <span className="text-[9px] font-medium text-black-85">{ev.titulo}</span>
                  {ev.estado && <EstadoTareaBadge estado={ev.estado} />}
                </div>
                {ev.detalle && <p className="mt-0.5 line-clamp-2 text-[9px] text-black-45">{ev.detalle}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </SeccionColapsable>
  );
}

/** Badge de estado de ticket/tarea. */
function EstadoTareaBadge({ estado }: { estado: string | null | undefined }) {
  if (!estado) return <ND />;
  return <span className={cn("rounded px-1.5 py-0.5 text-[9px] font-medium", tonoEstadoTarea(estado))}>{estado}</span>;
}

/** Tono semántico del estado de una tarea/ticket (presentación). */
function tonoEstadoTarea(estado: string | null | undefined): string {
  const e = (estado ?? "").toLowerCase();
  if (/rechaz/.test(e)) return "bg-danger-5 text-danger";
  if (/complet|hecho|resuelt|cerrad/.test(e)) return "bg-success-5 text-success";
  if (/proceso|curso|prueba/.test(e)) return "bg-primary-5 text-primary";
  return "bg-black-5 text-black-45";
}

/** Tono visual por área del historial transversal. */
function tonoArea(area: string): string {
  if (/Soporte en Línea/.test(area)) return "bg-primary-5 text-primary";
  if (/Especializado/.test(area)) return "bg-purple-5 text-purple";
  if (/Desarrollo/.test(area)) return "bg-aqua-5 text-aqua";
  if (/Facturación/.test(area)) return "bg-warning-5 text-warning-65";
  return "bg-black-5 text-black-45";
}