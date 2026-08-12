import { useMemo } from "react";
import { mapOperationalCharts, type ChartGroup } from "../mappers/operationalChartMapper";
import { MOCK_CHART_DTO } from "../mocks/charts.mock";
import type { OperationalChartsDTO } from "../dto/operational-chart.dto";

export function useOperationalCharts(dto?: OperationalChartsDTO): ChartGroup {
  const data = dto ?? MOCK_CHART_DTO;
  return useMemo(() => mapOperationalCharts(data), [data]);
}
