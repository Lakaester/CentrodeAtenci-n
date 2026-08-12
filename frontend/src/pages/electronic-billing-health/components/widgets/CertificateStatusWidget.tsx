import { useMemo } from "react";
import { DashboardWidget } from "@/components/widgets";
import type { CertificateUI } from "../../mappers/electronicBilling.mapper";

interface Props { items: CertificateUI[]; state: "loading" | "empty" | "error" | "success" }

export function CertificateStatusWidget({ items, state }: Props) {
  const agg = useMemo(() => ({ valid: items.filter((i) => i.status === "Valid").length, expiring: items.filter((i) => i.status === "Expiring").length, expired: items.filter((i) => i.status === "Expired").length, minDays: Math.min(...items.map((i) => i.daysRemaining)) }), [items]);
  if (state !== "success") return <DashboardWidget title="Certificate Status" subtitle="Certificate health" state={state} />;
  return (
    <DashboardWidget title="Certificate Status" subtitle="Certificate health" state="success">
      <div className="flex gap-2 mb-3 text-[10px] flex-wrap"><span className="font-medium text-black-85">{items.length} certs</span><span className="text-success">{agg.valid} valid</span><span className="text-warning">{agg.expiring} expiring</span><span className="text-danger">{agg.expired} expired</span><span className="text-black-45">{agg.minDays}d closest</span></div>
      <div className="space-y-1 text-[10px]">{items.filter((c) => c.status !== "Valid").slice(0, 5).map((c) => (
        <div key={c.id} className="flex items-center gap-2 rounded bg-light px-2 py-1">
          <span className={`inline-flex items-center rounded px-1 py-0.5 text-[9px] font-medium ${c.statusColor}`}>{c.status}</span>
          <span className="flex-1 font-medium text-black-85 truncate">{c.issuer}</span>
          <span className="text-black-45">{c.daysRemaining}d</span>
        </div>
      ))}</div>
    </DashboardWidget>
  );
}
