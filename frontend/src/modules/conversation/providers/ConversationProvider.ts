import type { InboxTicketDTO } from "../../inbox/dto/inbox.dto";
import type { ConversationResponseDTO } from "../dto/conversation.dto";

export interface ConversationProvider {
  getConversation(ticket: InboxTicketDTO): Promise<ConversationResponseDTO>;
}
