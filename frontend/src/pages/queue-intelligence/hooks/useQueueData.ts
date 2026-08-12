import { useQuery } from "@tanstack/react-query";
import { QueueService } from "../services/QueueService";
import { queueProvider } from "../providers";
import type { QueueData } from "../services/QueueService";

const REFETCH_INTERVAL = 30_000;
const service = new QueueService(queueProvider);

interface DataResult {
  data: QueueData | undefined; isLoading: boolean; isError: boolean;
  error: string | null; dataUpdatedAt: number; refetch: () => void;
}

export function useQueueData(): DataResult {
  const { data, isLoading, isError, error, dataUpdatedAt, refetch } = useQuery({
    queryKey: ["queue-intelligence"],
    queryFn: () => service.fetchAll(),
    refetchInterval: REFETCH_INTERVAL,
    staleTime: REFETCH_INTERVAL,
  });
  return {
    data, isLoading, isError,
    error: error instanceof Error ? error.message : isError ? "Error al cargar colas" : null,
    dataUpdatedAt, refetch,
  };
}
