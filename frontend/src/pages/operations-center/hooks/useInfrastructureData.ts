import { useQuery } from "@tanstack/react-query";
import { InfrastructureService } from "../services/InfrastructureService";
import { infrastructureProvider } from "../providers";
import type { InfrastructureData } from "../services/InfrastructureService";

const REFETCH_INTERVAL = 30_000;
const service = new InfrastructureService(infrastructureProvider);

interface DataResult {
  data: InfrastructureData | undefined;
  isLoading: boolean;
  isError: boolean;
  error: string | null;
  dataUpdatedAt: number;
  refetch: () => void;
}

export function useInfrastructureData(): DataResult {
  const { data, isLoading, isError, error, dataUpdatedAt, refetch } = useQuery({
    queryKey: ["infrastructure-health"],
    queryFn: () => service.fetchAll(),
    refetchInterval: REFETCH_INTERVAL,
    staleTime: REFETCH_INTERVAL,
  });

  return {
    data,
    isLoading,
    isError,
    error: error instanceof Error ? error.message : isError ? "Error al cargar infraestructura" : null,
    dataUpdatedAt,
    refetch,
  };
}
