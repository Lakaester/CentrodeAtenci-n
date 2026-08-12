import type { ConversationProvider } from "../providers/ConversationProvider";
import type { InboxTicketDTO } from "../../inbox/dto/inbox.dto";
import type { ConversationResponseDTO } from "../dto/conversation.dto";

export class ConversationService {
  constructor(private provider: ConversationProvider) {}

  async getConversation(ticket: InboxTicketDTO): Promise<ConversationResponseDTO> {
    return this.provider.getConversation(ticket);
  }
}
