import type { GlobalAlertProvider } from "./GlobalAlertProvider";
import { MOCK_SUMMARY, MOCK_CRITICAL, MOCK_INCIDENTS, MOCK_INFRA_ALERTS, MOCK_QUEUE_ALERTS, MOCK_BILLING_ALERTS, MOCK_DEPLOY_ALERTS, MOCK_SLA, MOCK_NOTIFICATIONS } from "../mocks/globalAlert.mock";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const mockAlertProvider: GlobalAlertProvider = {
  getSummary: async () => { await delay(300); return MOCK_SUMMARY; },
  getCriticalAlerts: async () => { await delay(300); return MOCK_CRITICAL; },
  getActiveIncidents: async () => { await delay(300); return MOCK_INCIDENTS; },
  getInfrastructureAlerts: async () => { await delay(300); return MOCK_INFRA_ALERTS; },
  getQueueAlerts: async () => { await delay(300); return MOCK_QUEUE_ALERTS; },
  getElectronicBillingAlerts: async () => { await delay(300); return MOCK_BILLING_ALERTS; },
  getDeploymentAlerts: async () => { await delay(300); return MOCK_DEPLOY_ALERTS; },
  getSlaBreaches: async () => { await delay(300); return MOCK_SLA; },
  getSystemNotifications: async () => { await delay(300); return MOCK_NOTIFICATIONS; },
};
