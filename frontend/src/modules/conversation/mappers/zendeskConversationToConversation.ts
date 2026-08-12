import type { ConversationResponseDTO } from "../dto/conversation.dto";

export function zendeskConversationToConversation(): ConversationResponseDTO {
  return { messages: [], hasMore: false };
}
