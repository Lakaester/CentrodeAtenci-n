/** @deprecated Este módulo ha sido reemplazado por modules/zendesk-test/. Se eliminará en M2. */
import type {
  TicketZendeskDTO, MensajeZendeskDTO, ClienteZendeskDTO,
  BandejaZendeskDTO, ConversacionZendeskDTO,
} from "./dto/ZendeskDTOs";

export interface ZendeskProvider {
  getUnassignedTickets(page?: number): Promise<BandejaZendeskDTO>;
  getMyTickets(page?: number): Promise<BandejaZendeskDTO>;
  getRecentlyUpdated(page?: number): Promise<BandejaZendeskDTO>;
  getTicket(id: number): Promise<TicketZendeskDTO | null>;
  getConversation(ticketId: number): Promise<ConversacionZendeskDTO>;
  getUser(userId: number): Promise<ClienteZendeskDTO | null>;
  getTicketFields(): Promise<{ id: number; title: string; type: string }[]>;
}

