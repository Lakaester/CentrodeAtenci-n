import { useQuery } from "@tanstack/react-query";
import { useFilters } from "@/contexts/FilterContext";
import { fetchSupervisor } from "../services/supervisorService";
import type { SupervisorResponse } from "../services/supervisorService";

const REFETCH_INTERVAL = 30_000;

interface DataResult {
  data: SupervisorResponse | undefined;
  isLoading: boolean;
  isError: boolean;
  error: string | null;
  dataUpdatedAt: number;
  refetch: () => void;
}

export function useSupervisorData(): DataResult {
  const { filters } = useFilters();

  const { data, isLoading, isError, error, dataUpdatedAt, refetch } = useQuery({
    queryKey: ["supervisor", filters],
    queryFn: () => fetchSupervisor(filters),
    refetchInterval: REFETCH_INTERVAL,
    staleTime: REFETCH_INTERVAL,
  });

  return {
    data,
    isLoading,
    isError,
    error: error instanceof Error ? error.message : isError ? "Error al cargar datos del supervisor" : null,
    dataUpdatedAt,
    refetch,
  };
}
