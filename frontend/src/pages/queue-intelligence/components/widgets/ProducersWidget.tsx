import { useMemo } from "react";
import { DashboardWidget } from "@/components/widgets";
import type { ProducerUI } from "../../mappers/queue.mapper";

interface Props { items: ProducerUI[]; state: "loading" | "empty" | "error" | "success" }

export function ProducersWidget({ items, state }: Props) {
  const agg = useMemo(() => ({ active: items.filter((i) => i.status === "Active").length, inactive: items.filter((i) => i.status === "Inactive").length, paused: items.filter((i) => i.status === "Paused").length }), [items]);
  if (state !== "success") return <DashboardWidget title="Producers" subtitle="Active producers" state={state} />;
  return (
    <DashboardWidget title="Producers" subtitle="Active producers" state="success">
      <div className="flex gap-2 mb-3 text-[10px] flex-wrap"><span className="font-medium text-black-85">{items.length} producers</span><span className="text-success">{agg.active} active</span><span className="text-black-25">{agg.inactive} inactive</span><span className="text-warning">{agg.paused} paused</span></div>
      <div className="space-y-1 text-[10px]">{items.filter((p) => p.status !== "Active").slice(0, 5).map((p) => (
        <div key={p.id} className="flex items-center gap-2 rounded bg-light px-2 py-1">
          <span className={`inline-flex items-center rounded px-1 py-0.5 text-[9px] font-medium ${p.statusColor}`}>{p.status}</span>
          <span className="flex-1 font-medium text-black-85 truncate">{p.name}</span>
          <span className="text-black-45">{p.rate}/s</span>
        </div>
      ))}</div>
    </DashboardWidget>
  );
}
