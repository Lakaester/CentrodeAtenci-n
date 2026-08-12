import type { KpiData } from "@/components/kpi/types";
import type { OperationalKpiDTO } from "../dto/operational-kpi.dto";

interface MappedKpi {
  data: Omit<KpiData, "icon">;
  iconKey: string;
}

export function mapOperationalKpis(dtos: OperationalKpiDTO[]): MappedKpi[] {
  return dtos.map((dto) => ({
    data: {
      id: dto.id,
      title: dto.label,
      value: dto.value,
      unit: dto.unit,
      subtitle: dto.subtitle,
      trend: dto.trendValue != null && dto.trendDirection
        ? { value: Math.abs(dto.trendValue), direction: dto.trendDirection, inverted: dto.trendInverted }
        : undefined,
      status: dto.statusVariant
        ? { variant: dto.statusVariant, label: "" }
        : undefined,
    },
    iconKey: dto.iconKey,
  }));
}
