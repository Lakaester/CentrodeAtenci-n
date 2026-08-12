import { DashboardWidget } from "@/components/widgets";
import { SupervisorActionsList } from "./SupervisorActionsList";
import type { ResolvedAction } from "../hooks/useSupervisorActions";
import type { SupervisorState } from "../hooks/useSupervisor";

interface Props {
  actions: ResolvedAction[];
  state: SupervisorState;
  error: string | null;
  onRetry: () => void;
}

export function ActionsArea({ actions, state, error, onRetry }: Props) {
  return (
    <DashboardWidget title="Acciones operativas" subtitle="Asignaciones, escalamientos y ajustes" state={state === "error" ? "error" : "success"}>
      <SupervisorActionsList
        items={actions}
        state={state === "loading" ? "loading" : actions.length === 0 ? "empty" : "success"}
        error={error}
        onRetry={onRetry}
      />
    </DashboardWidget>
  );
}
