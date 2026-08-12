import { DashboardWidget } from "@/components/widgets";
import { FollowersList } from "./FollowersList";
import type { FollowerUI } from "../mappers/follower.mapper";
import type { CollaborationState } from "../hooks/useCollaboration";

interface Props {
  followers: FollowerUI[];
  state: CollaborationState;
  error: string | null;
  onRetry: () => void;
}

export function FollowersArea({ followers, state, error, onRetry }: Props) {
  return (
    <DashboardWidget title="Seguidores" subtitle="Tickets y casos en seguimiento" state={state === "error" ? "error" : "success"}>
      <FollowersList items={followers} state={state === "loading" ? "loading" : followers.length === 0 ? "empty" : "success"} error={error} onRetry={onRetry} />
    </DashboardWidget>
  );
}
