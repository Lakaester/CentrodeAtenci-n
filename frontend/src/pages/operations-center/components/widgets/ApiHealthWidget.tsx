import { useMemo } from "react";
import { DashboardWidget } from "@/components/widgets";
import type { ApiHealthUI } from "../../mappers/infrastructure.mapper";

interface Props { items: ApiHealthUI[]; state: "loading" | "empty" | "error" | "success" }

export function ApiHealthWidget({ items, state }: Props) {
  const agg = useMemo(() => ({
    healthy: items.filter((i) => i.status === "Healthy").length,
    degraded: items.filter((i) => i.status !== "Healthy").length,
    avgResponse: items.length ? Math.round(items.reduce((s, i) => s + i.responseTime, 0) / items.length) : 0,
  }), [items]);

  if (state === "error") return <DashboardWidget title="API Health" subtitle="Disponibilidad de APIs" state="error" />;
  if (state === "empty" || items.length === 0) return <DashboardWidget title="API Health" subtitle="Disponibilidad de APIs" state="empty" />;

  return (
    <DashboardWidget title="API Health" subtitle="Disponibilidad de APIs" state="success">
      <div className="flex gap-3 mb-3 text-[10px]">
        <span className="font-medium text-black-85">{items.length} APIs</span>
        <span className="text-success">{agg.healthy} saludables</span>
        <span className="text-danger">{agg.degraded} degradadas</span>
        <span className="text-black-45">{agg.avgResponse}ms promedio</span>
      </div>
      <div className="space-y-1 text-[10px]">
        {items.slice(0, 5).map((a) => (
          <div key={a.id} className="flex items-center gap-2 rounded bg-light px-2 py-1">
            <span className={`inline-flex items-center rounded px-1 py-0.5 text-[9px] font-medium ${a.statusColor}`}>{a.status}</span>
            <span className="flex-1 font-medium text-black-85">{a.name}</span>
            <span className="text-black-25 text-[9px]">{a.endpoint}</span>
            <span className="text-black-45 w-12 text-right">{a.responseTime}ms</span>
            <span className="text-black-45 w-12 text-right">{a.availability}%</span>
          </div>
        ))}
      </div>
    </DashboardWidget>
  );
}
