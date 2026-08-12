import type { ActionCategory, ActionPriority } from "../dto/supervisor-action.dto";

export const CATEGORY_CONFIG: Record<ActionCategory, { label: string; color: string }> = {
  asignacion: { label: "Asignación", color: "text-primary bg-primary-5" },
  escalamiento: { label: "Escalamiento", color: "text-danger bg-danger-5" },
  supervision: { label: "Supervisión", color: "text-purple bg-purple-5" },
  historial: { label: "Historial", color: "text-success bg-success-5" },
  seguimiento: { label: "Seguimiento", color: "text-warning bg-warning-5" },
};

export const PRIORITY_ORDER: Record<ActionPriority, number> = {
  alta: 0,
  media: 1,
  baja: 2,
};

export function getCategoryConfig(c: ActionCategory) {
  return CATEGORY_CONFIG[c] ?? CATEGORY_CONFIG.seguimiento;
}
