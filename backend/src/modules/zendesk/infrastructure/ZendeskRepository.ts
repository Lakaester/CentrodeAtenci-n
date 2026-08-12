/** @deprecated Este m�dulo ha sido reemplazado por modules/zendesk-test/. Se eliminar� en M2. */
/**
 * ZendeskRepository — Implementación que usa el Provider.
 *
 * Cuando no hay configuración, usa MockZendeskProvider.
 * Cuando Zendesk esté configurado, usará el provider real.
 */

import type { ZendeskProvider } from "../application/ZendeskProvider";
import { MockZendeskProvider } from "../application/MockZendeskProvider";
import { ZendeskRealProvider } from "../application/ZendeskRealProvider";
import { loadZendeskConfig, isZendeskConfigurado } from "../domain/ZendeskConfig";
import type { BandejaZendeskDTO, TicketZendeskDTO, ConversacionZendeskDTO, ClienteZendeskDTO } from "../application/dto/ZendeskDTOs";

export class ZendeskRepository {
  private provider: ZendeskProvider;

  constructor() {
    const config = loadZendeskConfig();
    if (isZendeskConfigurado(config)) {
      this.provider = new ZendeskRealProvider();
    } else {
      this.provider = new MockZendeskProvider();
    }
  }

  async obtenerUnassigned(page?: number): Promise<BandejaZendeskDTO> {
    return this.provider.getUnassignedTickets(page);
  }

  async obtenerMyTickets(page?: number): Promise<BandejaZendeskDTO> {
    return this.provider.getMyTickets(page);
  }

  async obtenerRecentlyUpdated(page?: number): Promise<BandejaZendeskDTO> {
    return this.provider.getRecentlyUpdated(page);
  }

  async obtenerAtencion(id: number): Promise<TicketZendeskDTO | null> {
    return this.provider.getTicket(id);
  }

  async obtenerConversacion(ticketId: number): Promise<ConversacionZendeskDTO> {
    return this.provider.getConversation(ticketId);
  }

  async obtenerCliente(usuarioId: number): Promise<ClienteZendeskDTO | null> {
    return this.provider.getUser(usuarioId);
  }
}

