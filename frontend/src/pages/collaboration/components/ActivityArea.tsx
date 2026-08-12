import { DashboardWidget } from "@/components/widgets";
import { ActivityList } from "./ActivityList";
import type { ActivityUI } from "../mappers/activity.mapper";
import type { CollaborationState } from "../hooks/useCollaboration";

interface Props {
  activity: ActivityUI[];
  state: CollaborationState;
  error: string | null;
  onRetry: () => void;
}

export function ActivityArea({ activity, state, error, onRetry }: Props) {
  return (
    <DashboardWidget title="Actividad reciente" subtitle="Movimientos y cambios en el equipo" state={state === "error" ? "error" : "success"}>
      <ActivityList items={activity} state={state === "loading" ? "loading" : activity.length === 0 ? "empty" : "success"} error={error} onRetry={onRetry} />
    </DashboardWidget>
  );
}
