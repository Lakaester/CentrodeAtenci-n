import { useMemo } from "react";
import { mapConversations, type ConversationUI } from "../mappers/conversationMapper";
import { MOCK_CONVERSATION_DTOS } from "../mocks/conversation.mock";
import type { ConversationDTO } from "../dto/conversation.dto";

export function useConversationMonitor(dtos?: ConversationDTO[]): ConversationUI[] {
  const data = dtos ?? MOCK_CONVERSATION_DTOS;
  return useMemo(() => mapConversations(data), [data]);
}
