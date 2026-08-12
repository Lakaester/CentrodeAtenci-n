import { useMemo } from "react";
import { DashboardWidget } from "@/components/widgets";
import type { PendingUI } from "../../mappers/electronicBilling.mapper";

interface Props { items: PendingUI[]; state: "loading" | "empty" | "error" | "success" }

export function PendingDocumentsWidget({ items, state }: Props) {
  const agg = useMemo(() => ({ high: items.filter((i) => i.priority === "alta").length, avgRetries: items.length ? Math.round(items.reduce((s, i) => s + i.retryCount, 0) / items.length) : 0 }), [items]);
  if (state !== "success") return <DashboardWidget title="Pending Documents" subtitle="Documents pending processing" state={state} />;
  return (
    <DashboardWidget title="Pending Documents" subtitle="Documents pending processing" state="success">
      <div className="flex gap-2 mb-3 text-[10px] flex-wrap"><span className="font-medium text-black-85">{items.length} pending</span><span className="text-danger">{agg.high} high priority</span><span className="text-black-45">{agg.avgRetries} avg retries</span></div>
      <div className="space-y-1 text-[10px]">{items.filter((p) => p.priority === "alta").slice(0, 5).map((p) => (
        <div key={p.id} className="flex items-center gap-2 rounded bg-light px-2 py-1">
          <span className="text-danger inline-flex items-center rounded px-1 py-0.5 text-[9px] font-medium bg-danger-5">{p.priority}</span>
          <span className="font-medium text-black-85">{p.documentType}</span>
          <span className="text-black-25">{p.series}-{p.number}</span>
          <span className="text-black-45">{p.retryCount} retries</span>
        </div>
      ))}</div>
    </DashboardWidget>
  );
}
