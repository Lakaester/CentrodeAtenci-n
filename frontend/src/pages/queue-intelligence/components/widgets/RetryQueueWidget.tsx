import { useMemo } from "react";
import { DashboardWidget } from "@/components/widgets";
import type { RetryUI } from "../../mappers/queue.mapper";

interface Props { items: RetryUI[]; state: "loading" | "empty" | "error" | "success" }

export function RetryQueueWidget({ items, state }: Props) {
  const agg = useMemo(() => ({ totalMessages: items.reduce((s, i) => s + i.messageCount, 0), atLimit: items.filter((i) => i.currentRetries >= i.maxRetries).length }), [items]);
  if (state !== "success") return <DashboardWidget title="Retry Queue" subtitle="Retry messages status" state={state} />;
  return (
    <DashboardWidget title="Retry Queue" subtitle="Retry messages status" state="success">
      <div className="flex gap-2 mb-3 text-[10px] flex-wrap"><span className="font-medium text-black-85">{agg.totalMessages} retries</span><span className="text-danger">{agg.atLimit} at max retries</span><span className="text-black-45">max 3 retries</span></div>
      <div className="space-y-1 text-[10px]">{items.slice(0, 5).map((r) => (
        <div key={r.id} className="flex items-center gap-2 rounded bg-light px-2 py-1">
          <span className={`inline-flex items-center rounded px-1 py-0.5 text-[9px] font-medium ${r.currentRetries >= r.maxRetries ? "text-danger bg-danger-5" : "text-warning bg-warning-5"}`}>{r.currentRetries}/{r.maxRetries}</span>
          <span className="flex-1 font-medium text-black-85 truncate">{r.messageCount} messages</span>
        </div>
      ))}</div>
    </DashboardWidget>
  );
}
