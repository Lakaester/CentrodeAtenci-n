import { useMemo } from "react";
import { DashboardWidget } from "@/components/widgets";
import type { PipelineUI } from "../../mappers/release.mapper";

interface Props { items: PipelineUI[]; state: "loading" | "empty" | "error" | "success" }

export function PipelineStatusWidget({ items, state }: Props) {
  const agg = useMemo(() => ({ running: items.filter((i) => i.status === "Running").length, waiting: items.filter((i) => i.status === "Waiting").length, success: items.filter((i) => i.status === "Success").length, failed: items.filter((i) => i.status === "Failed").length, paused: items.filter((i) => i.status === "Paused").length }), [items]);
  if (state !== "success") return <DashboardWidget title="Pipeline Status" subtitle="CI/CD pipeline status" state={state} />;
  return (
    <DashboardWidget title="Pipeline Status" subtitle="CI/CD pipeline status" state="success">
      <div className="flex gap-2 mb-3 text-[10px] flex-wrap"><span className="font-medium text-black-85">{items.length} pipelines</span><span className="text-primary">{agg.running} running</span><span className="text-black-45">{agg.waiting} waiting</span><span className="text-success">{agg.success} success</span><span className="text-danger">{agg.failed} failed</span><span className="text-warning">{agg.paused} paused</span></div>
      <div className="space-y-1 text-[10px]">{items.slice(0, 5).map((p) => (
        <div key={p.id} className="flex items-center gap-2 rounded bg-light px-2 py-1">
          <span className={`inline-flex items-center rounded px-1 py-0.5 text-[9px] font-medium ${p.statusColor}`}>{p.status}</span>
          <span className="flex-1 font-medium text-black-85 truncate">{p.name}</span>
          <span className="text-black-25 text-[9px]">{p.branch}</span>
          <span className="text-black-45">{p.triggeredBy}</span>
        </div>
      ))}</div>
    </DashboardWidget>
  );
}
