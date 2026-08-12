import { DashboardWidget } from "@/components/widgets";
import { AgentOverviewList } from "./AgentOverviewList";
import type { AgentOverviewUI } from "../mappers/agentOverviewMapper";
import type { SupervisorState } from "../hooks/useSupervisor";

interface Props {
  agents: AgentOverviewUI[];
  state: SupervisorState;
  error: string | null;
  onRetry: () => void;
}

export function AgentOverviewArea({ agents, state, error, onRetry }: Props) {
  return (
    <DashboardWidget title="Resumen de asesores" subtitle="Estado, carga y disponibilidad" state={state === "error" ? "error" : "success"}>
      <AgentOverviewList
        items={agents}
        state={state === "loading" ? "loading" : agents.length === 0 ? "empty" : "success"}
        error={error}
        onRetry={onRetry}
      />
    </DashboardWidget>
  );
}
