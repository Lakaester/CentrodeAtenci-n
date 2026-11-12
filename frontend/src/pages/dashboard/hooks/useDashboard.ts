import { useDashboardData } from "./useDashboardData";
import type { GerencialResponse } from "../dto/dashboard.dto";

export type DashboardState = "loading" | "empty" | "error" | "success";

interface DashboardData {
  state: DashboardState;
  data: GerencialResponse | null;
  isFetching: boolean;
  error: string | null;
  retry: () => void;
}

export function useDashboard(enabled = true): DashboardData {
  const query = useDashboardData(enabled);

  return {
    state: query.state,
    data: query.data,
    isFetching: query.isFetching,
    error: query.error,
    retry: query.refetch,
  };
}
