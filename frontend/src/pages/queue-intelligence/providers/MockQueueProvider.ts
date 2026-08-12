import type { QueueProvider } from "./QueueProvider";
import { MOCK_SUMMARY, MOCK_QUEUES, MOCK_BACKLOGS, MOCK_THROUGHPUTS, MOCK_CONSUMERS, MOCK_PRODUCERS, MOCK_RETRIES, MOCK_DEAD_LETTERS, MOCK_LATENCIES } from "../mocks/queue.mock";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const mockQueueProvider: QueueProvider = {
  getSummary: async () => { await delay(300); return MOCK_SUMMARY; },
  getQueues: async () => { await delay(300); return MOCK_QUEUES; },
  getBacklogs: async () => { await delay(300); return MOCK_BACKLOGS; },
  getThroughputs: async () => { await delay(300); return MOCK_THROUGHPUTS; },
  getConsumers: async () => { await delay(300); return MOCK_CONSUMERS; },
  getProducers: async () => { await delay(300); return MOCK_PRODUCERS; },
  getRetryQueues: async () => { await delay(300); return MOCK_RETRIES; },
  getDeadLetterQueues: async () => { await delay(300); return MOCK_DEAD_LETTERS; },
  getLatencies: async () => { await delay(300); return MOCK_LATENCIES; },
};
