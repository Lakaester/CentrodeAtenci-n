import { useMemo } from "react";
import { DashboardWidget } from "@/components/widgets";
import type { ThroughputUI } from "../../mappers/electronicBilling.mapper";

interface Props { items: ThroughputUI[]; state: "loading" | "empty" | "error" | "success" }

export function BillingThroughputWidget({ items, state }: Props) {
  const agg = useMemo(() => items.length ? { sent: Math.round(items.reduce((s, i) => s + i.documentsSent, 0) / items.length), accepted: Math.round(items.reduce((s, i) => s + i.documentsAccepted, 0) / items.length), rejected: Math.round(items.reduce((s, i) => s + i.documentsRejected, 0) / items.length), avgResponse: Math.round(items.reduce((s, i) => s + i.avgResponseTime, 0) / items.length) } : { sent: 0, accepted: 0, rejected: 0, avgResponse: 0 }, [items]);
  if (state !== "success") return <DashboardWidget title="Billing Throughput" subtitle="Documents per minute" state={state} />;
  return (
    <DashboardWidget title="Billing Throughput" subtitle="Documents per minute" state="success">
      <div className="flex gap-2 mb-3 text-[10px] flex-wrap"><span className="font-medium text-black-85">{items.length} samples</span><span className="text-success">{agg.sent}/min sent</span><span className="text-primary">{agg.accepted}/min accepted</span><span className="text-danger">{agg.rejected}/min rejected</span><span className="text-black-45">{agg.avgResponse}ms avg</span></div>
      <div className="space-y-1 text-[10px]">{items.slice(0, 5).map((t) => (
        <div key={t.id} className="flex items-center gap-2 rounded bg-light px-2 py-1">
          <span className="flex-1 font-medium text-black-85 truncate">{t.timestamp.slice(11, 16)}</span>
          <span className="text-black-45">{t.documentsSent}</span>
          <span className="text-success">{t.documentsAccepted}</span>
          <span className="text-danger">{t.documentsRejected}</span>
        </div>
      ))}</div>
    </DashboardWidget>
  );
}
