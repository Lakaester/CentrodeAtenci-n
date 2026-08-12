import { useMemo } from "react";
import { DashboardWidget } from "@/components/widgets";
import type { BillingAlertUI } from "../../mappers/globalAlert.mapper";

interface Props { items: BillingAlertUI[]; state: "loading" | "empty" | "error" | "success" }

export function ElectronicBillingAlertsWidget({ items, state }: Props) {
  const agg = useMemo(() => ({ countries: new Set(items.map((i) => i.country)).size, critical: items.filter((i) => i.severity === "Critical").length, errorCodes: new Set(items.map((i) => i.errorCode)).size }), [items]);
  if (state !== "success") return <DashboardWidget title="Electronic Billing Alerts" subtitle="Electronic billing alerts" state={state} />;
  return (
    <DashboardWidget title="Electronic Billing Alerts" subtitle="Electronic billing alerts" state="success">
      <div className="flex gap-2 mb-3 text-[10px] flex-wrap"><span className="font-medium text-black-85">{items.length} alerts</span><span className="text-black-45">{agg.countries} countries</span><span className="text-danger">{agg.critical} critical</span><span className="text-black-45">{agg.errorCodes} error codes</span></div>
      <div className="space-y-1 text-[10px]">{items.filter((a) => a.severity === "Critical" || a.severity === "High").slice(0, 5).map((a) => (
        <div key={a.id} className="flex items-center gap-2 rounded bg-light px-2 py-1">
          <span className={`inline-flex items-center rounded px-1 py-0.5 text-[9px] font-medium ${a.severityColor}`}>{a.severity}</span>
          <span className="font-medium text-black-85">{a.country}</span>
          <span className="text-black-25">{a.documentType}</span>
          <span className="text-black-45">{a.errorCode}</span>
        </div>
      ))}</div>
    </DashboardWidget>
  );
}
