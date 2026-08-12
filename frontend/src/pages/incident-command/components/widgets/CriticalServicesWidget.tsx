import { useMemo } from "react";
import { DashboardWidget } from "@/components/widgets";
import type { AffectedServiceUI } from "../../mappers/incident.mapper";

interface Props { items: AffectedServiceUI[]; state: "loading" | "empty" | "error" | "success" }

export function CriticalServicesWidget({ items, state }: Props) {
  const agg = useMemo(() => ({
    down: items.filter((i) => i.status === "down").length,
    degraded: items.filter((i) => i.status === "degraded").length,
    healthy: items.filter((i) => i.status === "healthy").length,
  }), [items]);

  if (state !== "success") return <DashboardWidget title="Critical Services" subtitle="Services at risk" state={state} />;

  return (
    <DashboardWidget title="Critical Services" subtitle="Services at risk" state="success">
      <div className="flex gap-3 mb-3 text-[10px]">
        <span className="font-medium text-black-85">{items.length} services</span>
        <span className="text-danger">{agg.down} down</span>
        <span className="text-warning">{agg.degraded} degraded</span>
        <span className="text-success">{agg.healthy} healthy</span>
      </div>
      <div className="space-y-1 text-[10px]">
        {items.slice(0, 5).map((s) => (
          <div key={s.id} className="flex items-center gap-2 rounded bg-light px-2 py-1">
            <span className={`inline-flex items-center rounded px-1 py-0.5 text-[9px] font-medium ${
              s.status === "down" ? "text-danger bg-danger-5" : s.status === "degraded" ? "text-warning bg-warning-5" : "text-success bg-success-5"
            }`}>{s.status}</span>
            <span className="flex-1 font-medium text-black-85 truncate">{s.name}</span>
            <span className="text-black-45 truncate max-w-[120px]">{s.impact}</span>
          </div>
        ))}
      </div>
    </DashboardWidget>
  );
}
