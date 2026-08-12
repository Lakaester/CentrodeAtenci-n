import type { InfrastructureProvider } from "./InfrastructureProvider";
import { MOCK_SUMMARY, MOCK_MICROSERVICES, MOCK_APIS, MOCK_FEATURE_FLAGS, MOCK_DEPLOYMENTS, MOCK_QUEUES, MOCK_LICENSES, MOCK_FOLIOS, MOCK_REGIONS } from "../mocks/infrastructure.mock";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const mockInfrastructureProvider: InfrastructureProvider = {
  getSummary: async () => { await delay(300); return MOCK_SUMMARY; },
  getMicroservices: async () => { await delay(300); return MOCK_MICROSERVICES; },
  getApis: async () => { await delay(300); return MOCK_APIS; },
  getFeatureFlags: async () => { await delay(300); return MOCK_FEATURE_FLAGS; },
  getDeployments: async () => { await delay(300); return MOCK_DEPLOYMENTS; },
  getQueues: async () => { await delay(300); return MOCK_QUEUES; },
  getLicenses: async () => { await delay(300); return MOCK_LICENSES; },
  getFolios: async () => { await delay(300); return MOCK_FOLIOS; },
  getRegions: async () => { await delay(300); return MOCK_REGIONS; },
};
