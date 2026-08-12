import { memo, useMemo } from "react";
import { DashboardWidget } from "@/components/widgets";
import type { IncidentUI } from "../../mappers/incident.mapper";

interface Props { items: IncidentUI[]; state: "loading" | "empty" | "error" | "success" }

export const ActiveIncidentsWidget = memo(function ActiveIncidentsWidget({ items, state }: Props) {
  const agg = useMemo(() => ({
    open: items.filter((i) => i.status === "Open").length,
    investigating: items.filter((i) => i.status === "Investigating").length,
    monitoring: items.filter((i) => i.status === "Monitoring").length,
    resolved: items.filter((i) => i.status === "Resolved").length,
  }), [items]);

  if (state !== "success") return <DashboardWidget title="Active Incidents" subtitle="Currently active incidents" state={state} />;

  return (
    <DashboardWidget title="Active Incidents" subtitle="Currently active incidents" state="success">
      <div className="flex gap-3 mb-3 text-[10px]">
        <span className="font-medium text-black-85">{items.length} total</span>
        <span className="text-danger">{agg.open} open</span>
        <span className="text-warning">{agg.investigating} investigating</span>
        <span className="text-purple">{agg.monitoring} monitoring</span>
        <span className="text-success">{agg.resolved} resolved</span>
      </div>
      <div className="space-y-1 text-[10px]">
        {items.filter((i) => i.status !== "Resolved").slice(0, 5).map((inc) => (
          <div key={inc.id} className="flex items-center gap-2 rounded bg-light px-2 py-1">
            <span className={`inline-flex items-center rounded px-1 py-0.5 text-[9px] font-medium ${inc.severityColor}`}>{inc.severity}</span>
            <span className="flex-1 font-medium text-black-85 truncate">{inc.title}</span>
            <span className={`inline-flex items-center rounded px-1 py-0.5 text-[9px] font-medium ${inc.statusColor}`}>{inc.status}</span>
            <span className={`inline-flex items-center rounded px-1 py-0.5 text-[9px] font-medium ${inc.envColor}`}>{inc.environment}</span>
          </div>
        ))}
      </div>
    </DashboardWidget>
  );
});
