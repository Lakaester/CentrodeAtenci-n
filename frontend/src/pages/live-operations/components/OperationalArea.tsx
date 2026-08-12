import { DashboardSection } from "@/pages/dashboard/components/DashboardSection";
import { KpiGrid } from "@/components/kpi/KpiGrid";
import type { KpiData } from "@/components/kpi/types";
import type { LiveState } from "../hooks/useLiveOperations";

interface Props {
  kpis: KpiData[];
  state: LiveState;
  error: string | null;
  onRetry: () => void;
}

export function OperationalArea({ kpis, state, error, onRetry }: Props) {
  return (
    <DashboardSection title="Resumen operativo">
      <KpiGrid
        items={kpis}
        cols={4}
        isLoading={state === "loading"}
        isEmpty={kpis.length === 0}
        error={state === "error" ? error : null}
        onRetry={onRetry}
      />
    </DashboardSection>
  );
}
