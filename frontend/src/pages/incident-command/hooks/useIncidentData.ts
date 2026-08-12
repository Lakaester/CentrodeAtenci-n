import { useQuery } from "@tanstack/react-query";
import { IncidentService } from "../services/IncidentService";
import { incidentProvider } from "../providers";
import type { IncidentData } from "../services/IncidentService";

const REFETCH_INTERVAL = 30_000;
const service = new IncidentService(incidentProvider);

interface DataResult {
  data: IncidentData | undefined;
  isLoading: boolean;
  isError: boolean;
  error: string | null;
  dataUpdatedAt: number;
  refetch: () => void;
}

export function useIncidentData(): DataResult {
  const { data, isLoading, isError, error, dataUpdatedAt, refetch } = useQuery({
    queryKey: ["incident-command"],
    queryFn: () => service.fetchAll(),
    refetchInterval: REFETCH_INTERVAL,
    staleTime: REFETCH_INTERVAL,
  });

  return {
    data,
    isLoading,
    isError,
    error: error instanceof Error ? error.message : isError ? "Error al cargar incidentes" : null,
    dataUpdatedAt,
    refetch,
  };
}
