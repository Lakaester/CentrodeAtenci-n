import type { ReleaseProvider } from "./ReleaseProvider";
import { mockReleaseProvider } from "./MockReleaseProvider";

export const releaseProvider: ReleaseProvider = mockReleaseProvider;
// import { apiReleaseProvider } from "./ApiReleaseProvider";
// export const releaseProvider: ReleaseProvider = apiReleaseProvider; // 🎯 uncomment for API
