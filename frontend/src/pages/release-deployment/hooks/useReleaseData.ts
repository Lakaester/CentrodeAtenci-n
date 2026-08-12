import { useQuery } from "@tanstack/react-query";
import { ReleaseService } from "../services/ReleaseService";
import { releaseProvider } from "../providers";
import type { ReleaseData } from "../services/ReleaseService";

const REFETCH_INTERVAL = 30_000;
const service = new ReleaseService(releaseProvider);

interface DataResult {
  data: ReleaseData | undefined; isLoading: boolean; isError: boolean;
  error: string | null; dataUpdatedAt: number; refetch: () => void;
}

export function useReleaseData(): DataResult {
  const { data, isLoading, isError, error, dataUpdatedAt, refetch } = useQuery({
    queryKey: ["release-deployment"],
    queryFn: () => service.fetchAll(),
    refetchInterval: REFETCH_INTERVAL,
    staleTime: REFETCH_INTERVAL,
  });
  return {
    data, isLoading, isError,
    error: error instanceof Error ? error.message : isError ? "Error al cargar releases" : null,
    dataUpdatedAt, refetch,
  };
}
