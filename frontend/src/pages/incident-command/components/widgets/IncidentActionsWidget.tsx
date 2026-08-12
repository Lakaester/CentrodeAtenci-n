import { useMemo } from "react";
import { DashboardWidget } from "@/components/widgets";
import type { IncidentActionUI } from "../../mappers/incident.mapper";

interface Props { items: IncidentActionUI[]; state: "loading" | "empty" | "error" | "success" }

export function IncidentActionsWidget({ items, state }: Props) {
  const agg = useMemo(() => ({ critical: items.filter((i) => i.priority === "critical").length, high: items.filter((i) => i.priority === "high").length, medium: items.filter((i) => i.priority === "medium").length, pending: items.filter((i) => i.status === "pending").length, inProgress: items.filter((i) => i.status === "in-progress").length, completed: items.filter((i) => i.status === "completed").length }), [items]);
  if (state !== "success") return <DashboardWidget title="Incident Actions" subtitle="Open actions" state={state} />;
  return (
    <DashboardWidget title="Incident Actions" subtitle="Open actions" state="success">
      <div className="flex gap-3 mb-3 text-[10px]"><span className="font-medium text-black-85">{items.length} actions</span><span className="text-danger">{agg.critical} critical</span><span className="text-warning">{agg.high} high</span><span className="text-black-45">{agg.medium} medium</span><span className="text-primary">{agg.inProgress} in progress</span></div>
      <div className="space-y-1 text-[10px]">{items.filter((a) => a.status !== "completed").slice(0, 5).map((a) => (
        <div key={a.id} className="flex items-center gap-2 rounded bg-light px-2 py-1">
          <span className={`inline-flex items-center rounded px-1 py-0.5 text-[9px] font-medium ${a.priority === "critical" ? "text-danger bg-danger-5" : a.priority === "high" ? "text-warning bg-warning-5" : "text-black-45 bg-black-5"}`}>{a.priority}</span>
          <span className="flex-1 font-medium text-black-85 truncate">{a.description}</span><span className="text-black-45">{a.owner}</span>
          <span className={`text-[9px] ${a.status === "in-progress" ? "text-primary" : "text-black-25"}`}>{a.status === "in-progress" ? "In progress" : "Pending"}</span>
        </div>
      ))}</div>
    </DashboardWidget>
  );
}
