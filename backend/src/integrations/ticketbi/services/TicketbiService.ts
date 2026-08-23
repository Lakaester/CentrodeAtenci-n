/**
 * TicketbiService — Creación de tickets internos de Desarrollo desde Atenciones.
 *
 * Flujo: Frontend (COPE) → Backend COPE → Microservicios (TicketBI).
 * El backend valida el payload y delega el POST al endpoint central.
 * No guarda credenciales sensibles; el endpoint público no requiere token.
 */
import { ticketbiClient, type CrearTicketbiInput, type TicketbiEnvelope, type TicketbiData } from "../client/TicketbiClient";
import { ApplicationError } from "../../../core/errors/types";

export interface TareaDesarrolloInput {
  tarea_nombre?: string | null;
  tarea_descripcion?: string | null;
  areaId?: number | null;
  plataforma?: string | null;
  proyecto?: string | null;
  tipo?: string | null;
  version?: string | null;
  etapaError?: string | null;
  fechaEntrega?: string | null;
  referencia?: string | null;
  casos?: string | null;
}

export interface CrearTicketDesarrolloInput {
  localbi_id?: number | string | null;
  personabi_id?: number | string | null;
  ticketbi_asunto?: string | null;
  ticketbi_categoria?: string | null;
  detalleList?: TareaDesarrolloInput[];
}

export interface CrearTicketDesarrolloResultado {
  ticketbi_id?: number | string;
  mensajes: string[];
}

function toNum(v: number | string | null | undefined): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function parseRespuesta(resp: TicketbiEnvelope<TicketbiData>): CrearTicketDesarrolloResultado {
  const mensajes = Array.isArray(resp.mensajes) ? resp.mensajes : [];
  if (resp.tipo === "1" && resp.data) {
    return { ticketbi_id: resp.data.ticketbi_id, mensajes };
  }
  if (resp.tipo === "3" || (resp.tipo != null && resp.tipo !== "1")) {
    const detalle = mensajes.join(" ").trim();
    throw new ApplicationError(
      detalle || "No fue posible crear el ticket. Inténtalo nuevamente o contacta al administrador.",
      "TICKETBI_ERROR",
    );
  }
  // Sin tipo reconocible: mensaje amigable.
  throw new ApplicationError(
    "No fue posible crear el ticket. Inténtalo nuevamente o contacta al administrador.",
    "TICKETBI_ERROR",
  );
}

/** Construye un nombre de tarea claro a partir de proyecto y tipo. */
function nombreTarea(d: TareaDesarrolloInput, asunto?: string | null): string {
  const partes = [d.proyecto, d.tipo].filter(Boolean).map(String).map((x) => x.trim()).filter(Boolean);
  if (partes.length > 0) return partes.join(" — ");
  return String(asunto ?? "Tarea").trim();
}

export const ticketbiService = {
  /**
   * Crea un ticket de desarrollo. Valida la información mínima y, si falta el
   * local o el asesor, devuelve un error claro (no se envían tickets incompletos).
   */
  async crearTicket(input: CrearTicketDesarrolloInput): Promise<CrearTicketDesarrolloResultado> {
    const localbiId = toNum(input.localbi_id);
    const personabiId = toNum(input.personabi_id);

    if (localbiId == null) {
      throw new ApplicationError(
        "No se puede crear el ticket porque la atención no tiene un cliente/local identificado.",
        "LOCALBI_ID_INVALIDO",
      );
    }
    if (personabiId == null) {
      throw new ApplicationError(
        "No se pudo identificar correctamente al asesor. Verifica tu sesión.",
        "PERSONABI_ID_INVALIDO",
      );
    }
    if (!input.ticketbi_asunto || !String(input.ticketbi_asunto).trim()) {
      throw new ApplicationError("Ingresa un asunto para el ticket.", "ASUNTO_REQUERIDO");
    }
    const detalle = (input.detalleList ?? []).filter((d) => d && (d.tarea_nombre || d.tarea_descripcion));
    if (detalle.length === 0) {
      throw new ApplicationError(
        "Ingresa el detalle de la tarea que debe revisar Desarrollo.",
        "DETALLE_REQUERIDO",
      );
    }
    for (const [i, d] of detalle.entries()) {
      if (d.areaId == null || !Number.isFinite(d.areaId) || d.areaId <= 0) {
        throw new ApplicationError(
          `La tarea ${i + 1} no tiene un área válida. Selecciona un área del catálogo.`,
          "AREA_REQUERIDA",
        );
      }
    }
    const primera = detalle[0];
    if (!primera.tarea_descripcion || !String(primera.tarea_descripcion).trim()) {
      throw new ApplicationError(
        "Ingresa el detalle de la tarea que debe revisar Desarrollo.",
        "DETALLE_REQUERIDO",
      );
    }

    const payload: CrearTicketbiInput = {
      localbi_id: localbiId,
      personabi_id: personabiId,
      ticketbi_asunto: String(input.ticketbi_asunto).trim(),
      ticketbi_categoria: (input.ticketbi_categoria ?? "DESARROLLO").toUpperCase(),
      detalleList: detalle.map((d) => ({
        tarea_nombre: String(d.tarea_nombre ?? nombreTarea(d, input.ticketbi_asunto)).trim(),
        tarea_descripcion: String(d.tarea_descripcion).trim(),
        area: d.areaId!,
        plataforma: d.plataforma ? String(d.plataforma).toUpperCase() : undefined,
        tarea_proyecto: d.proyecto ? String(d.proyecto).trim() : undefined,
        tarea_version: d.version ? String(d.version).trim() : undefined,
        tarea_tipo: d.tipo ? String(d.tipo).trim() : undefined,
        tarea_etapaerror: d.etapaError ? String(d.etapaError).trim() : undefined,
        tarea_fechaentrega: d.fechaEntrega ? String(d.fechaEntrega).trim() : undefined,
        tarea_referencia: d.referencia ? String(d.referencia).trim() : undefined,
        casos_contemplar: d.casos ? String(d.casos).trim() : undefined,
      })),
    };

    const resp = await ticketbiClient.crearTicket(payload);
    return parseRespuesta(resp);
  },
};