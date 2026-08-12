import { Ticket, type TicketData } from "./Ticket";
import { calculatePriority } from "./TicketPriority";
import type { ExternalChannel } from "./TicketChannel";
import type { TicketStatus } from "./TicketStatus";

export interface CreateTicketParams {
  channel: ExternalChannel;
  clienteId: string;
  clienteNombre: string;
  clienteDominio: string;
  asunto: string;
  clienteEmail?: string;
  clienteTelefono?: string;
  pais?: string;
  tipoCliente?: string;
  mensajeInicial?: string;
  metadata?: Record<string, unknown>;
}

export class TicketFactory {
  static create(params: CreateTicketParams): Ticket {
    const ahora = new Date().toISOString();
    const data: TicketData = {
      id: `TKT-${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      channel: params.channel,
      status: "PENDIENTE",
      priority: "MEDIA",
      priorityScore: 30,
      clienteId: params.clienteId,
      clienteNombre: params.clienteNombre,
      clienteDominio: params.clienteDominio,
      clienteEmail: params.clienteEmail,
      clienteTelefono: params.clienteTelefono,
      pais: params.pais,
      tipoCliente: params.tipoCliente,
      asunto: params.asunto,
      slaPorcentaje: 0,
      slaVencido: false,
      tags: [],
      noLeido: params.mensajeInicial ? 1 : 0,
      ultimoMensaje: params.mensajeInicial,
      ultimoMensajeEn: params.mensajeInicial ? ahora : undefined,
      metadata: params.metadata,
      createdAt: ahora,
      updatedAt: ahora,
    };
    return new Ticket(data);
  }

  static fromData(data: TicketData): Ticket {
    return new Ticket(data);
  }
}
