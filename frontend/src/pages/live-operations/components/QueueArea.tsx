import { DashboardWidget } from "@/components/widgets";
import { QueueList } from "./QueueList";
import { AgentList } from "./AgentList";
import type { QueueItemUI } from "../mappers/queueMapper";
import type { AgentUI } from "../mappers/agentMapper";
import type { LiveState } from "../hooks/useLiveOperations";

interface Props {
  queue: QueueItemUI[];
  agents: AgentUI[];
  state: LiveState;
  error: string | null;
  onRetry: () => void;
}

export function QueueArea({ queue, agents, state, error, onRetry }: Props) {
  return (
    <div className="space-y-3">
      <DashboardWidget title="Cola de atención" subtitle="Tickets pendientes" state={state === "error" ? "error" : "success"}>
        <QueueList items={queue} state={state === "loading" ? "loading" : queue.length === 0 ? "empty" : "success"} error={error} onRetry={onRetry} />
      </DashboardWidget>
      <DashboardWidget title="Asesores" subtitle="Estado y disponibilidad" state={state === "error" ? "error" : "success"}>
        <AgentList items={agents} state={state === "loading" ? "loading" : agents.length === 0 ? "empty" : "success"} error={error} onRetry={onRetry} />
      </DashboardWidget>
    </div>
  );
}
