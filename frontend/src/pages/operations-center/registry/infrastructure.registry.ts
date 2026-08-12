import type { HealthStatus, Environment, DeploymentStatus, QueueStatus } from "../dto/infrastructure.dto";

export const STATUS_CONFIG: Record<HealthStatus, { label: string; color: string; order: number }> = {
  healthy:     { label: "Healthy",     color: "text-success bg-success-5",     order: 0 },
  warning:     { label: "Warning",     color: "text-warning bg-warning-5",         order: 1 },
  critical:    { label: "Critical",    color: "text-danger bg-danger-5",           order: 2 },
  maintenance: { label: "Maintenance", color: "text-black-45 bg-black-5",        order: 3 },
};

export const ENVIRONMENT_CONFIG: Record<Environment, { label: string; color: string }> = {
  production:  { label: "Producción",  color: "text-danger bg-danger-5" },
  staging:     { label: "Staging",     color: "text-warning bg-warning-5" },
  qa:          { label: "QA",          color: "text-primary bg-primary-5" },
  development: { label: "Desarrollo",  color: "text-black-45 bg-black-5" },
};

export const DEPLOYMENT_STATUS_CONFIG: Record<DeploymentStatus, { label: string; color: string }> = {
  success:      { label: "Exitoso",      color: "text-success bg-success-5" },
  failed:       { label: "Fallido",      color: "text-danger bg-danger-5" },
  "in-progress": { label: "En progreso", color: "text-primary bg-primary-5" },
  "rolled-back": { label: "Revertido",   color: "text-warning bg-warning-5" },
};

export const QUEUE_STATUS_CONFIG: Record<QueueStatus, { label: string; color: string }> = {
  running:  { label: "En ejecución", color: "text-success bg-success-5" },
  paused:   { label: "Pausada",      color: "text-warning bg-warning-5" },
  degraded: { label: "Degradada",    color: "text-danger bg-danger-5" },
};

export const REGIONS = [
  { country: "Perú",       region: "Lima",       code: "pe-lim" },
  { country: "Perú",       region: "Arequipa",   code: "pe-aqp" },
  { country: "Perú",       region: "Cusco",      code: "pe-cus" },
  { country: "Perú",       region: "Trujillo",   code: "pe-trj" },
  { country: "Chile",      region: "Santiago",   code: "cl-scl" },
  { country: "Chile",      region: "Valparaíso", code: "cl-vap" },
  { country: "Colombia",   region: "Bogotá",     code: "co-bog" },
  { country: "México",     region: "CDMX",       code: "mx-cdmx" },
];
