import { useMemo } from "react";
import { DashboardWidget } from "@/components/widgets";
import type { DeadLetterUI } from "../../mappers/queue.mapper";

interface Props { items: DeadLetterUI[]; state: "loading" | "empty" | "error" | "success" }

export function DeadLetterQueueWidget({ items, state }: Props) {
  const agg = useMemo(() => ({ totalMessages: items.reduce((s, i) => s + i.messageCount, 0), errorTypes: new Set(items.map((i) => i.topErrorType)).size }), [items]);
  if (state !== "success") return <DashboardWidget title="Dead Letter Queue" subtitle="Dead letter queue" state={state} />;
  return (
    <DashboardWidget title="Dead Letter Queue" subtitle="Dead letter queue" state="success">
      <div className="flex gap-2 mb-3 text-[10px] flex-wrap"><span className="font-medium text-black-85">{agg.totalMessages} dead letters</span><span className="text-black-45">{agg.errorTypes} error types</span></div>
      <div className="space-y-1 text-[10px]">{items.filter((d) => d.status !== "Healthy").slice(0, 5).map((d) => (
        <div key={d.id} className="flex items-center gap-2 rounded bg-light px-2 py-1">
          <span className={`inline-flex items-center rounded px-1 py-0.5 text-[9px] font-medium ${d.statusColor}`}>{d.status}</span>
          <span className="flex-1 font-medium text-black-85 truncate">{d.messageCount} msgs</span>
          <span className="text-black-45 truncate max-w-[100px]">{d.topErrorType}</span>
        </div>
      ))}</div>
    </DashboardWidget>
  );
}
