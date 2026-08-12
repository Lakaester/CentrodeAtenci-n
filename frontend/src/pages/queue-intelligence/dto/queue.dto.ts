export type QueueStatus = "healthy" | "warning" | "critical" | "offline";
export type MessageStatus = "waiting" | "processing" | "completed" | "failed";
export type PriorityLevel = "critical" | "high" | "medium" | "low";
export type ConsumerStatus = "online" | "offline" | "degraded";
export type ProducerStatus = "active" | "inactive" | "paused";
export type EnvironmentType = "production" | "staging" | "qa" | "development";

export interface QueueSummaryDTO {
  activeQueues: number; messagesWaiting: number; consumersOnline: number;
  retryMessages: number; deadLetters: number; averageLatency: number;
  throughputPerSecond: number; healthyQueues: number;
}

export interface QueueDTO {
  id: string; name: string; status: QueueStatus; environment: EnvironmentType;
  region: string; messagesWaiting: number; consumersCount: number;
  producersCount: number; throughputPerSecond: number; averageLatency: number;
  lastMessageAt: string;
}

export interface BacklogDTO {
  id: string; queueId: string; priority: PriorityLevel; messageCount: number;
  oldestMessageAge: number; status: MessageStatus;
}

export interface ThroughputDTO {
  id: string; queueId: string; timestamp: string; messagesPerSecond: number;
  totalMessages: number; bytesPerSecond: number;
}

export interface ConsumerDTO {
  id: string; queueId: string; name: string; status: ConsumerStatus;
  messagesProcessed: number; lastHeartbeat: string; lag: number;
}

export interface ProducerDTO {
  id: string; queueId: string; name: string; status: ProducerStatus;
  messagesProduced: number; rate: number; lastMessageAt: string;
}

export interface RetryQueueDTO {
  id: string; queueId: string; messageCount: number; oldestRetry: string;
  maxRetries: number; currentRetries: number; status: MessageStatus;
}

export interface DeadLetterQueueDTO {
  id: string; queueId: string; messageCount: number; lastFailureAt: string;
  topErrorType: string; status: QueueStatus;
}

export interface LatencyDTO {
  id: string; queueId: string; timestamp: string;
  p50Ms: number; p95Ms: number; p99Ms: number; maxMs: number;
}
