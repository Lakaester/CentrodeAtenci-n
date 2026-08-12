import type { AlertSeverity, AlertType, AlertStatus } from "../dto/alert.dto";

export interface AlertConfigEntry {
  severityColor: string;
  severityLabel: string;
  priorityOrder: number;
}

export const SEVERITY_CONFIG: Record<AlertSeverity, AlertConfigEntry> = {
  critica: { severityColor: "text-white bg-danger", severityLabel: "Crítica", priorityOrder: 0 },
  alta: { severityColor: "text-danger bg-rose-100", severityLabel: "Alta", priorityOrder: 1 },
  media: { severityColor: "text-warning-65 bg-warning-10", severityLabel: "Media", priorityOrder: 2 },
  baja: { severityColor: "text-black-45 bg-black-5", severityLabel: "Baja", priorityOrder: 3 },
};

export const STATUS_LABEL: Record<AlertStatus, string> = {
  activa: "Activa",
  acknowledged: "Reconocida",
  resuelta: "Resuelta",
};

export const ALERT_TYPE_LABEL: Record<AlertType, string> = {
  "sla-vencido": "SLA vencido",
  "sla-proximo": "SLA próximo a vencer",
  "cola-saturada": "Cola saturada",
  "canal-alta-demanda": "Canal con alta demanda",
  "asesor-sobrecargado": "Asesor sobrecargado",
};

export function getAlertSeverityConfig(severidad: AlertSeverity): AlertConfigEntry {
  return SEVERITY_CONFIG[severidad] ?? SEVERITY_CONFIG.media;
}
