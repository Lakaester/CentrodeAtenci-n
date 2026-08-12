import type { QueueDTO, BacklogDTO, ThroughputDTO, ConsumerDTO, ProducerDTO, RetryQueueDTO, DeadLetterQueueDTO, LatencyDTO, QueueSummaryDTO } from "../dto/queue.dto";
const n = Date.now(); const ago = (m: number) => new Date(n - m * 60000).toISOString();
const P = "production" as const; const S = "staging" as const; const H = "healthy" as const; const W = "warning" as const; const C = "critical" as const;

export const MOCK_QUEUES: QueueDTO[] = [
  { id: "q-001", name: "order-processing",   status: H, environment: P, region: "pe-lim", messagesWaiting: 124, consumersCount: 3, producersCount: 2, throughputPerSecond: 45, averageLatency: 120, lastMessageAt: ago(1) },
  { id: "q-002", name: "payment-confirmation",status: H, environment: P, region: "pe-lim", messagesWaiting: 56,  consumersCount: 2, producersCount: 1, throughputPerSecond: 32, averageLatency: 85,  lastMessageAt: ago(2) },
  { id: "q-003", name: "notification-delivery",status: W, environment: P, region: "pe-lim", messagesWaiting: 342, consumersCount: 4, producersCount: 3, throughputPerSecond: 28, averageLatency: 340, lastMessageAt: ago(1) },
  { id: "q-004", name: "email-sender",        status: H, environment: P, region: "pe-lim", messagesWaiting: 89,  consumersCount: 2, producersCount: 2, throughputPerSecond: 55, averageLatency: 65,  lastMessageAt: ago(1) },
  { id: "q-005", name: "report-generation",   status: H, environment: S, region: "pe-lim", messagesWaiting: 12,  consumersCount: 1, producersCount: 1, throughputPerSecond: 8,  averageLatency: 250, lastMessageAt: ago(5) },
  { id: "q-006", name: "data-sync",           status: W, environment: P, region: "cl-scl", messagesWaiting: 210, consumersCount: 2, producersCount: 2, throughputPerSecond: 18, averageLatency: 420, lastMessageAt: ago(2) },
  { id: "q-007", name: "file-processing",     status: C, environment: P, region: "pe-lim", messagesWaiting: 45,  consumersCount: 1, producersCount: 2, throughputPerSecond: 12, averageLatency: 580, lastMessageAt: ago(3) },
  { id: "q-008", name: "audit-log",           status: H, environment: P, region: "pe-lim", messagesWaiting: 890, consumersCount: 5, producersCount: 3, throughputPerSecond: 120, averageLatency: 15,  lastMessageAt: ago(1) },
  { id: "q-009", name: "webhook-delivery",    status: H, environment: P, region: "cl-scl", messagesWaiting: 67,  consumersCount: 2, producersCount: 1, throughputPerSecond: 22, averageLatency: 90,  lastMessageAt: ago(1) },
  { id: "q-010", name: "backup-scheduler",    status: H, environment: S, region: "pe-lim", messagesWaiting: 0,   consumersCount: 1, producersCount: 1, throughputPerSecond: 2,  averageLatency: 0,   lastMessageAt: ago(60) },
  { id: "q-011", name: "sms-delivery",        status: H, environment: P, region: "pe-aqp", messagesWaiting: 23,  consumersCount: 2, producersCount: 1, throughputPerSecond: 15, averageLatency: 110, lastMessageAt: ago(2) },
  { id: "q-012", name: "push-notifications",  status: W, environment: P, region: "pe-lim", messagesWaiting: 156, consumersCount: 3, producersCount: 2, throughputPerSecond: 35, averageLatency: 280, lastMessageAt: ago(1) },
  { id: "q-013", name: "invoice-queue",       status: H, environment: P, region: "cl-scl", messagesWaiting: 34,  consumersCount: 2, producersCount: 1, throughputPerSecond: 10, averageLatency: 200, lastMessageAt: ago(3) },
  { id: "q-014", name: "search-indexing",     status: H, environment: S, region: "pe-cus", messagesWaiting: 78,  consumersCount: 2, producersCount: 1, throughputPerSecond: 14, averageLatency: 180, lastMessageAt: ago(4) },
  { id: "q-015", name: "cache-warmup",        status: C, environment: P, region: "co-bog", messagesWaiting: 12,  consumersCount: 0, producersCount: 1, throughputPerSecond: 0,  averageLatency: 0,   lastMessageAt: ago(120) },
  { id: "q-016", name: "export-csv",          status: H, environment: S, region: "pe-lim", messagesWaiting: 5,   consumersCount: 1, producersCount: 1, throughputPerSecond: 3,  averageLatency: 300, lastMessageAt: ago(10) },
  { id: "q-017", name: "log-aggregator",      status: H, environment: P, region: "mx-cdmx", messagesWaiting: 2340, consumersCount: 4, producersCount: 3, throughputPerSecond: 200, averageLatency: 8,   lastMessageAt: ago(1) },
  { id: "q-018", name: "metrics-collector",   status: H, environment: P, region: "pe-lim", messagesWaiting: 45,  consumersCount: 2, producersCount: 2, throughputPerSecond: 60, averageLatency: 25,  lastMessageAt: ago(1) },
  { id: "q-019", name: "alerts-processor",    status: W, environment: P, region: "pe-lim", messagesWaiting: 89,  consumersCount: 2, producersCount: 2, throughputPerSecond: 40, averageLatency: 150, lastMessageAt: ago(2) },
  { id: "q-020", name: "audit-trail",         status: H, environment: S, region: "pe-lim", messagesWaiting: 567, consumersCount: 2, producersCount: 1, throughputPerSecond: 25, averageLatency: 45,  lastMessageAt: ago(3) },
];

