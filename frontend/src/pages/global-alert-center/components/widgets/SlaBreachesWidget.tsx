import { useMemo } from "react";
import { DashboardWidget } from "@/components/widgets";
import type { SlaUI } from "../../mappers/globalAlert.mapper";

interface Props { items: SlaUI[]; state: "loading" | "empty" | "error" | "success" }

export function SlaBreachesWidget({ items, state }: Props) {
  const agg = useMemo(() => ({ critical: items.filter((i) => i.severity === "Critical").length, avgDelay: items.length ? Math.round(items.reduce((s, i) => s + i.minutesOverdue, 0) / items.length) : 0, maxDelay: Math.max(...items.map((i) => i.minutesOverdue), 0) }), [items]);
  if (state !== "success") return <DashboardWidget title="SLA Breaches" subtitle="SLA compliance breaches" state={state} />;
  return (
    <DashboardWidget title="SLA Breaches" subtitle="SLA compliance breaches" state="success">
      <div className="flex gap-2 mb-3 text-[10px] flex-wrap"><span className="font-medium text-black-85">{items.length} breaches</span><span className="text-danger">{agg.critical} critical</span><span className="text-black-45">{agg.avgDelay}m avg</span><span className="text-warning">{agg.maxDelay}m max</span></div>
      <div className="space-y-1 text-[10px]">{items.filter((s) => s.severity === "Critical" || s.severity === "High").slice(0, 5).map((s) => (
        <div key={s.id} className="flex items-center gap-2 rounded bg-light px-2 py-1">
          <span className={`inline-flex items-center rounded px-1 py-0.5 text-[9px] font-medium ${s.severityColor}`}>{s.severity}</span>
          <span className="flex-1 font-medium text-black-85 truncate">{s.customer}</span>
          <span className="text-black-45">{s.ticketId}</span>
          <span className="text-black-45">{s.minutesOverdue}m</span>
        </div>
      ))}</div>
    </DashboardWidget>
  );
}
