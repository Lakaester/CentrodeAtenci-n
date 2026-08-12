import { useMemo } from "react";
import { DashboardWidget } from "@/components/widgets";
import type { ConsumerUI } from "../../mappers/queue.mapper";

interface Props { items: ConsumerUI[]; state: "loading" | "empty" | "error" | "success" }

export function ConsumersWidget({ items, state }: Props) {
  const agg = useMemo(() => ({ online: items.filter((i) => i.status === "Online").length, offline: items.filter((i) => i.status === "Offline").length, degraded: items.filter((i) => i.status === "Degraded").length }), [items]);
  if (state !== "success") return <DashboardWidget title="Consumers" subtitle="Active consumers" state={state} />;
  return (
    <DashboardWidget title="Consumers" subtitle="Active consumers" state="success">
      <div className="flex gap-2 mb-3 text-[10px] flex-wrap"><span className="font-medium text-black-85">{items.length} consumers</span><span className="text-success">{agg.online} online</span><span className="text-black-25">{agg.offline} offline</span><span className="text-warning">{agg.degraded} degraded</span></div>
      <div className="space-y-1 text-[10px]">{items.filter((c) => c.status !== "Online").slice(0, 5).map((c) => (
        <div key={c.id} className="flex items-center gap-2 rounded bg-light px-2 py-1">
          <span className={`inline-flex items-center rounded px-1 py-0.5 text-[9px] font-medium ${c.statusColor}`}>{c.status}</span>
          <span className="flex-1 font-medium text-black-85 truncate">{c.name}</span>
          <span className="text-black-45">lag: {c.lag}</span>
        </div>
      ))}</div>
    </DashboardWidget>
  );
}
