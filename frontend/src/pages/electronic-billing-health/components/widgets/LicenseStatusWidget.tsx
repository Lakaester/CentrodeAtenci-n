import { useMemo } from "react";
import { DashboardWidget } from "@/components/widgets";
import type { LicenseUI } from "../../mappers/electronicBilling.mapper";

interface Props { items: LicenseUI[]; state: "loading" | "empty" | "error" | "success" }

export function LicenseStatusWidget({ items, state }: Props) {
  const agg = useMemo(() => ({ active: items.filter((i) => i.status === "Active").length, warning: items.filter((i) => i.status === "Warning").length, expired: items.filter((i) => i.status === "Expired").length }), [items]);
  if (state !== "success") return <DashboardWidget title="License Status" subtitle="License status" state={state} />;
  return (
    <DashboardWidget title="License Status" subtitle="License status" state="success">
      <div className="flex gap-2 mb-3 text-[10px] flex-wrap"><span className="font-medium text-black-85">{items.length} licenses</span><span className="text-success">{agg.active} active</span><span className="text-warning">{agg.warning} warning</span><span className="text-danger">{agg.expired} expired</span></div>
      <div className="space-y-1 text-[10px]">{items.filter((l) => l.status !== "Active").slice(0, 5).map((l) => (
        <div key={l.id} className="flex items-center gap-2 rounded bg-light px-2 py-1">
          <span className={`inline-flex items-center rounded px-1 py-0.5 text-[9px] font-medium ${l.statusColor}`}>{l.status}</span>
          <span className="flex-1 font-medium text-black-85 truncate">{l.customer}</span>
          <span className="text-black-25">{l.licenseType}</span>
          <span className="text-black-45">{l.daysRemaining}d</span>
        </div>
      ))}</div>
    </DashboardWidget>
  );
}
