import { DashboardGrid } from "@/pages/dashboard/components/DashboardGrid";
import { CriticalAlertsWidget } from "./widgets/CriticalAlertsWidget";
import { ActiveIncidentsWidget } from "./widgets/ActiveIncidentsWidget";
import { InfrastructureAlertsWidget } from "./widgets/InfrastructureAlertsWidget";
import { QueueAlertsWidget } from "./widgets/QueueAlertsWidget";
import { ElectronicBillingAlertsWidget } from "./widgets/ElectronicBillingAlertsWidget";
import { DeploymentAlertsWidget } from "./widgets/DeploymentAlertsWidget";
import { SlaBreachesWidget } from "./widgets/SlaBreachesWidget";
import { SystemNotificationsWidget } from "./widgets/SystemNotificationsWidget";
import type { CriticalAlertUI, IncidentUI, InfraAlertUI, QueueAlertUI, BillingAlertUI, DeployAlertUI, SlaUI, NotificationUI } from "../mappers/globalAlert.mapper";
import type { AlertCenterState } from "../hooks/useGlobalAlertCenter";

interface Props {
  state: AlertCenterState;
  critical: CriticalAlertUI[]; incidents: IncidentUI[]; infra: InfraAlertUI[];
  queues: QueueAlertUI[]; billing: BillingAlertUI[]; deploy: DeployAlertUI[];
  sla: SlaUI[]; notifications: NotificationUI[];
}

export function GlobalAlertCenterGrid({ state, critical, incidents, infra, queues, billing, deploy, sla, notifications }: Props) {
  return <DashboardGrid cols={4}>
    <CriticalAlertsWidget items={critical} state={state} />
    <ActiveIncidentsWidget items={incidents} state={state} />
    <InfrastructureAlertsWidget items={infra} state={state} />
    <QueueAlertsWidget items={queues} state={state} />
    <ElectronicBillingAlertsWidget items={billing} state={state} />
    <DeploymentAlertsWidget items={deploy} state={state} />
    <SlaBreachesWidget items={sla} state={state} />
    <SystemNotificationsWidget items={notifications} state={state} />
  </DashboardGrid>;
}
