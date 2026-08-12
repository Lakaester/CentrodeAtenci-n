import { getActivityTypeConfig, PRIORITY_ORDER } from "../registry/activity.registry";
import type { ActivityDTO } from "../dto/activity.dto";

export interface ActivityUI {
  id: string;
  typeLabel: string;
  typeColor: string;
  title: string;
  description: string;
  user: string;
  timestamp: string;
  timeAgo: string;
  priority: string;
  priorityOrder: number;
  status: string;
  iconKey: string;
}

function formatTimeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 1) return "Ahora";
  if (diff < 60) return `Hace ${diff} min`;
  const h = Math.floor(diff / 60);
  if (h < 24) return `Hace ${h}h`;
  const d = Math.floor(h / 24);
  return `Hace ${d}d`;
}

export function mapActivity(dto: ActivityDTO): ActivityUI {
  const tc = getActivityTypeConfig(dto.type);
  return {
    id: dto.id,
    typeLabel: tc.label,
    typeColor: tc.color,
    title: dto.title,
    description: dto.description,
    user: dto.user,
    timestamp: dto.timestamp,
    timeAgo: formatTimeAgo(dto.timestamp),
    priority: dto.priority,
    priorityOrder: PRIORITY_ORDER[dto.priority] ?? 2,
    status: dto.status,
    iconKey: dto.iconKey,
  };
}

export function mapActivities(dtos: ActivityDTO[]): ActivityUI[] {
  return dtos
    .map(mapActivity)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
