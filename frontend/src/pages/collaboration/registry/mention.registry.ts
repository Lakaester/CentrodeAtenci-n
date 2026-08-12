import type { MentionStatus, MentionPriority } from "../dto/mention.dto";

export const MENTION_STATUS_CONFIG: Record<MentionStatus, { label: string; color: string }> = {
  pending:  { label: "Pendiente", color: "text-warning bg-warning-5" },
  read:     { label: "Leído",     color: "text-black-45 bg-black-5" },
  resolved: { label: "Resuelto",  color: "text-success bg-success-5" },
};

export const MENTION_PRIORITY_ORDER: Record<MentionPriority, number> = {
  alta: 0, media: 1, baja: 2,
};

export function getMentionStatusConfig(s: MentionStatus) {
  return MENTION_STATUS_CONFIG[s] ?? MENTION_STATUS_CONFIG.pending;
}
