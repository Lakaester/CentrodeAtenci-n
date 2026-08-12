import { api } from "@/lib/api";
import { filtersToParams } from "@/lib/filters";
import type { DashboardFilters } from "@/lib/filters";
import type { ActivityDTO } from "../dto/activity.dto";
import type { InternalNoteDTO } from "../dto/internalNote.dto";
import type { MentionDTO } from "../dto/mention.dto";
import type { FollowerDTO } from "../dto/follower.dto";
import type { TimelineDTO } from "../dto/timeline.dto";

export interface CollaborationResponse {
  activity: ActivityDTO[];
  notes: InternalNoteDTO[];
  mentions: MentionDTO[];
  followers: FollowerDTO[];
  timeline: TimelineDTO[];
}

function isCollaborationResponse(raw: unknown): raw is CollaborationResponse {
  if (typeof raw !== "object" || raw === null) return false;
  const r = raw as Record<string, unknown>;
  return Array.isArray(r.activity) && Array.isArray(r.notes) && Array.isArray(r.mentions) && Array.isArray(r.followers) && Array.isArray(r.timeline);
}

export async function fetchCollaboration(filters: DashboardFilters): Promise<CollaborationResponse> {
  const params = filtersToParams(filters);
  const { data } = await api.get("/dashboard/collaboration", { params });
  const payload = data?.data;
  if (!isCollaborationResponse(payload)) {
    throw new Error("Respuesta inválida del servidor");
  }
  return payload;
}
