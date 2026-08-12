import { useMemo } from "react";
import { DashboardWidget } from "@/components/widgets";
import type { DocumentUI } from "../../mappers/electronicBilling.mapper";

interface Props { items: DocumentUI[]; state: "loading" | "empty" | "error" | "success" }

export function ElectronicDocumentsWidget({ items, state }: Props) {
  const agg = useMemo(() => ({ accepted: items.filter((i) => i.status === "Accepted").length, processing: items.filter((i) => i.status === "Processing").length, pending: items.filter((i) => i.status === "Pending").length, rejected: items.filter((i) => i.status === "Rejected").length }), [items]);
  if (state !== "success") return <DashboardWidget title="Electronic Documents" subtitle="Total electronic documents" state={state} />;
  return (
    <DashboardWidget title="Electronic Documents" subtitle="Total electronic documents" state="success">
      <div className="flex gap-2 mb-3 text-[10px] flex-wrap"><span className="font-medium text-black-85">{items.length} docs</span><span className="text-success">{agg.accepted} accepted</span><span className="text-primary">{agg.processing} processing</span><span className="text-warning">{agg.pending} pending</span><span className="text-danger">{agg.rejected} rejected</span></div>
      <div className="space-y-1 text-[10px]">{items.filter((d) => d.status === "Rejected" || d.status === "Pending").slice(0, 5).map((d) => (
        <div key={d.id} className="flex items-center gap-2 rounded bg-light px-2 py-1">
          <span className={`inline-flex items-center rounded px-1 py-0.5 text-[9px] font-medium ${d.statusColor}`}>{d.status}</span>
          <span className="font-medium text-black-85">{d.documentType}</span>
          <span className="text-black-25">{d.series}-{d.number}</span>
        </div>
      ))}</div>
    </DashboardWidget>
  );
}
