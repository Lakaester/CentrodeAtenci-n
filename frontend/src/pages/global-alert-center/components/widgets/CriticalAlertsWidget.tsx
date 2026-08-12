import { useMemo } from "react";
import { DashboardWidget } from "@/components/widgets";
import type { CriticalAlertUI } from "../../mappers/globalAlert.mapper";

interface Props { items: CriticalAlertUI[]; state: "loading" | "empty" | "error" | "success" }

export function CriticalAlertsWidget({ items, state }: Props) {
  const agg = useMemo(() => ({ critical: items.filter((i) => i.severity === "Critical").length, high: items.filter((i) => i.severity === "High").length, open: items.filter((i) => i.status === "Open").length }), [items]);
  if (state !== "success") return <DashboardWidget title="Critical Alerts" subtitle="Critical alerts requiring action" state={state} />;
  return (
    <DashboardWidget title="Critical Alerts" subtitle="Critical alerts requiring action" state="success">
      <div className="flex gap-2 mb-3 text-[10px] flex-wrap"><span className="font-medium text-black-85">{items.length} alerts</span><span className="text-danger">{agg.critical} critical</span><span className="text-warning">{agg.high} high</span><span className="text-danger">{agg.open} open</span></div>
      <div className="space-y-1 text-[10px]">{items.filter((a) => a.status !== "Resolved" && a.status !== "Suppressed").slice(0, 5).map((a) => (
        <div key={a.id} className="flex items-center gap-2 rounded bg-light px-2 py-1">
          <span className={`inline-flex items-center rounded px-1 py-0.5 text-[9px] font-medium ${a.severityColor}`}>{a.severity}</span>
          <span className="flex-1 font-medium text-black-85 truncate">{a.title}</span>
          <span className={`inline-flex items-center rounded px-1 py-0.5 text-[9px] font-medium ${a.sourceColor}`}>{a.source}</span>
          <span className="text-black-25">{a.owner}</span>
        </div>
      ))}</div>
    </DashboardWidget>
  );
}
