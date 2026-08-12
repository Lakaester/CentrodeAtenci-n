import { getMentionStatusConfig, MENTION_PRIORITY_ORDER } from "../registry/mention.registry";
import type { MentionDTO } from "../dto/mention.dto";

export interface MentionUI {
  id: string; ticketId: string;
  mentionedUser: string; mentionedRole: string;
  mentionedBy: string; message: string;
  createdAt: string; timeAgo: string;
  status: string; statusColor: string;
  priority: string; priorityOrder: number;
  isRead: boolean;
}

function fmt(iso: string): string {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (d < 1) return "Ahora";
  if (d < 60) return `Hace ${d} min`;
  const h = Math.floor(d / 60);
  return h < 24 ? `Hace ${h}h` : `Hace ${Math.floor(h / 24)}d`;
}

export function mapMention(dto: MentionDTO): MentionUI {
  const sc = getMentionStatusConfig(dto.status);
  return {
    id: dto.id, ticketId: dto.ticketId,
    mentionedUser: dto.mentionedUser, mentionedRole: dto.mentionedRole,
    mentionedBy: dto.mentionedBy, message: dto.message,
    createdAt: dto.createdAt, timeAgo: fmt(dto.createdAt),
    status: sc.label, statusColor: sc.color,
    priority: dto.priority, priorityOrder: MENTION_PRIORITY_ORDER[dto.priority] ?? 2,
    isRead: dto.isRead,
  };
}

export function mapMentions(dtos: MentionDTO[]): MentionUI[] {
  return dtos.map(mapMention).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
