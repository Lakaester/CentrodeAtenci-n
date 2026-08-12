import { useMemo } from "react";
import { DashboardWidget } from "@/components/widgets";
import type { WarRoomUI } from "../../mappers/incident.mapper";

interface Props { items: WarRoomUI[]; state: "loading" | "empty" | "error" | "success" }

export function WarRoomWidget({ items, state }: Props) {
  const agg = useMemo(() => ({ active: items.filter((r) => r.status === "active").length, standby: items.filter((r) => r.status === "standby").length, closed: items.filter((r) => r.status === "closed").length }), [items]);
  if (state !== "success") return <DashboardWidget title="War Room" subtitle="Active war rooms" state={state} />;
  return (
    <DashboardWidget title="War Room" subtitle="Active war rooms" state="success">
      <div className="flex gap-3 mb-3 text-[10px]"><span className="font-medium text-black-85">{items.length} rooms</span><span className="text-danger">{agg.active} active</span><span className="text-warning">{agg.standby} standby</span><span className="text-black-25">{agg.closed} closed</span></div>
      <div className="space-y-1 text-[10px]">{items.filter((r) => r.status !== "closed").slice(0, 4).map((r) => (
        <div key={r.id} className="flex items-center gap-2 rounded bg-light px-2 py-1">
          <span className={`inline-flex items-center rounded px-1 py-0.5 text-[9px] font-medium ${r.status === "active" ? "text-danger bg-danger-5" : "text-warning bg-warning-5"}`}>{r.status}</span>
          <span className="flex-1 font-medium text-black-85 truncate">{r.name}</span><span className="text-black-45">{r.leader}</span><span className="text-black-25">{r.members} members</span>
        </div>
      ))}</div>
    </DashboardWidget>
  );
}
