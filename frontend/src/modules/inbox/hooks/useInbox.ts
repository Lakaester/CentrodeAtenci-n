import { useQuery } from "@tanstack/react-query";
import { InboxService } from "../services/InboxService";
import { inboxProvider } from "../providers";
import type { InboxTicketDTO } from "../dto/inbox.dto";

const service = new InboxService(inboxProvider);

interface InboxResult {
  tickets: InboxTicketDTO[];
  count: number;
  isLoading: boolean;
  isError: boolean;
  error: string | null;
  refetch: () => void;
}

export function useInbox(): InboxResult {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["inbox"],
    queryFn: () => service.getInbox(),
    staleTime: 30_000,
    retry: 1,
  });

  return {
    tickets: data ?? [],
    count: data?.length ?? 0,
    isLoading,
    isError,
    error: error instanceof Error ? error.message : isError ? "Error al cargar bandeja" : null,
    refetch,
  };
}
