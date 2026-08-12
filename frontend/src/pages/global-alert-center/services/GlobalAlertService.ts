import type { GlobalAlertProvider } from "../providers/GlobalAlertProvider";
import type { GlobalAlertSummaryDTO, CriticalAlertDTO, ActiveIncidentDTO, InfrastructureAlertDTO, QueueAlertDTO, ElectronicBillingAlertDTO, DeploymentAlertDTO, SlaBreachDTO, SystemNotificationDTO } from "../dto/globalAlert.dto";

export interface AlertData {
  summary: GlobalAlertSummaryDTO; criticalAlerts: CriticalAlertDTO[];
  activeIncidents: ActiveIncidentDTO[]; infrastructureAlerts: InfrastructureAlertDTO[];
  queueAlerts: QueueAlertDTO[]; electronicBillingAlerts: ElectronicBillingAlertDTO[];
  deploymentAlerts: DeploymentAlertDTO[]; slaBreaches: SlaBreachDTO[]; systemNotifications: SystemNotificationDTO[];
}

export class GlobalAlertService {
  constructor(private provider: GlobalAlertProvider) {}

  async fetchAll(): Promise<AlertData> {
    const [summary, criticalAlerts, activeIncidents, infrastructureAlerts, queueAlerts, electronicBillingAlerts, deploymentAlerts, slaBreaches, systemNotifications] = await Promise.all([
      this.provider.getSummary(), this.provider.getCriticalAlerts(), this.provider.getActiveIncidents(),
      this.provider.getInfrastructureAlerts(), this.provider.getQueueAlerts(), this.provider.getElectronicBillingAlerts(),
      this.provider.getDeploymentAlerts(), this.provider.getSlaBreaches(), this.provider.getSystemNotifications(),
    ]);
    return { summary, criticalAlerts, activeIncidents, infrastructureAlerts, queueAlerts, electronicBillingAlerts, deploymentAlerts, slaBreaches, systemNotifications };
  }
}
