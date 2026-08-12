import { DashboardWidget } from "@/components/widgets";
import { MentionsList } from "./MentionsList";
import type { MentionUI } from "../mappers/mention.mapper";
import type { CollaborationState } from "../hooks/useCollaboration";

interface Props {
  mentions: MentionUI[];
  state: CollaborationState;
  error: string | null;
  onRetry: () => void;
}

export function MentionsArea({ mentions, state, error, onRetry }: Props) {
  return (
    <DashboardWidget title="Menciones" subtitle="@menciones y notificaciones" state={state === "error" ? "error" : "success"}>
      <MentionsList items={mentions} state={state === "loading" ? "loading" : mentions.length === 0 ? "empty" : "success"} error={error} onRetry={onRetry} />
    </DashboardWidget>
  );
}
