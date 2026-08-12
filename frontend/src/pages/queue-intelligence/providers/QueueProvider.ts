import type { QueueSummaryDTO, QueueDTO, BacklogDTO, ThroughputDTO, ConsumerDTO, ProducerDTO, RetryQueueDTO, DeadLetterQueueDTO, LatencyDTO } from "../dto/queue.dto";

export interface QueueProvider {
  getSummary(): Promise<QueueSummaryDTO>;
  getQueues(): Promise<QueueDTO[]>;
  getBacklogs(): Promise<BacklogDTO[]>;
  getThroughputs(): Promise<ThroughputDTO[]>;
  getConsumers(): Promise<ConsumerDTO[]>;
  getProducers(): Promise<ProducerDTO[]>;
  getRetryQueues(): Promise<RetryQueueDTO[]>;
  getDeadLetterQueues(): Promise<DeadLetterQueueDTO[]>;
  getLatencies(): Promise<LatencyDTO[]>;
}
