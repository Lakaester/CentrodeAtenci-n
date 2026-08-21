/**
 * TicketbiClient — Cliente HTTP hacia TicketBI (tickets de desarrollo de Restaurant.pe).
 *
 * API PÚBLICA (sin token). Endpoint confirmado:
 *   https://microservices.restaurant.pe/backendrestaurantpe/public/rest/common/ticketbi/ticketbi
 * Solo acepta POST (GET devuelve "Method not allowed").
 *
 * Payload esperado:
 *   {
 *     localbi_id: number,
 *     personabi_id: number,
 *     ticketbi_asunto: string,
 *     ticketbi_categoria: "DESARROLLO",
 *     detalleList: [ { tarea_nombre, tarea_descripcion, area, plataforma } ]
 *   }
 *
 * Respuesta:
 *   { tipo: "1" (éxito) | "3" (error), mensajes: [], data: { ticketbi_id } }
 */
import { env } from "../../../config/env";

const SEGMENTO = "/public/rest/common/ticketbi/ticketbi";

export interface TicketbiDetalle {
  tarea_nombre: string;
  tarea_descripcion: string;
  area: string;
  plataforma?: string;
}

export interface CrearTicketbiInput {
  localbi_id: number;
  personabi_id: number;
  ticketbi_asunto: string;
  ticketbi_categoria: string;
  detalleList: TicketbiDetalle[];
}

export interface TicketbiEnvelope<T> {
  tipo?: string;
  mensajes?: string[];
  data?: T;
}

export interface TicketbiData {
  ticketbi_id?: number | string;
}

export class TicketbiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = env.LOCALBI_BASE_URL.replace(/\/+$/, "");
  }

  private url(): string {
    return `${this.baseUrl}${SEGMENTO}`;
  }

  /** Crea un ticket interno de desarrollo. POST únicamente. */
  async crearTicket(input: CrearTicketbiInput): Promise<TicketbiEnvelope<TicketbiData>> {
    const res = await fetch(this.url(), {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(60000),
    });

    if (!res.ok) {
      if (res.status === 405) {
        throw new Error("El endpoint de tickets solo acepta POST (405).");
      }
      throw new Error(`Microservicios respondió HTTP ${res.status}.`);
    }

    const text = await res.text();
    if (!text) throw new Error("Microservicios devolvió una respuesta vacía.");
    try {
      return JSON.parse(text) as TicketbiEnvelope<TicketbiData>;
    } catch {
      throw new Error("Microservicios devolvió una respuesta JSON inválida.");
    }
  }
}

export const ticketbiClient = new TicketbiClient();