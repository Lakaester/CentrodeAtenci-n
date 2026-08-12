import { useQuery } from "@tanstack/react-query";
import { useFilters } from "@/contexts/FilterContext";
import { fetchCollaboration } from "../services/collaborationService";
import type { CollaborationResponse } from "../services/collaborationService";

const REFETCH_INTERVAL = 30_000;

interface DataResult {
  data: CollaborationResponse | undefined;
  isLoading: boolean;
  isError: boolean;
  error: string | null;
  dataUpdatedAt: number;
  refetch: () => void;
}

export function useCollaborationData(): DataResult {
  const { filters } = useFilters();

  const { data, isLoading, isError, error, dataUpdatedAt, refetch } = useQuery({
    queryKey: ["collaboration", filters],
    queryFn: () => fetchCollaboration(filters),
    refetchInterval: REFETCH_INTERVAL,
    staleTime: REFETCH_INTERVAL,
  });

  return {
    data,
    isLoading,
    isError,
    error: error instanceof Error ? error.message : isError ? "Error al cargar datos de colaboración" : null,
    dataUpdatedAt,
    refetch,
  };
}
