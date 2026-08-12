import type { AlertSeverity, AlertStatus, AlertSource, IncidentPriority, NotificationType } from "../dto/globalAlert.dto";

export const SEVERITY_CONFIG: Record<AlertSeverity, { label: string; color: string; order: number }> = {
  critical: { label: "Critical", color: "text-white bg-danger",       order: 0 },
  high:     { label: "High",     color: "text-danger bg-rose-100",    order: 1 },
  medium:   { label: "Medium",   color: "text-warning-65 bg-warning-10",  order: 2 },
  low:      { label: "Low",      color: "text-black-45 bg-black-5", order: 3 },
};

export const STATUS_CONFIG: Record<AlertStatus, { label: string; color: string }> = {
  open:         { label: "Open",         color: "text-danger bg-danger-5" },
  acknowledged: { label: "Acknowledged", color: "text-warning bg-warning-5" },
  resolved:     { label: "Resolved",     color: "text-success bg-success-5" },
  suppressed:   { label: "Suppressed",   color: "text-black-25 bg-black-5" },
};

export const SOURCE_CONFIG: Record<AlertSource, { label: string; color: string }> = {
  infrastructure: { label: "Infrastructure", color: "text-purple bg-purple-5" },
  queues:         { label: "Queues",         color: "text-cyan-600 bg-cyan-50" },
  billing:        { label: "Billing",        color: "text-warning bg-warning-5" },
  deployment:     { label: "Deployment",     color: "text-primary bg-primary-5" },
  application:    { label: "Application",    color: "text-purple bg-purple-5" },
  system:         { label: "System",         color: "text-black-45 bg-black-5" },
};

export const PRIORITY_CONFIG: Record<IncidentPriority, { label: string; color: string; order: number }> = {
  P1: { label: "P1 - Critical", color: "text-white bg-danger",      order: 0 },
  P2: { label: "P2 - High",    color: "text-danger bg-rose-100",    order: 1 },
  P3: { label: "P3 - Medium",  color: "text-warning-65 bg-warning-10",  order: 2 },
  P4: { label: "P4 - Low",     color: "text-black-45 bg-black-5", order: 3 },
};

export const NOTIFICATION_CONFIG: Record<NotificationType, { label: string; color: string }> = {
  info:    { label: "Info",    color: "text-primary bg-primary-5" },
  warning: { label: "Warning", color: "text-warning bg-warning-5" },
  success: { label: "Success", color: "text-success bg-success-5" },
  error:   { label: "Error",   color: "text-danger bg-danger-5" },
};
