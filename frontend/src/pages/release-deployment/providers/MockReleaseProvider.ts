import type { ReleaseProvider } from "./ReleaseProvider";
import { MOCK_SUMMARY, MOCK_RELEASES, MOCK_DEPLOYMENTS, MOCK_ENVIRONMENTS, MOCK_PIPELINES, MOCK_VERSIONS, MOCK_ROLLBACKS, MOCK_QUEUE, MOCK_CALENDAR } from "../mocks/release.mock";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const mockReleaseProvider: ReleaseProvider = {
  getSummary: async () => { await delay(300); return MOCK_SUMMARY; },
  getReleases: async () => { await delay(300); return MOCK_RELEASES; },
  getDeployments: async () => { await delay(300); return MOCK_DEPLOYMENTS; },
  getEnvironments: async () => { await delay(300); return MOCK_ENVIRONMENTS; },
  getPipelines: async () => { await delay(300); return MOCK_PIPELINES; },
  getVersions: async () => { await delay(300); return MOCK_VERSIONS; },
  getRollbacks: async () => { await delay(300); return MOCK_ROLLBACKS; },
  getQueue: async () => { await delay(300); return MOCK_QUEUE; },
  getCalendar: async () => { await delay(300); return MOCK_CALENDAR; },
};
