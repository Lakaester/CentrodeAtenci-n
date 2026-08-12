/** @deprecated Este módulo ha sido reemplazado por modules/zendesk-test/. Se eliminará en M2. */
import type { ZendeskProvider } from "./ZendeskProvider";
import type { TicketZendeskDTO, ClienteZendeskDTO, BandejaZendeskDTO, ConversacionZendeskDTO } from "./dto/ZendeskDTOs";

export class MockZendeskProvider implements ZendeskProvider {
  async getUnassignedTickets(page?: number): Promise<BandejaZendeskDTO> {
    return { tickets: [], total: 0, pagina: page ?? 1 };
  }

  async getMyTickets(page?: number): Promise<BandejaZendeskDTO> {
    return { tickets: [], total: 0, pagina: page ?? 1 };
  }

  async getRecentlyUpdated(page?: number): Promise<BandejaZendeskDTO> {
    return { tickets: [], total: 0, pagina: page ?? 1 };
  }

  async getTicket(id: number): Promise<TicketZendeskDTO | null> {
    return null;
  }

  async getConversation(ticketId: number): Promise<ConversacionZendeskDTO> {
    return { ticketId: String(ticketId), mensajes: [], total: 0 };
  }

  async getUser(userId: number): Promise<ClienteZendeskDTO | null> {
    return null;
  }

  async getTicketFields(): Promise<{ id: number; title: string; type: string }[]> {
    return [];
  }
}

