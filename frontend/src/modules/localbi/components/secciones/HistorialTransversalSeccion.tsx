import { SeccionColapsable, ND, fmtFecha, useHistoriaDensity } from "../HistoriaClinicaUI";
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
  const comfortable = useHistoriaDensity() === "comfortable";

  return (
    <SeccionColapsable
      title="Historial Transversal"
      defaultOpen
      badge={
        <span className={comfortable ? "text-[12px] text-black-45" : "text-[9px] text-black-45"}>
          {eventos.length} eventos
        </span>
      }
    >
      {eventos.length === 0 ? (
        <p className={comfortable ? "text-[14px] text-black-45" : "text-[10px] text-black-25"}>
          Sin eventos registrados.
        </p>
      ) : (
        <div className={comfortable ? "space-y-3" : "space-y-1.5"}>
          {eventos.map((ev, i) => (
            <div
              key={i}
              className={cn(
                "flex items-start border-b border-black-10 last:border-0",
                comfortable ? "gap-4 py-2.5" : "gap-2 py-1",
              )}
            >
              <span className={cn("shrink-0 tabular-nums text-black-65", comfortable ? "w-[92px] text-[12px]" : "w-[68px] text-[9px] text-black-45")}>
                {fmtFecha(ev.fecha)}
              </span>
              <div className="min-w-0">
                <div className={cn("flex flex-wrap items-center", comfortable ? "gap-2" : "gap-1.5")}>
                  <span
                    className={cn(
                      "rounded-md font-medium",
                      comfortable ? "px-2 py-1 text-[12px]" : "px-1.5 py-0.5 text-[8px]",
                      tonoArea(ev.area),
                    )}
                  >
                    {ev.area}
                  </span>
                  <span className={cn("font-medium text-black-85", comfortable ? "text-[14px]" : "text-[9px]")}>
                    {ev.titulo}
                  </span>
                  {ev.estado && <EstadoTareaBadge estado={ev.estado} />}
                </div>
                {ev.detalle && (
                  <p className={cn("line-clamp-2 text-black-65", comfortable ? "mt-1 text-[13px]" : "mt-0.5 text-[9px] text-black-45")}>
                    {ev.detalle}
                  </p>
                )}
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
  const comfortable = useHistoriaDensity() === "comfortable";
  if (!estado) return <ND />;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md font-medium",
        comfortable ? "px-2 py-1 text-[12px]" : "px-1.5 py-0.5 text-[9px]",
        tonoEstadoTarea(estado),
      )}
    >
      {estado}
    </span>
  );
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
  if (/^Tarea/.test(area)) return "bg-aqua-5 text-aqua";
  if (/Desarrollo/.test(area)) return "bg-aqua-5 text-aqua";
  if (/Facturación/.test(area)) return "bg-warning-5 text-warning-65";
  return "bg-black-5 text-black-45";
}