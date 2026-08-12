import { useMemo } from "react";
import { DashboardWidget } from "@/components/widgets";
import type { ValidationUI } from "../../mappers/electronicBilling.mapper";

interface Props { items: ValidationUI[]; state: "loading" | "empty" | "error" | "success" }

export function ValidationErrorsWidget({ items, state }: Props) {
  const agg = useMemo(() => ({ critical: items.filter((i) => i.severity === "Critical").length, resolved: items.filter((i) => i.resolved).length, pending: items.filter((i) => !i.resolved).length }), [items]);
  if (state !== "success") return <DashboardWidget title="Validation Errors" subtitle="Validation error count" state={state} />;
  return (
    <DashboardWidget title="Validation Errors" subtitle="Validation error count" state="success">
      <div className="flex gap-2 mb-3 text-[10px] flex-wrap"><span className="font-medium text-black-85">{items.length} errors</span><span className="text-danger">{agg.critical} critical</span><span className="text-success">{agg.resolved} resolved</span><span className="text-warning">{agg.pending} pending</span></div>
      <div className="space-y-1 text-[10px]">{items.filter((v) => !v.resolved).slice(0, 5).map((v) => (
        <div key={v.id} className="flex items-center gap-2 rounded bg-light px-2 py-1">
          <span className={`inline-flex items-center rounded px-1 py-0.5 text-[9px] font-medium ${v.severityColor}`}>{v.severity}</span>
          <span className="font-medium text-black-85">{v.errorCode}</span>
          <span className="text-black-45 truncate max-w-[100px]">{v.description}</span>
        </div>
      ))}</div>
    </DashboardWidget>
  );
}
