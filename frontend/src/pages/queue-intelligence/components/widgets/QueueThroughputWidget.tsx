import { useMemo } from "react";
import { DashboardWidget } from "@/components/widgets";
import type { ThroughputUI } from "../../mappers/queue.mapper";

interface Props { items: ThroughputUI[]; state: "loading" | "empty" | "error" | "success" }

export function QueueThroughputWidget({ items, state }: Props) {
  const agg = useMemo(() => ({ totalMessages: items.reduce((s, i) => s + i.totalMessages, 0), avgMps: items.length ? Math.round(items.reduce((s, i) => s + i.messagesPerSecond, 0) / items.length) : 0 }), [items]);
  if (state !== "success") return <DashboardWidget title="Queue Throughput" subtitle="Messages per second" state={state} />;
  return (
    <DashboardWidget title="Queue Throughput" subtitle="Messages per second" state="success">
      <div className="flex gap-2 mb-3 text-[10px] flex-wrap"><span className="font-medium text-black-85">{agg.avgMps}/s avg</span><span className="text-black-45">{agg.totalMessages.toLocaleString()} total</span></div>
      <div className="space-y-1 text-[10px]">{items.slice(0, 5).map((t) => (
        <div key={t.id} className="flex items-center gap-2 rounded bg-light px-2 py-1">
          <span className="flex-1 font-medium text-black-85 truncate">{t.timestamp.slice(11, 16)}</span>
          <span className="text-black-45">{t.messagesPerSecond}/s</span>
          <span className="text-black-25">{t.totalMessages.toLocaleString()}</span>
        </div>
      ))}</div>
    </DashboardWidget>
  );
}
