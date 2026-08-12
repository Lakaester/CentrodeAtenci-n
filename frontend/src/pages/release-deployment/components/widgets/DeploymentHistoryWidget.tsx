import { useMemo } from "react";
import { DashboardWidget } from "@/components/widgets";
import type { DeploymentUI } from "../../mappers/release.mapper";

interface Props { items: DeploymentUI[]; state: "loading" | "empty" | "error" | "success" }

export function DeploymentHistoryWidget({ items, state }: Props) {
  const agg = useMemo(() => ({ success: items.filter((i) => i.status === "Success").length, failed: items.filter((i) => i.status === "Failed").length, rollback: items.filter((i) => i.status === "Rollback").length }), [items]);
  if (state !== "success") return <DashboardWidget title="Deployment History" subtitle="Recent deployments" state={state} />;
  return (
    <DashboardWidget title="Deployment History" subtitle="Recent deployments" state="success">
      <div className="flex gap-2 mb-3 text-[10px] flex-wrap"><span className="font-medium text-black-85">{items.length} deploys</span><span className="text-success">{agg.success} success</span><span className="text-danger">{agg.failed} failed</span><span className="text-warning">{agg.rollback} rollbacks</span></div>
      <div className="space-y-1 text-[10px]">{items.slice(0, 5).map((d) => (
        <div key={d.id} className="flex items-center gap-2 rounded bg-light px-2 py-1">
          <span className={`inline-flex items-center rounded px-1 py-0.5 text-[9px] font-medium ${d.statusColor}`}>{d.status}</span>
          <span className="flex-1 font-medium text-black-85 truncate">{d.service}</span>
          <span className="text-black-25">{d.version}</span>
          <span className="text-black-45 w-10 text-right">{d.duration ?? "—"}</span>
        </div>
      ))}</div>
    </DashboardWidget>
  );
}
