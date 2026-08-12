import { useMemo } from "react";
import { DashboardWidget } from "@/components/widgets";
import type { MicroserviceUI } from "../../mappers/infrastructure.mapper";

interface Props { items: MicroserviceUI[]; state: "loading" | "empty" | "error" | "success" }

export function MicroservicesWidget({ items, state }: Props) {
  const counts = useMemo(() => ({
    total: items.length,
    healthy: items.filter((i) => i.status === "Healthy").length,
    warning: items.filter((i) => i.status === "Warning").length,
    critical: items.filter((i) => i.status === "Critical").length,
    maintenance: items.filter((i) => i.status === "Maintenance").length,
  }), [items]);

  if (state === "error") return <DashboardWidget title="Microservices" subtitle="Estado de microservicios" state="error" />;
  if (state === "empty" || items.length === 0) return <DashboardWidget title="Microservices" subtitle="Estado de microservicios" state="empty" />;

  return (
    <DashboardWidget title="Microservices" subtitle="Estado de microservicios" state="success">
      <div className="flex gap-3 mb-3 text-[10px]">
        <span className="font-medium text-black-85">{counts.total} total</span>
        <span className="text-success">{counts.healthy} healthy</span>
        <span className="text-warning">{counts.warning} warning</span>
        <span className="text-danger">{counts.critical} critical</span>
        <span className="text-black-25">{counts.maintenance} maintenance</span>
      </div>
      <div className="space-y-1 text-[10px]">
        {items.slice(0, 5).map((m) => (
          <div key={m.id} className="flex items-center gap-2 rounded bg-light px-2 py-1">
            <span className={`inline-flex items-center rounded px-1 py-0.5 text-[9px] font-medium ${m.statusColor}`}>{m.status}</span>
            <span className="flex-1 font-medium text-black-85">{m.name}</span>
            <span className="text-black-25">{m.version}</span>
            <span className="text-black-45 w-10 text-right">{m.latency}ms</span>
            <span className="text-black-45 w-10 text-right">{m.cpuUsage}%</span>
            <span className="text-black-45 w-10 text-right">{m.memoryUsage}%</span>
          </div>
        ))}
        {items.length > 5 && <p className="text-[9px] text-black-25 text-center pt-1">+{items.length - 5} más</p>}
      </div>
    </DashboardWidget>
  );
}
