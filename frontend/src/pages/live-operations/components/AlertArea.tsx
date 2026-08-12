import { DashboardWidget } from "@/components/widgets";
import { AlertList } from "./AlertList";
import type { AlertUI } from "../mappers/alertMapper";
import type { LiveState } from "../hooks/useLiveOperations";

interface Props {
  alerts: AlertUI[];
  state: LiveState;
  error: string | null;
  onRetry: () => void;
}

export function AlertArea({ alerts, state, error, onRetry }: Props) {
  return (
    <DashboardWidget title="Alertas operativas" subtitle="SLA, saturación y eventos críticos" state={state === "error" ? "error" : "success"}>
      <AlertList items={alerts} state={state === "loading" ? "loading" : alerts.length === 0 ? "empty" : "success"} error={error} onRetry={onRetry} />
    </DashboardWidget>
  );
}
