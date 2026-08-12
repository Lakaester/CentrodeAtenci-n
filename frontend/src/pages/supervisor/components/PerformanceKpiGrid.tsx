import { KpiGrid } from "@/components/kpi/KpiGrid";
import type { KpiData } from "@/components/kpi/types";

interface Props {
  kpis: KpiData[];
  state: "loading" | "empty" | "error" | "success";
  error: string | null;
  onRetry: () => void;
}

export function PerformanceKpiGrid({ kpis, state, error, onRetry }: Props) {
  return (
    <KpiGrid
      items={kpis}
      cols={4}
      isLoading={state === "loading"}
      isEmpty={kpis.length === 0}
      error={state === "error" ? error : null}
      onRetry={onRetry}
    />
  );
}
