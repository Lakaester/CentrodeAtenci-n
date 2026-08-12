import { useMemo } from "react";
import { DashboardWidget } from "@/components/widgets";
import type { QueueUI } from "../../mappers/queue.mapper";

interface Props { items: QueueUI[]; state: "loading" | "empty" | "error" | "success" }

export function QueueHealthWidget({ items, state }: Props) {
  const agg = useMemo(() => ({ healthy: items.filter((i) => i.status === "Healthy").length, warning: items.filter((i) => i.status === "Warning").length, critical: items.filter((i) => i.status === "Critical").length, offline: items.filter((i) => i.status === "Offline").length }), [items]);
  if (state !== "success") return <DashboardWidget title="Queue Health" subtitle="Overall queue health" state={state} />;
  return (
    <DashboardWidget title="Queue Health" subtitle="Overall queue health" state="success">
      <div className="space-y-3">
        <div className="flex gap-2 text-[10px] flex-wrap"><span className="font-medium text-black-85">{items.length} queues</span><span className="text-success">{agg.healthy} healthy</span><span className="text-warning">{agg.warning} warning</span><span className="text-danger">{agg.critical} critical</span><span className="text-black-25">{agg.offline} offline</span></div>
        <div className="space-y-1 text-[10px]">{items.filter((q) => q.status !== "Healthy").slice(0, 5).map((q) => (
          <div key={q.id} className="flex items-center gap-2 rounded bg-light px-2 py-1">
            <span className={`inline-flex items-center rounded px-1 py-0.5 text-[9px] font-medium ${q.statusColor}`}>{q.status}</span>
            <span className="flex-1 font-medium text-black-85 truncate">{q.name}</span>
            <span className={`inline-flex items-center rounded px-1 py-0.5 text-[9px] font-medium ${q.envColor}`}>{q.environment}</span>
            <span className="text-black-45">{q.messagesWaiting.toLocaleString()} msgs</span>
          </div>
        ))}</div>
      </div>
    </DashboardWidget>
  );
}
