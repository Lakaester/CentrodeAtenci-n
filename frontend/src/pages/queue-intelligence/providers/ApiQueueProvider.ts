import type { QueueProvider } from "./QueueProvider";

export const apiQueueProvider: QueueProvider = {
  getSummary: () => { throw new Error("Not implemented"); },
  getQueues: () => { throw new Error("Not implemented"); },
  getBacklogs: () => { throw new Error("Not implemented"); },
  getThroughputs: () => { throw new Error("Not implemented"); },
  getConsumers: () => { throw new Error("Not implemented"); },
  getProducers: () => { throw new Error("Not implemented"); },
  getRetryQueues: () => { throw new Error("Not implemented"); },
  getDeadLetterQueues: () => { throw new Error("Not implemented"); },
  getLatencies: () => { throw new Error("Not implemented"); },
};
