import type { IncidentProvider } from "./IncidentProvider";

export const apiIncidentProvider: IncidentProvider = {
  getSummary: () => { throw new Error("Not implemented"); },
  getIncidents: () => { throw new Error("Not implemented"); },
  getAffectedServices: () => { throw new Error("Not implemented"); },
  getAffectedCustomers: () => { throw new Error("Not implemented"); },
  getTimeline: () => { throw new Error("Not implemented"); },
  getEscalations: () => { throw new Error("Not implemented"); },
  getWarRooms: () => { throw new Error("Not implemented"); },
  getCommunications: () => { throw new Error("Not implemented"); },
  getActions: () => { throw new Error("Not implemented"); },
};
