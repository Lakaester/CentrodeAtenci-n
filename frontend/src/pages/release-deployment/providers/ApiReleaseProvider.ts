import type { ReleaseProvider } from "./ReleaseProvider";

export const apiReleaseProvider: ReleaseProvider = {
  getSummary: () => { throw new Error("Not implemented"); },
  getReleases: () => { throw new Error("Not implemented"); },
  getDeployments: () => { throw new Error("Not implemented"); },
  getEnvironments: () => { throw new Error("Not implemented"); },
  getPipelines: () => { throw new Error("Not implemented"); },
  getVersions: () => { throw new Error("Not implemented"); },
  getRollbacks: () => { throw new Error("Not implemented"); },
  getQueue: () => { throw new Error("Not implemented"); },
  getCalendar: () => { throw new Error("Not implemented"); },
};
