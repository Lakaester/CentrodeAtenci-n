import { getFollowerReasonConfig } from "../registry/follower.registry";
import type { FollowerDTO } from "../dto/follower.dto";

export interface FollowerUI {
  id: string; ticketId: string;
  user: string; role: string;
  followingSince: string; sinceLabel: string;
  reason: string; reasonColor: string;
  notificationsEnabled: boolean;
  status: string;
}

function fmt(iso: string): string {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d < 1) return "Hoy";
  if (d === 1) return "Ayer";
  return `Hace ${d}d`;
}

export function mapFollower(dto: FollowerDTO): FollowerUI {
  const rc = getFollowerReasonConfig(dto.reason);
  return {
    id: dto.id, ticketId: dto.ticketId,
    user: dto.user, role: dto.role,
    followingSince: dto.followingSince, sinceLabel: fmt(dto.followingSince),
    reason: rc.label, reasonColor: rc.color,
    notificationsEnabled: dto.notificationsEnabled,
    status: dto.status,
  };
}

export function mapFollowers(dtos: FollowerDTO[]): FollowerUI[] {
  return dtos.map(mapFollower).sort((a, b) => new Date(b.followingSince).getTime() - new Date(a.followingSince).getTime());
}
