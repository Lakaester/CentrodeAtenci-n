import type { IncidentProvider } from "./IncidentProvider";
import { MOCK_SUMMARY, MOCK_INCIDENTS, MOCK_SERVICES, MOCK_CUSTOMERS, MOCK_TIMELINES, MOCK_ESCALATIONS, MOCK_WAR_ROOMS, MOCK_COMMUNICATIONS, MOCK_ACTIONS } from "../mocks/incident.mock";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const mockIncidentProvider: IncidentProvider = {
  getSummary: async () => { await delay(300); return MOCK_SUMMARY; },
  getIncidents: async () => { await delay(300); return MOCK_INCIDENTS; },
  getAffectedServices: async () => { await delay(300); return MOCK_SERVICES; },
  getAffectedCustomers: async () => { await delay(300); return MOCK_CUSTOMERS; },
  getTimeline: async () => { await delay(300); return MOCK_TIMELINES; },
  getEscalations: async () => { await delay(300); return MOCK_ESCALATIONS; },
  getWarRooms: async () => { await delay(300); return MOCK_WAR_ROOMS; },
  getCommunications: async () => { await delay(300); return MOCK_COMMUNICATIONS; },
  getActions: async () => { await delay(300); return MOCK_ACTIONS; },
};
