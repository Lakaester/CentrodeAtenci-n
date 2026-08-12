import { useMemo } from "react";
import { useGlobalAlertData } from "./useGlobalAlertData";
import { mapSummary, mapCriticalAlerts, mapIncidents, mapInfraAlerts, mapQueueAlerts, mapBillingAlerts, mapDeployAlerts, mapSlas, mapNotifications } from "../mappers/globalAlert.mapper";
import type { SummaryUI, CriticalAlertUI, IncidentUI, InfraAlertUI, QueueAlertUI, BillingAlertUI, DeployAlertUI, SlaUI, NotificationUI } from "../mappers/globalAlert.mapper";

export type AlertCenterState = "loading" | "empty" | "error" | "success";

interface AlertCenterResult {
  state: AlertCenterState; lastUpdate: string | null; error: string | null; refresh: () => void;
  summary: SummaryUI | null; critical: CriticalAlertUI[]; incidents: IncidentUI[];
  infra: InfraAlertUI[]; queues: QueueAlertUI[]; billing: BillingAlertUI[];
  deploy: DeployAlertUI[]; sla: SlaUI[]; notifications: NotificationUI[];
}

export function useGlobalAlertCenter(): AlertCenterResult {
  const { data, isLoading, isError, error, dataUpdatedAt, refetch } = useGlobalAlertData();
  const summary = useMemo(() => data ? mapSummary(data.summary) : null, [data]);
  const critical = useMemo(() => data ? mapCriticalAlerts(data.criticalAlerts) : [], [data]);
  const incidents = useMemo(() => data ? mapIncidents(data.activeIncidents) : [], [data]);
  const infra = useMemo(() => data ? mapInfraAlerts(data.infrastructureAlerts) : [], [data]);
  const queues = useMemo(() => data ? mapQueueAlerts(data.queueAlerts) : [], [data]);
  const billing = useMemo(() => data ? mapBillingAlerts(data.electronicBillingAlerts) : [], [data]);
  const deploy = useMemo(() => data ? mapDeployAlerts(data.deploymentAlerts) : [], [data]);
  const sla = useMemo(() => data ? mapSlas(data.slaBreaches) : [], [data]);
  const notifications = useMemo(() => data ? mapNotifications(data.systemNotifications) : [], [data]);

  const hasData = data && data.criticalAlerts.length > 0;
  const state: AlertCenterState = isLoading ? "loading" : isError ? "error" : hasData ? "success" : "empty";
  const lastUpdate = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }) : null;
  return { state, lastUpdate, error: error ?? null, refresh: refetch, summary, critical, incidents, infra, queues, billing, deploy, sla, notifications };
}
