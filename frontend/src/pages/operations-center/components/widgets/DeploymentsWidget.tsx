import { useMemo } from "react";
import { DashboardWidget } from "@/components/widgets";
import type { DeploymentUI } from "../../mappers/infrastructure.mapper";

interface Props { items: DeploymentUI[]; state: "loading" | "empty" | "error" | "success" }

export function DeploymentsWidget({ items, state }: Props) {
  const agg = useMemo(() => ({
    success: items.filter((i) => i.status === "Exitoso").length,
    failed: items.filter((i) => i.status === "Fallido").length,
    inProgress: items.filter((i) => i.status === "En progreso").length,
    rolledBack: items.filter((i) => i.status === "Revertido").length,
  }), [items]);

  if (state === "error") return <DashboardWidget title="Deployments" subtitle="Últimos despliegues" state="error" />;
  if (state === "empty" || items.length === 0) return <DashboardWidget title="Deployments" subtitle="Últimos despliegues" state="empty" />;

  return (
    <DashboardWidget title="Deployments" subtitle="Últimos despliegues" state="success">
      <div className="flex gap-3 mb-3 text-[10px]">
        <span className="font-medium text-black-85">{items.length} deploys</span>
        <span className="text-success">{agg.success} exitosos</span>
        <span className="text-danger">{agg.failed} fallidos</span>
        <span className="text-primary">{agg.inProgress} en curso</span>
        <span className="text-warning">{agg.rolledBack} revertidos</span>
      </div>
      <div className="space-y-1 text-[10px]">
        {items.slice(0, 5).map((d) => (
          <div key={d.id} className="flex items-center gap-2 rounded bg-light px-2 py-1">
            <span className={`inline-flex items-center rounded px-1 py-0.5 text-[9px] font-medium ${d.statusColor}`}>{d.status}</span>
            <span className="flex-1 font-medium text-black-85">{d.service}</span>
            <span className="text-black-25">{d.version}</span>
            <span className="text-black-45 w-14 text-right">{d.duration ?? "—"}</span>
            <span className={`inline-flex items-center rounded px-1 py-0.5 text-[9px] font-medium ${d.envColor}`}>{d.environment}</span>
          </div>
        ))}
      </div>
    </DashboardWidget>
  );
}