export const MOCK_BACKLOGS: BacklogDTO[] = Array.from({ length: 30 }, (_, i) => ({
  id: `BL-${String(i + 1).padStart(3, "0")}`, queueId: MOCK_QUEUES[i % 20].id,
  priority: (["critical", "high", "medium", "low"] as const)[i % 4],
  messageCount: (i + 1) * 12,
  oldestMessageAge: (i + 1) * 3,
  status: (["waiting", "processing", "completed", "failed"] as const)[i % 4],
}));

export const MOCK_THROUGHPUTS: ThroughputDTO[] = Array.from({ length: 30 }, (_, i) => ({
  id: `TP-${String(i + 1).padStart(3, "0")}`, queueId: MOCK_QUEUES[i % 20].id,
  timestamp: ago(i * 2),
  messagesPerSecond: Math.floor(Math.random() * 100) + 10,
  totalMessages: (i + 1) * 500,
  bytesPerSecond: (i + 1) * 1024,
}));

export const MOCK_CONSUMERS: ConsumerDTO[] = Array.from({ length: 25 }, (_, i) => ({
  id: `CON-${String(i + 1).padStart(3, "0")}`, queueId: MOCK_QUEUES[i % 20].id,
  name: ["order-consumer-1", "payment-consumer-1", "notification-consumer-1", "email-consumer-1", "report-consumer-1", "sync-consumer-1", "file-consumer-1", "audit-consumer-1", "webhook-consumer-1", "sms-consumer-1", "push-consumer-1", "invoice-consumer-1", "search-consumer-1", "export-consumer-1", "log-consumer-1", "metrics-consumer-1", "alerts-consumer-1", "audit-consumer-2", "order-consumer-2", "notification-consumer-2", "push-consumer-2", "log-consumer-2", "sync-consumer-2", "file-consumer-2", "webhook-consumer-2"][i],
  status: (["online", "online", "online", "offline", "degraded"] as const)[i % 5],
  messagesProcessed: (i + 1) * 1000,
  lastHeartbeat: ago(i * 5),
  lag: i * 10,
}));

export const MOCK_PRODUCERS: ProducerDTO[] = Array.from({ length: 15 }, (_, i) => ({
  id: `PRO-${String(i + 1).padStart(3, "0")}`, queueId: MOCK_QUEUES[i % 20].id,
  name: ["order-api", "payment-api", "notification-service", "email-service", "report-generator", "sync-service", "file-uploader", "webhook-service", "sms-service", "push-service", "invoice-service", "search-indexer", "export-service", "log-shipper", "metrics-exporter"][i],
  status: (["active", "active", "active", "inactive", "paused"] as const)[i % 5],
  messagesProduced: (i + 1) * 5000,
  rate: (i + 1) * 5,
  lastMessageAt: ago(i * 3),
}));

export const MOCK_RETRIES: RetryQueueDTO[] = Array.from({ length: 20 }, (_, i) => ({
  id: `RT-${String(i + 1).padStart(3, "0")}`, queueId: MOCK_QUEUES[i % 20].id,
  messageCount: (i + 1) * 3,
  oldestRetry: ago(i * 10 + 5),
  maxRetries: 3,
  currentRetries: (i % 3) + 1,
  status: (["waiting", "processing", "failed", "waiting"] as const)[i % 4],
}));

export const MOCK_DEAD_LETTERS: DeadLetterQueueDTO[] = Array.from({ length: 15 }, (_, i) => ({
  id: `DLQ-${String(i + 1).padStart(3, "0")}`, queueId: MOCK_QUEUES[i % 20].id,
  messageCount: (i + 1) * 2,
  lastFailureAt: ago(i * 15 + 2),
  topErrorType: ["TimeoutException", "ValidationError", "ConnectionLost", "SchemaMismatch", "RateLimitExceeded", "AuthenticationFailed", "NotFoundError", "DuplicateMessage", "PayloadTooLarge", "UnsupportedFormat", "DatabaseError", "NetworkTimeout", "ServiceUnavailable", "InternalError", "ConfigurationError"][i],
  status: (["healthy", "warning", "critical"] as const)[i % 3],
}));

export const MOCK_LATENCIES: LatencyDTO[] = Array.from({ length: 30 }, (_, i) => ({
  id: `LAT-${String(i + 1).padStart(3, "0")}`, queueId: MOCK_QUEUES[i % 20].id,
  timestamp: ago(i * 5),
  p50Ms: Math.floor(Math.random() * 100) + 20,
  p95Ms: Math.floor(Math.random() * 300) + 100,
  p99Ms: Math.floor(Math.random() * 800) + 200,
  maxMs: Math.floor(Math.random() * 2000) + 500,
}));

export const MOCK_SUMMARY: QueueSummaryDTO = {
  activeQueues: 18, messagesWaiting: 5784, consumersOnline: 20,
  retryMessages: 210, deadLetters: 240, averageLatency: 145,
  throughputPerSecond: 744, healthyQueues: 13,
};
