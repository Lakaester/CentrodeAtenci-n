import { DashboardGrid } from "@/pages/dashboard/components/DashboardGrid";
import { QueueHealthWidget } from "./widgets/QueueHealthWidget";
import { QueueBacklogWidget } from "./widgets/QueueBacklogWidget";
import { QueueThroughputWidget } from "./widgets/QueueThroughputWidget";
import { ConsumersWidget } from "./widgets/ConsumersWidget";
import { ProducersWidget } from "./widgets/ProducersWidget";
import { RetryQueueWidget } from "./widgets/RetryQueueWidget";
import { DeadLetterQueueWidget } from "./widgets/DeadLetterQueueWidget";
import { ProcessingLatencyWidget } from "./widgets/ProcessingLatencyWidget";
import type { QueueUI, BacklogUI, ThroughputUI, ConsumerUI, ProducerUI, RetryUI, DeadLetterUI, LatencyUI } from "../mappers/queue.mapper";
import type { QueueState } from "../hooks/useQueueIntelligence";

interface Props {
  state: QueueState;
  queues: QueueUI[]; backlogs: BacklogUI[]; throughputs: ThroughputUI[];
  consumers: ConsumerUI[]; producers: ProducerUI[]; retryQueues: RetryUI[];
  deadLetterQueues: DeadLetterUI[]; latencies: LatencyUI[];
}

export function QueueIntelligenceGrid({ state, queues, backlogs, throughputs, consumers, producers, retryQueues, deadLetterQueues, latencies }: Props) {
  return <DashboardGrid cols={4}>
    <QueueHealthWidget items={queues} state={state} />
    <QueueBacklogWidget items={backlogs} state={state} />
    <QueueThroughputWidget items={throughputs} state={state} />
    <ConsumersWidget items={consumers} state={state} />
    <ProducersWidget items={producers} state={state} />
    <RetryQueueWidget items={retryQueues} state={state} />
    <DeadLetterQueueWidget items={deadLetterQueues} state={state} />
    <ProcessingLatencyWidget items={latencies} state={state} />
  </DashboardGrid>;
}
