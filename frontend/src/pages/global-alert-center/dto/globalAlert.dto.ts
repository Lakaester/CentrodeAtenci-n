export type AlertSeverity = "critical" | "high" | "medium" | "low";
export type AlertStatus = "open" | "acknowledged" | "resolved" | "suppressed";
export type AlertSource = "infrastructure" | "queues" | "billing" | "deployment" | "application" | "system";
export type IncidentPriority = "P1" | "P2" | "P3" | "P4";
export type NotificationType = "info" | "warning" | "success" | "error";
export type EnvironmentType = "production" | "staging" | "qa" | "development";

export interface GlobalAlertSummaryDTO {
  criticalAlerts: number; activeIncidents: number; infrastructureAlerts: number;
  queueAlerts: number; billingAlerts: number; deploymentAlerts: number;
  slaBreaches: number; systemNotifications: number;
}

export interface CriticalAlertDTO {
  id: string; title: string; description: string; severity: AlertSeverity;
  source: AlertSource; environment: EnvironmentType; status: AlertStatus;
  detectedAt: string; acknowledgedAt: string | null; resolvedAt: string | null;
  owner: string;
}

export interface ActiveIncidentDTO {
  id: string; title: string; service: string; priority: IncidentPriority;
  environment: EnvironmentType; status: AlertStatus; detectedAt: string;
  lead: string; affectedCustomers: number;
}

export interface InfrastructureAlertDTO {
  id: string; service: string; metric: string; severity: AlertSeverity;
  environment: EnvironmentType; status: AlertStatus; value: number;
  threshold: number; detectedAt: string;
}

export interface QueueAlertDTO {
  id: string; queue: string; metric: string; severity: AlertSeverity;
  status: AlertStatus; currentValue: number; threshold: number;
  detectedAt: string;
}

export interface ElectronicBillingAlertDTO {
  id: string; country: string; documentType: string; severity: AlertSeverity;
  environment: EnvironmentType; status: AlertStatus; errorCode: string;
  detectedAt: string;
}

export interface DeploymentAlertDTO {
  id: string; service: string; version: string; environment: EnvironmentType;
  severity: AlertSeverity; status: AlertStatus; reason: string;
  detectedAt: string;
}

export interface SlaBreachDTO {
  id: string; ticketId: string; customer: string; severity: AlertSeverity;
  environment: EnvironmentType; status: AlertStatus; minutesOverdue: number;
  detectedAt: string;
}

export interface SystemNotificationDTO {
  id: string; title: string; message: string; type: NotificationType;
  source: string; createdAt: string; read: boolean;
}
