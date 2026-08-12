import { useMemo } from "react";
import { DashboardWidget } from "@/components/widgets";
import type { EnvironmentUI } from "../../mappers/release.mapper";

interface Props { items: EnvironmentUI[]; state: "loading" | "empty" | "error" | "success" }

export function EnvironmentStatusWidget({ items, state }: Props) {
  const agg = useMemo(() => ({ healthy: items.filter((i) => i.status === "healthy").length, degraded: items.filter((i) => i.status === "degraded").length, down: items.filter((i) => i.status === "down").length }), [items]);
  if (state !== "success") return <DashboardWidget title="Environment Status" subtitle="Environment health" state={state} />;
  return (
    <DashboardWidget title="Environment Status" subtitle="Environment health" state="success">
      <div className="flex gap-2 mb-3 text-[10px] flex-wrap"><span className="font-medium text-black-85">{items.length} envs</span><span className="text-success">{agg.healthy} healthy</span><span className="text-warning">{agg.degraded} degraded</span><span className="text-danger">{agg.down} down</span></div>
      <div className="space-y-1 text-[10px]">{items.slice(0, 5).map((e) => (
        <div key={e.id} className="flex items-center gap-2 rounded bg-light px-2 py-1">
          <span className={`inline-flex items-center rounded px-1 py-0.5 text-[9px] font-medium ${e.status === "healthy" ? "text-success bg-success-5" : e.status === "degraded" ? "text-warning bg-warning-5" : "text-danger bg-danger-5"}`}>{e.status}</span>
          <span className="flex-1 font-medium text-black-85 truncate">{e.name}</span>
          <span className="text-black-25">{e.currentVersion}</span>
          <span className={`inline-flex items-center rounded px-1 py-0.5 text-[9px] font-medium ${e.typeColor}`}>{e.type}</span>
        </div>
      ))}</div>
    </DashboardWidget>
  );
}
