import type { NoteCategory } from "../dto/internalNote.dto";

export interface NoteCategoryConfig {
  label: string;
  color: string;
  priority: number;
}

export const NOTE_CATEGORY_CONFIG: Record<NoteCategory, NoteCategoryConfig> = {
  general:       { label: "General",       color: "text-black-45 bg-black-5", priority: 3 },
  technical:     { label: "Técnica",       color: "text-cyan-600 bg-cyan-50",     priority: 0 },
  customer:      { label: "Cliente",       color: "text-success bg-success-5", priority: 1 },
  billing:       { label: "Facturación",   color: "text-warning bg-warning-5",   priority: 1 },
  deployment:    { label: "Despliegue",    color: "text-purple bg-purple-5", priority: 2 },
  investigation: { label: "Investigación", color: "text-primary bg-primary-5",     priority: 2 },
  "follow-up":   { label: "Seguimiento",   color: "text-warning bg-orange-50", priority: 1 },
  internal:      { label: "Interna",       color: "text-danger bg-danger-5",     priority: 0 },
};

export function getNoteCategoryConfig(category: NoteCategory): NoteCategoryConfig {
  return NOTE_CATEGORY_CONFIG[category] ?? NOTE_CATEGORY_CONFIG.general;
}
