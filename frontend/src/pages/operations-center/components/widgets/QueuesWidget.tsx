import { useMemo } from "react";
import { DashboardWidget } from "@/components/widgets";
import type { QueueUI } from "../../mappers/infrastructure.mapper";

interface Props { items: QueueUI[]; state: "loading" | "empty" | "error" | "success" }

export function QueuesWidget({ items, state }: Props) {
  const agg = useMemo(() => ({
    running: items.filter((i) => i.status === "En ejecución").length,
    paused: items.filter((i) => i.status === "Pausada").length,
    degraded: items.filter((i) => i.status === "Degradada").length,
    totalPending: items.reduce((s, i) => s + i.pendingMessages, 0),
  }), [items]);

  if (state === "error") return <DashboardWidget title="Queues" subtitle="Estado de colas" state="error" />;
  if (state === "empty" || items.length === 0) return <DashboardWidget title="Queues" subtitle="Estado de colas" state="empty" />;

  return (
    <DashboardWidget title="Queues" subtitle="Estado de colas" state="success">
      <div className="flex gap-3 mb-3 text-[10px]">
        <span className="font-medium text-black-85">{items.length} queues</span>
        <span className="text-success">{agg.running} running</span>
        <span className="text-warning">{agg.paused} pausadas</span>
        <span className="text-danger">{agg.degraded} degradadas</span>
        <span className="text-black-45">{agg.totalPending.toLocaleString()} pendientes</span>
      </div>
      <div className="space-y-1 text-[10px]">
        {items.slice(0, 5).map((q) => (
          <div key={q.id} className="flex items-center gap-2 rounded bg-light px-2 py-1">
            <span className={`inline-flex items-center rounded px-1 py-0.5 text-[9px] font-medium ${q.statusColor}`}>{q.status}</span>
            <span className="flex-1 font-medium text-black-85">{q.name}</span>
            <span className="text-black-45 w-12 text-right">{q.pendingMessages}</span>
            <span className="text-black-45 w-12 text-right">{q.processingMessages}</span>
            <span className="text-black-45 w-12 text-right">{q.failedMessages}</span>
          </div>
        ))}
      </div>
    </DashboardWidget>
  );
}
