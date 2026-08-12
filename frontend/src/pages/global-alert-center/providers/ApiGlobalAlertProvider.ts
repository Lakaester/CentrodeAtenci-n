import type { GlobalAlertProvider } from "./GlobalAlertProvider";
export const apiAlertProvider: GlobalAlertProvider = {
  getSummary: () => { throw new Error("Not implemented"); },
  getCriticalAlerts: () => { throw new Error("Not implemented"); },
  getActiveIncidents: () => { throw new Error("Not implemented"); },
  getInfrastructureAlerts: () => { throw new Error("Not implemented"); },
  getQueueAlerts: () => { throw new Error("Not implemented"); },
  getElectronicBillingAlerts: () => { throw new Error("Not implemented"); },
  getDeploymentAlerts: () => { throw new Error("Not implemented"); },
  getSlaBreaches: () => { throw new Error("Not implemented"); },
  getSystemNotifications: () => { throw new Error("Not implemented"); },
};
