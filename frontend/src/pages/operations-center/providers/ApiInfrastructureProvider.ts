import type { InfrastructureProvider } from "./InfrastructureProvider";

export const apiInfrastructureProvider: InfrastructureProvider = {
  getSummary: () => { throw new Error("Not implemented"); },
  getMicroservices: () => { throw new Error("Not implemented"); },
  getApis: () => { throw new Error("Not implemented"); },
  getFeatureFlags: () => { throw new Error("Not implemented"); },
  getDeployments: () => { throw new Error("Not implemented"); },
  getQueues: () => { throw new Error("Not implemented"); },
  getLicenses: () => { throw new Error("Not implemented"); },
  getFolios: () => { throw new Error("Not implemented"); },
  getRegions: () => { throw new Error("Not implemented"); },
};
