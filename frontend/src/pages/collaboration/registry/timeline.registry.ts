import type { TimelineEventType, TimelineSource } from "../dto/timeline.dto";

export interface TimelineEventConfig {
  label: string;
  color: string;
  category: string;
  priority: number;
}

export const EVENT_TYPE_CONFIG: Record<TimelineEventType, TimelineEventConfig> = {
  "ticket-created":    { label: "Ticket creado",    color: "text-success bg-success-5", category: "actividad",   priority: 0 },
  "ticket-closed":     { label: "Ticket cerrado",   color: "text-black-45 bg-black-5",   category: "actividad",   priority: 3 },
  "ticket-reopened":   { label: "Ticket reabierto",  color: "text-warning bg-warning-5",     category: "actividad",   priority: 1 },
  "note-added":        { label: "Nota agregada",    color: "text-primary bg-primary-5",       category: "notas",       priority: 2 },
  "mention":           { label: "Mención",           color: "text-purple bg-purple-5",   category: "menciones",   priority: 1 },
  "assignment":        { label: "Asignación",        color: "text-warning bg-orange-50",   category: "actividad",   priority: 2 },
  "deployment":        { label: "Despliegue",        color: "text-cyan-600 bg-cyan-50",       category: "sistema",     priority: 3 },
  "feature-flag":      { label: "Feature flag",      color: "text-purple bg-purple-5",   category: "sistema",     priority: 3 },
  "version-update":    { label: "Actualización",     color: "text-aqua bg-aqua-5",         category: "sistema",     priority: 3 },
  "queue-alert":       { label: "Alerta de cola",    color: "text-danger bg-danger-5",       category: "alertas",    priority: 0 },
  "follower-added":    { label: "Seguidor agregado", color: "text-success bg-success-5", category: "seguidores", priority: 2 },
  "follower-removed":  { label: "Seguidor quitado",  color: "text-danger bg-danger-5",       category: "seguidores", priority: 2 },
  "status-change":     { label: "Cambio de estado",  color: "text-warning bg-warning-5",     category: "actividad",   priority: 1 },
  "internal-comment":  { label: "Comentario interno",color: "text-black-65 bg-black-10",    category: "notas",       priority: 2 },
};

export const SOURCE_LABEL: Record<TimelineSource, string> = {
  activity: "Actividad", notes: "Notas", mentions: "Menciones", followers: "Seguidores", system: "Sistema",
};

export function getEventConfig(type: TimelineEventType): TimelineEventConfig {
  return EVENT_TYPE_CONFIG[type] ?? { label: type, color: "text-black-45 bg-black-5", category: "otro", priority: 3 };
}
