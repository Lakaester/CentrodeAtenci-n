import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useFilters } from "@/contexts/FilterContext";
import { fetchGerencial } from "../services/dashboardService";
import type { GerencialResponse } from "../dto/dashboard.dto";

interface DashboardQueryResult {
  data: GerencialResponse | null;
  state: "loading" | "error" | "success" | "empty";
  isFetching: boolean;
  error: string | null;
  refetch: () => void;
}

export function useDashboardData(enabled = true): DashboardQueryResult {
  const { filters } = useFilters();

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: ["dashboard-gerencial", filters],
    queryFn: () => fetchGerencial(filters),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
    enabled,
  });

  if (!enabled || isLoading) {
    return { data: null, state: "loading", isFetching, error: null, refetch };
  }

  if (isError) {
    return {
      data: null,
      state: "error",
      isFetching,
      error: error instanceof Error ? error.message : "Error al cargar datos del dashboard",
      refetch,
    };
  }

  if (!data) {
    return { data: null, state: "empty", isFetching, error: null, refetch };
  }

  if (data.kpis.recibidas === 0) {
    return { data, state: "empty", isFetching, error: null, refetch };
  }

  return { data, state: "success", isFetching, error: null, refetch };
}
