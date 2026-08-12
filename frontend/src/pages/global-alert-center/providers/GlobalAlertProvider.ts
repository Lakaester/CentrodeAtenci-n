import type { GlobalAlertSummaryDTO, CriticalAlertDTO, ActiveIncidentDTO, InfrastructureAlertDTO, QueueAlertDTO, ElectronicBillingAlertDTO, DeploymentAlertDTO, SlaBreachDTO, SystemNotificationDTO } from "../dto/globalAlert.dto";

export interface GlobalAlertProvider {
  getSummary(): Promise<GlobalAlertSummaryDTO>;
  getCriticalAlerts(): Promise<CriticalAlertDTO[]>;
  getActiveIncidents(): Promise<ActiveIncidentDTO[]>;
  getInfrastructureAlerts(): Promise<InfrastructureAlertDTO[]>;
  getQueueAlerts(): Promise<QueueAlertDTO[]>;
  getElectronicBillingAlerts(): Promise<ElectronicBillingAlertDTO[]>;
  getDeploymentAlerts(): Promise<DeploymentAlertDTO[]>;
  getSlaBreaches(): Promise<SlaBreachDTO[]>;
  getSystemNotifications(): Promise<SystemNotificationDTO[]>;
}
