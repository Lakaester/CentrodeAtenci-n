import type { QueueProvider } from "./QueueProvider";
import { mockQueueProvider } from "./MockQueueProvider";

export const queueProvider: QueueProvider = mockQueueProvider;
// import { apiQueueProvider } from "./ApiQueueProvider";
// export const queueProvider: QueueProvider = apiQueueProvider; // 🎯 uncomment for API
