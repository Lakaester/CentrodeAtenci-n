import type { HistoriaClinicaData } from "../../hooks/useHistoriaClinicaData";
import { TicketsDev } from "./TicketsDev";
import { TareasIndependientes } from "./TareasIndependientes";
import { CoseUnidad } from "./CoseUnidad";
import { ModulosLocalbi } from "./ModulosLocalbi";
import { SoporteEnLinea } from "./SoporteEnLinea";

/**
 * Sección ACTIVIDAD del Panel Operativo.
 *
 * Responde: "¿Qué actividad tiene o ha tenido este cliente/unidad?"
 *
 * Incluye:
 *   - Tickets de desarrollo (TICKETS DEV, LocalBI + Tareabi bajo demanda).
 *   - Tareas independientes (TAREAS, asociadas a un local).
 *   - Actividad en COSE (atenciones v_unificado_norm).
 *   - Módulos utilizados.
 *   - Soporte en Línea (incidencias).
 *
 * NPS y facturación NO viven aquí (NPS oculto; facturación → Operación).
 */
export function ActividadUnidad({ data }: { data: HistoriaClinicaData }) {
  const { tickets, tareasIndependientes } = data;

  return (
    <div className="space-y-0.5">
      {/* Tickets de desarrollo */}
      <TicketsDev tickets={tickets} />

      {/* Tareas independientes */}
      <TareasIndependientes tareas={tareasIndependientes} />

      {/* COSE (v_unificado_norm) */}
      <CoseUnidad data={data} />

      {/* Módulos utilizados (agregado LocalBI; sin desglose por módulo) */}
      <ModulosLocalbi data={data} />

      {/* Soporte en Línea (public.incidencias) */}
      <SoporteEnLinea data={data} />
    </div>
  );
}

