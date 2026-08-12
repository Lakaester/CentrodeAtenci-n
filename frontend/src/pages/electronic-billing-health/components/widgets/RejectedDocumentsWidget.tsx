import { useMemo } from "react";
import { DashboardWidget } from "@/components/widgets";
import type { RejectedUI } from "../../mappers/electronicBilling.mapper";

interface Props { items: RejectedUI[]; state: "loading" | "empty" | "error" | "success" }

export function RejectedDocumentsWidget({ items, state }: Props) {
  const agg = useMemo(() => ({ critical: items.filter((i) => i.severity === "Critical").length, errorCodes: new Set(items.map((i) => i.errorCode)).size }), [items]);
  if (state !== "success") return <DashboardWidget title="Rejected Documents" subtitle="Rejected documents" state={state} />;
  return (
    <DashboardWidget title="Rejected Documents" subtitle="Rejected documents" state="success">
      <div className="flex gap-2 mb-3 text-[10px] flex-wrap"><span className="font-medium text-black-85">{items.length} rejected</span><span className="text-danger">{agg.critical} critical</span><span className="text-black-45">{agg.errorCodes} error codes</span></div>
      <div className="space-y-1 text-[10px]">{items.filter((r) => r.severity === "Critical" || r.severity === "Error").slice(0, 5).map((r) => (
        <div key={r.id} className="flex items-center gap-2 rounded bg-light px-2 py-1">
          <span className={`inline-flex items-center rounded px-1 py-0.5 text-[9px] font-medium ${r.severityColor}`}>{r.severity}</span>
          <span className="font-medium text-black-85">{r.errorCode}</span>
          <span className="text-black-45 truncate max-w-[100px]">{r.errorDescription}</span>
        </div>
      ))}</div>
    </DashboardWidget>
  );
}
