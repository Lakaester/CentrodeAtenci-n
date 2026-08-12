import { useMemo } from "react";
import { DashboardWidget } from "@/components/widgets";
import type { SunatUI } from "../../mappers/electronicBilling.mapper";

interface Props { items: SunatUI[]; state: "loading" | "empty" | "error" | "success" }

export function SunatConnectivityWidget({ items, state }: Props) {
  const agg = useMemo(() => ({ online: items.filter((i) => i.status === "Online").length, degraded: items.filter((i) => i.status === "Degraded").length, offline: items.filter((i) => i.status === "Offline").length, maintenance: items.filter((i) => i.status === "Maintenance").length }), [items]);
  if (state !== "success") return <DashboardWidget title="SUNAT Connectivity" subtitle="SUNAT connection status" state={state} />;
  return (
    <DashboardWidget title="SUNAT Connectivity" subtitle="SUNAT connection status" state="success">
      <div className="flex gap-2 mb-3 text-[10px] flex-wrap"><span className="font-medium text-black-85">{items.length} connections</span><span className="text-success">{agg.online} online</span><span className="text-warning">{agg.degraded} degraded</span><span className="text-danger">{agg.offline} offline</span><span className="text-primary">{agg.maintenance} maintenance</span></div>
      <div className="space-y-1 text-[10px]">{items.filter((s) => s.status !== "Online").slice(0, 5).map((s) => (
        <div key={s.id} className="flex items-center gap-2 rounded bg-light px-2 py-1">
          <span className={`inline-flex items-center rounded px-1 py-0.5 text-[9px] font-medium ${s.statusColor}`}>{s.status}</span>
          <span className="flex-1 font-medium text-black-85 truncate">{s.country}</span>
          <span className="text-black-45 truncate max-w-[120px]">{s.endpoint}</span>
          <span className="text-black-45">{s.responseTime}ms</span>
        </div>
      ))}</div>
    </DashboardWidget>
  );
}
