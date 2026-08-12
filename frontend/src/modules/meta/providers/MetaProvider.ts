import type { MetaTicketResponseDTO, MetaConversationResponseDTO } from "../dto/meta.dto";

export interface MetaProvider {
  getTickets(): Promise<MetaTicketResponseDTO>;
  getConversation(ticketId: number): Promise<MetaConversationResponseDTO>;
  sendMessage(ticketId: number, body: string): Promise<any>;
  closeTicket(ticketId: number): Promise<any>;
}
