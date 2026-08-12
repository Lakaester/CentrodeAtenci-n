import { getEventConfig, SOURCE_LABEL } from "../registry/timeline.registry";
import type { TimelineDTO } from "../dto/timeline.dto";

export interface TimelineUI {
  id: string; entityId: string; entityType: string;
  title: string; description: string;
  actor: string; actorRole: string;
  createdAt: string; timeAgo: string;
  typeLabel: string; typeColor: string;
  category: string; sourceLabel: string;
  priority: string; iconKey: string;
}

function fmt(iso: string): string {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (d < 1) return "Ahora";
  if (d < 60) return `Hace ${d} min`;
  const h = Math.floor(d / 60);
  if (h < 24) return `Hace ${h}h`;
  return `Hace ${Math.floor(h / 24)}d`;
}

export function mapTimelineEvent(dto: TimelineDTO): TimelineUI {
  const ec = getEventConfig(dto.eventType);
  return {
    id: dto.id, entityId: dto.entityId, entityType: dto.entityType,
    title: dto.title, description: dto.description,
    actor: dto.actor, actorRole: dto.actorRole,
    createdAt: dto.createdAt, timeAgo: fmt(dto.createdAt),
    typeLabel: ec.label, typeColor: ec.color,
    category: ec.category, sourceLabel: SOURCE_LABEL[dto.source] ?? dto.source,
    priority: dto.priority, iconKey: dto.iconKey,
  };
}

export function mapTimeline(dtos: TimelineDTO[]): TimelineUI[] {
  return dtos.map(mapTimelineEvent).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
