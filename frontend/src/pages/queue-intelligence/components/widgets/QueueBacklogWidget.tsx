import { useMemo } from "react";
import { DashboardWidget } from "@/components/widgets";
import type { BacklogUI } from "../../mappers/queue.mapper";

interface Props { items: BacklogUI[]; state: "loading" | "empty" | "error" | "success" }

export function QueueBacklogWidget({ items, state }: Props) {
  const agg = useMemo(() => ({ totalMessages: items.reduce((s, i) => s + i.messageCount, 0), critical: items.filter((i) => i.priority === "Critical").reduce((s, i) => s + i.messageCount, 0), high: items.filter((i) => i.priority === "High").reduce((s, i) => s + i.messageCount, 0), oldest: Math.max(...items.map((i) => parseInt(i.oldestAge)), 0) }), [items]);
  if (state !== "success") return <DashboardWidget title="Queue Backlog" subtitle="Pending messages" state={state} />;
  return (
    <DashboardWidget title="Queue Backlog" subtitle="Pending messages" state="success">
      <div className="flex gap-2 mb-3 text-[10px] flex-wrap"><span className="font-medium text-black-85">{agg.totalMessages.toLocaleString()} total</span><span className="text-danger">{agg.critical.toLocaleString()} critical</span><span className="text-warning">{agg.high.toLocaleString()} high</span><span className="text-black-45">Oldest: {agg.oldest}m</span></div>
      <div className="space-y-1 text-[10px]">{items.filter((b) => b.priority === "Critical" || b.priority === "High").slice(0, 5).map((b) => (
        <div key={b.id} className="flex items-center gap-2 rounded bg-light px-2 py-1">
          <span className={`inline-flex items-center rounded px-1 py-0.5 text-[9px] font-medium ${b.priorityColor}`}>{b.priority}</span>
          <span className="flex-1 font-medium text-black-85 truncate">{b.messageCount.toLocaleString()} messages</span>
          <span className="text-black-45">{b.oldestAge}</span>
        </div>
      ))}</div>
    </DashboardWidget>
  );
}
