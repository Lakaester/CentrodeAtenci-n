import { useTicketDetail } from "@/hooks/useTicketDetail";
import { ConversationHeader } from "./ConversationHeader";
import { ConversationPanel } from "./ConversationPanel";
import { ConversationSkeleton } from "./ConversationSkeleton";
import { WorkspaceEmptyState } from "./WorkspaceEmptyState";
import { WorkspaceErrorState } from "./WorkspaceErrorState";
import type { TicketDetail } from "@/hooks/useTicketDetail";

interface Props {
  ticketId: string | null;
  onRetry: () => void;
}

export function TicketWorkspace({ ticketId, onRetry }: Props) {
  const { ticket, comentarios, loading, error } = useTicketDetail(ticketId);

  if (!ticketId) {
    return <WorkspaceEmptyState />;
  }

  if (loading) {
    return <ConversationSkeleton />;
  }

  if (error) {
    return <WorkspaceErrorState message={error} onRetry={onRetry} />;
  }

  if (!ticket) {
    return (
      <WorkspaceErrorState
        message="No se encontró el ticket"
        onRetry={onRetry}
      />
    );
  }

  return (
    <div className="flex h-full flex-col">
      <ConversationHeader ticket={ticket as TicketDetail} />
      <ConversationPanel comentarios={comentarios} loading={loading} />
    </div>
  );
}
