import { useMemo } from "react";
import { DashboardWidget } from "@/components/widgets";
import type { AffectedCustomerUI } from "../../mappers/incident.mapper";

interface Props { items: AffectedCustomerUI[]; state: "loading" | "empty" | "error" | "success" }

export function AffectedCustomersWidget({ items, state }: Props) {
  const agg = useMemo(() => ({
    enterprise: items.filter((i) => i.segment === "Enterprise").length,
    business: items.filter((i) => i.segment === "Business").length,
    standard: items.filter((i) => i.segment === "Standard").length,
  }), [items]);

  if (state !== "success") return <DashboardWidget title="Affected Customers" subtitle="Customers impacted" state={state} />;

  return (
    <DashboardWidget title="Affected Customers" subtitle="Customers impacted" state="success">
      <div className="flex gap-3 mb-3 text-[10px]">
        <span className="font-medium text-black-85">{items.length} customers</span>
        <span className="text-purple">{agg.enterprise} Enterprise</span>
        <span className="text-primary">{agg.business} Business</span>
        <span className="text-black-45">{agg.standard} Standard</span>
      </div>
      <div className="space-y-1 text-[10px]">
        {items.slice(0, 5).map((c) => (
          <div key={c.id} className="flex items-center gap-2 rounded bg-light px-2 py-1">
            <span className="flex-1 font-medium text-black-85 truncate">{c.name}</span>
            <span className="text-black-45">{c.segment}</span>
            <span className="text-black-25">{c.tickets} tickets</span>
            <span className="text-black-45 truncate max-w-[100px]">{c.impact}</span>
          </div>
        ))}
        {items.length > 5 && <p className="text-[9px] text-black-25 text-center pt-1">+{items.length - 5} more</p>}
      </div>
    </DashboardWidget>
  );
}
