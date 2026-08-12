import { useMemo } from "react";
import { mapOperationalKpis } from "../mappers/operationalKpiMapper";
import { getOperationalKpiIcon } from "../registry/operationalKpiIcons";
import { MOCK_KPI_DTOS } from "../mocks/kpis.mock";
import type { KpiData } from "@/components/kpi/types";
import type { OperationalKpiDTO } from "../dto/operational-kpi.dto";

export function useOperationalKpis(dtos?: OperationalKpiDTO[]): KpiData[] {
  const data = dtos ?? MOCK_KPI_DTOS;

  const mapped = useMemo(() => mapOperationalKpis(data), [data]);

  return useMemo<KpiData[]>(
    () =>
      mapped.map((item) => ({
        ...item.data,
        icon: getOperationalKpiIcon(item.iconKey)({ size: 18 }),
      })),
    [mapped],
  );
}
