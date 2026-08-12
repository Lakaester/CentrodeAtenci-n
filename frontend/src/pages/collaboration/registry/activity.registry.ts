import type { ActivityType, ActivityPriority } from "../dto/activity.dto";

export interface ActivityTypeConfig {
  label: string;
  color: string;
  priority: number;
}

export const ACTIVITY_TYPE_CONFIG: Record<ActivityType, ActivityTypeConfig> = {
  "ticket-created":  { label: "Ticket creado",    color: "text-success bg-success-5",  priority: 0 },
  "ticket-closed":   { label: "Ticket cerrado",   color: "text-black-45 bg-black-5",    priority: 3 },
  "ticket-reopened": { label: "Ticket reabierto",  color: "text-warning bg-warning-5",      priority: 1 },
  "note-added":      { label: "Nota agregada",    color: "text-primary bg-primary-5",        priority: 2 },
  mention:           { label: "Mención",           color: "text-purple bg-purple-5",    priority: 1 },
  assignment:        { label: "Asignación",        color: "text-warning bg-orange-50",    priority: 2 },
  deployment:        { label: "Despliegue",        color: "text-cyan-600 bg-cyan-50",        priority: 3 },
  "feature-flag":    { label: "Feature flag",      color: "text-purple bg-purple-5",    priority: 3 },
  "version-update":  { label: "Actualización",     color: "text-aqua bg-aqua-5",          priority: 3 },
  "queue-alert":     { label: "Alerta de cola",    color: "text-danger bg-danger-5",        priority: 0 },
};

export const PRIORITY_ORDER: Record<ActivityPriority, number> = {
  alta: 0,
  media: 1,
  baja: 2,
};

export function getActivityTypeConfig(type: ActivityType): ActivityTypeConfig {
  return ACTIVITY_TYPE_CONFIG[type] ?? { label: type, color: "text-black-45 bg-black-5", priority: 3 };
}
