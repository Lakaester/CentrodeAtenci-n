import { useMemo } from "react";
import { useQueueData } from "./useQueueData";
import { mapSummary, mapQueues, mapBacklogs, mapThroughputs, mapConsumers, mapProducers, mapRetries, mapDeadLetters, mapLatencies } from "../mappers/queue.mapper";
import type { SummaryUI, QueueUI, BacklogUI, ThroughputUI, ConsumerUI, ProducerUI, RetryUI, DeadLetterUI, LatencyUI } from "../mappers/queue.mapper";

export type QueueState = "loading" | "empty" | "error" | "success";

interface QueueDataResult {
  state: QueueState; lastUpdate: string | null; error: string | null; refresh: () => void;
  summary: SummaryUI | null; queues: QueueUI[]; backlogs: BacklogUI[];
  throughputs: ThroughputUI[]; consumers: ConsumerUI[]; producers: ProducerUI[];
  retryQueues: RetryUI[]; deadLetterQueues: DeadLetterUI[]; latencies: LatencyUI[];
}

export function useQueueIntelligence(): QueueDataResult {
  const { data, isLoading, isError, error, dataUpdatedAt, refetch } = useQueueData();
  const summary = useMemo(() => data ? mapSummary(data.summary) : null, [data]);
  const queues = useMemo(() => data ? mapQueues(data.queues) : [], [data]);
  const backlogs = useMemo(() => data ? mapBacklogs(data.backlogs) : [], [data]);
  const throughputs = useMemo(() => data ? mapThroughputs(data.throughputs) : [], [data]);
  const consumers = useMemo(() => data ? mapConsumers(data.consumers) : [], [data]);
  const producers = useMemo(() => data ? mapProducers(data.producers) : [], [data]);
  const retryQueues = useMemo(() => data ? mapRetries(data.retryQueues) : [], [data]);
  const deadLetterQueues = useMemo(() => data ? mapDeadLetters(data.deadLetterQueues) : [], [data]);
  const latencies = useMemo(() => data ? mapLatencies(data.latencies) : [], [data]);

  const hasData = data && data.queues.length > 0;
  const state: QueueState = isLoading ? "loading" : isError ? "error" : hasData ? "success" : "empty";
  const lastUpdate = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }) : null;

  return { state, lastUpdate, error: error ?? null, refresh: refetch, summary, queues, backlogs, throughputs, consumers, producers, retryQueues, deadLetterQueues, latencies };
}
