import { useMemo } from "react";
import { mapPerformance, type PerformanceUI } from "../mappers/performanceMapper";
import { getOperationalKpiIcon } from "@/pages/live-operations/registry/operationalKpiIcons";
import { MOCK_PERFORMANCE_DTO } from "../mocks/performance.mock";
import type { KpiData } from "@/components/kpi/types";
import type { PerformanceDTO } from "../dto/performance.dto";

export interface PerformanceResult {
  kpis: KpiData[];
  evolucion: PerformanceUI["evolucion"];
}

export function usePerformanceDashboard(dto?: PerformanceDTO): PerformanceResult {
  const data = dto ?? MOCK_PERFORMANCE_DTO;

  return useMemo(() => {
    const ui = mapPerformance(data);
    return {
      kpis: ui.mappedKpis.map((m) => ({
        ...m.kpi,
        icon: getOperationalKpiIcon(m.iconKey)({ size: 18 }),
      })),
      evolucion: ui.evolucion,
    };
  }, [data]);
}
