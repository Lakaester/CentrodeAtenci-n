import { useQuery } from "@tanstack/react-query";
import { MetaService } from "../services/MetaService";
import { metaProvider } from "../providers";
import type { MetaMessageDTO } from "../dto/meta.dto";

const service = new MetaService(metaProvider);

interface ConversationResult {
  messages: MetaMessageDTO[];
  isLoading: boolean;
  isError: boolean;
  error: string | null;
}

export function useMetaConversation(ticketId: number | null): ConversationResult {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["meta-conversation", ticketId],
    queryFn: () => service.getConversation(ticketId!),
    enabled: !!ticketId,
    staleTime: 10_000,
    retry: 1,
  });

  return {
    messages: data?.messages ?? [],
    isLoading: isLoading && !!ticketId,
    isError,
    error: error instanceof Error ? error.message : isError ? "Error al cargar conversación" : null,
  };
}
