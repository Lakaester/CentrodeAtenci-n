import { DashboardWidget } from "@/components/widgets";
import { ConversationList } from "./ConversationList";
import type { ConversationUI } from "../mappers/conversationMapper";
import type { SupervisorState } from "../hooks/useSupervisor";

interface Props {
  conversations: ConversationUI[];
  state: SupervisorState;
  error: string | null;
  onRetry: () => void;
}

export function ConversationArea({ conversations, state, error, onRetry }: Props) {
  return (
    <DashboardWidget title="Conversaciones" subtitle="Supervisión de conversaciones activas" state={state === "error" ? "error" : "success"}>
      <ConversationList
        items={conversations}
        state={state === "loading" ? "loading" : conversations.length === 0 ? "empty" : "success"}
        error={error}
        onRetry={onRetry}
      />
    </DashboardWidget>
  );
}
