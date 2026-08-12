import { useQuery } from "@tanstack/react-query";
import { GlobalAlertService } from "../services/GlobalAlertService";
import { alertProvider } from "../providers";
import type { AlertData } from "../services/GlobalAlertService";

const REFETCH_INTERVAL = 30_000;
const service = new GlobalAlertService(alertProvider);

interface DataResult { data: AlertData | undefined; isLoading: boolean; isError: boolean; error: string | null; dataUpdatedAt: number; refetch: () => void; }

export function useGlobalAlertData(): DataResult {
  const { data, isLoading, isError, error, dataUpdatedAt, refetch } = useQuery({
    queryKey: ["global-alert"], queryFn: () => service.fetchAll(),
    refetchInterval: REFETCH_INTERVAL, staleTime: REFETCH_INTERVAL,
  });
  return { data, isLoading, isError, error: error instanceof Error ? error.message : isError ? "Error al cargar alertas" : null, dataUpdatedAt, refetch };
}
