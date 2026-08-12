import { DashboardWidget } from "@/components/widgets";
import { PerformanceKpiGrid } from "./PerformanceKpiGrid";
import { PerformanceChart } from "./PerformanceChart";
import type { KpiData } from "@/components/kpi/types";
import type { LineData } from "@/components/charts/types";
import type { SupervisorState } from "../hooks/useSupervisor";

interface Props {
  kpis: KpiData[];
  evolucion: LineData;
  state: SupervisorState;
  error: string | null;
  onRetry: () => void;
}

export function PerformanceArea({ kpis, evolucion, state, error, onRetry }: Props) {
  return (
    <DashboardWidget title="Desempeño" subtitle="KPIs de rendimiento del equipo" state={state === "error" ? "error" : "success"}>
      <div className="space-y-4">
        <PerformanceKpiGrid kpis={kpis} state={state === "loading" ? "loading" : kpis.length === 0 ? "empty" : "success"} error={error} onRetry={onRetry} />
        <PerformanceChart data={evolucion} state={state === "loading" ? "loading" : "success"} error={error} />
      </div>
    </DashboardWidget>
  );
}
