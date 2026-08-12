import type { KpiData } from "@/components/kpi/types";
import type { LineData } from "@/components/charts/types";
import type { PerformanceDTO } from "../dto/performance.dto";

export interface MappedKpi {
  kpi: Omit<KpiData, "icon">;
  iconKey: string;
}

export interface PerformanceUI {
  mappedKpis: MappedKpi[];
  evolucion: LineData;
}

export function mapPerformance(dto: PerformanceDTO): PerformanceUI {
  const ICON_KEYS: Record<string, string> = {
    conversaciones: "conversacionesActivas",
    sla: "slaEnRiesgo",
    "tiempo-respuesta": "tiempoPromedioEspera",
    "tiempo-resolucion": "tiempoPromedioEspera",
    productividad: "ticketsActivos",
    ocupacion: "asesoresDisponibles",
  };

  return {
    mappedKpis: dto.kpis.map((k) => ({
      kpi: {
        id: k.id,
        title: k.label,
        value: k.value,
        unit: k.unit,
        trend: k.trendValue != null && k.trendDirection
          ? { value: Math.abs(k.trendValue), direction: k.trendDirection, inverted: k.trendInverted }
          : undefined,
      },
      iconKey: ICON_KEYS[k.id] ?? "ticketsActivos",
    })),
    evolucion: {
      categories: dto.evolucion.categorias,
      series: [{ name: "SLA %", data: dto.evolucion.valores, config: { name: "SLA %", smooth: true } }],
    },
  };
}
