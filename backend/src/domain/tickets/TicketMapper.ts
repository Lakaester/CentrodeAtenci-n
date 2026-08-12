import { Ticket, type TicketData } from "./Ticket";
import type { ExternalChannel } from "./TicketChannel";
import type { TicketStatus } from "./TicketStatus";
import type { TicketPriority } from "./TicketPriority";

export interface RawExternalTicket {
  id: string;
  channel: ExternalChannel;
  clienteNombre: string;
  clienteDominio: string;
  asunto: string;
  mensaje?: string;
  timestamp?: string;
  metadata?: Record<string, unknown>;
}

export class TicketMapper {
  static fromWhaticket(raw: RawExternalTicket): TicketData {
    return TicketMapper.base(raw, "whaticket");
  }

  static fromMeta(raw: RawExternalTicket): TicketData {
    return TicketMapper.base(raw, "meta");
  }

  static fromZendesk(raw: RawExternalTicket): TicketData {
    return TicketMapper.base(raw, "zendesk");
  }

  static fromExternal(raw: RawExternalTicket): Ticket {
    const data = TicketMapper.base(raw, raw.channel);
    return new Ticket(data);
  }

  private static base(raw: RawExternalTicket, channel: ExternalChannel): TicketData {
    const ahora = new Date().toISOString();
    return {
      id: `TKT-${Date.now()}`,
      externalId: raw.id,
      channel,
      status: "PENDIENTE",
      priority: "MEDIA",
      priorityScore: 30,
      clienteId: `CLI-${raw.clienteDominio}`,
      clienteNombre: raw.clienteNombre,
      clienteDominio: raw.clienteDominio,
      asunto: raw.asunto,
      slaPorcentaje: 0,
      slaVencido: false,
      tags: [],
      noLeido: 1,
      ultimoMensaje: raw.mensaje,
      ultimoMensajeEn: raw.timestamp ?? ahora,
      metadata: raw.metadata,
      createdAt: ahora,
      updatedAt: ahora,
    };
  }
}
