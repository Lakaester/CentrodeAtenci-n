import { useMemo } from "react";
import { DashboardWidget } from "@/components/widgets";
import type { IncidentUI } from "../../mappers/globalAlert.mapper";

interface Props { items: IncidentUI[]; state: "loading" | "empty" | "error" | "success" }

export function ActiveIncidentsWidget({ items, state }: Props) {
  const agg = useMemo(() => ({ p1: items.filter((i) => i.priority.startsWith("P1")).length, p2: items.filter((i) => i.priority.startsWith("P2")).length, customers: items.reduce((s, i) => s + i.customers, 0) }), [items]);
  if (state !== "success") return <DashboardWidget title="Active Incidents" subtitle="Active operational incidents" state={state} />;
  return (
    <DashboardWidget title="Active Incidents" subtitle="Active operational incidents" state="success">
      <div className="flex gap-2 mb-3 text-[10px] flex-wrap"><span className="font-medium text-black-85">{items.length} incidents</span><span className="text-danger">{agg.p1} P1</span><span className="text-warning">{agg.p2} P2</span><span className="text-black-45">{agg.customers.toLocaleString()} customers</span></div>
      <div className="space-y-1 text-[10px]">{items.filter((i) => i.status !== "Resolved").slice(0, 5).map((i) => (
        <div key={i.id} className="flex items-center gap-2 rounded bg-light px-2 py-1">
          <span className={`inline-flex items-center rounded px-1 py-0.5 text-[9px] font-medium ${i.priorityColor}`}>{i.priority}</span>
          <span className="flex-1 font-medium text-black-85 truncate">{i.title}</span>
          <span className="text-black-25">{i.service}</span>
          <span className="text-black-45">{i.customers}</span>
        </div>
      ))}</div>
    </DashboardWidget>
  );
}
