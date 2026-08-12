import { useQuery } from "@tanstack/react-query";
import { ConversationService } from "../services/ConversationService";
import { conversationProvider } from "../providers";
import type { InboxTicketDTO } from "../../inbox/dto/inbox.dto";
import type { ConversationMessageDTO } from "../dto/conversation.dto";

const service = new ConversationService(conversationProvider);

interface ConversationResult {
  messages: ConversationMessageDTO[];
  isLoading: boolean;
  isError: boolean;
  error: string | null;
}

export function useConversation(ticket: InboxTicketDTO | null): ConversationResult {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["conversation", ticket?.id, ticket?.subChannel],
    queryFn: () => service.getConversation(ticket!),
    enabled: !!ticket,
    staleTime: 10_000,
    retry: 1,
  });

  return {
    messages: data?.messages ?? [],
    isLoading: isLoading && !!ticket,
    isError,
    error: error instanceof Error ? error.message : isError ? "Error al cargar conversación" : null,
  };
}
