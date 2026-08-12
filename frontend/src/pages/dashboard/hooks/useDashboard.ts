import { useDashboardData } from "./useDashboardData";
import type { KpiData } from "@/components/kpi/types";

export type DashboardState = "loading" | "empty" | "error" | "success";

interface DashboardData {
  state: DashboardState;
  kpiItems: KpiData[];
  error: string | null;
  retry: () => void;
}

export function useDashboard(): DashboardData {
  const query = useDashboardData();

  return {
    state: query.state,
    kpiItems: query.kpiItems,
    error: query.error,
    retry: query.refetch,
  };
}
