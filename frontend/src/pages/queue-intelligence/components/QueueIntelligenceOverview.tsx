import { DashboardGrid } from "@/pages/dashboard/components/DashboardGrid";
import type { SummaryUI } from "../mappers/queue.mapper";
import type { QueueState } from "../hooks/useQueueIntelligence";

interface Props { summary: SummaryUI | null; state: QueueState }

const ITEMS: { key: keyof SummaryUI; label: string; color: string; suffix?: string }[] = [
  { key: "activeQueues", label: "Active Queues", color: "text-black-85" },
  { key: "messagesWaiting", label: "Messages Waiting", color: "text-warning" },
  { key: "consumersOnline", label: "Consumers Online", color: "text-success" },
  { key: "retryMessages", label: "Retry Messages", color: "text-warning" },
  { key: "deadLetters", label: "Dead Letters", color: "text-danger" },
  { key: "averageLatency", label: "Average Latency", color: "text-black-85" },
  { key: "throughputPerSecond", label: "Throughput/sec", color: "text-primary" },
  { key: "healthyQueues", label: "Healthy Queues", color: "text-success" },
];

export function QueueIntelligenceOverview({ summary, state }: Props) {
  if (state !== "success" || !summary) return null;
  return (
    <DashboardGrid cols={4}>
      {ITEMS.map((item) => {
        const val = summary[item.key];
        return (
          <div key={item.key} className="rounded-lg border border-black-10 bg-white p-4 ">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-black-45">{item.label}</p>
            <p className={`mt-1 text-2xl font-bold tracking-tight ${item.color}`}>{typeof val === "number" ? val.toLocaleString() : val}{item.suffix ?? ""}</p>
          </div>
        );
      })}
    </DashboardGrid>
  );
}
