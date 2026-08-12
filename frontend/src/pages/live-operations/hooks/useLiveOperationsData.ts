import { useQuery } from "@tanstack/react-query";
import { useFilters } from "@/contexts/FilterContext";
import { fetchOperacion } from "../services/liveOperationsService";
import type { OperacionResponse } from "../services/liveOperationsService";

const REFETCH_INTERVAL = 30_000;

interface LiveDataResult {
  operacion: OperacionResponse | undefined;
  isLoading: boolean;
  isError: boolean;
  error: string | null;
  refetch: () => void;
}

export function useLiveOperationsData(): LiveDataResult {
  const { filters } = useFilters();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["live-operations", filters],
    queryFn: () => fetchOperacion(filters),
    refetchInterval: REFETCH_INTERVAL,
    staleTime: REFETCH_INTERVAL,
  });

  return {
    operacion: data,
    isLoading,
    isError,
    error: error instanceof Error ? error.message : isError ? "Error al cargar datos" : null,
    refetch,
  };
}
