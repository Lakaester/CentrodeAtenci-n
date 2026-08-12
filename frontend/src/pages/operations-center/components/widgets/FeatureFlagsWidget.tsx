import { useMemo } from "react";
import { DashboardWidget } from "@/components/widgets";
import type { FeatureFlagUI } from "../../mappers/infrastructure.mapper";

interface Props { items: FeatureFlagUI[]; state: "loading" | "empty" | "error" | "success" }

export function FeatureFlagsWidget({ items, state }: Props) {
  const agg = useMemo(() => ({
    total: items.length,
    active: items.filter((i) => i.enabled).length,
    inactive: items.filter((i) => !i.enabled).length,
    avgRollout: items.length ? Math.round(items.reduce((s, i) => s + i.rolloutPercentage, 0) / items.length) : 0,
  }), [items]);

  if (state === "error") return <DashboardWidget title="Feature Flags" subtitle="Feature flags activos" state="error" />;
  if (state === "empty" || items.length === 0) return <DashboardWidget title="Feature Flags" subtitle="Feature flags activos" state="empty" />;

  return (
    <DashboardWidget title="Feature Flags" subtitle="Feature flags activos" state="success">
      <div className="flex gap-3 mb-3 text-[10px]">
        <span className="font-medium text-black-85">{agg.total} flags</span>
        <span className="text-success">{agg.active} activas</span>
        <span className="text-black-25">{agg.inactive} inactivas</span>
        <span className="text-black-45">{agg.avgRollout}% rollout prom.</span>
      </div>
      <div className="space-y-1 text-[10px]">
        {items.slice(0, 5).map((f) => (
          <div key={f.id} className="flex items-center gap-2 rounded bg-light px-2 py-1">
            <span className={`inline-flex items-center rounded px-1 py-0.5 text-[9px] font-medium ${f.envColor}`}>{f.environment}</span>
            <span className="flex-1 font-medium text-black-85">{f.name}</span>
            <span className="text-black-45 w-12 text-right">{f.rolloutPercentage}%</span>
            <span className="text-black-25 w-16 truncate">{f.owner}</span>
            <span className={f.enabled ? "text-success" : "text-black-25"}>
              {f.enabled ? "Activo" : "Inactivo"}
            </span>
          </div>
        ))}
        {items.length > 5 && <p className="text-[9px] text-black-25 text-center pt-1">+{items.length - 5} más</p>}
      </div>
    </DashboardWidget>
  );
}
