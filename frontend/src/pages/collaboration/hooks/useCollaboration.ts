import { useCollaborationData } from "./useCollaborationData";
import { useActivityFeed } from "./useActivityFeed";
import { useInternalNotes } from "./useInternalNotes";
import { useMentions } from "./useMentions";
import { useFollowers } from "./useFollowers";
import { useTimeline } from "./useTimeline";
import type { ActivityUI } from "../mappers/activity.mapper";
import type { NoteUI } from "../mappers/note.mapper";
import type { MentionUI } from "../mappers/mention.mapper";
import type { FollowerUI } from "../mappers/follower.mapper";
import type { TimelineUI } from "../mappers/timeline.mapper";

export type CollaborationState = "loading" | "error" | "success";

interface CollaborationData {
  state: CollaborationState;
  lastUpdate: string | null;
  error: string | null;
  refresh: () => void;
  activity: ActivityUI[];
  notes: NoteUI[];
  mentions: MentionUI[];
  followers: FollowerUI[];
  timeline: TimelineUI[];
}

export function useCollaboration(): CollaborationData {
  const { data, isLoading, isError, error, dataUpdatedAt, refetch } = useCollaborationData();

  const activity = useActivityFeed(data?.activity);
  const notes = useInternalNotes(data?.notes);
  const mentions = useMentions(data?.mentions);
  const followers = useFollowers(data?.followers);
  const timeline = useTimeline(data?.timeline);

  const state: CollaborationState = isLoading ? "loading" : isError ? "error" : "success";
  const lastUpdate = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })
    : null;

  return { state, lastUpdate, error: error ?? null, refresh: refetch, activity, notes, mentions, followers, timeline };
}
