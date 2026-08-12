import { useLiveOperationsData } from "./useLiveOperationsData";
import { useOperationalKpis } from "./useOperationalKpis";
import { useOperationalCharts } from "./useOperationalCharts";
import { useQueue } from "./useQueue";
import { useAgents } from "./useAgents";
import { useOperationalAlerts } from "./useOperationalAlerts";
import type { KpiData } from "@/components/kpi/types";
import type { ChartGroup } from "../mappers/operationalChartMapper";
import type { QueueItemUI } from "../mappers/queueMapper";
import type { AgentUI } from "../mappers/agentMapper";
import type { AlertUI } from "../mappers/alertMapper";

export type LiveState = "loading" | "empty" | "error" | "success";

interface LiveData {
  state: LiveState;
  lastUpdate: string | null;
  error: string | null;
  refresh: () => void;
  kpis: KpiData[];
  charts: ChartGroup;
  queue: QueueItemUI[];
  agents: AgentUI[];
  alerts: AlertUI[];
}

export function useLiveOperations(): LiveData {
  const { operacion, isLoading, isError, error, refetch } = useLiveOperationsData();

  const lastUpdate = operacion?.kpis?.horaPico
    ? new Date().toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })
    : null;

  const kpis = useOperationalKpis();
  const charts = useOperationalCharts();
  const queue = useQueue();
  const agents = useAgents();
  const alerts = useOperationalAlerts();

  const state: LiveState = isLoading ? "loading" : isError ? "error" : "success";

  return {
    state,
    lastUpdate,
    error: error ?? null,
    refresh: refetch,
    kpis,
    charts,
    queue,
    agents,
    alerts,
  };
}
