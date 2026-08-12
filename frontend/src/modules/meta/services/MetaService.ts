import type { MetaProvider } from "../providers/MetaProvider";
import type { MetaTicketResponseDTO, MetaConversationResponseDTO } from "../dto/meta.dto";

export class MetaService {
  constructor(private provider: MetaProvider) {}

  async getTickets(): Promise<MetaTicketResponseDTO> {
    return this.provider.getTickets();
  }

  async getConversation(ticketId: number): Promise<MetaConversationResponseDTO> {
    return this.provider.getConversation(ticketId);
  }

  async sendMessage(ticketId: number, body: string): Promise<any> {
    return this.provider.sendMessage(ticketId, body);
  }

  async closeTicket(ticketId: number): Promise<any> {
    return this.provider.closeTicket(ticketId);
  }
}
