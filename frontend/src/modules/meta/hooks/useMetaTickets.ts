import { useQuery } from "@tanstack/react-query";
import { MetaService } from "../services/MetaService";
import { metaProvider } from "../providers";
import type { MetaTicketDTO } from "../dto/meta.dto";

const service = new MetaService(metaProvider);

interface TicketsResult {
  tickets: MetaTicketDTO[];
  count: number;
  isLoading: boolean;
  isError: boolean;
  error: string | null;
  refetch: () => void;
}

export function useMetaTickets(): TicketsResult {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["meta-tickets"],
    queryFn: () => service.getTickets(),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  return {
    tickets: data?.tickets ?? [],
    count: data?.count ?? 0,
    isLoading,
    isError,
    error: error instanceof Error ? error.message : isError ? "Error al cargar tickets" : null,
    refetch,
  };
}
