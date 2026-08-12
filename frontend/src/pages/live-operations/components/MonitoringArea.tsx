import { ChartGrid, DonutChart, HorizontalBarChart, AreaChart, BarChart } from "@/components/charts";
import type { ChartGroup } from "../mappers/operationalChartMapper";
import type { LiveState } from "../hooks/useLiveOperations";

interface Props {
  charts: ChartGroup;
  state: LiveState;
  error: string | null;
}

function chartState(state: LiveState, error: string | null) {
  return {
    isLoading: state === "loading",
    isEmpty: false,
    error: state === "error" ? error : null,
  };
}

export function MonitoringArea({ charts, state, error }: Props) {
  const cs = chartState(state, error);

  return (
    <ChartGrid cols={2}>
      <DonutChart title="Volumen por canal" subtitle="Distribución actual" data={charts.volumenCanal} state={cs} />
      <HorizontalBarChart title="Tickets por prioridad" subtitle="Distribución acumulada" data={charts.ticketsPrioridad} state={cs} />
      <AreaChart title="Evolución reciente" subtitle="Últimos 60 minutos" data={charts.evolucionReciente} state={cs} />
      <BarChart title="Estado de asesores" subtitle="Distribución por estado" data={charts.estadoAsesores} state={cs} />
    </ChartGrid>
  );
}
