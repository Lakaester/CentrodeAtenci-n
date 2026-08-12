import { DashboardWidget } from "@/components/widgets";
import { TimelineList } from "./TimelineList";
import type { TimelineUI } from "../mappers/timeline.mapper";
import type { CollaborationState } from "../hooks/useCollaboration";

interface Props {
  timeline: TimelineUI[];
  state: CollaborationState;
  error: string | null;
  onRetry: () => void;
}

export function TimelineArea({ timeline, state, error, onRetry }: Props) {
  return (
    <DashboardWidget title="Línea de tiempo" subtitle="Historial de acciones del equipo" state={state === "error" ? "error" : "success"}>
      <TimelineList items={timeline} state={state === "loading" ? "loading" : timeline.length === 0 ? "empty" : "success"} error={error} onRetry={onRetry} />
    </DashboardWidget>
  );
}
