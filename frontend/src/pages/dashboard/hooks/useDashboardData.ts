import { useQuery } from "@tanstack/react-query";
import { useFilters } from "@/contexts/FilterContext";
import { fetchResumen } from "../services/dashboardService";
import { mapResumenToKpis } from "../mappers/kpiMapper";
import type { KpiData } from "@/components/kpi/types";

interface DashboardQueryResult {
  kpiItems: KpiData[];
  state: "loading" | "error" | "success" | "empty";
  error: string | null;
  refetch: () => void;
}

export function useDashboardData(): DashboardQueryResult {
  const { filters } = useFilters();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["dashboard-executive", filters],
    queryFn: () => fetchResumen(filters),
    staleTime: 30_000,
  });

  if (isLoading) {
    return { kpiItems: [], state: "loading", error: null, refetch };
  }

  if (isError) {
    return {
      kpiItems: [],
      state: "error",
      error: error instanceof Error ? error.message : "Error al cargar datos del dashboard",
      refetch,
    };
  }

  if (!data) {
    return { kpiItems: [], state: "empty", error: null, refetch };
  }

  const kpiItems = mapResumenToKpis(data);

  if (kpiItems.length === 0) {
    return { kpiItems: [], state: "empty", error: null, refetch };
  }

  return { kpiItems, state: "success", error: null, refetch };
}
