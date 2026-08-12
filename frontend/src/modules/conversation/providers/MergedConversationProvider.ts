import type { ConversationProvider } from "./ConversationProvider";
import type { InboxTicketDTO } from "../../inbox/dto/inbox.dto";
import { MetaService } from "../../meta/services/MetaService";
import { metaProvider as metaProviderInstance } from "../../meta/providers";
import { metaConversationToConversation, zendeskConversationToConversation } from "../mappers";
import type { ConversationResponseDTO } from "../dto/conversation.dto";

const metaService = new MetaService(metaProviderInstance);

export const mergedConversationProvider: ConversationProvider = {
  getConversation: async (ticket: InboxTicketDTO): Promise<ConversationResponseDTO> => {
    if (ticket.subChannel === "meta") {
      const raw = ticket.raw as any;
      const ticketId = raw?.id ?? Number(ticket.ticketNumber);
      const response = await metaService.getConversation(ticketId);
      return metaConversationToConversation(response);
    }

    if (ticket.subChannel === "zendesk") {
      return zendeskConversationToConversation();
    }

    return { messages: [], hasMore: false };
  },
};
