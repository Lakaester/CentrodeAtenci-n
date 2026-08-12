import { useMemo } from "react";
import { DashboardWidget } from "@/components/widgets";
import type { ReleaseUI } from "../../mappers/release.mapper";

interface Props { items: ReleaseUI[]; state: "loading" | "empty" | "error" | "success" }

export function ReleaseStatusWidget({ items, state }: Props) {
  const agg = useMemo(() => ({ planned: items.filter((i) => i.status === "Planned").length, inProgress: items.filter((i) => i.status === "In Progress").length, completed: items.filter((i) => i.status === "Completed").length, failed: items.filter((i) => i.status === "Failed").length, cancelled: items.filter((i) => i.status === "Cancelled").length }), [items]);
  if (state !== "success") return <DashboardWidget title="Release Status" subtitle="Current release status" state={state} />;
  return (
    <DashboardWidget title="Release Status" subtitle="Current release status" state="success">
      <div className="flex gap-2 mb-3 text-[10px] flex-wrap"><span className="font-medium text-black-85">{items.length} total</span><span className="text-primary">{agg.planned} planned</span><span className="text-warning">{agg.inProgress} in progress</span><span className="text-success">{agg.completed} completed</span><span className="text-danger">{agg.failed} failed</span></div>
      <div className="space-y-1 text-[10px]">{items.slice(0, 5).map((r) => (
        <div key={r.id} className="flex items-center gap-2 rounded bg-light px-2 py-1">
          <span className={`inline-flex items-center rounded px-1 py-0.5 text-[9px] font-medium ${r.statusColor}`}>{r.status}</span>
          <span className="flex-1 font-medium text-black-85 truncate">{r.name}</span>
          <span className="text-black-25">{r.version}</span>
          <span className={`inline-flex items-center rounded px-1 py-0.5 text-[9px] font-medium ${r.envColor}`}>{r.environment}</span>
        </div>
      ))}</div>
    </DashboardWidget>
  );
}
