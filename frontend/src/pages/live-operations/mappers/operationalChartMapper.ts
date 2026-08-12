import type { DonutData, LineData, BarData } from "@/components/charts/types";
import { getChartColor } from "../registry/chartPalette";
import type { OperationalChartsDTO } from "../dto/operational-chart.dto";

export interface ChartGroup {
  volumenCanal: DonutData[];
  ticketsPrioridad: BarData;
  evolucionReciente: LineData;
  estadoAsesores: BarData;
}

export function mapOperationalCharts(dto: OperationalChartsDTO): ChartGroup {
  return {
    volumenCanal: dto.volumenCanal.map((s) => ({
      name: s.name,
      value: s.value,
      color: getChartColor(s.colorKey ?? s.name.toLowerCase()),
    })),
    ticketsPrioridad: {
      categories: dto.ticketsPrioridad.categorias,
      series: dto.ticketsPrioridad.series.map((s) => ({
        name: s.name,
        data: s.values,
        config: { name: s.name, color: getChartColor(s.name.toLowerCase()) },
      })),
    },
    evolucionReciente: {
      categories: dto.evolucionReciente.categorias,
      series: dto.evolucionReciente.series.map((s) => ({
        name: s.name,
        data: s.values,
        config: { name: s.name, smooth: true },
      })),
    },
    estadoAsesores: {
      categories: dto.estadoAsesores.categorias,
      series: dto.estadoAsesores.series.map((s) => ({
        name: s.name,
        data: s.values,
        config: { name: s.name, color: getChartColor(s.name.toLowerCase()) },
      })),
    },
  };
}
