import type { IncidentSeverity, IncidentStatus, Environment, CommunicationChannel, EscalationLevel } from "../dto/incident.dto";

export const SEVERITY_CONFIG: Record<IncidentSeverity, { label: string; color: string; order: number }> = {
  critical: { label: "Critical", color: "text-white bg-danger",    order: 0 },
  high:     { label: "High",     color: "text-danger bg-rose-100", order: 1 },
  medium:   { label: "Medium",   color: "text-warning-65 bg-warning-10", order: 2 },
  low:      { label: "Low",      color: "text-black-45 bg-black-5", order: 3 },
};

export const STATUS_CONFIG: Record<IncidentStatus, { label: string; color: string }> = {
  open:           { label: "Open",           color: "text-danger bg-danger-5" },
  investigating:  { label: "Investigating",  color: "text-warning bg-warning-5" },
  identified:     { label: "Identified",     color: "text-primary bg-primary-5" },
  monitoring:     { label: "Monitoring",     color: "text-purple bg-purple-5" },
  resolved:       { label: "Resolved",       color: "text-success bg-success-5" },
};

export const ENVIRONMENT_CONFIG: Record<Environment, { label: string; color: string }> = {
  production:  { label: "Production",  color: "text-danger bg-danger-5" },
  staging:     { label: "Staging",     color: "text-warning bg-warning-5" },
  qa:          { label: "QA",          color: "text-primary bg-primary-5" },
  development: { label: "Development", color: "text-black-45 bg-black-5" },
};

export const CHANNEL_CONFIG: Record<CommunicationChannel, { label: string; icon: string }> = {
  email:       { label: "Email",      icon: "mail" },
  slack:       { label: "Slack",      icon: "messageSquare" },
  teams:       { label: "Teams",      icon: "messageSquare" },
  whatsapp:    { label: "WhatsApp",   icon: "messageCircle" },
  statuspage:  { label: "Status Page", icon: "globe" },
};

export const ESCALATION_CONFIG: Record<EscalationLevel, { label: string; order: number }> = {
  L1:          { label: "L1 — Support",    order: 0 },
  L2:          { label: "L2 — Engineering", order: 1 },
  L3:          { label: "L3 — Senior Eng",  order: 2 },
  Engineering: { label: "Engineering Lead", order: 3 },
  Executive:   { label: "Executive",        order: 4 },
};
