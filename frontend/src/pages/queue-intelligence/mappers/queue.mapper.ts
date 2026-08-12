import { QUEUE_STATUS_CONFIG, PRIORITY_CONFIG, CONSUMER_STATUS_CONFIG, PRODUCER_STATUS_CONFIG, ENVIRONMENT_CONFIG } from "../registry/queue.registry";
import type { QueueDTO, BacklogDTO, ThroughputDTO, ConsumerDTO, ProducerDTO, RetryQueueDTO, DeadLetterQueueDTO, LatencyDTO, QueueSummaryDTO } from "../dto/queue.dto";

export interface SummaryUI { activeQueues: number; messagesWaiting: number; consumersOnline: number; retryMessages: number; deadLetters: number; averageLatency: string; throughputPerSecond: number; healthyQueues: number; }
export interface QueueUI { id: string; name: string; status: string; statusColor: string; environment: string; envColor: string; region: string; messagesWaiting: number; consumersCount: number; producersCount: number; throughputPerSecond: number; averageLatency: string; }
export interface BacklogUI { id: string; priority: string; priorityColor: string; messageCount: number; oldestAge: string; }
export interface ThroughputUI { id: string; timestamp: string; messagesPerSecond: number; totalMessages: number; }
export interface ConsumerUI { id: string; name: string; status: string; statusColor: string; messagesProcessed: number; lag: number; }
export interface ProducerUI { id: string; name: string; status: string; statusColor: string; messagesProduced: number; rate: number; }
export interface RetryUI { id: string; messageCount: number; maxRetries: number; currentRetries: number; }
export interface DeadLetterUI { id: string; messageCount: number; topErrorType: string; status: string; statusColor: string; }
export interface LatencyUI { id: string; timestamp: string; p50: number; p95: number; p99: number; max: number; }

function fmtMs(ms: number): string { return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`; }
function fmtMin(m: number): string { return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`; }

export function mapSummary(dto: QueueSummaryDTO): SummaryUI { return { ...dto, averageLatency: fmtMs(dto.averageLatency) }; }
export function mapQueue(dto: QueueDTO): QueueUI { const qc = QUEUE_STATUS_CONFIG[dto.status]; const ec = ENVIRONMENT_CONFIG[dto.environment]; return { id: dto.id, name: dto.name, status: qc.label, statusColor: qc.color, environment: ec.label, envColor: ec.color, region: dto.region, messagesWaiting: dto.messagesWaiting, consumersCount: dto.consumersCount, producersCount: dto.producersCount, throughputPerSecond: dto.throughputPerSecond, averageLatency: fmtMs(dto.averageLatency) }; }
export function mapQueues(dtos: QueueDTO[]): QueueUI[] { return dtos.map(mapQueue); }
export function mapBacklog(dto: BacklogDTO): BacklogUI { const pc = PRIORITY_CONFIG[dto.priority]; return { id: dto.id, priority: pc.label, priorityColor: pc.color, messageCount: dto.messageCount, oldestAge: fmtMin(dto.oldestMessageAge) }; }
export function mapBacklogs(dtos: BacklogDTO[]): BacklogUI[] { return dtos.map(mapBacklog); }
export function mapThroughput(dto: ThroughputDTO): ThroughputUI { return { id: dto.id, timestamp: dto.timestamp, messagesPerSecond: dto.messagesPerSecond, totalMessages: dto.totalMessages }; }
export function mapThroughputs(dtos: ThroughputDTO[]): ThroughputUI[] { return dtos.map(mapThroughput); }
export function mapConsumer(dto: ConsumerDTO): ConsumerUI { const cc = CONSUMER_STATUS_CONFIG[dto.status]; return { id: dto.id, name: dto.name, status: cc.label, statusColor: cc.color, messagesProcessed: dto.messagesProcessed, lag: dto.lag }; }
export function mapConsumers(dtos: ConsumerDTO[]): ConsumerUI[] { return dtos.map(mapConsumer); }
export function mapProducer(dto: ProducerDTO): ProducerUI { const pc = PRODUCER_STATUS_CONFIG[dto.status]; return { id: dto.id, name: dto.name, status: pc.label, statusColor: pc.color, messagesProduced: dto.messagesProduced, rate: dto.rate }; }
export function mapProducers(dtos: ProducerDTO[]): ProducerUI[] { return dtos.map(mapProducer); }
export function mapRetry(dto: RetryQueueDTO): RetryUI { return { id: dto.id, messageCount: dto.messageCount, maxRetries: dto.maxRetries, currentRetries: dto.currentRetries }; }
export function mapRetries(dtos: RetryQueueDTO[]): RetryUI[] { return dtos.map(mapRetry); }
export function mapDeadLetter(dto: DeadLetterQueueDTO): DeadLetterUI { const qc = QUEUE_STATUS_CONFIG[dto.status]; return { id: dto.id, messageCount: dto.messageCount, topErrorType: dto.topErrorType, status: qc.label, statusColor: qc.color }; }
export function mapDeadLetters(dtos: DeadLetterQueueDTO[]): DeadLetterUI[] { return dtos.map(mapDeadLetter); }
export function mapLatency(dto: LatencyDTO): LatencyUI { return { id: dto.id, timestamp: dto.timestamp, p50: dto.p50Ms, p95: dto.p95Ms, p99: dto.p99Ms, max: dto.maxMs }; }
export function mapLatencies(dtos: LatencyDTO[]): LatencyUI[] { return dtos.map(mapLatency); }
