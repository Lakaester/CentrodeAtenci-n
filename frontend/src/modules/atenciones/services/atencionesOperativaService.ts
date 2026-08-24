import { api } from "@/lib/api";
import type { AtencionOperativa } from "@/hooks/useTicketDetail";

/** Obtiene el snapshot operativo + auditoría de una atención (por ticket Zendesk). */
export async function obtenerOperativa(ticketId: string): Promise<AtencionOperativa> {
  const res = await api.get(`/atenciones/${encodeURIComponent(ticketId)}/operativa`);
  return res.data?.data ?? null;
}

/** Registra/edita la clasificación (categoría/subcategoría) de la atención. */
export async function registrarClasificacion(
  ticketId: string,
  payload: { categoria: string; subcategoria?: string | null },
): Promise<void> {
  await api.post(`/atenciones/${encodeURIComponent(ticketId)}/operativa/clasificacion`, {
    ...payload,
    origen: "cope",
  });
}

/** Registra/edita la calificación de la atención. */
export async function registrarCalificacion(
  ticketId: string,
  payload: { calificacion: string },
): Promise<void> {
  await api.post(`/atenciones/${encodeURIComponent(ticketId)}/operativa/calificacion`, payload);
}

/** Registra una acción operativa genérica (respuesta, nota, resolución, etc.). */
export async function registrarAccion(
  ticketId: string,
  payload: {
    accion: string;
    detalle?: string | null;
    campo?: string | null;
    valorAnterior?: string | null;
    valorNuevo?: string | null;
  },
): Promise<void> {
  await api.post(`/atenciones/${encodeURIComponent(ticketId)}/operativa/acciones`, {
    ...payload,
    origen: "cope",
  });
}

/** Registra la identificación (dominio) manual en el snapshot de la atención. */
export async function registrarIdentificacion(
  ticketId: string,
  payload: {
    dominio: string;
    tipoIdentificacion: "MANUAL";
  },
): Promise<void> {
  await api.post(`/atenciones/${encodeURIComponent(ticketId)}/operativa/identificacion`, {
    ...payload,
    tipoIdentificacion: "MANUAL",
  });
}