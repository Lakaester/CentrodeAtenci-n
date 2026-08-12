import type { ConversationPriority, ConversationStatus } from "../dto/conversation.dto";

export interface PriorityEntry {
  label: string;
  order: number;
}

export interface StatusEntry {
  label: string;
  color: string;
}

export const PRIORITY_CONFIG: Record<ConversationPriority, PriorityEntry> = {
  alta: { label: "Alta", order: 0 },
  media: { label: "Media", order: 1 },
  baja: { label: "Baja", order: 2 },
};

export const STATUS_CONFIG: Record<ConversationStatus, StatusEntry> = {
  "esperando-respuesta": { label: "Esperando respuesta", color: "text-warning bg-warning-5" },
  "en-curso": { label: "En curso", color: "text-success bg-success-5" },
  "pendiente-asignacion": { label: "Pendiente asignación", color: "text-danger bg-danger-5" },
  pausada: { label: "Pausada", color: "text-black-45 bg-black-5" },
  finalizada: { label: "Finalizada", color: "text-black-25 bg-light" },
};

export function getPriorityConfig(p: ConversationPriority): PriorityEntry {
  return PRIORITY_CONFIG[p] ?? PRIORITY_CONFIG.media;
}

export function getStatusConfig(s: ConversationStatus): StatusEntry {
  return STATUS_CONFIG[s] ?? STATUS_CONFIG["en-curso"];
}
