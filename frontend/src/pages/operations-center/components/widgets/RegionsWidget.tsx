import { useMemo } from "react";
import { DashboardWidget } from "@/components/widgets";
import type { RegionUI } from "../../mappers/infrastructure.mapper";

interface Props { items: RegionUI[]; state: "loading" | "empty" | "error" | "success" }

export function RegionsWidget({ items, state }: Props) {
  const agg = useMemo(() => ({
    countries: new Set(items.map((r) => r.country)).size,
    totalServices: items.reduce((s, r) => s + r.activeServices, 0),
  }), [items]);

  if (state === "error") return <DashboardWidget title="Regions" subtitle="Disponibilidad por región" state="error" />;
  if (state === "empty" || items.length === 0) return <DashboardWidget title="Regions" subtitle="Disponibilidad por región" state="empty" />;

  return (
    <DashboardWidget title="Regions" subtitle="Disponibilidad por región" state="success">
      <div className="flex gap-3 mb-3 text-[10px]">
        <span className="font-medium text-black-85">{agg.countries} países</span>
        <span className="text-black-45">{items.length} regiones</span>
        <span className="text-black-45">{agg.totalServices} servicios</span>
      </div>
      <div className="space-y-1 text-[10px]">
        {items.map((r) => (
          <div key={r.id} className="flex items-center gap-2 rounded bg-light px-2 py-1">
            <span className={`inline-flex items-center rounded px-1 py-0.5 text-[9px] font-medium ${r.statusColor}`}>{r.status}</span>
            <span className="flex-1 font-medium text-black-85">{r.country}</span>
            <span className="text-black-25">{r.region}</span>
            <span className="text-black-45 w-12 text-right">{r.activeServices} svc</span>
          </div>
        ))}
      </div>
    </DashboardWidget>
  );
}
