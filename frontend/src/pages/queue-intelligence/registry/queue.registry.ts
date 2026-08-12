import type { QueueStatus, MessageStatus, PriorityLevel, ConsumerStatus, ProducerStatus, EnvironmentType } from "../dto/queue.dto";

export const QUEUE_STATUS_CONFIG: Record<QueueStatus, { label: string; color: string; order: number }> = {
  healthy:  { label: "Healthy",  color: "text-success bg-success-5", order: 0 },
  warning:  { label: "Warning",  color: "text-warning bg-warning-5",     order: 1 },
  critical: { label: "Critical", color: "text-danger bg-danger-5",       order: 2 },
  offline:  { label: "Offline",  color: "text-black-25 bg-black-5",   order: 3 },
};

export const MESSAGE_STATUS_CONFIG: Record<MessageStatus, { label: string; color: string }> = {
  waiting:    { label: "Waiting",    color: "text-black-45 bg-black-5" },
  processing: { label: "Processing", color: "text-primary bg-primary-5" },
  completed:  { label: "Completed",  color: "text-success bg-success-5" },
  failed:     { label: "Failed",     color: "text-danger bg-danger-5" },
};

export const PRIORITY_CONFIG: Record<PriorityLevel, { label: string; color: string; order: number }> = {
  critical: { label: "Critical", color: "text-white bg-danger",       order: 0 },
  high:     { label: "High",     color: "text-danger bg-rose-100",    order: 1 },
  medium:   { label: "Medium",   color: "text-warning-65 bg-warning-10",  order: 2 },
  low:      { label: "Low",      color: "text-black-45 bg-black-5", order: 3 },
};

export const CONSUMER_STATUS_CONFIG: Record<ConsumerStatus, { label: string; color: string }> = {
  online:   { label: "Online",   color: "text-success bg-success-5" },
  offline:  { label: "Offline",  color: "text-black-25 bg-black-5" },
  degraded: { label: "Degraded", color: "text-warning bg-warning-5" },
};

export const PRODUCER_STATUS_CONFIG: Record<ProducerStatus, { label: string; color: string }> = {
  active:   { label: "Active",   color: "text-success bg-success-5" },
  inactive: { label: "Inactive", color: "text-black-25 bg-black-5" },
  paused:   { label: "Paused",   color: "text-warning bg-warning-5" },
};

export const ENVIRONMENT_CONFIG: Record<EnvironmentType, { label: string; color: string }> = {
  production:  { label: "Production",  color: "text-danger bg-danger-5" },
  staging:     { label: "Staging",     color: "text-warning bg-warning-5" },
  qa:          { label: "QA",          color: "text-primary bg-primary-5" },
  development: { label: "Development", color: "text-black-45 bg-black-5" },
};
