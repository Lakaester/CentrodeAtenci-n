import { useMemo } from "react";
import { DashboardWidget } from "@/components/widgets";
import type { InfraAlertUI } from "../../mappers/globalAlert.mapper";

interface Props { items: InfraAlertUI[]; state: "loading" | "empty" | "error" | "success" }

export function InfrastructureAlertsWidget({ items, state }: Props) {
  const agg = useMemo(() => ({ critical: items.filter((i) => i.severity === "Critical").length, exceeded: items.filter((i) => i.value > i.threshold).length }), [items]);
  if (state !== "success") return <DashboardWidget title="Infrastructure Alerts" subtitle="Infrastructure health alerts" state={state} />;
  return (
    <DashboardWidget title="Infrastructure Alerts" subtitle="Infrastructure health alerts" state="success">
      <div className="flex gap-2 mb-3 text-[10px] flex-wrap"><span className="font-medium text-black-85">{items.length} alerts</span><span className="text-danger">{agg.critical} critical</span><span className="text-warning">{agg.exceeded} exceeded</span></div>
      <div className="space-y-1 text-[10px]">{items.filter((a) => a.value > a.threshold).slice(0, 5).map((a) => (
        <div key={a.id} className="flex items-center gap-2 rounded bg-light px-2 py-1">
          <span className={`inline-flex items-center rounded px-1 py-0.5 text-[9px] font-medium ${a.severityColor}`}>{a.severity}</span>
          <span className="flex-1 font-medium text-black-85 truncate">{a.service}</span>
          <span className="text-black-45">{a.metric}</span>
          <span className="text-black-45">{a.value}/{a.threshold}</span>
        </div>
      ))}</div>
    </DashboardWidget>
  );
}
