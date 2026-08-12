import type { QueueProvider } from "../providers/QueueProvider";
import type { QueueSummaryDTO, QueueDTO, BacklogDTO, ThroughputDTO, ConsumerDTO, ProducerDTO, RetryQueueDTO, DeadLetterQueueDTO, LatencyDTO } from "../dto/queue.dto";

export interface QueueData {
  summary: QueueSummaryDTO; queues: QueueDTO[]; backlogs: BacklogDTO[];
  throughputs: ThroughputDTO[]; consumers: ConsumerDTO[]; producers: ProducerDTO[];
  retryQueues: RetryQueueDTO[]; deadLetterQueues: DeadLetterQueueDTO[]; latencies: LatencyDTO[];
}

export class QueueService {
  constructor(private provider: QueueProvider) {}

  async fetchAll(): Promise<QueueData> {
    const [summary, queues, backlogs, throughputs, consumers, producers, retryQueues, deadLetterQueues, latencies] = await Promise.all([
      this.provider.getSummary(), this.provider.getQueues(), this.provider.getBacklogs(),
      this.provider.getThroughputs(), this.provider.getConsumers(), this.provider.getProducers(),
      this.provider.getRetryQueues(), this.provider.getDeadLetterQueues(), this.provider.getLatencies(),
    ]);
    return { summary, queues, backlogs, throughputs, consumers, producers, retryQueues, deadLetterQueues, latencies };
  }
}
