import { useSupervisorData } from "./useSupervisorData";
import { useAgentOverview } from "./useAgentOverview";
import { useConversationMonitor } from "./useConversationMonitor";
import { usePerformanceDashboard } from "./usePerformanceDashboard";
import { useSupervisorActions } from "./useSupervisorActions";
import type { KpiData } from "@/components/kpi/types";
import type { LineData } from "@/components/charts/types";
import type { AgentOverviewUI } from "../mappers/agentOverviewMapper";
import type { ConversationUI } from "../mappers/conversationMapper";
import type { ResolvedAction } from "./useSupervisorActions";

export type SupervisorState = "loading" | "empty" | "error" | "success";

interface SupervisorData {
  state: SupervisorState;
  lastUpdate: string | null;
  error: string | null;
  refresh: () => void;
  agents: AgentOverviewUI[];
  conversations: ConversationUI[];
  performanceKpis: KpiData[];
  performanceEvolucion: LineData;
  actions: ResolvedAction[];
}

export function useSupervisor(): SupervisorData {
  const { data, isLoading, isError, error, dataUpdatedAt, refetch } = useSupervisorData();

  const agents = useAgentOverview(data?.agentes);
  const conversations = useConversationMonitor(data?.conversaciones);
  const performance = usePerformanceDashboard(data?.performance);
  const actions = useSupervisorActions(data?.acciones);

  const state: SupervisorState = isLoading ? "loading" : isError ? "error" : "success";

  const lastUpdate = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })
    : null;

  return {
    state,
    lastUpdate,
    error: error ?? null,
    refresh: refetch,
    agents,
    conversations,
    performanceKpis: performance.kpis,
    performanceEvolucion: performance.evolucion,
    actions,
  };
}
